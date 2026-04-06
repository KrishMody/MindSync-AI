// ============================
// Dashboard — Burnout Gauge
// ============================
import { isNewUser } from './userState.js';

/**
 * Animate the burnout gauge.
 * @param {number|null} overrideScore  Pass a score to use directly (e.g. after check-in).
 *                                     Pass null/undefined to compute from localStorage.
 */
export function animateBurnoutGauge(overrideScore = null) {
    const gauge   = document.querySelector('.gauge-progress');
    const valueEl = document.getElementById('burnout-value');
    const unitEl  = document.querySelector('.gauge-unit');

    if (!gauge) return;

    // New user — no data yet
    if (isNewUser()) {
        showGaugeEmptyState(valueEl, unitEl, gauge);
        return;
    }

    // Resolve the score to display
    let progress;
    if (overrideScore !== null && overrideScore !== undefined) {
        progress = overrideScore;
    } else {
        // Try the check-in derived score first, then fall back to the
        // onboarding baseline + time-of-day factor (original logic)
        const stored = localStorage.getItem('ms_burnout_score');
        if (stored !== null) {
            progress = parseInt(stored);
        } else {
            const base = parseInt(localStorage.getItem('baselineCognitiveLoad') ?? '40');
            const hour = new Date().getHours();
            let tf = 0;
            if      (hour >= 18)              tf =  25;
            else if (hour >= 14 && hour < 18) tf =  15;
            else if (hour < 10)               tf = -10;
            progress = Math.max(0, Math.min(100, base + tf));
        }
    }

    const circumference = 2 * Math.PI * 85; // ~534
    const offset        = circumference - (progress / 100) * circumference;

    gauge.style.stroke           = ''; // reset in case empty-state changed it
    gauge.style.strokeDasharray  = circumference;
    gauge.style.strokeDashoffset = circumference;

    setTimeout(() => { gauge.style.strokeDashoffset = offset; }, 100);

    if (valueEl) {
        // If coming from a check-in update, animate from current displayed value
        const currentVal = parseInt(valueEl.textContent) || 0;
        animateValue(valueEl, currentVal, progress, 1000);
    }
    if (unitEl) unitEl.textContent = '%';

    // Remove any empty-state hint that might still be showing
    document.querySelector('.gauge-empty-hint')?.remove();
}

function showGaugeEmptyState(valueEl, unitEl, gauge) {
    if (valueEl) valueEl.textContent = '--';
    if (unitEl)  unitEl.textContent  = '';

    const circumference            = 2 * Math.PI * 85;
    gauge.style.stroke             = 'rgba(255,255,255,0.08)';
    gauge.style.strokeDasharray    = circumference;
    gauge.style.strokeDashoffset   = circumference * 0.25;

    const gaugeCard = gauge.closest('.dash-card');
    if (gaugeCard && !gaugeCard.querySelector('.gauge-empty-hint')) {
        const hint = document.createElement('p');
        hint.className = 'gauge-empty-hint';
        hint.style.cssText = `
            text-align: center;
            font-size: 0.78rem;
            color: var(--text-tertiary);
            margin-top: 8px;
            line-height: 1.5;
        `;
        hint.innerHTML = 'Complete your first<br>daily check-in to see your score.';
        const gaugeEl = gaugeCard.querySelector('.burnout-gauge');
        if (gaugeEl) gaugeEl.insertAdjacentElement('afterend', hint);
    }
}

export function animateValue(el, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}