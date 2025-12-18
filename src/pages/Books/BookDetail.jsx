import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Tag, FileText, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Buttons.jsx';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [isUserBorrowed, setIsUserBorrowed] = useState(false);
  const [userBorrowInfo, setUserBorrowInfo] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    memberId: '',
    dueDate: ''
  });

  // Get current user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || "");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Find member by email
  useEffect(() => {
    if (!userEmail) return;

    const findMember = async () => {
      try {
        const membersQuery = query(
          collection(db, 'members'),
          where('email', '==', userEmail)
        );
        const membersSnapshot = await getDocs(membersQuery);
        
        if (!membersSnapshot.empty) {
          const memberDoc = membersSnapshot.docs[0];
          setMemberId(memberDoc.id);
        }
      } catch (error) {
        console.error('Error finding member:', error);
      }
    };

    findMember();
  }, [userEmail]);

  // Load book data from Firestore
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const bookDocRef = doc(db, 'books', id);
        const bookDocSnap = await getDoc(bookDocRef);

        if (bookDocSnap.exists()) {
          const bookData = {
            id: bookDocSnap.id,
            ...bookDocSnap.data(),
            coverSrc: bookDocSnap.data().coverSrc || "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg"
          };
          setBook(bookData);
        } else {
          setBook(null);
        }
      } catch (error) {
        console.error("Error loading book:", error);
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  // Check if user has borrowed this book
  useEffect(() => {
    if (!memberId || !id) return;

    const checkUserBorrow = async () => {
      try {
        const borrowsQuery = query(
          collection(db, 'borrows'),
          where('memberId', '==', memberId),
          where('bookId', '==', id),
          where('status', '==', 'borrowed')
        );
        const borrowsSnapshot = await getDocs(borrowsQuery);
        
        if (!borrowsSnapshot.empty) {
          const borrowDoc = borrowsSnapshot.docs[0];
          const borrowData = borrowDoc.data();
          setIsUserBorrowed(true);
          setUserBorrowInfo({
            borrowDate: borrowData.borrowDate?.toDate ? borrowData.borrowDate.toDate().toISOString() : borrowData.borrowDate,
            dueDate: borrowData.dueDate?.toDate ? borrowData.dueDate.toDate().toISOString() : borrowData.dueDate
          });
        } else {
          setIsUserBorrowed(false);
          setUserBorrowInfo(null);
        }
      } catch (error) {
        console.error('Error checking user borrow:', error);
      }
    };

    checkUserBorrow();
  }, [memberId, id]);

  // Load members from Firestore
  useEffect(() => {
    const membersUnsubscribe = onSnapshot(
      collection(db, 'members'),
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersData);
      },
      (error) => {
        console.error('Error listening to members:', error);
      }
    );

    return () => membersUnsubscribe();
  }, []);

  const handleBorrow = async () => {
    if (!borrowForm.memberId || !borrowForm.dueDate) {
      alert('Please select a member and due date');
      return;
    }

    if (!book || book.available <= 0) {
      alert('Book is not available');
      return;
    }

    try {
      // Get latest book data from Firestore
      const bookDoc = await getDoc(doc(db, 'books', book.id));
      if (!bookDoc.exists()) {
        alert('Book not found');
        return;
      }
      const latestBook = { id: bookDoc.id, ...bookDoc.data() };

      // Get member data
      const memberDoc = await getDoc(doc(db, 'members', borrowForm.memberId));
      if (!memberDoc.exists()) {
        alert('Member not found');
        return;
      }
      const member = { id: memberDoc.id, ...memberDoc.data() };

      // Validate book availability
      if (latestBook.available <= 0) {
        alert('Book is not available');
        return;
      }

      // Check if member already borrowed this book
      const activeBorrowsQuery = query(
        collection(db, 'borrows'),
        where('memberId', '==', borrowForm.memberId),
        where('bookId', '==', book.id),
        where('status', '==', 'borrowed')
      );
      const activeBorrowsSnapshot = await getDocs(activeBorrowsQuery);
      if (!activeBorrowsSnapshot.empty) {
        alert('Member already has an active borrow for this book');
        return;
      }

      // Create borrow record
      const dueDateTimestamp = Timestamp.fromDate(new Date(borrowForm.dueDate));
      const newBorrow = {
        bookId: book.id,
        bookTitle: latestBook.title,
        bookISBN: latestBook.isbn,
        memberId: borrowForm.memberId,
        memberName: member.name,
        memberEmail: member.email,
        borrowDate: serverTimestamp(),
        dueDate: dueDateTimestamp,
        status: 'borrowed',
        returnDate: null
      };
      
      await addDoc(collection(db, 'borrows'), newBorrow);

      // Update book availability
      await updateDoc(doc(db, 'books', book.id), {
        available: latestBook.available - 1
      });

      // Update member borrowed count
      await updateDoc(doc(db, 'members', borrowForm.memberId), {
        borrowedBooks: (member.borrowedBooks || 0) + 1
      });

      // Update local state
      setBook({ ...book, available: book.available - 1 });
      setShowBorrowModal(false);
      setBorrowForm({ memberId: '', dueDate: '' });
      setIsUserBorrowed(true);
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
                    <span className="font-semibold">Category:</span> {book.category || book.genre}
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

              {/* User Borrow Status */}
              {isUserBorrowed && userBorrowInfo && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Your Borrow Status</h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>Borrowed: {userBorrowInfo.borrowDate ? new Date(userBorrowInfo.borrowDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="font-medium">
                      Due Date: {userBorrowInfo.dueDate ? new Date(userBorrowInfo.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Borrow Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className={`p-4 ${book.available > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-lg`}>
                    <p className={`text-${book.available > 0 ? 'green-800' : 'red-800'} font-semibold`}>
                      {book.available > 0 ? '✓ This Book Are Available' : '✗ This Book are Not Available'}
                    </p>
                  </div>
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
