// ============================
// Daily Check-in & Onboarding
// ============================
import { showPage } from './router.js';
import { showToast } from './auth.js';

export function submitOnboarding() {
    const sliderVal = document.getElementById('cognitive-slider').value;
    localStorage.setItem('baselineCognitiveLoad', sliderVal);
    showToast('Profile configuration saved. Generating dashboard...', 'success');
    showPage('page-dashboard');
}

export function checkDailyModal() {
    const today = new Date().toDateString();
    if (!localStorage.getItem('dailyCheckIn_' + today)) {
        const modal = document.getElementById('daily-modal');
        if (modal) modal.style.display = 'flex';
    }
}

export function saveDailyCheckin() {
    const sleep  = document.getElementById('checkin-sleep').value;
    const stress = document.getElementById('checkin-stress').value;
    const mood   = document.getElementById('checkin-mood').value;

    if (!sleep) {
        showToast('Please enter sleep hours.', 'error');
        return;
    }

    const today = new Date().toDateString();
    localStorage.setItem('dailyCheckIn_' + today, JSON.stringify({ sleep, stress, mood }));

    showToast('Daily markers recorded. Algorithms updated.', 'success');

    const modal = document.getElementById('daily-modal');
    if (modal) modal.style.display = 'none';
}
