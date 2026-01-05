import React, {useEffect, useState, useRef} from 'react';
import {Link, useNavigate} from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import Book from '../components/ui/Book.jsx';
import BookSkeleton from '../components/ui/BookSkeleton.jsx';
import {
    ChevronRight,
    Brain,
    Heart,
    Sparkles,
    Apple,
    X,
    Home as HomeIcon,
    UserIcon
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

    const [userId, setUserId] = useState(null);
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [allBooksFromDB, setAllBooksFromDB] = useState([]);
    const [isLoadingBorrows, setIsLoadingBorrows] = useState(true);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [borrowCount, setBorrowCount] = useState(0);

    useEffect(() => {
        // Listen to auth state changes
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                setUsername(user.displayName || user.email?.split("@")[0] || "User");
            } else {
                navigate("/login");
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    // Listen to borrowed books using auth UID directly
    useEffect(() => {
        if (!userId) {
            setIsLoadingBorrows(false);
            return;
        }
        
        setIsLoadingBorrows(true);

        // Listen to active borrows for this user using their auth UID
        const borrowsUnsubscribe = onSnapshot(
            query(
                collection(db, 'borrows'),
                where('userId', '==', userId),
                where('status', '==', 'borrowed')
            ),
            async (snapshot) => {
                setBorrowCount(snapshot.size);
                const borrowPromises = snapshot.docs.map(async (doc) => {
                    const borrowData = doc.data();
                    
                    try {
                        // Try to get book by ID directly
                        const bookRef = firestoreDoc(db, 'books', borrowData.bookId);
                        const bookSnapshot = await getDoc(bookRef);
                        
                        let book;
                        if (bookSnapshot.exists()) {
                            book = { id: bookSnapshot.id, ...bookSnapshot.data() };
                        } else {
                            // Fallback: use data from borrow record
                            book = {
                                id: borrowData.bookId,
                                title: borrowData.bookTitle || 'Unknown Book',
                                author: 'Unknown Author',
                                coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg"
                            };
                        }

                        return {
                            id: doc.id,
                            ...borrowData,
                            book: book,
                            borrowDate: borrowData.borrowDate?.toDate ? borrowData.borrowDate.toDate().toISOString() : borrowData.borrowDate,
                            dueDate: borrowData.dueDate?.toDate ? borrowData.dueDate.toDate().toISOString() : borrowData.dueDate
                        };
                    } catch (error) {
                        console.error('Error fetching book:', error);
                        // Return with minimal data
                        return {
                            id: doc.id,
                            ...borrowData,
                            book: {
                                id: borrowData.bookId,
                                title: borrowData.bookTitle || 'Unknown Book',
                                author: 'Unknown Author',
                                coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg"
                            },
                            borrowDate: borrowData.borrowDate?.toDate ? borrowData.borrowDate.toDate().toISOString() : borrowData.borrowDate,
                            dueDate: borrowData.dueDate?.toDate ? borrowData.dueDate.toDate().toISOString() : borrowData.dueDate
                        };
                    }
                });

                const borrows = await Promise.all(borrowPromises);
                
                // Sort by borrowDate descending
                borrows.sort((a, b) => {
                    const dateA = a.borrowDate ? new Date(a.borrowDate) : new Date(0);
                    const dateB = b.borrowDate ? new Date(b.borrowDate) : new Date(0);
                    return dateB - dateA;
                });
                
                setBorrowedBooks(borrows);
                setIsLoadingBorrows(false);
            },
            (error) => {
                console.error('Error listening to borrows:', error);
                setIsLoadingBorrows(false);
            }
        );

        return () => {
            borrowsUnsubscribe();
        };
    }, [userId]);

    // Load books from Firestore
    useEffect(() => {
        const booksUnsubscribe = onSnapshot(
            collection(db, 'books'),
            (snapshot) => {
                const booksData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || '',
                        author: data.author || '',
                        category: data.category || data.genre || 'General',
                        coverSrc: data.coverSrc || "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
                        isbn: data.isbn || '',
                        description: data.description || '',
                        available: data.available || 0,
                        quantity: data.quantity || 0
                    };
                });
                setAllBooksFromDB(booksData);
                setIsLoadingBooks(false);
            },
            (error) => {
                console.error('Error listening to books:', error);
                setIsLoadingBooks(false);
            }
        );

        return () => booksUnsubscribe();
    }, []);

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
            category: "Self-Development"
        },
        {
            id: 2,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Atomic Habits",
            author: "James Clear",
            category: "Self-Development"
        },
        {
            id: 3,
            coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg",
            title: "Mindset: The New Psychology of Success",
            author: "Carol S. Dweck",
            category: "Psychology"
        }
    ];

    // borrowedBooks now comes from Firestore real-time listener

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

    // Get recommendation books from database (10 books with various genres)
    const getRecommendationBooks = () => {
        if (allBooksFromDB.length === 0) {
            return [];
        }

        // If genre is selected, filter by genre
        if (selectedGenre) {
            const selectedGenreData = genres.find(g => g.name === selectedGenre);
            if (selectedGenreData) {
                const filtered = allBooksFromDB.filter(book => 
                    selectedGenreData.searchTerms.some(term => 
                        book.genre?.toLowerCase().includes(term.toLowerCase()) ||
                        book.category?.toLowerCase().includes(term.toLowerCase()) ||
                        book.title?.toLowerCase().includes(term.toLowerCase())
                    )
                );
                return filtered.slice(0, 10);
            }
        }

        // Get diverse books from different genres (up to 10 books)
        const genreMap = new Map();
        const result = [];
        
        // Group books by genre/category
        allBooksFromDB.forEach(book => {
            const genre = book.genre || book.category || 'General';
            if (!genreMap.has(genre)) {
                genreMap.set(genre, []);
            }
            genreMap.get(genre).push(book);
        });

        // Take books from different genres to ensure diversity
        const genresArray = Array.from(genreMap.keys());
        let totalAdded = 0;
        const maxPerGenre = Math.ceil(10 / genresArray.length);

        for (const genre of genresArray) {
            if (totalAdded >= 10) break;
            
            const booksInGenre = genreMap.get(genre);
            const toAdd = Math.min(maxPerGenre, booksInGenre.length, 10 - totalAdded);
            
            for (let i = 0; i < toAdd && totalAdded < 10; i++) {
                result.push(booksInGenre[i]);
                totalAdded++;
            }
        }

        // If we still need more books, fill from remaining
        if (result.length < 10) {
            for (const genre of genresArray) {
                if (result.length >= 10) break;
                const booksInGenre = genreMap.get(genre);
                for (const book of booksInGenre) {
                    if (result.length >= 10) break;
                    if (!result.find(b => b.id === book.id)) {
                        result.push(book);
                    }
                }
            }
        }

        // If still less than 10, add any remaining books
        if (result.length < 10) {
            for (const book of allBooksFromDB) {
                if (result.length >= 10) break;
                if (!result.find(b => b.id === book.id)) {
                    result.push(book);
                }
            }
        }

        return result.slice(0, 10);
    };

    const recommendationBooks = getRecommendationBooks();

    // Combine all books for search
    const allBooks = [...featuredBooks, ...recommendationBooks];

    // Filter books by search query only (for search results section)
    const searchResults = searchQuery.trim()
        ? allBooks.filter(book => {
            const query = searchQuery.toLowerCase().trim();
            return book.title.toLowerCase().includes(query) ||
                   book.author.toLowerCase().includes(query);
          })
        : [];

    const handleGenreClick = (genreName) => {
        setSelectedGenre(selectedGenre === genreName ? null : genreName);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearchOpen(false);
    };

    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
    };

    const handleSeeAllClick = (books) => {
        navigate('/catalog', { state: { books } });
    };

    // Format due date for machine-readable format
    const formatDateISO = (dateString) => {
        try {
            return new Date(dateString).toISOString();
        } catch {
            return '';
        }
    };

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>Home - Puswaka Digital Library | Discover & Borrow Books</title>
                <meta 
                    name="description" 
                    content="Welcome to Puswaka Digital Library. Browse, discover, and borrow books from our extensive collection. Explore categories like mental health, physical wellness, emotional resilience, and nutrition." 
                />
                <meta 
                    name="keywords" 
                    content="digital library, books, borrow books, ebooks, reading, mental health, wellness, self-development, psychology" 
                />
                <meta property="og:title" content="Puswaka Digital Library - Your Gateway to Knowledge" />
                <meta property="og:description" content="Discover and borrow books from our extensive digital collection. Join Puswaka today!" />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="/home" />
            </Helmet>

            <main className="min-h-screen bg-background" role="main">
                {/* Main Content Container */}
                <article className="p-4 flex flex-col gap-4">
                    
                    {/* Hero Section - User Welcome & Borrowed Books */}
                    <section 
                        className="bg-primary rounded-2xl px-4 sm:px-6 py-6 sm:py-8"
                        aria-labelledby="welcome-heading"
                    >
                        <div>
                            <header>
                                <h1 
                                    id="welcome-heading" 
                                    className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6"
                                >
                                    Selamat datang, {username} 👋
                                </h1>
                            </header>
                            
                            {/* Currently Borrowed Books Carousel */}
                            <section aria-labelledby="borrowed-books-heading">
                                <h2 id="borrowed-books-heading" className="sr-only">
                                    Your Borrowed Books
                                </h2>
                                
                                <div className="relative">
                                    <div 
                                        ref={carouselRef}
                                        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                                        role="region"
                                        aria-label="Borrowed books carousel"
                                        onScroll={(e) => {
                                            const scrollLeft = e.target.scrollLeft;
                                            const itemWidth = 163;
                                            const newIndex = Math.min(Math.round(scrollLeft / itemWidth), borrowedBooks.length - 1);
                                            if (newIndex >= 0 && newIndex !== currentCarouselIndex) {
                                                setCurrentCarouselIndex(newIndex);
                                            }
                                        }}
                                    >
                                        {isLoadingBorrows ? (
                                            <div 
                                                className="flex gap-3 sm:gap-4 overflow-x pb-2"
                                                aria-busy="true"
                                                aria-label="Loading borrowed books"
                                            >
                                                {[...Array(borrowCount > 0 ? borrowCount : 3)].map((_, index) => (
                                                    <div key={index} className="flex-shrink-0 w-[180px] sm:w-[200px]">
                                                        <BookSkeleton className="w-full" aria-hidden="true" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : borrowedBooks.length > 0 ? (
                                            <ul 
                                                className="flex gap-3 sm:gap-4 pb-2 list-none p-0 m-0"
                                                role="list"
                                                aria-label="List of borrowed books"
                                            >
                                                {borrowedBooks.map((borrow, index) => (
                                                    <li 
                                                        key={borrow.id} 
                                                        className="flex-shrink-0"
                                                        aria-setsize={borrowedBooks.length}
                                                        aria-posinset={index + 1}
                                                    >
                                                        <figure className="m-0">
                                                            <Book
                                                                id={borrow.book?.id || borrow.bookId}
                                                                coverSrc={borrow.book?.coverSrc || "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg"}
                                                                title={borrow.book?.title || borrow.bookTitle || "Unknown Book"}
                                                                author={borrow.book?.author || "Unknown Author"}
                                                                category={borrow.book?.category || borrow.book?.genre || "General"}
                                                                className="snap-start w-[180px] sm:w-[200px]"
                                                                onClick={handleBookClick}
                                                                showStatusOverlay={false}
                                                            />
                                                            <figcaption className="mt-1 space-y-0.5">
                                                                <time 
                                                                    dateTime={formatDateISO(borrow.dueDate)}
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                >
                                                                    Due: {borrow.dueDate ? new Date(borrow.dueDate).toLocaleDateString() : 'N/A'}
                                                                </time>
                                                            </figcaption>
                                                        </figure>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white text-sm sm:text-base" role="status">
                                                No borrowed books at the moment.
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Carousel Navigation Indicators */}
                                    {borrowedBooks.length > 0 && (
                                        <nav 
                                            className="flex justify-center gap-2 mt-4"
                                            aria-label="Carousel navigation"
                                        >
                                            {borrowedBooks.map((_, index) => (
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
                                                    aria-label={`Go to book ${index + 1}`}
                                                    aria-current={index === currentCarouselIndex ? 'true' : undefined}
                                                />
                                            ))}
                                        </nav>
                                    )}
                                </div>
                            </section>
                        </div>
                    </section>

                    {/* Explore by Category Section */}
                    <section 
                        aria-labelledby="categories-heading"
                    >
                        <div>
                            <header className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 
                                    id="categories-heading" 
                                    className="text-lg sm:text-xl font-bold text-gray-900"
                                >
                                    Explore by Category
                                </h2>
                                <Link 
                                    to="/catalog"
                                    className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    aria-label="See all book categories"
                                >
                                    See all
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                            </header>
                            
                            <nav 
                                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-2"
                                aria-label="Book categories"
                                role="navigation"
                            >
                                {genres.map((genre) => {
                                    const IconComponent = genre.icon;
                                    const isSelected = selectedGenre === genre.name;
                                    
                                    return (
                                        <button
                                            key={genre.id}
                                            onClick={() => handleGenreClick(genre.name)}
                                            className={`flex-shrink-0 flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl ring-1 ring-black/5 text-red-500 bg-gray-800 hover:opacity-90 transition-opacity min-w-[120px] sm:min-w-[140px] ${
                                                isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                                            }`}
                                            aria-pressed={isSelected}
                                            aria-label={`Filter by ${genre.name} category`}
                                        >
                                            <IconComponent 
                                                className="w-8 h-8 sm:w-10 sm:h-10 text-white mb-2" 
                                                aria-hidden="true" 
                                            />
                                            <span className="text-white text-xs sm:text-sm font-medium text-center">
                                                {genre.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </section>

                    {/* Book Recommendations Section */}
                    <section 
                        aria-labelledby="recommendations-heading"
                    >
                        <div>
                            <header className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 
                                    id="recommendations-heading" 
                                    className="text-lg sm:text-xl font-bold text-gray-900"
                                >
                                    Recommendation For You
                                </h2>
                                <Link 
                                    to="/catalog"
                                    className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    aria-label="View all book recommendations in catalog"
                                >
                                    See all
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                            </header>
                            
                            <div 
                                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide"
                                role="region"
                                aria-label="Book recommendations"
                            >
                                {isLoadingBooks ? (
                                    [...Array(10)].map((_, index) => (
                                        <BookSkeleton 
                                            key={index} 
                                            className="snap-start min-w-[160px] max-w-[160px]"
                                            aria-hidden="true"
                                        />
                                    ))
                                ) : (
                                    <ul 
                                        className="flex gap-3 sm:gap-4 list-none p-0 m-0"
                                        role="list"
                                        aria-label="List of recommended books"
                                    >
                                        {recommendationBooks.map((book, index) => (
                                            <li 
                                                key={book.id}
                                                aria-setsize={recommendationBooks.length}
                                                aria-posinset={index + 1}
                                            >
                                                <article className="snap-start min-w-[160px] max-w-[160px]">
                                                    <Book
                                                        id={book.id}
                                                        coverSrc={book.coverSrc}
                                                        title={book.title}
                                                        author={book.author}
                                                        category={book.category || book.genre}
                                                        textColor="text-gray-900"
                                                        available={book.available}
                                                        onClick={handleBookClick}
                                                    />
                                                </article>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Search Results Section - Conditional Render */}
                    {searchQuery.trim() && (
                        <section 
                            className="px-4 sm:px-6 py-6 sm:py-8 bg-white border-t border-gray-200"
                            aria-labelledby="search-results-heading"
                            aria-live="polite"
                        >
                            <div>
                                <header className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h2 
                                        id="search-results-heading" 
                                        className="text-lg sm:text-xl font-bold text-gray-900"
                                    >
                                        Search Results for "{searchQuery}"
                                    </h2>
                                    <button 
                                        onClick={handleClearSearch}
                                        className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                        aria-label="Clear search results"
                                    >
                                        Clear
                                        <X className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                </header>
                                
                                {searchResults.length > 0 ? (
                                    <ul 
                                        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 list-none p-0 m-0"
                                        role="list"
                                        aria-label="Search results"
                                    >
                                        {searchResults.map((book, index) => (
                                            <li 
                                                key={book.id}
                                                aria-setsize={searchResults.length}
                                                aria-posinset={index + 1}
                                            >
                                                <article className="snap-start">
                                                    <Book
                                                        id={book.id}
                                                        coverSrc={book.coverSrc}
                                                        title={book.title}
                                                        author={book.author}
                                                        category={book.category || book.genre}
                                                        textColor="text-gray-900"
                                                        onClick={handleBookClick}
                                                    />
                                                </article>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p 
                                        className="text-gray-500 text-sm sm:text-base text-center py-4"
                                        role="status"
                                    >
                                        No books found matching "{searchQuery}"
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                </article>
            </main>
        </>
    );
};

export default Home;