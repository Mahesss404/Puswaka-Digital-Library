import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Search, Camera, Upload, X, XCircle, CreditCard, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const BooksManagement = () => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showEditBook, setShowEditBook] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  
  const [borrowForm, setBorrowForm] = useState({
    bookId: '',
    userId: '',
    dueDate: '',
    userIdInput: ''
  });
  const [userScanError, setUserScanError] = useState('');
  
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    coverSrc: '',
    description: '',
    category: '',
    quantity: 1
  });
  
  const [isbnInput, setIsbnInput] = useState('');
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Real-time listeners for books and members
  useEffect(() => {
    const booksUnsubscribe = onSnapshot(
      collection(db, 'books'),
      (snapshot) => {
        const booksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBooks(booksData);
      },
      (error) => {
        console.error('Error listening to books:', error);
      }
    );

    const usersUnsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );

    return () => {
      booksUnsubscribe();
      usersUnsubscribe();
    };
  }, []);

  // Find user by ID number (NIS)
  const findUserByIdNumber = async (idNumber) => {
    const userQuery = query(
      collection(db, 'users'),
      where('idNumber', '==', idNumber)
    );
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      return null;
    }
    
    const userDoc = userSnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  };

  // Handle user ID input verification
  const handleUserIdInput = async (userId) => {
    setUserScanError('');
    if (!userId.trim()) {
      setUserScanError('Please enter a user NIS');
      return;
    }

    const user = await findUserByIdNumber(userId.trim());
    if (!user) {
      setUserScanError('User not found with this NIS');
      return;
    }

    setBorrowForm({ ...borrowForm, userId: user.id, userIdInput: userId.trim() });
    alert(`✓ User found: ${user.name}`);
  };

  // Handle borrow book submission
  const handleBorrowBook = async () => {
    if (!borrowForm.userId || !borrowForm.bookId || !borrowForm.dueDate) {
      alert('Please enter user NIS, select a book, and choose due date');
      return;
    }
    
    try {
      const bookDoc = await getDoc(doc(db, 'books', borrowForm.bookId));
      if (!bookDoc.exists()) {
        alert('Book not found');
        return;
      }
      const book = { id: bookDoc.id, ...bookDoc.data() };

      const userDoc = await getDoc(doc(db, 'users', borrowForm.userId));
      if (!userDoc.exists()) {
        alert('User not found');
        return;
      }
      const userData = { id: userDoc.id, ...userDoc.data() };

      if (book.available <= 0) {
        alert('Book is not available');
        return;
      }

      // Check if user already has this book borrowed
      const activeBorrowsQuery = query(
        collection(db, 'borrows'),
        where('userId', '==', borrowForm.userId),
        where('bookId', '==', borrowForm.bookId),
        where('status', '==', 'borrowed')
      );
      const activeBorrowsSnapshot = await getDocs(activeBorrowsQuery);
      if (!activeBorrowsSnapshot.empty) {
        alert('User already has an active borrow for this book');
        return;
      }

      const dueDateTimestamp = Timestamp.fromDate(new Date(borrowForm.dueDate));
      const newBorrow = {
        bookId: borrowForm.bookId,
        bookTitle: book.title,
        bookISBN: book.isbn,
        userId: borrowForm.userId,
        userName: userData.name,
        userContact: userData.email || userData.phoneNumber,
        borrowDate: serverTimestamp(),
        dueDate: dueDateTimestamp,
        status: 'borrowed',
        returnDate: null
      };
      
      await addDoc(collection(db, 'borrows'), newBorrow);

      await updateDoc(doc(db, 'books', borrowForm.bookId), {
        available: book.available - 1
      });

      await updateDoc(doc(db, 'users', borrowForm.userId), {
        borrowedCount: (userData.borrowedCount || 0) + 1
      });
      
      setBorrowForm({ bookId: '', userId: '', dueDate: '', userIdInput: '' });
      setShowBorrowModal(false);
      setSelectedBook(null);
      setUserScanError('');
      alert('✓ Book borrowed successfully!');
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Failed to process borrow. Please try again.');
    }
  };

  const fetchBookByISBN = async (isbn) => {
    setIsLoadingBook(true);
    try {
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch book data');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Book not found');
      }
      
      const bookData = data.items[0].volumeInfo;
      const title = bookData.title || '';
      const authors = bookData.authors ? bookData.authors.join(', ') : '';
      const categories = bookData.categories ? bookData.categories.slice(0, 3).join(', ') : '';
      const description = bookData.description || '';
      const coverImage = bookData.imageLinks?.thumbnail || 
                        bookData.imageLinks?.smallThumbnail || 
                        bookData.imageLinks?.medium || '';
      
      let coverSrc = '';
      if (coverImage) {
        coverSrc = coverImage.replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
      }
      
      setBookForm({
        title: title,
        author: authors,
        isbn: cleanISBN,
        category: categories,
        description: description,
        coverSrc: coverSrc,
        quantity: 1
      });
      setIsbnInput('');
      alert('✓ Book found and details loaded successfully!');
      
    } catch (error) {
      console.error('Error fetching book:', error);
      alert('Book not found with this ISBN. Please enter details manually.');
      setBookForm({
        title: '',
        author: '',
        isbn: isbn.replace(/[-\s]/g, ''),
        category: '',
        description: '',
        coverSrc: '',
        quantity: 1
      });
      setIsbnInput('');
    } finally {
      setIsLoadingBook(false);
    }
  };

  const handleISBNSubmit = () => {
    if (isbnInput.trim()) {
      fetchBookByISBN(isbnInput.trim());
    }
  };

  const startBarcodeScan = async () => {
    try {
      setIsScanning(true);
      setScanError('');
      
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      const codeReader = codeReaderRef.current;
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found.');
      }

      const selectedDeviceId = videoInputDevices[0].deviceId;

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            if (barcode && /^\d{10,13}$/.test(barcode)) {
              stopBarcodeScan();
              setBookForm({ ...bookForm, isbn: barcode });
              setIsbnInput(barcode);
              setShowBarcodeScanner(false);
              alert(`✓ Barcode scanned! ISBN: ${barcode}`);
              fetchBookByISBN(barcode);
            }
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Barcode scan error:', error);
      setScanError(error.message || 'Failed to start camera.');
      setIsScanning(false);
    }
  };

  const stopBarcodeScan = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setScanError('');

      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      const codeReader = codeReaderRef.current;
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        img.src = e.target.result;
        img.onload = async () => {
          try {
            const result = await codeReader.decodeFromImage(img);
            const barcode = result.getText();
            
            if (barcode && /^\d{10,13}$/.test(barcode)) {
              setBookForm({ ...bookForm, isbn: barcode });
              setIsbnInput(barcode);
              setShowBarcodeScanner(false);
              setIsScanning(false);
              alert(`✓ Barcode scanned! ISBN: ${barcode}`);
              fetchBookByISBN(barcode);
            } else {
              setScanError('Invalid barcode format.');
              setIsScanning(false);
            }
          } catch (error) {
            setScanError('Could not read barcode from image.');
            setIsScanning(false);
          }
        };
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setScanError('Failed to process image.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (!showBarcodeScanner && codeReaderRef.current) {
      stopBarcodeScan();
    }
  }, [showBarcodeScanner]);

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.isbn || !bookForm.category || !bookForm.quantity || !bookForm.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const newBook = {
        ...bookForm,
        quantity: parseInt(bookForm.quantity),
        available: parseInt(bookForm.quantity),
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'books'), newBook);
      setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
      setShowAddBook(false);
      alert('Book added successfully!');
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book. Please try again.');
    }
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      coverSrc: book.coverSrc || '',
      description: book.description || '',
      category: book.category || '',
      quantity: book.quantity || 1
    });
    setShowEditBook(true);
  };

  const handleUpdateBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.isbn || !bookForm.category || !bookForm.quantity || !bookForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (!editingBook) {
      alert('No book selected for editing');
      return;
    }

    try {
      const bookRef = doc(db, 'books', editingBook.id);
      const currentBook = books.find(b => b.id === editingBook.id);
      
      const oldQuantity = currentBook?.quantity || editingBook.quantity;
      const newQuantity = parseInt(bookForm.quantity);
      const oldAvailable = currentBook?.available || editingBook.available;
      const quantityDiff = newQuantity - oldQuantity;
      const newAvailable = Math.min(newQuantity, Math.max(0, oldAvailable + quantityDiff));

      await updateDoc(bookRef, {
        title: bookForm.title,
        author: bookForm.author,
        isbn: bookForm.isbn,
        coverSrc: bookForm.coverSrc,
        description: bookForm.description,
        category: bookForm.category,
        quantity: newQuantity,
        available: newAvailable
      });

      setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
      setShowEditBook(false);
      setEditingBook(null);
      alert('Book updated successfully!');
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book. Please try again.');
    }
  };

  const handleDeleteBook = async () => {
    if (!editingBook) {
      alert('No book selected for deletion');
      return;
    }

    try {
      const activeBorrowsQuery = query(
        collection(db, 'borrows'),
        where('bookId', '==', editingBook.id),
        where('status', '==', 'borrowed')
      );
      const activeBorrowsSnapshot = await getDocs(activeBorrowsQuery);
      
      if (!activeBorrowsSnapshot.empty) {
        alert('Cannot delete book. There are active borrows for this book.');
        return;
      }

      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${editingBook.title}"?\n\nThis action cannot be undone.`
      );

      if (!confirmDelete) return;

      const bookRef = doc(db, 'books', editingBook.id);
      await deleteDoc(bookRef);

      setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
      setShowEditBook(false);
      setEditingBook(null);
      alert('✓ Book deleted successfully!');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  const filteredBooks = books.filter(book =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Books Management</h2>
          <p className="text-sm text-neutral-500">Manage your library book collection</p>
        </div>
        <button
          onClick={() => setShowAddBook(true)}
          className="px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Book
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search books by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED] transition-colors"
        />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map(book => (
          <div key={book.id} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {book.coverSrc && (
                <img
                  src={book.coverSrc}
                  alt={book.title}
                  className="w-16 h-24 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 truncate" title={book.title}>{book.title}</h3>
                <p className="text-sm text-neutral-500 truncate">by {book.author}</p>
                <p className="text-xs text-neutral-400 mt-1">ISBN: {book.isbn}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    book.available > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {book.available}/{book.quantity} Available
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
              <button
                onClick={() => handleEditBook(book)}
                className="flex-1 px-3 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedBook(book);
                  setBorrowForm({ ...borrowForm, bookId: book.id });
                  setShowBorrowModal(true);
                }}
                disabled={book.available === 0}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#4995ED] rounded-lg hover:bg-[#3a7bc8] disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                Borrow
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No books found</p>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Add New Book</h2>
              <button
                onClick={() => {
                  setShowAddBook(false);
                  setIsbnInput('');
                  setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
                  setShowBarcodeScanner(false);
                  stopBarcodeScan();
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* ISBN Auto-fill Section */}
              <div className="p-4 bg-[#4995ED]/5 rounded-xl border border-[#4995ED]/20">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Enter ISBN to Auto-fill Book Details
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter ISBN (e.g., 9780134685991)"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleISBNSubmit()}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                    disabled={isLoadingBook}
                  />
                  <button
                    onClick={handleISBNSubmit}
                    disabled={isLoadingBook || !isbnInput.trim()}
                    className="px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] disabled:bg-neutral-300 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isLoadingBook ? 'Loading...' : 'Fetch'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowBarcodeScanner(!showBarcodeScanner);
                      if (!showBarcodeScanner) {
                        startBarcodeScan();
                      } else {
                        stopBarcodeScan();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium transition-colors"
                    disabled={isScanning && showBarcodeScanner}
                  >
                    <Camera className="w-4 h-4" />
                    {showBarcodeScanner ? 'Stop Camera' : 'Scan Barcode'}
                  </button>
                  <label className="flex-1 px-4 py-2.5 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 flex items-center justify-center gap-2 cursor-pointer font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {showBarcodeScanner && (
                  <div className="mt-3 p-3 bg-neutral-900 rounded-lg">
                    <video ref={videoRef} className="w-full h-auto rounded" style={{ display: isScanning ? 'block' : 'none' }} />
                    {!isScanning && (
                      <div className="flex items-center justify-center py-8 text-white/70">
                        <Camera className="w-8 h-8 mr-2" />
                        <span>Starting camera...</span>
                      </div>
                    )}
                    {scanError && <p className="text-xs text-red-400 mt-2">{scanError}</p>}
                  </div>
                )}
                
                <p className="text-xs text-neutral-500 mt-2">
                  Powered by Google Books API
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Book Title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size too large. Max 5MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setBookForm({ ...bookForm, coverSrc: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg"
                  />
                  {bookForm.coverSrc && (
                    <div className="mt-2">
                      <img src={bookForm.coverSrc} alt="Cover preview" className="w-24 h-36 object-cover rounded-lg border" />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="ISBN"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                />
                <textarea
                  placeholder="Description"
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED] resize-none"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={bookForm.quantity}
                  onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddBook}
                  className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] font-medium transition-colors"
                >
                  Add Book
                </button>
                <button
                  onClick={() => {
                    setShowAddBook(false);
                    setIsbnInput('');
                    setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
                    setShowBarcodeScanner(false);
                    stopBarcodeScan();
                  }}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditBook && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Edit Book</h2>
              <button
                onClick={() => {
                  setShowEditBook(false);
                  setEditingBook(null);
                  setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Book Title"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="text"
                placeholder="Author"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File size too large. Max 5MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBookForm({ ...bookForm, coverSrc: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg"
                />
                {bookForm.coverSrc && (
                  <div className="mt-2">
                    <img src={bookForm.coverSrc} alt="Cover preview" className="w-24 h-36 object-cover rounded-lg border" />
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="ISBN"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <textarea
                placeholder="Description"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED] resize-none"
              />
              <input
                type="text"
                placeholder="Category"
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={bookForm.quantity}
                onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })}
                min="1"
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
              />

              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateBook}
                    className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] font-medium transition-colors"
                  >
                    Update Book
                  </button>
                  <button
                    onClick={() => {
                      setShowEditBook(false);
                      setEditingBook(null);
                      setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
                    }}
                    className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  onClick={handleDeleteBook}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Delete Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Borrow Book</h2>
              <button
                onClick={() => {
                  setShowBorrowModal(false);
                  setSelectedBook(null);
                  setBorrowForm({ bookId: '', userId: '', dueDate: '', userIdInput: '' });
                  setUserScanError('');
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Selected Book Info */}
              {selectedBook && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Selected Book
                  </label>
                  <div className="flex gap-3">
                    {selectedBook.coverSrc && (
                      <img
                        src={selectedBook.coverSrc}
                        alt={selectedBook.title}
                        className="w-12 h-18 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-neutral-800">{selectedBook.title}</p>
                      <p className="text-sm text-neutral-600">by {selectedBook.author}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Available: {selectedBook.available}/{selectedBook.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* User ID Input */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  User NIS / ID
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter User NIS"
                    value={borrowForm.userIdInput}
                    onChange={(e) => setBorrowForm({ ...borrowForm, userIdInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleUserIdInput(borrowForm.userIdInput)}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                  />
                  <button
                    onClick={() => handleUserIdInput(borrowForm.userIdInput)}
                    className="px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] flex items-center gap-2 font-medium transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Verify
                  </button>
                </div>
                {userScanError && (
                  <p className="text-xs text-red-600 mt-1">{userScanError}</p>
                )}
                {borrowForm.userId && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ User verified: {users.find(u => u.id === borrowForm.userId)?.name}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={borrowForm.dueDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBorrowBook}
                  disabled={!borrowForm.userId || !borrowForm.bookId || !borrowForm.dueDate}
                  className="flex-1 px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] disabled:bg-neutral-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Confirm Borrow
                </button>
                <button
                  onClick={() => {
                    setShowBorrowModal(false);
                    setSelectedBook(null);
                    setBorrowForm({ bookId: '', userId: '', dueDate: '', userIdInput: '' });
                    setUserScanError('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 font-medium transition-colors"
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

export default BooksManagement;
