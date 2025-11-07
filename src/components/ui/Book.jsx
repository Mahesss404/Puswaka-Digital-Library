import React from 'react';

/**
 * Reusable book cover component.
 * Props:
 * - coverSrc: image URL of the book cover
 * - title: book title text
 * - author: author name (optional)
 * - className: extra classes for the outer wrapper (optional)
 */
const Book = ({ coverSrc, title, author = '' }) => {
  return (
    <div className={`max-w-[147px] select-none `}>
      <div className="relative w-min-[148px] h-min-[127px] overflow-hidden rounded-md shadow-sm ring-1 ring-black/5 bg-white">
        <img
          src={coverSrc}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-1">
        <h3 className="text-[11px] leading-tight font-semibold text-white line-clamp-1">
          {title}
        </h3>
        {author ? (
          <p className="text-[10px] leading-tight text-white/80 line-clamp-1">By {author}</p>
        ) : null}
      </div>
    </div>
  );
};

export default Book;