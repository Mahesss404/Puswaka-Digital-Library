import React from 'react';

/**
 * Reusable book cover component.
 * Props:
 * - coverSrc: image URL of the book cover
 * - title: book title text
 * - author: author name (optional)
 * - genre: book genre (optional)
 * - className: extra classes for the outer wrapper (optional)
 * - textColor: text color class (optional, defaults to text-gray-900)
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
  textColor = 'text-gray-900',
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
      className={`group relative flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100">
        <img
          src={coverSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Genre Tag (Overlay) */}
        {genre && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-[10px] font-semibold tracking-wide uppercase bg-blue-100 text-blue-500 backdrop-blur-sm rounded-md">
              {genre}
            </span>
          </div>
        )}

        {/* Status Overlay (Only if low stock or out of stock) */}
        {typeof available === 'number' && available <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="px-3 py-1 bg-red-100 text-red-500 text-xs font-bold rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <h3 className={`text-sm font-bold leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors ${textColor}`}>
          {title}
        </h3>
        
        {author && (
          <p className="text-xs text-gray-500 font-medium line-clamp-1">
            {author}
          </p>
        )}

        {/* Availability Badge */}
        {typeof available === 'number' && available > 0 && (
          <div className="mt-auto pt-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium
              ${available < 3 ? 'text-amber-600' : 'text-green-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full 
                ${available < 3 ? 'bg-amber-500' : 'bg-green-500'}`} 
              />
              {available === 1 ? '1 Buku tersisa' : `${available} Buku tersisa`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Book;