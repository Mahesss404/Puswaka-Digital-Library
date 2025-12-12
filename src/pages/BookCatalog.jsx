import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import Book from "@/components/ui/Book";
import Header from "@/components/Header";

const BookCatalog = () => {
    const location = useLocation();
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate loading data
        const timer = setTimeout(() => {
            if (location.state?.books) {
                setBooks(location.state.books);
                setFilteredBooks(location.state.books);
            }
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [location.state]);

    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (!query.trim()) {
            setFilteredBooks(books);
            return;
        }

        const filtered = books.filter(book => 
            book.title?.toLowerCase().includes(query) ||
            book.author?.toLowerCase().includes(query) ||
            book.genre?.toLowerCase().includes(query) ||
            book.isbn?.toLowerCase().includes(query)
        );
        setFilteredBooks(filtered);
    };

    return (
        <div className="bg-white p-4 lg:p-8 flex flex-col gap-4">
            <Header/>
            {/* Back Button */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-primary hover:text-gray-800 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <p>Back to Home</p>
                </button>
            </div>

            {/* Banner */}
            <div className="w-full overflow-hidden rounded-lg mb-8 bg-gray-100">
                <img 
                    src="src/assets/banner-1.png" 
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
                        placeholder="Search by title, author, or genre..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full p-2 pl-10 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Book Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                    {filteredBooks.map((book) => (
                        <div
                            key={book.id}
                            className="bg-white rounded-md border border-gray-200 flex justify-center items-center w-full hover:shadow-lg shadow transition-shadow"
                        >
                            <Book
                                id={book.id}
                                coverSrc={book.coverSrc || null}
                                title={book.title}
                                author={book.author}
                                genre={book.genre}
                                textColor="text-gray-900"
                                className="w-full"
                                onClick={handleBookClick}
                            />
                        </div>
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