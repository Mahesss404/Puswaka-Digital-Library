import { Text } from '@/components/ui/text';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, AlertCircle, Info, BellRing, ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs, onSnapshot, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- Utility: Calculate Fine ---
export const calculateOverdueFine = (dueDate, returnDate = new Date()) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const returned = new Date(returnDate);
    
    // Normalize to midnight
    due.setHours(0, 0, 0, 0);
    returned.setHours(0, 0, 0, 0);

    if (returned <= due) return 0;

    const diffTime = Math.abs(returned - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const finePerDay = 1000; // IDR 1000 per day
    return diffDays * finePerDay;
};

const Notification = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    // 1. Get Auth User UID directly
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUserId(firebaseUser.uid);
            } else {
                setLoading(false); // No user, stop loading
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Borrows & Generate Notifications
    useEffect(() => {
        if (!userId) return;

        const q = query(collection(db, 'borrows'), where('userId', '==', userId));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const rawBorrows = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                // Fetch book title if missing or just to be safe (though usually in borrow doc)
                let bookTitle = data.bookTitle;
                if (!bookTitle && data.bookId) {
                    const bookSnap = await getDoc(firestoreDoc(db, 'books', data.bookId));
                    if (bookSnap.exists()) bookTitle = bookSnap.data().title;
                }

                return {
                    id: docSnap.id,
                    ...data,
                    bookTitle: bookTitle || "Unknown Book",
                    borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date(data.borrowDate),
                    dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
                    returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : (data.returnDate ? new Date(data.returnDate) : null),
                };
            }));

            // Transform into Notifications
            let generatedNotifications = [];

            rawBorrows.forEach(borrow => {
                // Event 1: Borrowed
                if (borrow.borrowDate) {
                    generatedNotifications.push({
                        id: `${borrow.id}_borrow`,
                        borrowId: borrow.id,
                        title: `Peminjaman Berhasil: ${borrow.bookTitle}`,
                        content: `Anda telah berhasil meminjam buku "${borrow.bookTitle}".`,
                        date: borrow.borrowDate,
                        category: 'Activity',
                        isRead: true, // Historical, assume read
                        type: 'borrow_success',
                        originalData: borrow
                    });
                }

                // Event 2: Returned
                if (borrow.returnDate) {
                    generatedNotifications.push({
                         id: `${borrow.id}_return`,
                         borrowId: borrow.id,
                         title: `Pengembalian Berhasil: ${borrow.bookTitle}`,
                         content: `Terima kasih! Buku "${borrow.bookTitle}" telah dikembalikan.`,
                         date: borrow.returnDate,
                         category: 'Activity',
                         isRead: true,
                         type: 'return_success',
                         originalData: borrow
                    });
                }

                // Event 3: Overdue Alert (Automatic)
                const now = new Date();
                const due = new Date(borrow.dueDate);
                // Check if currently overdue (not returned yet AND past due date)
                if (!borrow.returnDate && now > due) {
                    // Calculate fine for context
                    const fine = calculateOverdueFine(borrow.dueDate);
                    generatedNotifications.push({
                        id: `${borrow.id}_overdue`,
                        borrowId: borrow.id,
                        title: `Peringatan: Buku Terlambat!`,
                        content: `Buku "${borrow.bookTitle}" seharusnya dikembalikan pada ${borrow.dueDate.toLocaleDateString('id-ID')}. Anda dikenakan denda keterlambatan. Harap segera melakukan pengembalian ke perpustakaan.`,
                        date: now, // Alert time is NOW
                        category: 'Alert',
                        isRead: false,
                        type: 'overdue_alert',
                        originalData: borrow,
                        fine: fine
                    });
                }
            });

            // Sort by Date Descending
            generatedNotifications.sort((a, b) => b.date - a.date);

            setNotifications(generatedNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);


    // Filter Logic
    const filteredNotifications = notifications.filter(notif => {
        const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              notif.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'All') return matchesSearch;
        return matchesSearch && notif.category === activeTab;
    });

    const categories = ['All', 'Activity', 'Alert', 'Promotion'];

    const formatTime = (date) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        if (!date) return '';
         return date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
    }

    // Is Today Helper
    const isDateToday = (date) => {
        if (!date) return false;
        return date.toDateString() === new Date().toDateString();
    }

    if (loading) {
         return (
            <div className="mx-auto w-full p-8 bg-white flex items-center justify-center h-screen">
                <Text>Loading notifications...</Text>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full bg-white">
            <div className="bg-white border-b border-gray-200">
                <div className="px-4 sm:px-6 py-4">
                    <Link
                        to="/home"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>
            
            {/* Header / Search */}
            <div className="p-4 border-b flex items-center gap-4 bg-gray-50/50">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search notifications" 
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 border-b overflow-x-auto no-scrollbar">
                <div className="flex min-w-full">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
                                activeTab === cat 
                                    ? "bg-blue-100 text-blue-600" 
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            )}
                        >   
                            {cat === 'Activity' && <BellRing className="w-4 h-4 text-green-600"/>}
                            {cat === 'Alert' && <AlertCircle className="w-4 h-4 text-red-600"/>}
                            {cat === 'Promotion' && <Info className="w-4 h-4 text-orange-600"/>}
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto min-h-[500px]">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <BellRing className="w-12 h-12 mb-4 opacity-20" />
                        <Text>No notifications found</Text>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => {
                        const isToday = isDateToday(notif.date);

                        return (
                            <div 
                                key={notif.id}
                                onClick={() => navigate(`/notification/${notif.id}`, { state: { notification: notif } })} 
                                className={cn(
                                    "group flex items-center gap-4 px-4 py-3 border-b border-gray-200 hover:shadow-md cursor-pointer transition-all bg-white hover:z-10 relative",
                                    !notif.isRead ? "bg-white" : "bg-gray-50/30"
                                )}
                            >
                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <Text 
                                        className={cn(
                                            "truncate w-48 sm:w-64",
                                            !notif.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"
                                        )}
                                    >
                                        {notif.title}
                                    </Text>
                                    
                                    {/* Category Badge - Restored */}
                                    <span className={cn(
                                        "shrink-0 px-2 py-0.5 text-[10px] rounded-full font-medium border",
                                        notif.category === 'Activity' ? "bg-green-50 text-green-700 border-green-200" :
                                        notif.category === 'Alert' ? "bg-red-50 text-red-700 border-red-200" :
                                        "bg-blue-50 text-blue-700 border-blue-200"
                                    )}>
                                        {notif.category}
                                    </span>

                                    {/* Snippet */}
                                    <span className="text-sm text-gray-500 truncate flex-1 hidden sm:block">
                                        <span className="mx-2 text-gray-300">-</span>
                                        {notif.content}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2 sm:w-auto">
                                    {/* Date */}
                                    <div className={cn(
                                        "text-xs whitespace-nowrap w-20 text-right font-medium",
                                        !notif.isRead ? "text-gray-900" : "text-gray-500"
                                    )}>
                                        {isToday ? formatTime(notif.date) : formatDate(notif.date)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Notification;