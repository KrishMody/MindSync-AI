// ============================
// Auth — Login, Signup, Toasts
// ============================

// All imports must be at the top of the file
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase.js';
import { showPage } from './router.js';

// ============================
// Login — Real Firebase Auth
// ============================
export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass  = document.getElementById('login-password').value;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('Login successful. Synchronizing neuro-patterns...', 'success');
        showPage('page-dashboard');
    } catch (err) {
        showToast(err.message, 'error');
        btn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
}

// ============================
// Sign Up — Real Firebase Auth
// ============================
export async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const pass  = document.getElementById('signup-password').value;

    if (pass.length < 8) {
        showToast('Password must be at least 8 characters for baseline security.', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';

    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        showToast('Profile initialized successfully.', 'success');
        showPage('page-onboarding');
    } catch (err) {
        showToast(err.message, 'error');
        btn.innerHTML = 'Initialize Profile <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
}

// ============================
// Google Sign-In
// ============================
export async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        showToast('Google sign-in successful!', 'success');
        showPage('page-dashboard');
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            showToast(err.message, 'error');
        }
    }
}

// ============================
// Password Toggle
// ============================
export function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8S4 3 8 3S15 8 15 8S12 13 8 13S1 8 1 8Z" stroke="currentColor" stroke-width="1.2"/><path d="M2 2L14 14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8S4 3 8 3S15 8 15 8S12 13 8 13S1 8 1 8Z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/></svg>';
    }
}

// ============================
// Toast Notifications
// ============================
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✓' : '⚠️'}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
