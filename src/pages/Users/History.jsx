import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { collection, query, where, onSnapshot, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const History = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [borrowHistory, setBorrowHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Get current auth user
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUserId(firebaseUser.uid);
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    // Listen to borrow history for this user
    useEffect(() => {
        if (!userId) return;

        const borrowsQuery = query(
            collection(db, 'borrows'),
            where('userId', '==', userId)
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
    }, [userId]);

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
                    <p className="mt-4 text-gray-600">Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div>
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">Borrowing History</h1>
                    <p className="text-gray-600">Your complete borrowing history and current loans</p>
                </div>

                {/* History List */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {borrowHistory.length === 0 ? (
                        <div className="p-8 text-center">
                            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-700">No borrowing history yet</h3>
                            <p className="text-gray-500 mt-2">Your borrowing history will appear here.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {borrowHistory.map((borrow) => (
                                <li key={borrow.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            {borrow.book.coverSrc ? (
                                                <img
                                                    src={borrow.book.coverSrc}
                                                    alt={`Cover of ${borrow.book.title}`}
                                                    className="h-20 w-14 object-cover rounded-md"
                                                />
                                            ) : (
                                                <div className="h-20 w-14 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">
                                                {borrow.book.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {borrow.book.author}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Borrowed: {formatDate(borrow.borrowDate)}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Due: {formatDate(borrow.dueDate)}
                                                </span>
                                                {borrow.returnDate ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Returned: {formatDate(borrow.returnDate)}
                                                    </span>
                                                ) : isOverdue(borrow.dueDate) ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        On Loan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;