// ============================
// MindSync AI — Entry Point
// ============================

// Import all CSS (Vite handles bundling)
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/layout.css';

// Import all modules
import { showPage } from './router.js';
import { handleLogin, handleSignup, togglePassword, showToast, handleGoogleSignIn, handleLogout } from './auth.js';
import { sendMessage, sendQuickAction, handleChatKey, loadChatHistory } from './coach.js';
import { submitOnboarding, saveDailyCheckin, openCheckinModal } from './checkin.js';
import { initCognitiveChart, initPerformanceChart, initBaselineChart, updatePatternCard } from './charts.js';
import { saveProfileSettings, initiateDeleteAccount, cancelDeleteAccount, confirmDeleteAccount } from './settings.js';
import { openProtocolModal, closeProtocolModal, toggleSaveProtocol, startProtocol } from './protocols.js';
import { updateUserIdentityUI } from './demo.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { pullCheckinsFromFirestore } from './sync.js';

// ============================
// Expose to HTML (onclick="...")
// ============================
window.showPage           = showPage;
window.handleLogin        = handleLogin;
window.handleSignup       = handleSignup;
window.togglePassword     = togglePassword;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleLogout       = handleLogout;
window.openCheckinModal   = openCheckinModal;
window.toggleUserMenu     = function(el) {
    const menu   = el.querySelector('.user-menu');
    const isOpen = menu.classList.contains('open');
    document.querySelectorAll('.user-menu.open').forEach(m => m.classList.remove('open'));
    if (!isOpen) {
        const isDemo = localStorage.getItem('isDemoUser') === 'true';
        menu.querySelectorAll('.demo-only').forEach(item => {
            item.style.display = isDemo ? 'flex' : 'none';
        });
        menu.classList.add('open');
    }
};
window.sendMessage            = sendMessage;
window.sendQuickAction        = sendQuickAction;
window.handleChatKey          = handleChatKey;
window.submitOnboarding       = submitOnboarding;
window.saveDailyCheckin       = saveDailyCheckin;
window.saveProfileSettings    = saveProfileSettings;
window.initiateDeleteAccount  = initiateDeleteAccount;
window.cancelDeleteAccount    = cancelDeleteAccount;
window.confirmDeleteAccount   = confirmDeleteAccount;
window.openProtocolModal      = openProtocolModal;
window.closeProtocolModal     = closeProtocolModal;
window.toggleSaveProtocol     = toggleSaveProtocol;
window.startProtocol          = startProtocol;

// ============================
// Tab switching (generic)
// ============================
document.querySelectorAll('.card-tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Redraw cognitive chart when its tabs are switched
            if (tabGroup.closest('.trend-card')) {
                const mode = tab.textContent.trim().toLowerCase();
                initCognitiveChart(mode);
            }

            // Redraw insights charts when the page-level range tabs are switched
            if (tabGroup.closest('#page-insights')) {
                const mode = tab.textContent.trim().toLowerCase();
                initPerformanceChart(mode);
                initBaselineChart();
                updatePatternCard(mode);
            }
        });
    });
});

// ============================
// Onboarding slider
// ============================
const cogSlider = document.getElementById('cognitive-slider');
const sliderVal = document.getElementById('slider-value');
if (cogSlider) {
    cogSlider.addEventListener('input', (e) => {
        sliderVal.textContent = e.target.value;
    });
}

// Chip toggle
document.querySelectorAll('.state-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
});

// ============================
// Floating Particles (Landing)
// ============================
function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
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
        container.appendChild(particle);
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

// ============================
// Window Resize — Redraw Charts
// ============================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;
        if (activePage.id === 'page-dashboard') {
            const trendCard  = document.querySelector('.trend-card');
            const activeTab  = trendCard?.querySelector('.card-tabs .tab.active');
            const mode       = activeTab?.textContent.trim().toLowerCase() ?? 'today';
            initCognitiveChart(mode);
        }
        if (activePage.id === 'page-insights') {
            const insightsTab  = activePage.querySelector('.header-actions .card-tabs .tab.active');
            const insightsMode = insightsTab?.textContent.trim().toLowerCase() ?? '1w';
            initPerformanceChart(insightsMode);
            initBaselineChart();
            updatePatternCard(insightsMode);
        }
    }, 250);
});

// ============================
// Password Strength Meter
// ============================
window.updatePasswordStrength = function(val) {
    const bars   = [1,2,3,4].map(i => document.getElementById('sb' + i));
    const label  = document.getElementById('strength-label');
    if (!bars[0] || !label) return;

    bars.forEach(b => { b.className = 'strength-bar'; });

    let score = 0;
    if (val.length >= 8)                    score++;
    if (val.length >= 12)                   score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val))          score++;

    const levels = [
        { cls: 'weak',   text: 'WEAK',   count: 1 },
        { cls: 'fair',   text: 'FAIR',   count: 2 },
        { cls: 'good',   text: 'GOOD',   count: 3 },
        { cls: 'strong', text: 'STRONG', count: 4 },
    ];

    if (val.length === 0) { label.textContent = '—'; return; }
    const level = levels[Math.min(score, 3)];
    bars.slice(0, level.count).forEach(b => b.classList.add(level.cls));
    label.textContent = level.text;
    label.style.color = { weak: '#EF4444', fair: '#F59E0B', good: '#10B981', strong: '#06B6D4' }[level.cls];
};

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar-user')) {
        document.querySelectorAll('.user-menu.open').forEach(m => m.classList.remove('open'));
    }
});

// ============================
// DOM Ready
// ============================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();

    const badge = document.getElementById('status-badge');
    if (badge) {
        badge.style.opacity = '0';
        setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transition = 'opacity 0.5s ease';
        }, 200);
    }

    // ============================
    // Auth State Persistence
    // ============================
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Pull Firestore check-ins into localStorage before rendering
            await pullCheckinsFromFirestore();
            updateUserIdentityUI();
            loadChatHistory();
            showPage('page-dashboard');
        } else {
            // No session — check if demo mode is active, otherwise show landing
            const isDemo = localStorage.getItem('isDemoUser') === 'true';
            if (isDemo) {
                updateUserIdentityUI();
                loadChatHistory();
                showPage('page-dashboard');
            } else {
                showPage('page-landing');
            }
        }
    });
});
