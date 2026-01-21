import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * Reusable ShareButton component for sharing book details
 * @param {string} bookId - The unique ID of the book
 * @param {string} bookTitle - The title of the book
 * @param {string} bookAuthor - The author of the book (optional)
 */
const ShareButton = ({ bookId, bookTitle, bookAuthor = '' }) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    // Generate the sharing link
    const shareUrl = `${window.location.origin}/catalog/${bookId}`;
    
    // Create share text
    const shareText = bookAuthor 
      ? `Check out this book: ${bookTitle} by ${bookAuthor}`
      : `Check out this book: ${bookTitle}`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled the share or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to clipboard
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback to clipboard for browsers that don't support Web Share API
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShowToast(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        title={copied ? "Link copied!" : "Share this book"}
        className="p-2 rounded-lg border border-gray-300 hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {copied ? (
          <Check className="w-5 h-5" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
      </button>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Link copied to clipboard!</span>
        </div>
      )}
    </>
  );
};

export default ShareButton;
