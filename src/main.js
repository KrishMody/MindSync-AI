// ============================
// MindSync AI — Entry Point
// ============================

// CSS (Vite bundles these)
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/layout.css';

// Modules
import { showPage } from './router.js';
import {
    handleLogin, handleSignup, togglePassword,
    showToast, handleGoogleSignIn, handleSignOut,
    initAuthStateListener
} from './auth.js';
import {
    sendMessage, sendQuickAction, handleChatKey,
    loadChatHistory, clearChatHistory
} from './coach.js';
import { submitOnboarding, saveDailyCheckin } from './checkin.js';
import {
    initCognitiveChart, initPerformanceChart,
    initBaselineChart
} from './charts.js';
import { updateUserIdentityUI } from './demo.js';

// ── Expose to HTML onclick="..." ─────────────────────────────────────────────
window.showPage = showPage;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.togglePassword = togglePassword;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleSignOut = handleSignOut;
window.toggleUserMenu = toggleUserMenu;
window.sendMessage = sendMessage;
window.sendQuickAction = sendQuickAction;
window.handleChatKey = handleChatKey;
window.clearChatHistory = clearChatHistory;
window.submitOnboarding = submitOnboarding;
window.saveDailyCheckin = saveDailyCheckin;

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.card-tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});

// ── Onboarding slider ─────────────────────────────────────────────────────────
const cogSlider = document.getElementById('cognitive-slider');
const sliderVal = document.getElementById('slider-value');
if (cogSlider && sliderVal) {
    cogSlider.addEventListener('input', (e) => {
        sliderVal.textContent = e.target.value;
    });
}

// Chip toggle
document.querySelectorAll('.state-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
});

// ── Floating Particles (Landing) ──────────────────────────────────────────────
function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: rgba(124, 58, 237, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 15 + 10}s linear infinite;
            animation-delay: -${Math.random() * 15}s;
        `;
        container.appendChild(p);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0%   { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ── Window Resize — Redraw Charts ─────────────────────────────────────────────
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const active = document.querySelector('.page.active');
        if (!active) return;
        if (active.id === 'page-dashboard') initCognitiveChart();
        if (active.id === 'page-insights') { initPerformanceChart(); initBaselineChart(); }
    }, 250);
});

// ── User Menu Toggle ─────────────────────────────────────────────────────────
export function toggleUserMenu(e) {
    e.stopPropagation();
    const dropdown = e.currentTarget.querySelector('.user-dropdown');
    const isShowing = dropdown.classList.contains('show');

    // Close all other dropdowns first
    document.querySelectorAll('.user-dropdown').forEach(d => d.classList.remove('show'));

    if (!isShowing) dropdown.classList.add('show');
}

// Global click to close dropdowns
document.addEventListener('click', () => {
    document.querySelectorAll('.user-dropdown').forEach(d => d.classList.remove('show'));
});

// ── DOM Ready ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Sync name/avatar from localStorage immediately (before Firebase responds)
    updateUserIdentityUI();

    // Start Firebase auth state listener — handles session persistence + route guarding
    initAuthStateListener();

    // Init particles on landing
    initParticles();

    // Restore chat from localStorage
    loadChatHistory();

    // Landing badge fade-in
    const badge = document.getElementById('status-badge');
    if (badge) {
        badge.style.opacity = '0';
        setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transition = 'opacity 0.5s ease';
        }, 200);
    }
});
