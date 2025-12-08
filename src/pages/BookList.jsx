import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Book from "@/components/ui/Book";

const BookList = () => {
    const location = useLocation();
    const [books, setBooks] = useState([]);
    const navigate = useNavigate();


    useEffect(() => {
        if (location.state && location.state.books) {
            setBooks(location.state.books);
        }
    }, [location.state]);

    const handleBookClick = (bookId) => {
        navigate(`/book/${bookId}`);
    };

    console.log(books)

    return (
        <div className="p-4">
            <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-2 text-white hover:text-gray-800 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </button>
            <h2 className="text-white text-2xl font-semibold p-2 mb-4">Book List</h2>
            <div className="grid grid-cols-2 gap-2 ">
                {books.map((book) => (
                    <div key={book.id}
                        className="flex bg-white rounded-md border border-gray-200 p-2 justify-center items-center">
                            <Book
                                key={book.id}
                                id={book.id}
                                coverSrc={book.coverSrc || null}
                                title={book.title}
                                author={book.author}
                                genre={book.genre}
                                textColor="text-gray-900"
                                className="snap-start"
                                onClick={handleBookClick}
                            />                  
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookList;