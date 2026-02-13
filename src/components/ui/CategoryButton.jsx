import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CategoryButton Component
 * Reusable category button with image background and overlay
 * Displays category name as text on top of the image
 * 
 * Props:
 * - to: Link destination (string)
 * - name: Category name (string)
 * - image: Background image path (string) - defaults to /banner-1.png
 * - className: Additional classes (string)
 */
const CategoryButton = ({ 
  to, 
  name,
  image = '',
  className = '' 
}) => {
  
  return (
    <Link to={to} className={`group ${className}`}>
      <div className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl group-active:scale-95">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundImage: `url(${image})` }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/50" />
        
        {/* Category Title Text */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span className="text-white font-bold text-lg text-center drop-shadow-lg transition-all duration-300 group-hover:scale-110">
            {name}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CategoryButton;
