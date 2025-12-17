import React from 'react';

/**
 * Reusable book cover component.
 * Props:
 * - coverSrc: image URL of the book cover
 * - title: book title text
 * - author: author name (optional)
 * - genre: book genre (optional)
 * - className: extra classes for the outer wrapper (optional)
 * - textColor: text color class (optional, defaults to text-white for dark backgrounds)
 * - onClick: click handler function (optional)
 * - id: book id (optional)
 * - description: book description (optional)
 * - available: number of available books (optional)
 * - quantity: total quantity of books (optional)
 * - isbn: ISBN number (optional)
 */
const Book = ({ 
  coverSrc = '', 
  title, 
  author = '', 
  genre = '', 
  className = '', 
  textColor = '',
  onClick,
  id,
  description = '',
  available = 0,
  quantity = 0,
  isbn = ''
}) => {
  const handleClick = () => {
    if (onClick && id) {
      onClick(id);
    }
  };

  return (
    <div 
      className={`w-40 min-h-[240px] p-2 overflow-hidden rounded-lg ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="w-full aspect-[9/16] rounded-md overflow-hidden">
        <img
          src={coverSrc}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-2">
        <h3 className={`text-xs sm:text-[16px] leading-tight font-bold line-clamp-2 ${textColor || ''}`}>
          {title}
        </h3>
        {author ? (
          <p className={`text-xs sm:text-[16px] leading-tight line-clamp-1 mt-0.5 ${textColor || ''}`}>
            By {author}
          </p>
        ) : null}
        {genre ? (
          <p className={`text-xs sm:text-[16px] leading-tight line-clamp-1 mt-0.5 ${textColor || ''}`}>
            {genre}
          </p>
        ) : null}
        {typeof available === 'number' ? (
          (() => {
            let bgColorClass = '';
            let txtColorClass = '';
            if (available === 0) {
              bgColorClass = 'bg-red-100';
              txtColorClass = 'text-red-800';
            } else if (available < 3) {
              bgColorClass = 'bg-yellow-100';
              txtColorClass = 'text-yellow-800';
            } else {
              bgColorClass = 'bg-green-100';
              txtColorClass = 'text-green-800';
            }
            return (
              <p className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${bgColorClass} ${txtColorClass} ${textColor || ''}`}>
                Available: {available}
              </p>
            );
          })()
        ) : null}
      </div>
    </div>
  );
};

export default Book;