import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Home as HomeIcon } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCategoryContext } from '@/contexts/CategoryContext';
import Book from '@/components/ui/Book';
import BookSkeleton from '@/components/ui/BookSkeleton';

const CategoryCatalog = () => {
  const { categoryUuid } = useParams();
  const navigate = useNavigate();
  const { getCategoryByUuid, loading: categoriesLoading } = useCategoryContext();
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);

  // Fetch category details
  useEffect(() => {
    if (!categoriesLoading) {
      const cat = getCategoryByUuid(categoryUuid);
      if (cat) {
        setCategory(cat);
      } else {
        setError('Category not found');
      }
    }
  }, [categoryUuid, getCategoryByUuid, categoriesLoading]);

  // Fetch books filtered by category
  const fetchBooks = async () => {
    if (!category) {
      console.log('⚠️ Category not loaded yet, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching books for category:', category.name);

      // Query books where the 'category' field matches the category name
      const booksQuery = query(
        collection(db, 'books'),
        where('category', '==', category.name)
      );
      
      const booksSnapshot = await getDocs(booksQuery);
      console.log('📚 Books found:', booksSnapshot.docs.length);
      
      const booksData = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBooks(booksData);
    } catch (err) {
      console.error('❌ Error fetching books:', err);
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category && !categoriesLoading) {
      fetchBooks();
    }
  }, [category, categoriesLoading]);

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleRetry = () => {
    fetchBooks();
  };

  // Loading State
  if (loading || categoriesLoading) {
    return (
      <div className="bg-white min-h-screen p-4 lg:p-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Books Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {[...Array(14)].map((_, index) => (
            <BookSkeleton key={index} className="h-full w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white min-h-screen p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/home')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="bg-white min-h-screen p-4 lg:p-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
        <Link to="/home" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-primary transition-colors">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{category?.name || categoryUuid}</span>
      </nav>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category?.name || categoryUuid}
        </h1>
        <p className="text-gray-600">
          {books.length} {books.length === 1 ? 'book' : 'books'} found
        </p>
      </div>

      {/* Books Grid or Empty State */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {books.map((book) => (
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
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No books found
          </h3>
          <p className="text-gray-600 mb-6">
            There are no books in the "{category?.name || categoryUuid}" category yet.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse All Books
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryCatalog;
