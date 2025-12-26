import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, BookOpen, ArrowLeft, LogOut, MapPin, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Header from '@/components/Header';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authUser, setAuthUser] = useState(null);

    // Handle logout
    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    // Get current auth user and fetch profile by UID
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setAuthUser(firebaseUser);
                // Fetch user document directly by UID
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        setUser({ id: userDocSnap.id, ...userDocSnap.data() });
                    }
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setLoading(false);
                }
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary/30 border-t-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-6">User profile not found.</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-300 font-medium shadow-lg shadow-primary/25"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <Header />
            
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors duration-300 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span className="font-medium">Back to Home</span>
                </button>

                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden mb-6 border border-gray-100">
                    {/* Cover Gradient */}
                    <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-blue-400 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                        <div className="absolute top-10 -left-5 w-24 h-24 bg-white/10 rounded-full"></div>
                        <div className="absolute -bottom-5 right-20 w-20 h-20 bg-white/5 rounded-full"></div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="px-6 pb-6 -mt-16 relative">
                        {/* Avatar */}
                        <div className="relative inline-block mb-4">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-blue-400 p-1 shadow-xl shadow-primary/30">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h1>
                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4" />
                                    {user.email || user.phoneNumber}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    to="/history"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Borrowing History
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border-2 border-red-200 rounded-xl font-medium hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                        {/* Info Grid - 2 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
                            {/* Personal Information Column */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    Personal Information
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <CreditCard className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">NIS / ID Number</p>
                                            <p className="font-semibold text-gray-900 text-sm">{user.idNumber || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</p>
                                            <p className="font-semibold text-gray-900 text-sm">{user.phoneNumber || 'Not provided'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</p>
                                            <p className="font-semibold text-gray-900 text-sm">{user.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Details Column */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    Additional Details
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</p>
                                            <p className="font-semibold text-gray-900 text-sm">{user.address || 'Not provided'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</p>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {user.createdAt?.toDate ? formatDate(user.createdAt.toDate()) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                                        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Status</p>
                                            <p className="font-semibold text-green-700 text-sm">Active & Verified</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
