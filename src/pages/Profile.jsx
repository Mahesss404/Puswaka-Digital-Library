import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, BookOpen, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Profile = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState("");
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    // Handle logout
    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    // Get current user
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserEmail(user.email || "");
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    // Find member by email
    useEffect(() => {
        if (!userEmail) return;

        const findMember = async () => {
            try {
                const membersQuery = query(
                    collection(db, 'members'),
                    where('email', '==', userEmail)
                );
                const membersSnapshot = await getDocs(membersQuery);
                
                if (!membersSnapshot.empty) {
                    const memberDoc = membersSnapshot.docs[0];
                    const memberData = { id: memberDoc.id, ...memberDoc.data() };
                    setMember(memberData);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error finding member:', error);
                setLoading(false);
            }
        };

        findMember();
    }, [userEmail]);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                    <p className="text-gray-600 mb-4">Member profile not found.</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                </div>

                {/* Profile Content */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <User className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{member.name || 'Member'}</h2>
                                <p className="text-gray-600">{member.email || userEmail}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Member ID</h3>
                                <p className="font-medium">{member.memberId || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                                <p className="font-medium flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                    {member.phone || 'Not provided'}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Membership Since</h3>
                                <p className="font-medium">
                                    {member.joinedAt ? formatDate(member.joinedAt) : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Active Member
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <Link
                                to="/history"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                View Borrowing History
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
