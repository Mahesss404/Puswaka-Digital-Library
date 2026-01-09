import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CategoryButton Component
 * Reusable category button with soft bubble background and floating icon
 * Supports both emoji and image icons (for future 3D icons)
 * 
 * Props:
 * - to: Link destination (string)
 * - icon: Icon emoji (string) OR image URL (string starting with http/.)
 * - name: Category name (string)
 * - className: Additional classes (string)
 */
const CategoryButton = ({ 
  to, 
  icon = '📚', 
  name, 
  className = '' 
}) => {
  // Check if icon is an image URL or emoji
  const isImageIcon = typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('.'));
  
  return (
    <Link to={to} className={`group ${className}`}>
      <div className="flex flex-col items-center gap-3 cursor-pointer">
        {/* Bubble Background with Floating Icon */}
        <div className="relative">
          {/* Background Bubble - Uses Tailwind primary color */}
          <div 
            className="
              w-20 h-20 rounded-full 
              bg-gradient-to-br from-primary/10 to-primary/20
              transition-all duration-300 ease-out
              group-hover:scale-110 group-hover:shadow-md group-hover:from-primary/20 group-hover:to-primary/30
              group-active:scale-95
            "
          />
          
          {/* Floating Icon - Supports both emoji and images */}
          <div 
            className="
              absolute inset-0 flex items-center justify-center
              transform -translate-y-2
              transition-transform duration-300 ease-out
              group-hover:-translate-y-3 group-hover:scale-110
            "
          >
            {isImageIcon ? (
              // 3D Icon Image
              <img 
                src={icon} 
                alt={name}
                className="w-16 h-16 object-contain drop-shadow-md"
              />
            ) : (
              // Emoji Icon
              <div className="text-6xl drop-shadow-sm">
                {icon}
              </div>
            )}
          </div>
        </div>
        
        {/* Category Name */}
        <span 
          className="
            text-sm font-medium text-gray-700 text-center
            transition-colors duration-200
            group-hover:text-primary group-hover:font-semibold
            max-w-[100px] line-clamp-2
          "
        >
          {name}
        </span>
      </div>
    </Link>
  );
};

export default CategoryButton;
