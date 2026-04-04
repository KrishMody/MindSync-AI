/* ============================== */
/* MindSync AI — Application Logic */
/* ============================== */

// ============================
// Page Navigation
// ============================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        // Update sidebar active states on app pages
        updateSidebarState(pageId);
        target.classList.add('active');
        
        // Init charts if going to dashboard or insights
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
    }
}

function updateSidebarState(pageId) {
    const pages = ['page-dashboard', 'page-coach', 'page-insights'];
    
    // Set active on the correct link in EVERY sidebar instance
    document.querySelectorAll('.sidebar-nav').forEach(nav => {
        nav.querySelectorAll('.sidebar-link').forEach((link, i) => {
            link.classList.remove('active');
            if (pages[i] === pageId) {
                link.classList.add('active');
            }
        });
    });
}

// ============================
// Auth Handlers
// ============================
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    if (pass.length < 8) {
        showToast('Password must be at least 8 characters.', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    setTimeout(() => {
        showToast('Login successful. Synchronizing neuro-patterns...', 'success');
        showPage('page-dashboard');
        btn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }, 1200);
}

function handleSignup(e) {
    e.preventDefault();
    const pass = document.getElementById('signup-password').value;
    
    if (pass.length < 8) {
        showToast('Password must be at least 8 characters for baseline security.', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>';
    setTimeout(() => {
        showToast('Profile initialized successfully.', 'success');
        showPage('page-onboarding');
        btn.innerHTML = 'Initialize Profile <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }, 1200);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '✓' : '⚠️'}
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8S4 3 8 3S15 8 15 8S12 13 8 13S1 8 1 8Z" stroke="currentColor" stroke-width="1.2"/><path d="M2 2L14 14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8S4 3 8 3S15 8 15 8S12 13 8 13S1 8 1 8Z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/></svg>';
    }
}

// ============================
// Onboarding Slider
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
    chip.addEventListener('click', () => {
        chip.classList.toggle('active');
    });
});

// Micro-action toggle
document.querySelectorAll('.micro-action').forEach(action => {
    action.addEventListener('click', () => {
        action.classList.toggle('completed');
        const svg = action.querySelector('.action-check svg');
        if (action.classList.contains('completed')) {
            svg.innerHTML = '<circle cx="7" cy="7" r="6" fill="#22C55E" stroke="#22C55E" stroke-width="1.2"/><path d="M4.5 7L6.5 9L9.5 5" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else {
            svg.innerHTML = '<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>';
        }
    });
});

// ============================
// Burnout Gauge Animation
// ============================
function animateBurnoutGauge() {
    const gauge = document.querySelector('.gauge-progress');
    if (!gauge) return;
    
    // Dynamic score: Onboarding slider + time of day factor
    let baseScore = localStorage.getItem('baselineCognitiveLoad') ? parseInt(localStorage.getItem('baselineCognitiveLoad')) : 40;
    const hour = new Date().getHours();
    
    // Add up to 20% stress based on late hours, or subtract depending on time
    let timeFactor = 0;
    if (hour >= 14 && hour < 18) timeFactor = 15;
    else if (hour >= 18) timeFactor = 25;
    else if (hour < 10) timeFactor = -10;
    
    let progress = Math.max(0, Math.min(100, baseScore + timeFactor));

    const circumference = 2 * Math.PI * 85; // ~534
    const offset = circumference - (progress / 100) * circumference;
    gauge.style.strokeDasharray = circumference;
    gauge.style.strokeDashoffset = circumference;
    setTimeout(() => {
        gauge.style.strokeDashoffset = offset;
    }, 100);

    // Animate number
    const valueEl = document.getElementById('burnout-value');
    if (valueEl) {
        animateValue(valueEl, 0, 70, 1500);
    }
}

function animateValue(el, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.floor(eased * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ============================
// Charts (Canvas-based)
// ============================
function initCognitiveChart() {
    const canvas = document.getElementById('cognitiveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    // Data — hourly cognitive load
    const data = [35, 50, 65, 80, 72, 55, 90, 78, 60, 45, 70, 85, 65, 50, 40, 55, 68, 82, 75, 58, 42, 55, 65, 48];
    const hours = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barW = chartW / data.length * 0.6;
    const gap = chartW / data.length;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
    }

    // Bars
    const maxVal = Math.max(...data);
    data.forEach((val, i) => {
        const x = padding.left + i * gap + (gap - barW) / 2;
        const barH = (val / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        // Create gradient for each bar
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        if (val > 75) {
            grad.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.2)');
        } else if (val > 50) {
            grad.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
            grad.addColorStop(1, 'rgba(124, 58, 237, 0.2)');
        } else {
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        roundedRect(ctx, x, y, barW, barH, 3);
        ctx.fill();
    });

    // X-axis labels (show every 4th)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    data.forEach((_, i) => {
        if (i % 4 === 0) {
            const x = padding.left + i * gap + gap / 2;
            ctx.fillText(hours[i] + ':00', x, h - 10);
        }
    });
}

function initPerformanceChart() {
    const canvas = document.getElementById('performanceCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    // Two datasets
    const performance = [65, 70, 68, 75, 72, 78, 80, 76, 82, 79, 85, 83, 78, 80, 76, 82, 85, 88, 84, 80, 75, 78, 82, 85, 80, 78, 75, 72, 76, 80];
    const cogLoad = [40, 45, 50, 42, 55, 48, 52, 60, 55, 50, 45, 48, 55, 60, 65, 58, 52, 48, 55, 62, 58, 52, 48, 45, 50, 55, 58, 62, 55, 50];

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
    }

    // Draw area chart for performance
    drawAreaLine(ctx, performance, padding, chartW, chartH, 'rgba(124, 58, 237, 0.8)', 'rgba(124, 58, 237, 0.05)', w, h);
    // Draw area chart for cognitive load
    drawAreaLine(ctx, cogLoad, padding, chartW, chartH, 'rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 0.05)', w, h);

    // X-axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, i) => {
        const x = padding.left + (i / (days.length - 1)) * chartW;
        ctx.fillText(day, x, h - 10);
    });
}

function initBaselineChart() {
    const canvas = document.getElementById('baselineCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    const focusHours = [5.2, 6.1, 4.8, 7.2, 6.5, 5.9, 7.8, 6.2, 5.5, 6.8, 7.1, 5.6, 6.3, 7.5, 5.8, 6.7, 7.3, 5.4, 6.9, 7.0, 5.7, 6.4, 7.2, 6.1, 5.3, 6.6, 7.4, 5.9, 6.8, 7.1];
    const stressLevel = [35, 42, 50, 38, 45, 52, 30, 48, 55, 40, 35, 50, 42, 32, 48, 38, 30, 52, 40, 35, 50, 45, 32, 42, 55, 38, 28, 45, 36, 33];

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
    }

    // Bars for focus hours
    const maxFocus = 10;
    const barW = (chartW / focusHours.length) * 0.5;
    const gap = chartW / focusHours.length;

    focusHours.forEach((val, i) => {
        const x = padding.left + i * gap + (gap - barW) / 2;
        const barH = (val / maxFocus) * chartH;
        const y = padding.top + chartH - barH;

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.6)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        roundedRect(ctx, x, y, barW, barH, 2);
        ctx.fill();
    });

    // Line for stress level
    const maxStress = 70;
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    stressLevel.forEach((val, i) => {
        const x = padding.left + i * gap + gap / 2;
        const y = padding.top + chartH - (val / maxStress) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots on stress line
    stressLevel.forEach((val, i) => {
        const x = padding.left + i * gap + gap / 2;
        const y = padding.top + chartH - (val / maxStress) * chartH;
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // X-axis — show every 5th day
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    focusHours.forEach((_, i) => {
        if (i % 5 === 0) {
            const x = padding.left + i * gap + gap / 2;
            ctx.fillText('Day ' + (i + 1), x, h - 10);
        }
    });
}

function drawAreaLine(ctx, data, padding, chartW, chartH, strokeColor, fillColor, w, h) {
    const maxVal = 100;
    const step = chartW / (data.length - 1);

    const points = data.map((val, i) => ({
        x: padding.left + i * step,
        y: padding.top + chartH - (val / maxVal) * chartH
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, fillColor.replace('0.05', '0.15'));
    grad.addColorStop(1, fillColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Use bezier curves for smooth line
    points.forEach((p, i) => {
        if (i === 0) {
            ctx.moveTo(p.x, p.y);
        } else {
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
    });
    ctx.stroke();
}

function roundedRect(ctx, x, y, width, height, radius) {
    if (height < radius * 2) radius = height / 2;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

// ============================
// AI Coach Chat
// ============================
const aiResponses = [
    {
        trigger: 'overwhelmed',
        response: `I understand you're feeling overwhelmed. Let's address this systematically. Your current cognitive load is at <strong>78%</strong> — above your optimal threshold.

<div class="protocol-card glass-card-inner" style="margin-top:12px">
<h4>🫁 Immediate Relief Protocol</h4>
<p class="protocol-card-desc">Try these grounding techniques:</p>
<div class="micro-actions">
<div class="micro-action"><span class="action-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/></svg></span><span>5-4-3-2-1 Sensory Grounding — 2 min</span></div>
<div class="micro-action"><span class="action-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/></svg></span><span>Diaphragmatic Breathing — 3 min</span></div>
</div></div>`
    },
    {
        trigger: 'focus',
        response: `Activating focus protocol. I'll configure your environment for deep work.

Based on your patterns, your peak focus window is between <strong>10:00 AM — 12:30 PM</strong>. Current cortisol levels suggest you're ready for focused work.

<div class="protocol-card glass-card-inner" style="margin-top:12px">
<h4>🎯 Focus Enhancement Protocol</h4>
<p class="protocol-card-desc">Recommended actions:</p>
<div class="micro-actions">
<div class="micro-action"><span class="action-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/></svg></span><span>Set 90-minute deep work timer</span></div>
<div class="micro-action"><span class="action-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/></svg></span><span>Enable notification blocking</span></div>
<div class="micro-action"><span class="action-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/></svg></span><span>Play binaural beats (40Hz gamma)</span></div>
</div></div>`
    },
    {
        trigger: 'progress',
        response: `Here's your weekly cognitive performance summary:

📈 <strong>Focus Score:</strong> 82/100 (+5 from last week)
🧠 <strong>Cognitive Resilience:</strong> High
😴 <strong>Sleep Quality:</strong> 7.2h avg (optimal)
💪 <strong>Burnout Risk:</strong> 30% (decreasing trend)

You've completed <strong>12 of 15</strong> recommended protocols this week. Your stress recovery time has improved by <strong>18%</strong>. Keep using the circadian alignment protocol — it's showing strong results.`
    },
    {
        trigger: 'cognitive score',
        response: `Your current Cognitive Performance Index (CPI):

🧠 <strong>Overall Score: 82/100</strong>

Breakdown:
• Focus Capacity: <strong>85/100</strong> ▲
• Memory Consolidation: <strong>78/100</strong> →
• Decision Quality: <strong>80/100</strong> ▲
• Emotional Regulation: <strong>84/100</strong> ▲
• Creative Thinking: <strong>79/100</strong> →

Your score has improved <strong>+7 points</strong> over the last 30 days. The Alpha Wave Modulation protocol is contributing most to your gains.`
    }
];

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';

    // Show typing indicator
    showTyping();

    // Generate response
    setTimeout(() => {
        removeTyping();
        const response = generateResponse(msg);
        addMessage(response, 'bot');
    }, 1500 + Math.random() * 1000);
}

function sendQuickAction(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    sendMessage();
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendMessage();
}

function addMessage(content, type) {
    const container = document.getElementById('chat-messages');
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${type}-message`;

    if (type === 'bot') {
        msgEl.innerHTML = `
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="12" stroke="url(#msgGrad)" stroke-width="2"/>
                    <circle cx="14" cy="14" r="5" fill="url(#msgGrad)"/>
                </svg>
            </div>
            <div class="message-content"><p>${content}</p></div>
        `;
    } else {
        msgEl.innerHTML = `
            <div class="message-avatar">KM</div>
            <div class="message-content"><p>${content}</p></div>
        `;
    }

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;

    // Re-bind micro-action clicks
    msgEl.querySelectorAll('.micro-action').forEach(action => {
        action.addEventListener('click', () => {
            action.classList.toggle('completed');
            const svg = action.querySelector('.action-check svg');
            if (action.classList.contains('completed')) {
                svg.innerHTML = '<circle cx="7" cy="7" r="6" fill="#22C55E" stroke="#22C55E" stroke-width="1.2"/><path d="M4.5 7L6.5 9L9.5 5" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
            } else {
                svg.innerHTML = '<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>';
            }
            saveChatHistory();
        });
    });
    
    saveChatHistory();
}

function showTyping() {
    const container = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.className = 'chat-message bot-message';
    typing.id = 'typing-msg';
    typing.innerHTML = `
        <div class="message-avatar">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="url(#msgGrad)" stroke-width="2"/>
                <circle cx="14" cy="14" r="5" fill="url(#msgGrad)"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typing-msg');
    if (typing) typing.remove();
}

function generateResponse(msg) {
    const lower = msg.toLowerCase();
    for (const r of aiResponses) {
        if (lower.includes(r.trigger)) {
            return r.response;
        }
    }
    // Default response
    return `I've analyzed your input. Based on your current cognitive state and behavioral patterns, here are my observations:

Your neural activity patterns suggest a <strong>moderate cognitive load</strong>. I recommend maintaining your current pace and taking brief recovery breaks every 90 minutes.

Would you like me to activate a specific protocol or provide more detailed analysis?`;
}

// ============================
// Tab Switching
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

    // Add keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ============================
// Window Resize Handler
// ============================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            if (activePage.id === 'page-dashboard') initCognitiveChart();
            if (activePage.id === 'page-insights') {
                initPerformanceChart();
                initBaselineChart();
            }
        }
    }, 250);
});

// ============================
// Daily Check-in & Storage
// ============================
function submitOnboarding() {
    const sliderVal = document.getElementById('cognitive-slider').value;
    localStorage.setItem('baselineCognitiveLoad', sliderVal);
    showToast('Profile configuration saved', 'success');
    showPage('page-dashboard');
}

function checkDailyModal() {
    const today = new Date().toDateString();
    if (!localStorage.getItem('dailyCheckIn_' + today)) {
        const modal = document.getElementById('daily-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}

function saveDailyCheckin() {
    const sleep = document.getElementById('checkin-sleep').value;
    const stress = document.getElementById('checkin-stress').value;
    const mood = document.getElementById('checkin-mood').value;
    
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

function loadChatHistory() {
    const history = localStorage.getItem('chatHistory');
    if (history) {
        const container = document.getElementById('chat-messages');
        const defaultMsg = container.querySelector('.bot-message');
        if (defaultMsg) defaultMsg.remove();
        
        container.innerHTML = history;
        
        container.querySelectorAll('.micro-action').forEach(action => {
            action.addEventListener('click', () => {
                action.classList.toggle('completed');
                const svg = action.querySelector('.action-check svg');
                if (action.classList.contains('completed')) {
                    svg.innerHTML = '<circle cx="7" cy="7" r="6" fill="#22C55E" stroke="#22C55E" stroke-width="1.2"/><path d="M4.5 7L6.5 9L9.5 5" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
                } else {
                    svg.innerHTML = '<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>';
                }
                saveChatHistory();
            });
        });
        
        container.scrollTop = container.scrollHeight;
    }
}

function saveChatHistory() {
    const container = document.getElementById('chat-messages');
    
    // Temporarily remove typing indicator if exists before saving
    const typing = document.getElementById('typing-msg');
    let typingHTML = null;
    if (typing) {
        typingHTML = typing.outerHTML;
        typing.remove();
    }
    
    localStorage.setItem('chatHistory', container.innerHTML);
    
    // Put typing indicator back
    if (typingHTML) {
        container.insertAdjacentHTML('beforeend', typingHTML);
    }
}

// ============================
// Initialize
// ============================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    loadChatHistory();
    
    // Smooth entry animation for landing
    const badge = document.getElementById('status-badge');
    if (badge) {
        badge.style.opacity = '0';
        setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transition = 'opacity 0.5s ease';
        }, 200);
    }
});
