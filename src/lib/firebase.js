// Firebase Configuration Template
// Replace the placeholder values with your actual Firebase config

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: "puswakadb.firebaseapp.com",
    projectId: "puswakadb",
    storageBucket: "puswakadb.firebasestorage.app",
    messagingSenderId: "333287342230",
    appId: "1:333287342230:web:907c5ecadd5fa5d67702b7",
    measurementId: "G-WLQMDC2MWM",
    databaseURL: "https://puswakadb-default-rtdb.asia-southeast1.firebasedatabase.app"
  };
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

