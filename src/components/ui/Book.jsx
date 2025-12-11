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
      <img
        src={coverSrc}
        alt={title}
        className="rounded-md m-auto w-40 object-contain"
        loading="lazy"
      />
      <div className="mt-2">
        <h3 className={`text-[16px] sm:text-[12px] leading-tight font-semibold line-clamp-2 ${textColor || ''}`}>
          {title}
        </h3>
        {author ? (
          <p className={`text-[10px] sm:text-[11px] leading-tight line-clamp-1 mt-0.5 ${textColor || ''}`}>
            By {author}
          </p>
        ) : null}
        {genre ? (
          <p className={`text-[9px] sm:text-[10px] leading-tight line-clamp-1 mt-0.5 ${textColor || ''}`}>
            {genre}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Book;