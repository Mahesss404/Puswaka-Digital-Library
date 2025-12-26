import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Search, CheckCircle, CreditCard, ScanLine, AlertCircle, MoreVertical, Calendar, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Camera } from 'lucide-react';
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
import { db } from '@/lib/firebase';

const TransactionsManagement = () => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [extendMenuOpen, setExtendMenuOpen] = useState(null);
  
  const [borrowForm, setBorrowForm] = useState({
    bookId: '',
    userId: '',
    dueDate: '',
    userIdInput: '',
    bookIdInput: ''
  });
  const [userScanError, setUserScanError] = useState('');
  const [bookScanError, setBookScanError] = useState('');
  
  // Book Scanner State
  const [showBookScanner, setShowBookScanner] = useState(false);
  const [isBookScanning, setIsBookScanning] = useState(false);
  const [bookScannerError, setBookScannerError] = useState('');
  const bookVideoRef = useRef(null);
  const bookCodeReaderRef = useRef(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Real-time listeners
  useEffect(() => {
    const booksUnsubscribe = onSnapshot(
      collection(db, 'books'),
      (snapshot) => {
        const booksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBooks(booksData);
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
      }
    );

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
      }
    );

    return () => {
      booksUnsubscribe();
      usersUnsubscribe();
      borrowsUnsubscribe();
    };
  }, []);

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

  const findBookByIdOrISBN = async (bookIdOrISBN) => {
    const bookDoc = await getDoc(doc(db, 'books', bookIdOrISBN));
    if (bookDoc.exists()) {
      return {
        id: bookDoc.id,
        ...bookDoc.data()
      };
    }
    
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
    // Stop scanner if running
    stopBookBarcodeScan();
    setShowBookScanner(false);
  };

  const handleBorrowBook = async () => {
    if (!borrowForm.userId || !borrowForm.bookId || !borrowForm.dueDate) {
      alert('Please scan/enter user NIS, book ID, and select due date');
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
      
      setBorrowForm({ bookId: '', userId: '', dueDate: '', userIdInput: '', bookIdInput: '' });
      setShowBorrowModal(false);
      setSelectedBook(null);
      setUserScanError('');
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

      await updateDoc(doc(db, 'borrows', recordId), {
        status: 'returned',
        returnDate: serverTimestamp()
      });

      const bookDoc = await getDoc(doc(db, 'books', record.bookId));
      if (bookDoc.exists()) {
        const book = bookDoc.data();
        await updateDoc(doc(db, 'books', record.bookId), {
          available: Math.min(book.quantity || 1, (book.available || 0) + 1)
        });
      }

      const userDoc = await getDoc(doc(db, 'users', record.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await updateDoc(doc(db, 'users', record.userId), {
          borrowedCount: Math.max(0, (userData.borrowedCount || 0) - 1)
        });
      }

      setActionMenuOpen(null);
      alert('✓ Book returned successfully!');
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Failed to return book. Please try again.');
    }
  };

  const handleExtend = async (borrowId, currentDueDate, days) => {
    try {
      const newDate = new Date(currentDueDate);
      newDate.setDate(newDate.getDate() + days);
      
      await updateDoc(doc(db, 'borrows', borrowId), {
        dueDate: Timestamp.fromDate(newDate)
      });
      setExtendMenuOpen(null);
      setActionMenuOpen(null);
      alert('✓ Due date extended successfully!');
    } catch (err) {
      alert('Error extending due date');
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) <= new Date();
  };

  // Book Barcode Scanner Functions
  const startBookBarcodeScan = async () => {
    try {
      setIsBookScanning(true);
      setBookScannerError('');
      
      if (!bookCodeReaderRef.current) {
        bookCodeReaderRef.current = new BrowserMultiFormatReader();
      }

      const codeReader = bookCodeReaderRef.current;
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found.');
      }

      const selectedDeviceId = videoInputDevices[0].deviceId;

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        bookVideoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            if (barcode && /^\d{10,13}$/.test(barcode)) {
              stopBookBarcodeScan();
              setBorrowForm(prev => ({ ...prev, bookIdInput: barcode }));
              setShowBookScanner(false);
              // Auto-verify the scanned ISBN
              handleBookIdInput(barcode);
            }
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Book scan error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Book barcode scan error:', error);
      setBookScannerError(error.message || 'Failed to start camera.');
      setIsBookScanning(false);
    }
  };

  const stopBookBarcodeScan = () => {
    if (bookCodeReaderRef.current) {
      bookCodeReaderRef.current.reset();
    }
    setIsBookScanning(false);
  };

  // Cleanup camera on unmount or when closing scanner
  useEffect(() => {
    return () => {
      if (bookCodeReaderRef.current) {
        bookCodeReaderRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (!showBookScanner && bookCodeReaderRef.current) {
      stopBookBarcodeScan();
    }
  }, [showBookScanner]);

  const filteredBorrows = borrowRecords
    .filter(borrow =>
      borrow.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.userContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.bookISBN?.includes(searchTerm)
    )
    .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

  // Paginated data
  const paginatedBorrows = filteredBorrows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Transactions</h2>
          <p className="text-sm text-neutral-500">Manage book borrowings and returns</p>
        </div>
        <button
          onClick={() => setShowBorrowModal(true)}
          className="px-4 py-2.5 bg-[#4995ED] text-white rounded-lg hover:bg-[#3a7bc8] flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Borrow
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED] transition-colors"
        />
      </div>

      {/* Transactions List */}
      <div className="rounded-xl bg-white border shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Book</th>
                <th className="px-6 py-3 font-medium">Borrowed</th>
                <th className="px-6 py-3 font-medium">Due</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredBorrows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-neutral-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginatedBorrows.map((record) => (
                  <tr key={record.id} className="group hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{record.userName}</div>
                      <div className="text-xs text-neutral-500">{record.userContact}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 line-clamp-1 max-w-[200px]" title={record.bookTitle}>{record.bookTitle}</div>
                      <div className="text-xs text-neutral-500">ISBN: {record.bookISBN}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {record.borrowDate ? new Date(record.borrowDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${
                        record.status === 'borrowed' && record.dueDate && new Date(record.dueDate) < new Date()
                          ? 'text-red-600 font-medium'
                          : 'text-neutral-600'
                      }`}>
                        {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {record.status === 'borrowed' ? (
                        record.dueDate && isOverdue(record.dueDate) ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                            <AlertCircle className="mr-1 h-3 w-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                            <Clock className="mr-1 h-3 w-3" /> Active
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                          <CheckCircle className="mr-1 h-3 w-3" /> Returned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === record.id ? null : record.id)}
                        className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {actionMenuOpen === record.id && (
                        <div className="absolute right-0 top-12 z-10 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          {record.status !== 'returned' ? (
                            <>
                              <button
                                onClick={() => returnBook(record.id)}
                                className="flex w-full items-center px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Mark as Returned
                              </button>
                              <button
                                onClick={() => setExtendMenuOpen(extendMenuOpen === record.id ? null : record.id)}
                                className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Extend Due Date
                              </button>
                              {extendMenuOpen === record.id && (
                                <div className="bg-neutral-50 px-2 py-2 grid grid-cols-3 gap-1 border-t border-neutral-100">
                                  {[1, 3, 7].map(days => (
                                    <button
                                      key={days}
                                      onClick={() => handleExtend(record.id, record.dueDate, days)}
                                      className="rounded border bg-white px-2 py-1 text-xs font-medium hover:bg-neutral-100 hover:text-[#4995ED]"
                                    >
                                      +{days}d
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-4 py-2 text-xs text-neutral-400 italic text-center">
                              No actions available
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-neutral-900 text-neutral-100 rounded-b-xl">
          <div className="text-sm text-neutral-400">
            Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredBorrows.length)} to {Math.min(currentPage * rowsPerPage, filteredBorrows.length)} of {filteredBorrows.length} transactions
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-300">Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="text-sm text-neutral-300">
              Page {currentPage} of {Math.ceil(filteredBorrows.length / rowsPerPage) || 1}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBorrows.length / rowsPerPage)))}
                disabled={currentPage >= Math.ceil(filteredBorrows.length / rowsPerPage)}
                className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(filteredBorrows.length / rowsPerPage))}
                disabled={currentPage >= Math.ceil(filteredBorrows.length / rowsPerPage)}
                className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-800 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold text-neutral-900">Borrow Book</h2>
            </div>
            
            <div className="p-6 space-y-5">
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

              {/* Book ID Input */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Book ID / ISBN / Barcode
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter or scan Book ID/ISBN"
                    value={borrowForm.bookIdInput}
                    onChange={(e) => setBorrowForm({ ...borrowForm, bookIdInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleBookIdInput(borrowForm.bookIdInput)}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4995ED]/20 focus:border-[#4995ED]"
                  />
                  <button
                    onClick={() => handleBookIdInput(borrowForm.bookIdInput)}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
                  >
                    <ScanLine className="w-4 h-4" />
                    Verify
                  </button>
                </div>
                
                {/* Barcode Scanner Button */}
                <button
                  onClick={() => {
                    setShowBookScanner(!showBookScanner);
                    if (!showBookScanner) {
                      startBookBarcodeScan();
                    } else {
                      stopBookBarcodeScan();
                    }
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                    showBookScanner 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  disabled={isBookScanning && showBookScanner}
                >
                  <Camera className="w-4 h-4" />
                  {showBookScanner ? 'Stop Scanner' : 'Scan Book Barcode'}
                </button>

                {/* Barcode Scanner Camera View */}
                {showBookScanner && (
                  <div className="mt-3 p-3 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/80">Camera Scanner (ISBN)</span>
                      <button
                        onClick={() => {
                          stopBookBarcodeScan();
                          setShowBookScanner(false);
                        }}
                        className="text-white/60 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <video 
                      ref={bookVideoRef} 
                      className="w-full h-auto rounded" 
                      style={{ display: isBookScanning ? 'block' : 'none' }} 
                    />
                    {!isBookScanning && (
                      <div className="flex items-center justify-center py-8 text-white/70">
                        <Camera className="w-8 h-8 mr-2" />
                        <span>Starting camera...</span>
                      </div>
                    )}
                    {bookScannerError && (
                      <p className="text-xs text-red-400 mt-2">{bookScannerError}</p>
                    )}
                  </div>
                )}

                {bookScanError && (
                  <p className="text-xs text-red-600 mt-2">{bookScanError}</p>
                )}
                {selectedBook && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-neutral-800">{selectedBook.title}</p>
                    <p className="text-xs text-neutral-600">by {selectedBook.author}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Available: {selectedBook.available}/{selectedBook.quantity}
                    </p>
                  </div>
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
                    setBorrowForm({ bookId: '', userId: '', dueDate: '', userIdInput: '', bookIdInput: '' });
                    setUserScanError('');
                    setBookScanError('');
                    setShowBookScanner(false);
                    stopBookBarcodeScan();
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

export default TransactionsManagement;
