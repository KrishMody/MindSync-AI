// ============================
// User State — New vs Returning
// ============================

/**
 * Returns true if the user has no stored data yet.
 * A user is considered "new" if they have:
 *  - No baseline cognitive load (onboarding not completed, or just completed)
 *  - No daily check-ins recorded
 */
export function isNewUser() {
    const hasBaseline  = localStorage.getItem('baselineCognitiveLoad') !== null;
    const hasCheckins  = getCheckinCount() > 0;
    return !hasBaseline || !hasCheckins;
}

/**
 * Returns how many daily check-ins the user has recorded.
 */
export function getCheckinCount() {
    return Object.keys(localStorage)
        .filter(key => key.startsWith('dailyCheckIn_'))
        .length;
}

/**
 * Returns true if user has enough data to show meaningful charts.
 * We require at least 3 check-ins for trends to be meaningful.
 */
export function hasEnoughData(minCheckins = 3) {
    return getCheckinCount() >= minCheckins;
}
