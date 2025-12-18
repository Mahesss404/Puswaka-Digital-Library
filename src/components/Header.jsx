import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search, X, Bell, Home, BookOpen, Bookmark, User, Settings, History } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Menu items with icons
    const menuItems = [
        { label: 'Home', path: '/', icon: Home },
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

    return (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 relative z-50 sticky">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                    
                    {/* Menu Popup */}
                    {isMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            {menuItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleMenuNavigation(item.path)}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 text-gray-700"
                                    >
                                        {IconComponent && <IconComponent className="w-4 h-4" />}
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative" ref={searchRef}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search books..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchOpen(true)}
                                className="w-40 sm:w-64 px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {isSearchOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                                {isSearching ? (
                                    <div className="flex justify-center items-center p-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((book) => (
                                        <button
                                            key={book.id}
                                            onClick={() => handleSearchResultClick(book)}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex flex-col"
                                        >
                                            <span className="font-medium text-gray-900 truncate">{book.title}</span>
                                            <span className="text-sm text-gray-500 truncate">{book.author}</span>
                                        </button>
                                    ))
                                ) : searchQuery ? (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                        No books found matching "{searchQuery}"
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    
                    <Link to="/notification" className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                        <Bell className="w-6 h-6 text-gray-700" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Header;