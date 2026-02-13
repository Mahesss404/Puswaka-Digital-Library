import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CategoryButton Component
 * Reusable category button with image background and overlay
 * Displays category name as text on top of the image
 * 
 * Props:
 * - to: Link destination (string)
 * - icon: Not used in new design (kept for backwards compatibility)
 * - name: Category name (string)
 * - className: Additional classes (string)
 */
const CategoryButton = ({ 
  to, 
  icon = '📚', 
  name, 
  className = '' 
}) => {
  // Use banner images as example backgrounds (cycling through available images)
  const backgroundImages = ['/banner-1.png', '/banner-2.png'];
  const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
  
  return (
    <Link to={to} className={`group ${className}`}>
      <div className="relative w-full h-32 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl group-active:scale-95">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundImage: `url(${randomImage})` }}
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
