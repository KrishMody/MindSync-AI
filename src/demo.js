// ============================
// Demo Account Utilities
// ============================

export const DEMO_EMAIL = 'demo@mindsync.ai';
export const DEMO_PASSWORD = 'pass@123';

const DEMO_PROFILE = {
    name: 'Demo User',
    initials: 'DU',
    email: DEMO_EMAIL,
};

export function isDemoCredentials(email, password) {
    return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function seedDemoUserData() {
    localStorage.setItem('baselineCognitiveLoad', '58');
    localStorage.setItem('currentUserName', DEMO_PROFILE.name);
    localStorage.setItem('currentUserInitials', DEMO_PROFILE.initials);
    localStorage.setItem('currentUserEmail', DEMO_PROFILE.email);
    localStorage.setItem('isDemoUser', 'true');

    seedCheckins();
    seedChatHistory();
    updateUserIdentityUI();
}

export function updateUserIdentityUI() {
    const name = localStorage.getItem('currentUserName') || 'Krish Mody';
    const initials = localStorage.getItem('currentUserInitials') || 'KM';

    document.querySelectorAll('.user-name').forEach((node) => {
        node.textContent = name;
    });

    document.querySelectorAll('.user-avatar').forEach((node) => {
        node.textContent = initials;
    });
}

function seedCheckins() {
    for (let dayOffset = 0; dayOffset < 35; dayOffset += 1) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);

        const stress = Math.max(24, Math.min(82, 46 + Math.round(Math.sin(dayOffset / 3) * 18) + (dayOffset % 5)));
        const sleep = Math.max(5.4, Math.min(8.6, 7.2 + Math.cos(dayOffset / 4) * 0.9 - ((dayOffset % 6) * 0.08)));
        const moods = ['good', 'neutral', 'good', 'neutral', 'bad', 'good'];
        const mood = moods[dayOffset % moods.length];

        localStorage.setItem(
            `dailyCheckIn_${date.toDateString()}`,
            JSON.stringify({
                sleep: sleep.toFixed(1),
                stress: String(stress),
                mood,
            })
        );
    }
}

function seedChatHistory() {
    const history = `
        <div class="chat-message bot-message">
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="12" stroke="url(#msgGrad)" stroke-width="2"></circle>
                    <circle cx="14" cy="14" r="5" fill="url(#msgGrad)"></circle>
                </svg>
            </div>
            <div class="message-content">
                <p>Welcome back, Demo User. I have synchronized 35 days of cognitive telemetry so you can explore the full MindSync experience.</p>
            </div>
        </div>
        <div class="chat-message user-message">
            <div class="message-avatar">DU</div>
            <div class="message-content">
                <p>Summarize my last month.</p>
            </div>
        </div>
        <div class="chat-message bot-message">
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="12" stroke="url(#msgGrad)" stroke-width="2"></circle>
                    <circle cx="14" cy="14" r="5" fill="url(#msgGrad)"></circle>
                </svg>
            </div>
            <div class="message-content">
                <p>Your 30-day trend shows resilient focus with moderate mid-week stress spikes. Recovery improved when sleep stayed above 7 hours for three consecutive nights.</p>
                <div class="protocol-card glass-card-inner" style="margin-top:12px">
                    <h4>30-Day Highlights</h4>
                    <p class="protocol-card-desc">Patterns worth exploring in the demo:</p>
                    <div class="micro-actions">
                        <div class="micro-action completed">
                            <span class="action-check">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" fill="#22C55E" stroke="#22C55E" stroke-width="1.2"></circle>
                                    <path d="M4.5 7L6.5 9L9.5 5" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                            <span>Stress peaks stayed below 80 for 26 of the last 30 days</span>
                        </div>
                        <div class="micro-action">
                            <span class="action-check">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"></circle>
                                </svg>
                            </span>
                            <span>Average sleep recovered to 7.1h after protocol adherence</span>
                        </div>
                        <div class="micro-action">
                            <span class="action-check">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"></circle>
                                </svg>
                            </span>
                            <span>Best focus window remains 9:30 AM to 12:00 PM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    localStorage.setItem('chatHistory', history.trim());
}
