// ============================
// Auth — Login, Signup, Toasts
// ============================
import {
    signInWithEmailAndPassword, createUserWithEmailAndPassword,
    GoogleAuthProvider, signInWithPopup, updateProfile,
    onAuthStateChanged, signOut
} from 'firebase/auth';
import { auth } from './firebase.js';
import { showPage } from './router.js';
import { loadChatHistory } from './coach.js';
import { isDemoCredentials, seedDemoUserData, updateUserIdentityUI } from './demo.js';

// ── Route Guard (Firebase session persistence) ────────────────────────────────
// Called once from main.js on app boot.
// Keeps users logged in across refreshes and redirects them if not authenticated.
export function initAuthStateListener() {
    const PROTECTED = ['page-dashboard', 'page-coach', 'page-insights', 'page-onboarding'];
    const AUTH_PAGES = ['page-landing', 'page-login', 'page-signup'];

    onAuthStateChanged(auth, (user) => {
        const activePage = document.querySelector('.page.active')?.id;

        if (user) {
            // Save Firebase display name to localStorage so Gemini can use it
            if (user.displayName) {
                localStorage.setItem('currentUserName', user.displayName);
                const parts = user.displayName.trim().split(' ');
                const initials = parts.length >= 2
                    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    : parts[0].slice(0, 2).toUpperCase();
                localStorage.setItem('currentUserInitials', initials);
            }
            updateUserIdentityUI();

            // Redirect from auth pages → dashboard
            if (AUTH_PAGES.includes(activePage)) {
                showPage('page-dashboard');
            }
        } else {
            // Redirect from protected pages → landing
            if (PROTECTED.includes(activePage)) {
                showPage('page-landing');
            }
        }
    });
}

/**
 * Completely wipes all personalized telemetry and session data.
 * Crucial for multi-user browser environments to prevent data leakage.
 */
function clearSessionData() {
    // Identity
    localStorage.removeItem('isDemoUser');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('currentUserInitials');
    localStorage.removeItem('currentUserEmail');

    // Onboarding & Baselines
    localStorage.removeItem('baselineCognitiveLoad');
    localStorage.removeItem('onboardingChips');

    // Metrics & Markers
    localStorage.removeItem('ms_burnout_score');
    localStorage.removeItem('ms_avg_sleep');
    localStorage.removeItem('ms_stress');
    localStorage.removeItem('ms_mood');

    // Daily Checks (Wipe all dailyCheckIn_ keys)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dailyCheckIn_')) {
            localStorage.removeItem(key);
        }
    });

    // Chat History
    clearChatHistory();

    // Reset UI components
    updateUserIdentityUI();
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    // Demo shortcut
    if (isDemoCredentials(email, pass)) {
        seedDemoUserData();
        loadChatHistory();
        showToast('Demo environment loaded — 35 days of sample data ready.', 'success');
        showPage('page-dashboard');
        setButtonLoading(btn, false, 'Sign In');
        return;
    }

    try {
        clearSessionData(); // Ensure fresh start
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('Synchronizing neuro-patterns...', 'success');
        showPage('page-dashboard');
    } catch (err) {
        showToast(friendlyFirebaseError(err.code), 'error');
    } finally {
        setButtonLoading(btn, false, 'Sign In');
    }
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
export async function handleSignup(e) {
    e.preventDefault();
    const fname = (document.getElementById('signup-fname')?.value || '').trim();
    const lname = (document.getElementById('signup-lname')?.value || '').trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;

    if (pass.length < 8) {
        showToast('Password must be at least 8 characters.', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    clearSessionData(); // Wipe old session before creating new one

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);

        // Build display name and initials from the form fields
        const fullName = [fname, lname].filter(Boolean).join(' ') || email.split('@')[0];
        const initials = fname && lname
            ? (fname[0] + lname[0]).toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        // Save to Firebase profile
        await updateProfile(cred.user, { displayName: fullName });

        // Also persist locally for immediate use
        localStorage.setItem('currentUserName', fullName);
        localStorage.setItem('currentUserInitials', initials);
        localStorage.setItem('currentUserEmail', email);
        updateUserIdentityUI();

        showToast('Profile initialized. Welcome to MindSync.', 'success');
        showPage('page-onboarding');
    } catch (err) {
        showToast(friendlyFirebaseError(err.code), 'error');
    } finally {
        setButtonLoading(btn, false, 'Initialize Profile');
    }
}

// ── Google Sign-In ────────────────────────────────────────────────────────────
export async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        clearSessionData(); // Fresh start
        const cred = await signInWithPopup(auth, provider);

        // Sync Google display name
        if (cred.user.displayName) {
            const parts = cred.user.displayName.trim().split(' ');
            const initials = parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : parts[0].slice(0, 2).toUpperCase();
            localStorage.setItem('currentUserName', cred.user.displayName);
            localStorage.setItem('currentUserInitials', initials);
            updateUserIdentityUI();
        }

        clearDemoUserData();
        showToast('Google sign-in successful!', 'success');
        showPage('page-dashboard');
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            showToast(friendlyFirebaseError(err.code), 'error');
        }
    }
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function handleSignOut() {
    try {
        await signOut(auth);
        clearSessionData();
        showPage('page-landing');
    } catch (err) {
        showToast('Sign-out failed. Please try again.', 'error');
    }
}

// ── Password Toggle ───────────────────────────────────────────────────────────
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

// ── Toast Notifications ───────────────────────────────────────────────────────
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✓' : '⚠'}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setButtonLoading(btn, loading, label = '') {
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.dataset.label = btn.innerHTML;
        btn.innerHTML = '<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    } else {
        btn.disabled = false;
        btn.innerHTML = label || btn.dataset.label || label;
    }
}

function friendlyFirebaseError(code) {
    const map = {
        'auth/email-already-in-use': 'That email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
        'auth/invalid-credential': 'Invalid credentials. Check your email and password.',
    };
    return map[code] || `Authentication error (${code}). Please try again.`;
}
