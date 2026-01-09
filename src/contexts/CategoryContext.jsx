import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CategoryContext = createContext();

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 CategoryContext: Fetching categories from Firestore...');
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        console.log('✅ Firestore snapshot received. Categories count:', snapshot.docs.length);
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('📚 Categories data:', categoriesData);
        setCategories(categoriesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper function to get category by UUID (or ID)
  const getCategoryByUuid = (uuid) => {
    // Check both uuid field and id field
    return categories.find(cat => cat.uuid === uuid || cat.id === uuid);
  };

  // Helper function to get category name by UUID
  const getCategoryName = (uuid) => {
    const category = getCategoryByUuid(uuid);
    return category?.name || uuid;
  };

  // Helper function to get multiple category names
  const getCategoryNames = (uuids = []) => {
    return uuids.map(uuid => getCategoryName(uuid)).filter(Boolean);
  };

  const value = {
    categories,
    loading,
    error,
    getCategoryByUuid,
    getCategoryName,
    getCategoryNames
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext;
