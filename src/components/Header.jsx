import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search, X, Bell, Home, BookOpen, Bookmark, User, Settings, History, Library } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Menu items with icons
    const menuItems = [
        { label: 'Home', path: '/home', icon: Home },
        { label: 'Book Catalog', path: '/catalog', icon: BookOpen },
        { label: 'History', path: '/history', icon: History },
        { label: 'Profile', path: '/profile', icon: User },
        { label: 'Settings', path: '/settings', icon: Settings }
    ];

    // Handle menu navigation
    const handleMenuNavigation = (path) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    // Search books in Firestore with case-insensitive matching and multiple fields
    const searchBooks = async (searchText) => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const booksRef = collection(db, 'books');
            const searchLower = searchText.toLowerCase();
            
            // Get all books and filter client-side for case-insensitive search
            const q = query(booksRef);
            const querySnapshot = await getDocs(q);
            
            // Filter books based on search query (case-insensitive)
            const searchResults = [];
            querySnapshot.forEach((doc) => {
                const book = { id: doc.id, ...doc.data() };
                if (
                    (book.title && book.title.toLowerCase().includes(searchLower)) ||
                    (book.author && book.author.toLowerCase().includes(searchLower)) ||
                    (book.category && book.category.toLowerCase().includes(searchLower)) ||
                    (book.genre && book.genre.toLowerCase().includes(searchLower)) ||
                    (book.isbn && book.isbn.toLowerCase().includes(searchLower))
                ) {
                    searchResults.push(book);
                }
            });

            setSearchResults(searchResults);
        } catch (error) {
            console.error('Error searching books:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search input change with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchBooks(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
        }
    };

    // Handle search result click
    const handleSearchResultClick = (book) => {
        navigate(`/book/${book.id}`);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchOpen(false);
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchOpen(false);
    };

    // Close search when navigating away
    useEffect(() => {
        return () => {
            setSearchQuery('');
            setSearchResults([]);
            setIsSearchOpen(false);
        };
    }, [location.pathname]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Check for unread notifications (overdue borrows)
    useEffect(() => {
        let unsubscribeBorrows = () => {};
        
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Listen to user's borrows in real-time
                const borrowsQuery = query(
                    collection(db, 'borrows'), 
                    where('userId', '==', firebaseUser.uid),
                    where('status', '==', 'borrowed')
                );
                
                unsubscribeBorrows = onSnapshot(borrowsQuery, (snapshot) => {
                    const now = new Date();
                    let overdueCount = 0;
                    
                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
                        
                        // Count as unread if overdue (past due date and not returned)
                        if (dueDate && now > dueDate) {
                            overdueCount++;
                        }
                    });
                    
                    setUnreadCount(overdueCount);
                });
            } else {
                setUnreadCount(0);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeBorrows();
        };
    }, []);

    return (
        <header className="bg-[#4995ED] shadow-md px-4 sm:px-6 py-3 fixed w-full sm:py-4 z-50 top-0">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Logo - Left Side */}
                <Link to="/home" className="flex items-center gap-2 sm:gap-3 group">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg group-hover:bg-white/30 transition-all duration-300">
                        <Library className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    {/* Logo Title - Hidden on mobile, visible on desktop */}
                    <div className="hidden md:flex flex-col">
                        <span className="text-white font-bold text-lg leading-tight">Puswaka</span>
                        <span className="text-white/90 text-xs font-medium">Digital Library</span>
                    </div>
                </Link>

                {/* Navigation - Center to Right */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search Bar */}
                    <div className="relative" ref={searchRef}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search books..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchOpen(true)}
                                className="w-32 sm:w-48 md:w-64 px-3 sm:px-4 py-2 pl-9 sm:pl-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all duration-300 text-sm sm:text-base"
                            />
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/80" />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {isSearchOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 py-2 z-50 max-h-96 overflow-y-auto animate-fadeIn">
                                {isSearching ? (
                                    <div className="flex justify-center items-center p-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4995ED]"></div>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((book) => (
                                        <button
                                            key={book.id}
                                            onClick={() => handleSearchResultClick(book)}
                                            className="w-full px-4 py-2.5 text-left hover:bg-[#4995ED]/10 transition-all duration-200 flex flex-col"
                                        >
                                            <span className="font-medium text-gray-900 truncate">{book.title}</span>
                                            <span className="text-sm text-gray-600 truncate">{book.author}</span>
                                        </button>
                                    ))
                                ) : searchQuery ? (
                                    <div className="px-4 py-3 text-sm text-gray-600">
                                        No books found matching "{searchQuery}"
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <Link 
                        to="/notification" 
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300 relative backdrop-blur-sm"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                            </span>
                        )}
                    </Link>

                    {/* Menu Button */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm"
                            aria-label="Menu"
                        >
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </button>
                        
                        {/* Menu Popup */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 py-2 z-50 animate-fadeIn">
                                {menuItems.map((item) => {
                                    const IconComponent = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => handleMenuNavigation(item.path)}
                                            className={`w-full px-4 py-2.5 text-left hover:bg-[#4995ED]/10 transition-all duration-200 flex items-center gap-3 ${
                                                isActive ? 'bg-[#4995ED]/20 text-[#4995ED] font-semibold' : 'text-gray-700'
                                            }`}
                                        >
                                            {IconComponent && <IconComponent className="w-4 h-4" />}
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Add fade-in animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </header>
    );
};

export default Header;