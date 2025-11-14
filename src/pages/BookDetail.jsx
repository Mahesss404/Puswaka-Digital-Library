import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Tag, FileText, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Buttons.jsx';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    memberId: '',
    dueDate: ''
  });

  useEffect(() => {
    loadBookData();
    loadMembersAndRecords();
  }, [id]);

  const loadBookData = () => {
    try {
      // First, try to load from localStorage (admin books)
      const booksData = localStorage.getItem('books');
      if (booksData) {
        const books = JSON.parse(booksData);
        const foundBook = books.find(b => String(b.id) === String(id));
        if (foundBook) {
          setBook(foundBook);
          setLoading(false);
          return;
        }
      }
      
      // If not found in localStorage, check Home.jsx mock data
      const mockBooks = [
        { id: 1, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Atomic Habits", author: "James Clear", genre: "Self-Development" },
        { id: 2, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Atomic Habits", author: "James Clear", genre: "Self-Development" },
        { id: 3, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Mindset: The New Psychology of Success", author: "Carol S. Dweck", genre: "Psychology" },
        { id: 4, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "The Power of Habit", author: "Charles Duhigg", genre: "Self-Development" },
        { id: 5, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Atomic Habits", author: "James Clear", genre: "Self-Development" },
        { id: 6, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Mindset: The New Psychology of Success", author: "Carol S. Dweck", genre: "Psychology" },
        { id: 7, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Deep Work: Rules for Focused Success", author: "Cal Newport", genre: "Productivity" },
        { id: 8, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", genre: "Self-Development" },
        { id: 9, coverSrc: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", genre: "Psychology" }
      ];
      
      // Match by string or number ID
      const foundMockBook = mockBooks.find(b => String(b.id) === String(id));
      if (foundMockBook) {
        // Convert mock book to full book format with defaults
        setBook({
          ...foundMockBook,
          category: foundMockBook.genre,
          description: `This is a great book about ${foundMockBook.genre}. ${foundMockBook.title} by ${foundMockBook.author} offers valuable insights and practical advice.`,
          available: 5,
          quantity: 10,
          isbn: ''
        });
      } else {
        setBook(null);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      setBook(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMembersAndRecords = () => {
    try {
      const membersData = localStorage.getItem('members');
      const borrowData = localStorage.getItem('borrow_records');
      
      if (membersData) {
        setMembers(JSON.parse(membersData));
      }
      if (borrowData) {
        setBorrowRecords(JSON.parse(borrowData));
      }
    } catch (error) {
      console.error('Error loading members/records:', error);
    }
  };

  const handleBorrow = async () => {
    if (!borrowForm.memberId || !borrowForm.dueDate) {
      alert('Please select a member and due date');
      return;
    }

    if (book.available <= 0) {
      alert('Book is not available');
      return;
    }

    const member = members.find(m => m.id === borrowForm.memberId);
    
    if (!member) {
      alert('Member not found');
      return;
    }

    try {
      // Get current books data
      const booksData = localStorage.getItem('books');
      const books = booksData ? JSON.parse(booksData) : [];
      
      // Create borrow record
      const newRecord = {
        id: Date.now().toString(),
        bookId: book.id,
        bookTitle: book.title,
        memberId: borrowForm.memberId,
        memberName: member.name,
        borrowDate: new Date().toISOString(),
        dueDate: borrowForm.dueDate,
        status: 'borrowed',
        returnDate: null
      };

      // Update book availability
      const updatedBooks = books.map(b =>
        b.id === book.id ? { ...b, available: b.available - 1 } : b
      );

      // Update member borrowed count
      const membersData = localStorage.getItem('members');
      const membersList = membersData ? JSON.parse(membersData) : [];
      const updatedMembers = membersList.map(m =>
        m.id === borrowForm.memberId ? { ...m, borrowedBooks: m.borrowedBooks + 1 } : m
      );

      // Get current borrow records
      const borrowData = localStorage.getItem('borrow_records');
      const currentRecords = borrowData ? JSON.parse(borrowData) : [];

      // Save all updates
      localStorage.setItem('books', JSON.stringify(updatedBooks));
      localStorage.setItem('members', JSON.stringify(updatedMembers));
      localStorage.setItem('borrow_records', JSON.stringify([...currentRecords, newRecord]));

      // Update local state
      setBook({ ...book, available: book.available - 1 });
      setShowBorrowModal(false);
      setBorrowForm({ memberId: '', dueDate: '' });
      alert('✓ Book borrowed successfully!');
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Failed to borrow book. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Book not found</p>
          <Button onClick={() => navigate('/home')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* Book Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Book Cover */}
            <div className="md:w-1/3 p-8 bg-gray-50 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <img
                  src={book.coverSrc || 'https://placehold.co/300x400/cccccc/666666?text=No+Cover'}
                  alt={book.title}
                  className="w-full h-auto rounded-lg shadow-md object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x400/cccccc/666666?text=No+Cover';
                  }}
                />
              </div>
            </div>

            {/* Book Information */}
            <div className="md:w-2/3 p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {book.title}
              </h1>

              {/* Author */}
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-500" />
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Author:</span> {book.author}
                </p>
              </div>

              {/* Genre/Category */}
              {book.genre || book.category ? (
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <p className="text-lg text-gray-700">
                    <span className="font-semibold">Genre:</span> {book.genre || book.category}
                  </p>
                </div>
              ) : null}

              {/* ISBN */}
              {book.isbn && (
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <p className="text-lg text-gray-700">
                    <span className="font-semibold">ISBN:</span> {book.isbn}
                  </p>
                </div>
              )}

              {/* Stock Information */}
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-gray-500" />
                <div className="flex items-center gap-4">
                  <p className="text-lg text-gray-700">
                    <span className="font-semibold">Stock:</span>
                  </p>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    book.available > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {book.available || 0} / {book.quantity || 0} Available
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Description</h2>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {book.description || 'No description available for this book.'}
                </p>
              </div>

              {/* Borrow Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowBorrowModal(true)}
                  disabled={!book.available || book.available === 0}
                  className="w-full sm:w-auto px-8 py-3 text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <Calendar className="w-5 h-5" />
                  {book.available > 0 ? 'Borrow This Book' : 'Not Available'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Borrow Book</h2>
            <div className="bg-indigo-50 p-3 rounded-lg mb-4">
              <p className="font-semibold">{book.title}</p>
              <p className="text-sm text-gray-600">by {book.author}</p>
            </div>
            <div className="space-y-4">
              <select
                value={borrowForm.memberId}
                onChange={(e) => setBorrowForm({ ...borrowForm, memberId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Member</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.membershipId})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={borrowForm.dueDate}
                onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleBorrow}
                  className="flex-1"
                  size="lg"
                >
                  Confirm Borrow
                </Button>
                <button
                  onClick={() => {
                    setShowBorrowModal(false);
                    setBorrowForm({ memberId: '', dueDate: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;
