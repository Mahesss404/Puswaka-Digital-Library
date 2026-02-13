/**
 * Utility functions for book-related operations
 */

/**
 * Get category ID from book data
 * @param {Object} book - Book object with category information
 * @param {Array} categories - Array of category objects
 * @returns {string} Category UUID/ID or 'uncategorized'
 */
export const getCategoryIdFromBook = (book, categories) => {
  if (!book?.category) return 'uncategorized';
  
  const category = categories.find(cat => cat.name === book.category);
  return category?.uuid || category?.id || 'uncategorized';
};

/**
 * Generate book detail path with category
 * @param {string} bookId - Book ID
 * @param {string} categoryId - Category UUID/ID
 * @returns {string} Book detail path
 */
export const getBookDetailPath = (bookId, categoryId) => {
  return `/catalog/${categoryId}/${bookId}`;
};
