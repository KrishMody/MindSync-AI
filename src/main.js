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
import { handleLogin, handleSignup, togglePassword, showToast, handleGoogleSignIn } from './auth.js';
import { sendMessage, sendQuickAction, handleChatKey, loadChatHistory } from './coach.js';
import { submitOnboarding, saveDailyCheckin } from './checkin.js';
import { initCognitiveChart, initPerformanceChart, initBaselineChart } from './charts.js';

// ============================
// Expose to HTML (onclick="...")
// ============================
window.showPage         = showPage;
window.handleLogin      = handleLogin;
window.handleSignup     = handleSignup;
window.togglePassword   = togglePassword;
window.handleGoogleSignIn = handleGoogleSignIn;
window.sendMessage      = sendMessage;
window.sendQuickAction  = sendQuickAction;
window.handleChatKey    = handleChatKey;
window.submitOnboarding  = submitOnboarding;
window.saveDailyCheckin  = saveDailyCheckin;

// ============================
// Tab switching (generic)
// ============================
document.querySelectorAll('.card-tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
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
        if (activePage.id === 'page-dashboard') initCognitiveChart();
        if (activePage.id === 'page-insights') {
            initPerformanceChart();
            initBaselineChart();
        }
    }, 250);
});

// ============================
// DOM Ready
// ============================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    loadChatHistory();

    const badge = document.getElementById('status-badge');
    if (badge) {
        badge.style.opacity = '0';
        setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transition = 'opacity 0.5s ease';
        }, 200);
    }
});
