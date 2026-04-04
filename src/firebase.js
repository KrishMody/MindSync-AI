// ============================
// Firebase — MindSync AI
// ============================
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyBicsbBog_sdw-Ld54EHzdyZ6VtsZ_G1ZA',
  authDomain:        'mindsync-9e1ea.firebaseapp.com',
  projectId:         'mindsync-9e1ea',
  storageBucket:     'mindsync-9e1ea.firebasestorage.app',
  messagingSenderId: '582899265498',
  appId:             '1:582899265498:web:93cb44b8f6a6f16c8bdae3',
  measurementId:     'G-J3PBENYTPB',
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
