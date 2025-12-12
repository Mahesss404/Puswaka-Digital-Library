import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Book from "@/components/ui/Book";


const BookCatalog = () => {
    const location = useLocation();
    const [books, setBooks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state && location.state.books) {
            setBooks(location.state.books);
        }
    }, [location.state]);

    console.log(books);
    
    // handle book navigate
    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
    };
    return (
        <div className="bg-white p-4 lg:p-8">

            {/* Button Back */}
            <div>
                <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 text-primary hover:text-gray-800 mb-4"
                >
                <ArrowLeft className="w-5 h-5" />
                <p>Back to Home</p>
                </button>
            </div>

            {/* Card Catalog */}
            <div>
                <h2 className="text-primary text-starts text-2xl font-semibold p-2 mb-4">Book Catalog</h2>
                <div className="grid grid-cols-2 mx-4 md:grid-cols-4 mx-8 lg:grid-cols-7 gap-4 ">
                    {books.map((book) => (
                        <div
                        key={book.id}
                        className="bg-white rounded-md border border-gray-200 flex justify-center items-center w-full hover:shadow-lg shadow-primary"
                        >
                            <Book
                                id={book.id}
                                coverSrc={book.coverSrc || null}
                                title={book.title}
                                author={book.author}
                                genre={book.genre}
                                textColor="text-gray-900"
                                className=" w-full"
                                onClick={handleBookClick}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookCatalog;