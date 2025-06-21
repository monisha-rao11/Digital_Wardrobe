// firebaseConfig.ts (or firebase.js)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // Importing Auth module for Firebase Authentication
import { getFirestore } from "firebase/firestore";  // Importing Firestore module
import { getStorage } from "firebase/storage";  // Importing Storage module (if used)
import { getAnalytics } from "firebase/analytics";  // Importing Analytics module (optional)

const firebaseConfig = {
  apiKey: "AIzaSyCCrGphZMcOflmALVyFWtvsLqrhUllEz3U",
  authDomain: "wardrobe-11d00.firebaseapp.com",
  projectId: "wardrobe-11d00",
  storageBucket: "wardrobe-11d00.firebasestorage.app",
  messagingSenderId: "861080909226",
  appId: "1:861080909226:web:d773abc6153946a36027d3",
  measurementId: "G-G2KTVETCWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // Initialize Firebase Authentication
const db = getFirestore(app);  // Initialize Firestore
const storage = getStorage(app);  // Initialize Firebase Storage (if used)
const analytics = getAnalytics(app);  // Initialize Firebase Analytics (optional)

// Export necessary Firebase services
export { auth, db, storage, analytics };
