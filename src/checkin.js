// ============================
// Daily Check-in & Onboarding
// ============================
import { showPage } from './router.js';
import { showToast } from './auth.js';
import { animateBurnoutGauge } from './dashboard.js';

// ── Onboarding ────────────────────────────────────────────────────────────────
export function submitOnboarding() {
    const sliderVal = document.getElementById('cognitive-slider').value;

    // Save baseline cognitive load
    localStorage.setItem('baselineCognitiveLoad', sliderVal);

    // Capture selected state chips
    const chips = [];
    document.querySelectorAll('.state-chips .chip.active').forEach(c => {
        chips.push(c.dataset.state || c.textContent.trim());
    });
    if (chips.length) localStorage.setItem('onboardingChips', JSON.stringify(chips));

    showToast('Profile configuration saved. Generating dashboard...', 'success');
    showPage('page-dashboard');
}

// ── Daily Check-in Modal ──────────────────────────────────────────────────────
export function checkDailyModal() {
    const today = new Date().toDateString();
    if (!localStorage.getItem('dailyCheckIn_' + today)) {
        const modal = document.getElementById('daily-modal');
        if (modal) modal.style.display = 'flex';
    }
}

export function saveDailyCheckin() {
    const sleepEl  = document.getElementById('checkin-sleep');
    const stressEl = document.getElementById('checkin-stress');
    const moodEl   = document.getElementById('checkin-mood');

    const sleep  = parseFloat(sleepEl?.value)  || 0;
    const stress = parseInt(stressEl?.value)   || 50;
    const mood   = moodEl?.value               || 'neutral';

    if (!sleep || sleep <= 0) {
        showToast('Please enter your sleep hours.', 'error');
        return;
    }

    const today = new Date().toDateString();
    localStorage.setItem('dailyCheckIn_' + today, JSON.stringify({ sleep, stress, mood }));

    // Persist individual signals for Gemini system prompt
    localStorage.setItem('ms_avg_sleep', sleep.toFixed(1));
    localStorage.setItem('ms_stress',    stress);
    localStorage.setItem('ms_mood',      mood);

    // Compute & persist burnout score
    const score = computeBurnoutScore({ sleep, stress, mood });
    localStorage.setItem('ms_burnout_score', score);

    // Update the gauge live if dashboard is visible
    animateBurnoutGauge(score);

    showToast('Daily markers recorded. AI Coach updated.', 'success');

    const modal = document.getElementById('daily-modal');
    if (modal) modal.style.display = 'none';
}

// ── Burnout Score Formula ─────────────────────────────────────────────────────
/**
 * Rule-based burnout risk score (0–100).
 * Replaces the hardcoded 70 used in the original dashboard.js.
 *
 * @param {{ sleep: number, stress: number, mood: string }} data
 * @returns {number} 0–100
 */
export function computeBurnoutScore({ sleep, stress, mood }) {
    let score = 40; // neutral baseline

    // ── Sleep contribution ──────────────────────────────────────────────────
    if      (sleep < 5)  score += 30;
    else if (sleep < 6)  score += 20;
    else if (sleep < 7)  score += 10;
    else if (sleep >= 8) score -= 8;

    // ── Stress contribution (0–100 scale) ──────────────────────────────────
    // Maps 0→-20, 50→0, 100→+20
    score += Math.round((stress - 50) * 0.4);

    // ── Mood contribution ──────────────────────────────────────────────────
    const moodDelta = { good: -10, productive: -10, neutral: 0, bad: +12, overwhelmed: +18 };
    score += moodDelta[mood] ?? 0;

    // ── Time-of-day nudge (same logic as original dashboard.js) ────────────
    const hour = new Date().getHours();
    if      (hour >= 18)              score += 8;
    else if (hour >= 14 && hour < 18) score += 4;
    else if (hour < 9)                score -= 4;

    return Math.max(0, Math.min(100, Math.round(score)));
}
