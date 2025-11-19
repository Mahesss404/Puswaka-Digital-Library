import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, CreditCard, BookOpen, Calendar, CheckCircle, Clock, ArrowLeft, LogOut } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Profile = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState("");
    const [member, setMember] = useState(null);
    const [borrowHistory, setBorrowHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'history'

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
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error finding member:', error);
                setLoading(false);
            }
        };

        findMember();
    }, [userEmail]);

    // Listen to borrow history for this member
    useEffect(() => {
        if (!member?.id) return;

        const borrowsQuery = query(
            collection(db, 'borrows'),
            where('memberId', '==', member.id)
        );

        const unsubscribe = onSnapshot(borrowsQuery, async (snapshot) => {
            const historyPromises = snapshot.docs.map(async (doc) => {
                const borrowData = doc.data();
                
                // Try to get book details
                let book = null;
                try {
                    const bookRef = firestoreDoc(db, 'books', borrowData.bookId);
                    const bookSnapshot = await getDoc(bookRef);
                    if (bookSnapshot.exists()) {
                        book = { id: bookSnapshot.id, ...bookSnapshot.data() };
                    }
                } catch (error) {
                    console.error('Error fetching book:', error);
                }

                return {
                    id: doc.id,
                    ...borrowData,
                    book: book || {
                        id: borrowData.bookId,
                        title: borrowData.bookTitle || 'Unknown Book',
                        author: 'Unknown Author',
                        coverSrc: null
                    },
                    borrowDate: borrowData.borrowDate?.toDate ? borrowData.borrowDate.toDate() : (borrowData.borrowDate ? new Date(borrowData.borrowDate) : null),
                    dueDate: borrowData.dueDate?.toDate ? borrowData.dueDate.toDate() : (borrowData.dueDate ? new Date(borrowData.dueDate) : null),
                    returnDate: borrowData.returnDate?.toDate ? borrowData.returnDate.toDate() : (borrowData.returnDate ? new Date(borrowData.returnDate) : null)
                };
            });

            const history = await Promise.all(historyPromises);
            // Sort by borrow date (newest first)
            history.sort((a, b) => {
                if (!a.borrowDate) return 1;
                if (!b.borrowDate) return -1;
                return b.borrowDate - a.borrowDate;
            });
            setBorrowHistory(history);
            setLoading(false);
        }, (error) => {
            console.error('Error listening to borrows:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [member?.id]);

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

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

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-lg mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 px-6 py-4 font-semibold transition ${
                                activeTab === 'profile'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            <User className="w-5 h-5 inline mr-2" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 px-6 py-4 font-semibold transition ${
                                activeTab === 'history'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            <BookOpen className="w-5 h-5 inline mr-2" />
                            Borrowing History ({borrowHistory.length})
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <User className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{member.name}</h2>
                                        <p className="text-gray-600">Member since {member.joinedAt?.toDate ? formatDate(member.joinedAt.toDate()) : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Mail className="w-5 h-5 text-indigo-600" />
                                            <p className="text-sm text-gray-500">Email</p>
                                        </div>
                                        <p className="text-lg font-medium text-gray-800">{member.email || 'N/A'}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Phone className="w-5 h-5 text-indigo-600" />
                                            <p className="text-sm text-gray-500">Phone Number</p>
                                        </div>
                                        <p className="text-lg font-medium text-gray-800">{member.phone || 'Not provided'}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CreditCard className="w-5 h-5 text-indigo-600" />
                                            <p className="text-sm text-gray-500">Membership ID</p>
                                        </div>
                                        <p className="text-lg font-semibold text-indigo-600">{member.membershipId || 'N/A'}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                            <p className="text-sm text-gray-500">Books Borrowed</p>
                                        </div>
                                        <p className="text-lg font-medium text-gray-800">
                                            {borrowHistory.filter(b => b.status === 'borrowed').length} active
                                        </p>
                                    </div>

                                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                                        <LogOut className="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                {borrowHistory.length === 0 ? (
                                    <div className="text-center py-12">
                                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600 text-lg">No borrowing history yet</p>
                                        <button
                                            onClick={() => navigate('/home')}
                                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            Browse Books
                                        </button>
                                    </div>
                                ) : (
                                    borrowHistory.map((record) => (
                                        <div
                                            key={record.id}
                                            className={`border rounded-lg p-4 ${
                                                record.status === 'returned'
                                                    ? 'bg-gray-50 border-gray-300'
                                                    : isOverdue(record.dueDate)
                                                    ? 'bg-red-50 border-red-300'
                                                    : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex gap-4">
                                                {record.book?.coverSrc && (
                                                    <img
                                                        src={record.book.coverSrc}
                                                        alt={record.book.title}
                                                        className="w-20 h-28 object-cover rounded border border-gray-300"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                                                        {record.book?.title || record.bookTitle || 'Unknown Book'}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {record.book?.author || 'Unknown Author'}
                                                    </p>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Borrowed: {formatDate(record.borrowDate)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            <span>Due: {formatDate(record.dueDate)}</span>
                                                        </div>
                                                        {record.returnDate && (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span>Returned: {formatDate(record.returnDate)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {record.status === 'borrowed' ? (
                                                            <>
                                                                {isOverdue(record.dueDate) ? (
                                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                                                        Overdue
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                                                                Returned
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
