import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Plus, Search, Clock, CheckCircle, XCircle, Calendar, AlertCircle, Camera, Upload, X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

const BookBorrowSystem = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
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
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    membershipId: ''
  });
  
  const [borrowForm, setBorrowForm] = useState({
    bookId: '',
    memberId: '',
    dueDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const booksData = await localStorage.getItem('books');
      const membersData = await localStorage.getItem('members');
      const borrowData = await localStorage.getItem('borrow_records');
      
      if (booksData) setBooks(JSON.parse(booksData.value));
      if (membersData) setMembers(JSON.parse(membersData.value));
      if (borrowData) setBorrowRecords(JSON.parse(borrowData.value));
    } catch (error) {
      console.log('No existing data, starting fresh');
    }
  };

  const saveBooks = async (data) => {
    await localStorage.setItem('books', JSON.stringify(data));
    setBooks(data);
  };

  const saveMembers = async (data) => {
    await localStorage.setItem('members', JSON.stringify(data));
    setMembers(data);
  };

  const saveBorrowRecords = async (data) => {
    await localStorage.setItem('borrow_records', JSON.stringify(data));
    setBorrowRecords(data);
  };

  const fetchBookByISBN = async (isbn) => {
    setIsLoadingBook(true);
    try {
      // Clean ISBN (remove dashes and spaces)
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      
      // Use Open Library ISBN API
      const response = await fetch(`https://openlibrary.org/isbn/${cleanISBN}.json`);
      
      if (!response.ok) {
        throw new Error('Book not found');
      }
      
      const bookData = await response.json();
      
      // Fetch additional details from works API if available
      let title = bookData.title || '';
      let authors = '';
      let categories = '';
      
      // Get author names
      if (bookData.authors && bookData.authors.length > 0) {
        const authorPromises = bookData.authors.map(async (author) => {
          try {
            const authorResponse = await fetch(`https://openlibrary.org${author.key}.json`);
            const authorData = await authorResponse.json();
            return authorData.name;
          } catch {
            return '';
          }
        });
        const authorNames = await Promise.all(authorPromises);
        authors = authorNames.filter(name => name).join(', ');
      }
      
      // Get subjects/categories
      if (bookData.subjects && bookData.subjects.length > 0) {
        categories = bookData.subjects.slice(0, 3).join(', ');
      }
      
      setBookForm({
        title: title,
        author: authors,
        isbn: cleanISBN,
        category: categories,
        quantity: 1
      });
      setIsbnInput('');
      alert('✓ Book found and details loaded successfully!');
      
    } catch (error) {
      console.error('Error fetching book:', error);
      alert('Book not found with this ISBN. Please enter details manually or check the ISBN number.');
      // Pre-fill ISBN for manual entry
      setBookForm({
        title: '',
        author: '',
        isbn: isbn.replace(/[-\s]/g, ''),
        category: '',
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
      
      // Get available video input devices
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found. Please connect a camera or upload an image file.');
      }

      // Use the first available camera (usually the default)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start scanning from camera
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            // EAN-13 barcodes are 13 digits
            if (barcode && /^\d{13}$/.test(barcode)) {
              stopBarcodeScan();
              setBookForm({ ...bookForm, isbn: barcode });
              setIsbnInput(barcode);
              setShowBarcodeScanner(false);
              alert(`✓ Barcode scanned successfully! ISBN: ${barcode}`);
              // Auto-fetch book details
              fetchBookByISBN(barcode);
            } else if (barcode && /^\d{10,13}$/.test(barcode)) {
              // Accept 10 or 13 digit ISBNs
              stopBarcodeScan();
              setBookForm({ ...bookForm, isbn: barcode });
              setIsbnInput(barcode);
              setShowBarcodeScanner(false);
              alert(`✓ Barcode scanned! ISBN: ${barcode}`);
              // Auto-fetch book details
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
      setScanError(error.message || 'Failed to start camera. Please check permissions or upload an image file.');
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
      
      // Create image element
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        img.src = e.target.result;
        img.onload = async () => {
          try {
            const result = await codeReader.decodeFromImage(img);
            const barcode = result.getText();
            
            if (barcode && /^\d{13}$/.test(barcode)) {
              setBookForm({ ...bookForm, isbn: barcode });
              setIsbnInput(barcode);
              setShowBarcodeScanner(false);
              setIsScanning(false);
              alert(`✓ Barcode scanned successfully! ISBN: ${barcode}`);
              // Auto-fetch book details
              fetchBookByISBN(barcode);
            } else if (barcode && /^\d{10,13}$/.test(barcode)) {
              // Accept 10 or 13 digit ISBNs
              setBookForm({ ...bookForm, isbn: barcode });
              setIsbnInput(barcode);
              setShowBarcodeScanner(false);
              setIsScanning(false);
              alert(`✓ Barcode scanned! ISBN: ${barcode}`);
              // Auto-fetch book details
              fetchBookByISBN(barcode);
            } else {
              setScanError('Invalid barcode format. Please ensure it is an EAN-13 barcode (13 digits).');
              setIsScanning(false);
            }
          } catch (error) {
            console.error('Decode error:', error);
            setScanError('Could not read barcode from image. Please try another image or enter ISBN manually.');
            setIsScanning(false);
          }
        };
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      setScanError('Failed to process image. Please try another file.');
      setIsScanning(false);
    }
  };

  // Cleanup camera on unmount or when closing scanner
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
    if (!bookForm.title || !bookForm.author || !bookForm.isbn) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newBook = {
      id: Date.now().toString(),
      ...bookForm,
      quantity: parseInt(bookForm.quantity),
      available: parseInt(bookForm.quantity),
      createdAt: new Date().toISOString()
    };
    await saveBooks([...books, newBook]);
    setBookForm({ title: '', author: '', isbn: '', category: '', quantity: 1 });
    setShowAddBook(false);
  };

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email || !memberForm.membershipId) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newMember = {
      id: Date.now().toString(),
      ...memberForm,
      borrowedBooks: 0,
      joinedAt: new Date().toISOString()
    };
    await saveMembers([...members, newMember]);
    setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
    setShowAddMember(false);
  };

  const handleBorrowBook = async () => {
    if (!borrowForm.memberId || !borrowForm.dueDate) {
      alert('Please select a member and due date');
      return;
    }
    
    const book = books.find(b => b.id === borrowForm.bookId);
    const member = members.find(m => m.id === borrowForm.memberId);
    
    if (book.available <= 0) {
      alert('Book is not available');
      return;
    }
    
    const newRecord = {
      id: Date.now().toString(),
      bookId: borrowForm.bookId,
      bookTitle: book.title,
      memberId: borrowForm.memberId,
      memberName: member.name,
      borrowDate: new Date().toISOString(),
      dueDate: borrowForm.dueDate,
      status: 'borrowed',
      returnDate: null
    };
    
    const updatedBooks = books.map(b => 
      b.id === borrowForm.bookId ? { ...b, available: b.available - 1 } : b
    );
    
    const updatedMembers = members.map(m =>
      m.id === borrowForm.memberId ? { ...m, borrowedBooks: m.borrowedBooks + 1 } : m
    );
    
    await saveBooks(updatedBooks);
    await saveMembers(updatedMembers);
    await saveBorrowRecords([...borrowRecords, newRecord]);
    
    setBorrowForm({ bookId: '', memberId: '', dueDate: '' });
    setShowBorrowModal(false);
    setSelectedBook(null);
  };

  const returnBook = async (recordId) => {
    const record = borrowRecords.find(r => r.id === recordId);
    
    const updatedRecords = borrowRecords.map(r =>
      r.id === recordId ? { ...r, status: 'returned', returnDate: new Date().toISOString() } : r
    );
    
    const updatedBooks = books.map(b =>
      b.id === record.bookId ? { ...b, available: b.available + 1 } : b
    );
    
    const updatedMembers = members.map(m =>
      m.id === record.memberId ? { ...m, borrowedBooks: Math.max(0, m.borrowedBooks - 1) } : m
    );
    
    await saveBooks(updatedBooks);
    await saveMembers(updatedMembers);
    await saveBorrowRecords(updatedRecords);
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) <= new Date();
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.membershipId.includes(searchTerm)
  );

  const activeBorrows = borrowRecords.filter(r => r.status === 'borrowed');
  const overdueBorrows = activeBorrows.filter(r => isOverdue(r.dueDate));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Library Management System</h1>
                <p className="text-gray-600">Efficient and error-free book borrowing</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{books.length}</div>
                <div className="text-sm text-gray-600">Books</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{members.length}</div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{activeBorrows.length}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>
        </div>

        {overdueBorrows.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-semibold">
                {overdueBorrows.length} overdue book(s) need attention!
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'books'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              Books
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'members'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('borrows')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'borrows'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Clock className="w-5 h-5 inline mr-2" />
              Borrow Records
            </button>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'books' && (
                <button
                  onClick={() => setShowAddBook(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Book
                </button>
              )}
              {activeTab === 'members' && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Member
                </button>
              )}
            </div>

            {activeTab === 'books' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBooks.map(book => (
                  <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{book.title}</h3>
                    <p className="text-gray-600 text-sm mb-1">by {book.author}</p>
                    <p className="text-gray-500 text-xs mb-3">ISBN: {book.isbn}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        book.available > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {book.available}/{book.quantity} Available
                      </span>
                      <button
                        onClick={() => {
                          setSelectedBook(book);
                          setBorrowForm({ ...borrowForm, bookId: book.id });
                          setShowBorrowModal(true);
                        }}
                        disabled={book.available === 0}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Borrow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-3">
                {filteredMembers.map(member => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{member.name}</h3>
                        <p className="text-gray-600 text-sm">{member.email}</p>
                        <p className="text-gray-500 text-xs">ID: {member.membershipId}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{member.borrowedBooks}</div>
                        <div className="text-xs text-gray-600">Books Borrowed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'borrows' && (
              <div className="space-y-3">
                {borrowRecords.map(record => (
                  <div key={record.id} className={`border rounded-lg p-4 ${
                    record.status === 'returned'
                      ? 'bg-gray-50 border-gray-300'
                      : isOverdue(record.dueDate)
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{record.bookTitle}</h3>
                        <p className="text-sm text-gray-600">Borrowed by: {record.memberName}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Borrowed: {new Date(record.borrowDate).toLocaleDateString()}</span>
                          <span>Due: {new Date(record.dueDate).toLocaleDateString()}</span>
                          {record.returnDate && (
                            <span>Returned: {new Date(record.returnDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {record.status === 'borrowed' ? (
                          <>
                            {isOverdue(record.dueDate) && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                Overdue
                              </span>
                            )}
                            <button
                              onClick={() => returnBook(record.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Return
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                            Returned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showAddBook && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Add New Book</h2>
              
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter ISBN to Auto-fill Book Details
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter ISBN (e.g., 9780134685991)"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleISBNSubmit()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoadingBook}
                  />
                  <button
                    onClick={handleISBNSubmit}
                    disabled={isLoadingBook || !isbnInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoadingBook ? 'Loading...' : 'Fetch'}
                  </button>
                </div>
                
                {/* Barcode Scanner Options */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      setShowBarcodeScanner(!showBarcodeScanner);
                      if (!showBarcodeScanner) {
                        startBarcodeScan();
                      } else {
                        stopBarcodeScan();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
                    disabled={isScanning && showBarcodeScanner}
                  >
                    <Camera className="w-4 h-4" />
                    {showBarcodeScanner ? 'Stop Camera' : 'Scan Barcode'}
                  </button>
                  <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer">
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

                {/* Barcode Scanner Camera View */}
                {showBarcodeScanner && (
                  <div className="mb-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Camera Scanner (EAN-13)
                      </label>
                      <button
                        onClick={() => {
                          setShowBarcodeScanner(false);
                          stopBarcodeScan();
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
                      <video
                        ref={videoRef}
                        className="w-full h-auto"
                        style={{ display: isScanning ? 'block' : 'none' }}
                      />
                      {!isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center">
                            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Starting camera...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {scanError && (
                      <p className="text-xs text-red-600 mt-2">{scanError}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      Point camera at EAN-13 barcode. Scanning will stop automatically when detected.
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-600 mt-2">
                  Powered by Open Library API - Auto-fills title, author, and category
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Book Title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="ISBN"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={bookForm.quantity}
                  onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddBook}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Book
                  </button>
                  <button
                    onClick={() => {
                      setShowAddBook(false);
                      setIsbnInput('');
                      setBookForm({ title: '', author: '', isbn: '', category: '', quantity: 1 });
                      setShowBarcodeScanner(false);
                      stopBarcodeScan();
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

        {showAddMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Add New Member</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Membership ID"
                  value={memberForm.membershipId}
                  onChange={(e) => setMemberForm({ ...memberForm, membershipId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddMember}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Member
                  </button>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBorrowModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Borrow Book</h2>
              {selectedBook && (
                <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                  <p className="font-semibold">{selectedBook.title}</p>
                  <p className="text-sm text-gray-600">by {selectedBook.author}</p>
                </div>
              )}
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
                  <button
                    onClick={handleBorrowBook}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Confirm Borrow
                  </button>
                  <button
                    onClick={() => {
                      setShowBorrowModal(false);
                      setSelectedBook(null);
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
    </div>
  );
};

export default BookBorrowSystem;