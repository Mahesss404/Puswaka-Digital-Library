import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCategoryContext } from "@/contexts/CategoryContext";
import Book from "@/components/ui/Book";
import BookSkeleton from "@/components/ui/BookSkeleton";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";

const BookCatalog = () => {
    const location = useLocation();
    const { getCategoryName } = useCategoryContext();
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setIsLoading(true);
                const booksCollection = collection(db, 'books');
                const booksSnapshot = await getDocs(booksCollection);
                const booksList = booksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setBooks(booksList);
                setFilteredBooks(booksList);
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // If books are passed via location.state, use them
        // Otherwise, fetch from Firestore
        if (location.state?.books) {
            setBooks(location.state.books);
            setFilteredBooks(location.state.books);
            setIsLoading(false);
        } else {
            fetchBooks();
        }
    }, [location.state]);

    const handleBookClick = (bookId) => {
        navigate(`/catalog/${bookId}`);
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (!query.trim()) {
            setFilteredBooks(books);
            return;
        }

        const filtered = books.filter(book => {
            // Check title and author
            const matchesText = 
                book.title?.toLowerCase().includes(query) ||
                book.author?.toLowerCase().includes(query);
            
            // Check categories array (new field)
            const matchesCategories = book.categories?.some(catUuid => {
                const categoryName = getCategoryName(catUuid);
                return categoryName?.toLowerCase().includes(query);
            });
            
            // Check legacy category field
            const matchesLegacyCategory = book.category?.toLowerCase().includes(query);
            
            return matchesText || matchesCategories || matchesLegacyCategory;
        });
        setFilteredBooks(filtered);
    };

    console.log(books);

    return (
        <div className="bg-white p-4 flex flex-col lg:p-8 gap-4">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Banner */}
                <div className="w-full overflow-hidden rounded-lg mb-8 bg-gray-100">
                    <img 
                        src="public/banner-1.png" 
                        alt="Book Catalog" 
                        className="w-full h-auto object-cover"
                    />
                </div>

                {/* Search and Title Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-primary text-2xl font-semibold">Book Catalog</h2>
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search by title, author, or category..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full p-2 pl-10 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Book Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                        {[...Array(14)].map((_, index) => (
                            <BookSkeleton key={index} className="h-full w-full" />
                        ))}
                    </div>
                ) : filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                        {filteredBooks.map((book) => (
                            <Book
                                key={book.id}
                                id={book.id}
                                coverSrc={book.coverSrc || null}
                                title={book.title}
                                author={book.author}
                                category={book.category}
                                categories={book.categories}
                                available={book.available}
                                textColor="text-gray-900"
                                className="h-full w-full"
                                onClick={handleBookClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            {searchQuery ? 'No books found matching your search' : 'No books available'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilteredBooks(books);
                                }}
                                className="mt-2 px-4 py-1 text-sm text-primary hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
        </div>
    );
};

export default BookCatalog;