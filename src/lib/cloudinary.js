// Cloudinary Configuration
// For image uploads and delivery in the Puswaka Digital Library

import { Cloudinary } from '@cloudinary/url-gen';

// Create a Cloudinary instance with your cloud name from environment variables
// You need to add VITE_CLOUDINARY_CLOUD_NAME to your .env file
const cloudinary = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  },
  url: {
    secure: true // Use HTTPS
  }
});

// Upload preset for unsigned uploads (create this in Cloudinary Console)
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary upload URL for unsigned uploads
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload an image to Cloudinary using unsigned upload
 * @param {File} file - The image file to upload
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - The upload response containing url, public_id, etc.
 */
export const uploadImage = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // Add optional folder organization
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  // Add optional tags for better organization
  if (options.tags) {
    formData.append('tags', options.tags.join(','));
  }

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Get an optimized image URL from a Cloudinary public ID
 * @param {string} publicId - The public ID of the image in Cloudinary
 * @returns {string} - The optimized image URL
 */
export const getImageUrl = (publicId) => {
  return cloudinary.image(publicId).toURL();
};

export default cloudinary;
