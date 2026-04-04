// ============================
// Firebase — MindSync AI
// ============================
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app       = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth      = getAuth(app);
export const db        = getFirestore(app);

// ============================
// Ready-to-use Auth examples:
// ============================
//
// Sign up:
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from './firebase.js';
// createUserWithEmailAndPassword(auth, email, password)
//
// Sign in:
// import { signInWithEmailAndPassword } from 'firebase/auth';
// signInWithEmailAndPassword(auth, email, password)
//
// Google sign-in:
// import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// const provider = new GoogleAuthProvider();
// signInWithPopup(auth, provider)
//
// Sign out:
// import { signOut } from 'firebase/auth';
// signOut(auth)
//
// Auth state listener:
// import { onAuthStateChanged } from 'firebase/auth';
// onAuthStateChanged(auth, (user) => { if (user) { ... } else { ... } });
