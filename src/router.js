// ============================
// Router — Page Navigation
// ============================
import { animateBurnoutGauge } from './dashboard.js';
import { initCognitiveChart } from './charts.js';
import { initPerformanceChart, initBaselineChart } from './charts.js';
import { checkDailyModal } from './checkin.js';

export function showPage(pageId) {
    const current = document.querySelector('.page.active');
    const target  = document.getElementById(pageId);

    if (!target || current === target) return;

    // Update sidebar BEFORE transition
    updateSidebarState(pageId);

    // Fade out current page
    if (current) {
        current.style.transition = 'opacity 0.2s ease';
        current.style.opacity = '0';
    }

    setTimeout(() => {
        // Swap active class
        if (current) {
            current.classList.remove('active');
            current.style.opacity = '';
            current.style.transition = '';
        }
        target.classList.add('active');

        // Fade in new page
        target.style.opacity = '0';
        target.style.transition = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                target.style.transition = 'opacity 0.25s ease';
                target.style.opacity = '1';
                setTimeout(() => {
                    target.style.opacity = '';
                    target.style.transition = '';
                }, 250);
            });
        });

        // Trigger page-specific init
        if (pageId === 'page-dashboard') {
            setTimeout(() => initCognitiveChart(), 300);
            setTimeout(() => animateBurnoutGauge(), 500);
            setTimeout(() => checkDailyModal(), 600);
        }
        if (pageId === 'page-insights') {
            setTimeout(() => {
                initPerformanceChart();
                initBaselineChart();
            }, 300);
        }
    }, 200);
}

export function updateSidebarState(pageId) {
    const pages = ['page-dashboard', 'page-coach', 'page-insights'];
    document.querySelectorAll('.sidebar-nav').forEach(nav => {
        nav.querySelectorAll('.sidebar-link').forEach((link, i) => {
            link.classList.remove('active');
            if (pages[i] === pageId) link.classList.add('active');
        });
    });
}
