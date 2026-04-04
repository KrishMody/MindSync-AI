// ============================
// AI Coach — Chat Engine
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

Based on your patterns, your peak focus window is between <strong>10:00 AM — 12:30 PM</strong>.

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

You've completed <strong>12 of 15</strong> recommended protocols this week. Your stress recovery time has improved by <strong>18%</strong>.`
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

Your score has improved <strong>+7 points</strong> over the last 30 days.`
    }
];

export function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg   = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';
    showTyping();

    setTimeout(() => {
        removeTyping();
        const response = generateResponse(msg);
        addMessage(response, 'bot');
    }, 1500 + Math.random() * 1000);
}

export function sendQuickAction(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    sendMessage();
}

export function handleChatKey(e) {
    if (e.key === 'Enter') sendMessage();
}

export function addMessage(content, type) {
    const container = document.getElementById('chat-messages');
    const msgEl     = document.createElement('div');
    msgEl.className = `chat-message ${type}-message`;
    const initials  = localStorage.getItem('currentUserInitials') || 'KM';

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
            <div class="message-avatar">${initials}</div>
            <div class="message-content"><p>${content}</p></div>
        `;
    }

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;

    // Bind micro-action clicks
    bindMicroActions(msgEl);
    saveChatHistory();
}

export function bindMicroActions(root) {
    root.querySelectorAll('.micro-action').forEach(action => {
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
}

function showTyping() {
    const container = document.getElementById('chat-messages');
    const typing    = document.createElement('div');
    typing.className = 'chat-message bot-message';
    typing.id        = 'typing-msg';
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
    document.getElementById('typing-msg')?.remove();
}

function generateResponse(msg) {
    const lower = msg.toLowerCase();
    for (const r of aiResponses) {
        if (lower.includes(r.trigger)) return r.response;
    }
    return `I've analyzed your input. Based on your current cognitive state and behavioral patterns, here are my observations:

Your neural activity patterns suggest a <strong>moderate cognitive load</strong>. I recommend maintaining your current pace and taking brief recovery breaks every 90 minutes.

Would you like me to activate a specific protocol or provide more detailed analysis?`;
}

export function saveChatHistory() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Temporarily remove typing indicator
    const typing    = document.getElementById('typing-msg');
    const typingHTML = typing ? typing.outerHTML : null;
    if (typing) typing.remove();

    localStorage.setItem('chatHistory', container.innerHTML);

    if (typingHTML) container.insertAdjacentHTML('beforeend', typingHTML);
}

export function loadChatHistory() {
    const history   = localStorage.getItem('chatHistory');
    const container = document.getElementById('chat-messages');
    if (!history || !container) return;

    // Remove default welcome message
    const defaultMsg = container.querySelector('.bot-message');
    if (defaultMsg) defaultMsg.remove();

    container.innerHTML = history;
    bindMicroActions(container);
    container.scrollTop = container.scrollHeight;
}
