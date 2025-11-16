import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Plus, Search, Clock, CheckCircle, XCircle, Calendar, AlertCircle, Camera, Upload, X, CreditCard, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

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
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    membershipId: ''
  });
  
  const [borrowForm, setBorrowForm] = useState({
    bookId: '',
    memberId: '',
    dueDate: '',
    memberIdInput: '',
    bookIdInput: ''
  });
  const [scanningMemberId, setScanningMemberId] = useState(false);
  const [scanningBookId, setScanningBookId] = useState(false);
  const [memberScanError, setMemberScanError] = useState('');
  const [bookScanError, setBookScanError] = useState('');
  const videoRefMember = useRef(null);
  const videoRefBook = useRef(null);

  // Real-time listeners for Firestore
  useEffect(() => {
    // Listen to books collection
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

    // Listen to members collection
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

    // Listen to borrows collection
    const borrowsUnsubscribe = onSnapshot(
      collection(db, 'borrows'),
      (snapshot) => {
        const borrowsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate().toISOString() : data.borrowDate,
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
            returnDate: data.returnDate?.toDate ? data.returnDate.toDate().toISOString() : data.returnDate
          };
        });
        setBorrowRecords(borrowsData);
      },
      (error) => {
        console.error('Error listening to borrows:', error);
      }
    );

    return () => {
      booksUnsubscribe();
      membersUnsubscribe();
      borrowsUnsubscribe();
    };
  }, []);

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
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      setShowAddBook(false);
      alert('Book added successfully!');
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book. Please try again.');
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email || !memberForm.membershipId) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      // Check if membership ID already exists
      const existingMemberQuery = query(
        collection(db, 'members'),
        where('membershipId', '==', memberForm.membershipId)
      );
      const existingMemberSnapshot = await getDocs(existingMemberQuery);
      
      if (!existingMemberSnapshot.empty) {
        alert('Membership ID already exists. Please use a different ID.');
        return;
      }
      
      const newMember = {
        ...memberForm,
        borrowedBooks: 0,
        joinedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'members'), newMember);
      setMemberForm({ name: '', email: '', phone: '', membershipId: '' });
      setShowAddMember(false);
      alert('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  // Function to find member by membershipId
  const findMemberByMembershipId = async (membershipId) => {
    const memberQuery = query(
      collection(db, 'members'),
      where('membershipId', '==', membershipId)
    );
    const memberSnapshot = await getDocs(memberQuery);
    
    if (memberSnapshot.empty) {
      return null;
    }
    
    const memberDoc = memberSnapshot.docs[0];
    return {
      id: memberDoc.id,
      ...memberDoc.data()
    };
  };

  // Function to find book by ISBN or ID
  const findBookByIdOrISBN = async (bookIdOrISBN) => {
    // Try to find by ID first
    const bookDoc = await getDoc(doc(db, 'books', bookIdOrISBN));
    if (bookDoc.exists()) {
      return {
        id: bookDoc.id,
        ...bookDoc.data()
      };
    }
    
    // Try to find by ISBN
    const bookQuery = query(
      collection(db, 'books'),
      where('isbn', '==', bookIdOrISBN)
    );
    const bookSnapshot = await getDocs(bookQuery);
    
    if (bookSnapshot.empty) {
      return null;
    }
    
    const bookDoc2 = bookSnapshot.docs[0];
    return {
      id: bookDoc2.id,
      ...bookDoc2.data()
    };
  };

  // Handle member ID input (scan or manual)
  const handleMemberIdInput = async (memberId) => {
    setMemberScanError('');
    if (!memberId.trim()) {
      setMemberScanError('Please enter a member ID');
      return;
    }

    const member = await findMemberByMembershipId(memberId.trim());
    if (!member) {
      setMemberScanError('Member not found with this ID');
      return;
    }

    setBorrowForm({ ...borrowForm, memberId: member.id, memberIdInput: memberId.trim() });
    alert(`✓ Member found: ${member.name}`);
  };

  // Handle book ID input (scan or manual)
  const handleBookIdInput = async (bookIdOrISBN) => {
    setBookScanError('');
    if (!bookIdOrISBN.trim()) {
      setBookScanError('Please enter a book ID or ISBN');
      return;
    }

    const book = await findBookByIdOrISBN(bookIdOrISBN.trim());
    if (!book) {
      setBookScanError('Book not found with this ID/ISBN');
      return;
    }

    setBorrowForm({ ...borrowForm, bookId: book.id, bookIdInput: bookIdOrISBN.trim() });
    setSelectedBook(book);
    alert(`✓ Book found: ${book.title}`);
  };

  const handleBorrowBook = async () => {
    if (!borrowForm.memberId || !borrowForm.bookId || !borrowForm.dueDate) {
      alert('Please scan/enter member ID, book ID, and select due date');
      return;
    }
    
    try {
      // Get latest book data from Firestore
      const bookDoc = await getDoc(doc(db, 'books', borrowForm.bookId));
      if (!bookDoc.exists()) {
        alert('Book not found');
        return;
      }
      const book = { id: bookDoc.id, ...bookDoc.data() };

      // Get latest member data from Firestore
      const memberDoc = await getDoc(doc(db, 'members', borrowForm.memberId));
      if (!memberDoc.exists()) {
        alert('Member not found');
        return;
      }
      const member = { id: memberDoc.id, ...memberDoc.data() };

      // Validate book availability
      if (book.available <= 0) {
        alert('Book is not available');
        return;
      }

      // Check if member already borrowed this book
      const activeBorrowsQuery = query(
        collection(db, 'borrows'),
        where('memberId', '==', borrowForm.memberId),
        where('bookId', '==', borrowForm.bookId),
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
        bookId: borrowForm.bookId,
        bookTitle: book.title,
        bookISBN: book.isbn,
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
      await updateDoc(doc(db, 'books', borrowForm.bookId), {
        available: book.available - 1
      });

      // Update member borrowed count
      await updateDoc(doc(db, 'members', borrowForm.memberId), {
        borrowedBooks: (member.borrowedBooks || 0) + 1
      });
      
      setBorrowForm({ bookId: '', memberId: '', dueDate: '', memberIdInput: '', bookIdInput: '' });
      setShowBorrowModal(false);
      setSelectedBook(null);
      setMemberScanError('');
      setBookScanError('');
      alert('✓ Book borrowed successfully!');
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert('Failed to process borrow. Please try again.');
    }
  };

  const returnBook = async (recordId) => {
    try {
      const record = borrowRecords.find(r => r.id === recordId);
      if (!record) {
        alert('Borrow record not found');
        return;
      }

      // Update borrow record
      await updateDoc(doc(db, 'borrows', recordId), {
        status: 'returned',
        returnDate: serverTimestamp()
      });

      // Get latest book data and update availability
      const bookDoc = await getDoc(doc(db, 'books', record.bookId));
      if (bookDoc.exists()) {
        const book = bookDoc.data();
        await updateDoc(doc(db, 'books', record.bookId), {
          available: (book.available || 0) + 1
        });
      }

      // Get latest member data and update borrowed count
      const memberDoc = await getDoc(doc(db, 'members', record.memberId));
      if (memberDoc.exists()) {
        const member = memberDoc.data();
        await updateDoc(doc(db, 'members', record.memberId), {
          borrowedBooks: Math.max(0, (member.borrowedBooks || 0) - 1)
        });
      }

      alert('✓ Book returned successfully!');
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Failed to return book. Please try again.');
    }
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

  const filteredBorrows = borrowRecords.filter(borrow =>
    borrow.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrow.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrow.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    borrow.bookISBN.includes(searchTerm)
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
                {filteredBorrows.map(record => (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Check file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size too large. Please select an image smaller than 5MB.');
                          return;
                        }
                        
                        // Check file type
                        if (!file.type.startsWith('image/')) {
                          alert('Please select a valid image file.');
                          return;
                        }
                        
                        // Convert to base64
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setBookForm({ ...bookForm, coverSrc: reader.result });
                        };
                        reader.onerror = () => {
                          alert('Error reading file. Please try again.');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {bookForm.coverSrc && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Preview:</p>
                      <img
                        src={bookForm.coverSrc}
                        alt="Cover preview"
                        className="w-32 h-48 object-cover rounded border border-gray-300"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="ISBN"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  placeholder="Description"
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                ></textarea>
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
                      setBookForm({ title: '', author: '', isbn: '', description: '', coverSrc: '', category: '', quantity: 1 });
                      // Reset file input
                      const fileInput = document.querySelector('input[type="file"]');
                      if (fileInput) {
                        fileInput.value = '';
                      }
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Borrow Book</h2>
              
              {/* Member ID Input Section */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member ID / Kartu Member
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter or scan Member ID"
                    value={borrowForm.memberIdInput}
                    onChange={(e) => setBorrowForm({ ...borrowForm, memberIdInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleMemberIdInput(borrowForm.memberIdInput)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleMemberIdInput(borrowForm.memberIdInput)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Verify
                  </button>
                </div>
                {memberScanError && (
                  <p className="text-xs text-red-600 mt-1">{memberScanError}</p>
                )}
                {borrowForm.memberId && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Member verified: {members.find(m => m.id === borrowForm.memberId)?.name}
                  </p>
                )}
              </div>

              {/* Book ID Input Section */}
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Book ID / ISBN / Barcode Buku
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter or scan Book ID/ISBN"
                    value={borrowForm.bookIdInput}
                    onChange={(e) => setBorrowForm({ ...borrowForm, bookIdInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleBookIdInput(borrowForm.bookIdInput)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleBookIdInput(borrowForm.bookIdInput)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <ScanLine className="w-4 h-4" />
                    Verify
                  </button>
                </div>
                {bookScanError && (
                  <p className="text-xs text-red-600 mt-1">{bookScanError}</p>
                )}
                {selectedBook && (
                  <div className="mt-2 p-2 bg-white rounded border border-green-300">
                    <p className="text-sm font-semibold text-gray-800">{selectedBook.title}</p>
                    <p className="text-xs text-gray-600">by {selectedBook.author}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {selectedBook.available}/{selectedBook.quantity}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={borrowForm.dueDate}
                    onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBorrowBook}
                    disabled={!borrowForm.memberId || !borrowForm.bookId || !borrowForm.dueDate}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Confirm Borrow
                  </button>
                  <button
                    onClick={() => {
                      setShowBorrowModal(false);
                      setSelectedBook(null);
                      setBorrowForm({ bookId: '', memberId: '', dueDate: '', memberIdInput: '', bookIdInput: '' });
                      setMemberScanError('');
                      setBookScanError('');
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