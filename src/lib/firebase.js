// Firebase Configuration Template
// Replace the placeholder values with your actual Firebase config

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyCOe3INtWArTjSJc0yWKFVr1AhXwoTufdU",
    authDomain: "puswakadb.firebaseapp.com",
    projectId: "puswakadb",
    storageBucket: "puswakadb.firebasestorage.app",
    messagingSenderId: "333287342230",
    appId: "1:333287342230:web:907c5ecadd5fa5d67702b7",
    measurementId: "G-WLQMDC2MWM"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Helper function to initialize RecaptchaVerifier
export const initializeRecaptcha = (containerId = 'recaptcha-container') => {
  // Clear any existing recaptcha
  const existingRecaptcha = window.recaptchaVerifier;
  if (existingRecaptcha) {
    existingRecaptcha.clear();
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
    'callback': () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
    'expired-callback': () => {
      // Response expired. Ask user to solve reCAPTCHA again.
    }
  });

  return window.recaptchaVerifier;
};

export default app;

