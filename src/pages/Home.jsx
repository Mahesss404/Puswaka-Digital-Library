import React, {useEffect, useState, useRef} from 'react';
import {useNavigate} from "react-router-dom";
import Book from '../components/ui/Book.jsx';
import { Menu, Search, Bell, ChevronRight, Brain, Heart, Sparkles, Apple, X, Home as HomeIcon } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const carouselRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const isAuth = localStorage.getItem("auth");
        const name = localStorage.getItem("username");

        if (!isAuth) {
            navigate("/");
        } else {
            setUsername(name);
        }
    }, [navigate]);

    // Close menu and search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close menu if clicking outside
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            // Close search if clicking outside the search container
            if (isSearchOpen && searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        if (isMenuOpen || isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isMenuOpen, isSearchOpen]);

    // Mock data for books
    const featuredBooks = [
        {
            id: 1,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Atomic Habits",
            author: "James Clear",
            genre: "Self-Development"
        },
        {
            id: 2,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Atomic Habits",
            author: "James Clear",
            genre: "Self-Development"
        },
        {
            id: 3,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Mindset: The New Psychology of Success",
            author: "Carol S. Dweck",
            genre: "Psychology"
        }
    ];

    const recommendedBooks = [
        {
            id: 4,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "The Power of Habit",
            author: "Charles Duhigg",
            genre: "Self-Development"
        },
        {
            id: 5,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Atomic Habits",
            author: "James Clear",
            genre: "Self-Development"
        },
        {
            id: 6,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Mindset: The New Psychology of Success",
            author: "Carol S. Dweck",
            genre: "Psychology"
        },
        {
            id: 7,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Deep Work: Rules for Focused Success",
            author: "Cal Newport",
            genre: "Productivity"
        }
    ];

    const borrowedBooks = [
        {
            id: 8,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "The 7 Habits of Highly Effective People",
            author: "Stephen R. Covey",
            genre: "Self-Development",
            dueDate: "2024-01-15"
        },
        {
            id: 9,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Thinking, Fast and Slow",
            author: "Daniel Kahneman",
            genre: "Psychology",
            dueDate: "2024-01-20"
        }
    ];

    const genres = [
        {
            id: 1,
            name: "Mental health",
            icon: Brain,
            searchTerms: ["psychology", "mental", "mindset", "thinking"]
        },
        {
            id: 2,
            name: "Physical wellness",
            icon: Heart,
            searchTerms: ["wellness", "physical", "health", "fitness"]
        },
        {
            id: 3,
            name: "Emotional resilience",
            icon: Sparkles,
            searchTerms: ["emotional", "resilience", "habits", "self-development"]
        },
        {
            id: 4,
            name: "Nutrition balance",
            icon: Apple,
            searchTerms: ["nutrition", "food", "diet", "balance"]
        }
    ];

    // Combine all books for search
    const allBooks = [...featuredBooks, ...recommendedBooks, ...borrowedBooks];

    // Filter recommendation books by genre only (not by search)
    const recommendationBooks = (() => {
        if (selectedGenre) {
            const selectedGenreData = genres.find(g => g.name === selectedGenre);
            if (selectedGenreData) {
                return allBooks.filter(book => 
                    selectedGenreData.searchTerms.some(term => 
                        book.genre.toLowerCase().includes(term.toLowerCase()) ||
                        book.title.toLowerCase().includes(term.toLowerCase())
                    )
                );
            }
        }
        return recommendedBooks;
    })();

    // Filter books by search query only (for search results section)
    const searchResults = searchQuery.trim()
        ? allBooks.filter(book => {
            const query = searchQuery.toLowerCase().trim();
            return book.title.toLowerCase().includes(query) ||
                   book.author.toLowerCase().includes(query);
          })
        : [];

    // Navigation menu items
    const menuItems = [
        { path: '/home', label: 'Home', icon: HomeIcon },
        { path: '/about', label: 'About', icon: null },
        { path: '/app', label: 'App', icon: null },
    ];

    const handleGenreClick = (genreName) => {
        setSelectedGenre(selectedGenre === genreName ? null : genreName);
    };

    const handleMenuNavigation = (path) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearchOpen(false);
    };

    return (
        <div className="min-h-screen bg-white px-8 lg:px-12">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 relative z-50">
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
                            <button 
                                data-search-button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Search className="w-6 h-6 text-gray-700" />
                            </button>
                            
                            {/* Search Popup */}
                            {isSearchOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Search className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search books by name..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleClearSearch}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                    
                                    {/* Search Results Preview */}
                                    {searchQuery.trim() && (
                                        <div className="max-h-64 overflow-y-auto">
                                            {searchResults.length > 0 ? (
                                                <div className="space-y-1">
                                                    {searchResults.slice(0, 5).map((book) => (
                                                        <div
                                                            key={book.id}
                                                            className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                                                        >
                                                            <p className="font-medium text-gray-900">{book.title}</p>
                                                            <p className="text-xs text-gray-500">By {book.author}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 text-center py-4">No books found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <Bell className="w-6 h-6 text-gray-700" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pb-8">
                {/* Hero Carousel Section - Blue Background */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 sm:px-6 py-6 sm:py-8">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                            Selamat datang, {username} 👋
                        </h2>
                        
                        {/* Book Carousel */}
                        <div className="relative">
                            <div 
                                ref={carouselRef}
                                className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                                onScroll={(e) => {
                                    const scrollLeft = e.target.scrollLeft;
                                    const itemWidth = 163; // book width (147) + gap (16)
                                    const newIndex = Math.min(Math.round(scrollLeft / itemWidth), featuredBooks.length - 1);
                                    if (newIndex >= 0 && newIndex !== currentCarouselIndex) {
                                        setCurrentCarouselIndex(newIndex);
                                    }
                                }}
                            >
                                {featuredBooks.map((book, index) => (
                                    <Book
                                        key={book.id}
                                        coverSrc={book.coverSrc}
                                        title={book.title}
                                        author={book.author}
                                        genre={book.genre}
                                        className="snap-start"
                                    />
                                ))}
                                {/* See All Button */}
                                <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[147px] sm:min-w-[160px] snap-start">
                                    <button className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors mb-2">
                                        <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                    </button>
                                    <p className="text-sm sm:text-base text-white font-medium">See all</p>
                                </div>
                            </div>
                            
                            {/* Carousel Indicators */}
                            <div className="flex justify-center gap-2 mt-4">
                                {featuredBooks.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setCurrentCarouselIndex(index);
                                            if (carouselRef.current) {
                                                const itemWidth = 163;
                                                carouselRef.current.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
                                            }
                                        }}
                                        className={`h-1.5 rounded-full transition-all ${
                                            index === currentCarouselIndex
                                                ? 'w-8 bg-white'
                                                : 'w-2 bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Explore by Genre Section */}
                <div className="px-4 sm:px-6 py-6 sm:py-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Explore by Genre</h3>
                            <button className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                See all
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-2">
                            {genres.map((genre) => {
                                const IconComponent = genre.icon;
                                return (
                                    <button
                                        key={genre.id}
                                        onClick={() => handleGenreClick(genre.name)}
                                        className={`flex-shrink-0 flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl ring-1 ring-black/5 text-red-500 bg-gray-800 hover:opacity-90 transition-opacity min-w-[120px] sm:min-w-[140px] ${
                                            selectedGenre === genre.name ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                                        }`}
                                    >
                                        <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white mb-2" />
                                        <span className="text-white text-xs sm:text-sm font-medium text-center">
                                            {genre.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recommendation For You Section */}
                <div className="px-4 sm:px-6 py-6 sm:py-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recommendation For You</h3>
                            <button className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                See all
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
                            {recommendationBooks.map((book) => (
                                <Book
                                    key={book.id}
                                    coverSrc={book.coverSrc}
                                    title={book.title}
                                    author={book.author}
                                    genre={book.genre}
                                    textColor="text-gray-900"
                                    className="snap-start"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Borrowed Books Section */}
                <div className="px-4 sm:px-6 py-6 sm:py-8 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Borrowed Books</h3>
                            <button className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                See all
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {borrowedBooks.length > 0 ? (
                            <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
                                {borrowedBooks.map((book) => (
                                    <div key={book.id} className="flex-shrink-0">
                                        <Book
                                            coverSrc={book.coverSrc}
                                            title={book.title}
                                            author={book.author}
                                            genre={book.genre}
                                            textColor="text-gray-900"
                                            className="snap-start"
                                        />
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                            Due: {new Date(book.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm sm:text-base">No borrowed books at the moment.</p>
                        )}
                    </div>
                </div>

                {/* Search Results Section - Show when searching */}
                {searchQuery.trim() && (
                    <div className="px-4 sm:px-6 py-6 sm:py-8 bg-white border-t border-gray-200">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                    Search Results for "{searchQuery}"
                                </h3>
                                <button 
                                    onClick={handleClearSearch}
                                    className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    Clear
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {searchResults.length > 0 ? (
                                <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
                                    {searchResults.map((book) => (
                                        <Book
                                            key={book.id}
                                            coverSrc={book.coverSrc}
                                            title={book.title}
                                            author={book.author}
                                            genre={book.genre}
                                            textColor="text-gray-900"
                                            className="snap-start"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm sm:text-base text-center py-4">
                                    No books found matching "{searchQuery}"
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;