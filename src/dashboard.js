// ============================
// Dashboard — Burnout Gauge
// ============================
import { isNewUser } from './userState.js';

export function animateBurnoutGauge() {
    const gauge    = document.querySelector('.gauge-progress');
    const valueEl  = document.getElementById('burnout-value');
    const unitEl   = document.querySelector('.gauge-unit');

    if (!gauge) return;

    // New user — no data yet
    if (isNewUser()) {
        showGaugeEmptyState(valueEl, unitEl, gauge);
        return;
    }

    // Returning user — dynamic score
    const baseScore  = parseInt(localStorage.getItem('baselineCognitiveLoad') ?? '40');
    const hour       = new Date().getHours();

    let timeFactor = 0;
    if      (hour >= 14 && hour < 18) timeFactor =  15;
    else if (hour >= 18)               timeFactor =  25;
    else if (hour < 10)                timeFactor = -10;

    const progress      = Math.max(0, Math.min(100, baseScore + timeFactor));
    const circumference = 2 * Math.PI * 85; // ~534
    const offset        = circumference - (progress / 100) * circumference;

    gauge.style.strokeDasharray  = circumference;
    gauge.style.strokeDashoffset = circumference;
    setTimeout(() => { gauge.style.strokeDashoffset = offset; }, 100);

    if (valueEl) animateValue(valueEl, 0, progress, 1500);
}

function showGaugeEmptyState(valueEl, unitEl, gauge) {
    // Show dashes instead of a score
    if (valueEl) valueEl.textContent = '--';
    if (unitEl)  unitEl.textContent  = '';

    // Draw a flat grey arc
    const circumference            = 2 * Math.PI * 85;
    gauge.style.stroke             = 'rgba(255,255,255,0.08)';
    gauge.style.strokeDasharray    = circumference;
    gauge.style.strokeDashoffset   = circumference * 0.25; // small grey arc

    // Inject a small prompt below the gauge if not already there
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
        const eased    = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.floor(eased * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
