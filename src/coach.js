// ============================
// AI Coach — Dual-Engine Chat (Claude → Gemini Fallback)
// ============================

// ── API Config ────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GEMINI_API_KEY    = import.meta.env.VITE_GEMINI_API_KEY    || '';
const GEMINI_MODEL      = 'gemini-2.0-flash';
const GEMINI_URL        = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Separate histories because the two APIs use different message formats
let claudeHistory = [];
let geminiHistory = [];

// ── System Prompt ─────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are MindSync, an advanced AI mental wellness coach embedded in the MindSync AI platform.

Your purpose: prevent burnout, reduce stress, and optimize cognitive performance for high-achieving users.

Core personality:
- Warm, empathetic, and science-backed — never cold or clinical
- Action-oriented: always give concrete, numbered steps
- Data-aware: reference the user's metrics (burnout score, sleep, stress) when relevant
- CBT and mindfulness informed — naturally weave in evidence-based techniques
- Concise by default (3-5 sentences) unless the user asks for detail

Formatting rules:
- Use **bold** for key terms, action items, and important numbers
- Use bullet points for lists of steps
- End every response with either a clear next action or a follow-up question
- Never use headers (###) — keep it conversational

Safety rules:
- Never diagnose medical or psychiatric conditions
- Always recommend professional help for severe symptoms
- If user expresses crisis or self-harm ideation, respond with warmth and provide crisis resources immediately`;

/**
 * Builds the system prompt by injecting live user context from localStorage.
 */
function buildSystemPrompt() {
    const name       = localStorage.getItem('currentUserName')     || 'User';
    const burnout    = localStorage.getItem('ms_burnout_score')    || localStorage.getItem('baselineCognitiveLoad') || '—';
    const sleep      = localStorage.getItem('ms_avg_sleep')        || '—';
    const stress     = localStorage.getItem('ms_stress')           || '—';
    const mood       = localStorage.getItem('ms_mood')             || '—';
    const isDemoUser = localStorage.getItem('isDemoUser') === 'true';

    const contextBlock = `

Current user profile:
- Name: ${name}
- Burnout risk score: ${burnout}%
- Last recorded sleep: ${sleep}h
- Last recorded stress: ${stress}/100
- Last recorded mood: ${mood}
${isDemoUser ? '- Note: This is a demo account with 35 days of seeded historical data.' : ''}

Personalize every response to this profile. Reference specific numbers when they add value.`;

    return BASE_SYSTEM_PROMPT + contextBlock;
}

// ── Claude API Call ───────────────────────────────────────────────────────────
async function callClaude(userMessage) {
    if (claudeHistory.length > 20) claudeHistory = claudeHistory.slice(-20);

    claudeHistory.push({ role: 'user', content: userMessage });

    const body = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: claudeHistory,
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        // Remove the message we just pushed so history stays clean for retry
        claudeHistory.pop();
        const errorData = await res.json().catch(() => ({}));
        console.error('Claude API Error:', errorData);
        throw new Error(errorData?.error?.message || `HTTP ${res.status}`);
    }

    const data  = await res.json();
    const reply = data.content
        ?.map(block => block.type === 'text' ? block.text : '')
        .filter(Boolean)
        .join('\n') || null;

    if (reply) {
        claudeHistory.push({ role: 'assistant', content: reply });
    }

    return reply;
}

// ── Gemini API Call (Fallback) ────────────────────────────────────────────────
async function callGemini(userMessage) {
    if (geminiHistory.length > 20) geminiHistory = geminiHistory.slice(-20);

    geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    const body = {
        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: geminiHistory,
        generationConfig: {
            temperature:     0.75,
            maxOutputTokens: 450,
            topP:            0.9,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
    };

    const res = await fetch(GEMINI_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });

    if (!res.ok) {
        geminiHistory.pop();
        const errorData = await res.json().catch(() => ({}));
        console.error('Gemini API Error:', errorData);
        throw new Error(errorData?.error?.message || `HTTP ${res.status}`);
    }

    const data  = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (reply) {
        geminiHistory.push({ role: 'model', parts: [{ text: reply }] });
    }

    return reply;
}

// ── Unified AI Call — Claude first, Gemini fallback ──────────────────────────
async function callAI(userMessage) {
    // Try Claude first if key exists
    if (ANTHROPIC_API_KEY) {
        try {
            const reply = await callClaude(userMessage);
            if (reply) return reply;
        } catch (claudeErr) {
            console.warn('Claude failed, falling back to Gemini:', claudeErr.message);
        }
    }

    // Fall back to Gemini
    if (GEMINI_API_KEY) {
        const reply = await callGemini(userMessage);
        if (reply) return reply;
    }

    // Both failed or no keys provided
    throw new Error('No AI engine available. Add VITE_ANTHROPIC_API_KEY or VITE_GEMINI_API_KEY to your .env file.');
}

// ── Format markdown → safe HTML ──────────────────────────────────────────────
function formatReply(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')   // **bold**
        .replace(/\*(.*?)\*/g, '<em>$1</em>')               // *italic*
        .replace(/^- (.+)$/gm, '<li>$1</li>')               // - list items
        .replace(/(<li>.*<\/li>)/gs, '<ul style="padding-left:20px;margin:8px 0">$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// ── Core chat functions ───────────────────────────────────────────────────────
export async function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg   = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';
    showTyping();

    // Disable input while waiting
    input.disabled = true;
    const sendBtn = document.querySelector('.btn-send');
    if (sendBtn) sendBtn.disabled = true;

    try {
        const rawReply = await callAI(msg);
        if (!rawReply) throw new Error('Empty response from AI');
        const reply = formatReply(rawReply);

        removeTyping();
        addMessage(reply, 'bot');

    } catch (err) {
        removeTyping();
        console.error('Coach Pipeline Error:', err);

        let errorMsg;
        if (err.message.includes('429') || err.message.toLowerCase().includes('rate')) {
            errorMsg = formatReply(`My neural processors are recalibrating due to high demand. Please wait a moment and try again.\n\n*Rate limit reached — try again in about a minute.*`);
        } else if (err.message.includes('401') || err.message.toLowerCase().includes('auth')) {
            errorMsg = formatReply(`**Authentication error.** Please check your API keys in the .env file.`);
        } else {
            errorMsg = formatReply(`Something went wrong connecting to the AI. Please try again.\n\n*Error: ${err.message}*`);
        }

        addMessage(errorMsg, 'bot');
    } finally {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

export function sendQuickAction(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    sendMessage();
}

export function handleChatKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage();
}

export function addMessage(content, type) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const msgEl    = document.createElement('div');
    msgEl.className = `chat-message ${type}-message`;
    const initials  = localStorage.getItem('currentUserInitials') || 'MS';

    if (type === 'bot') {
        msgEl.innerHTML = `
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <defs>
                        <linearGradient id="msgGrad" x1="0" y1="0" x2="28" y2="28">
                            <stop offset="0%" stop-color="#7C3AED"/>
                            <stop offset="100%" stop-color="#06B6D4"/>
                        </linearGradient>
                    </defs>
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

    bindMicroActions(msgEl);
    saveChatHistory();
}

export function bindMicroActions(root) {
    root.querySelectorAll('.micro-action').forEach(action => {
        action.addEventListener('click', () => {
            action.classList.toggle('completed');
            const svg = action.querySelector('.action-check svg');
            if (!svg) return;
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
    if (!container || document.getElementById('typing-msg')) return;

    const typing = document.createElement('div');
    typing.className = 'chat-message bot-message';
    typing.id        = 'typing-msg';
    typing.innerHTML = `
        <div class="message-avatar">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <defs>
                    <linearGradient id="msgGradTyping" x1="0" y1="0" x2="28" y2="28">
                        <stop offset="0%" stop-color="#7C3AED"/>
                        <stop offset="100%" stop-color="#06B6D4"/>
                    </linearGradient>
                </defs>
                <circle cx="14" cy="14" r="12" stroke="url(#msgGradTyping)" stroke-width="2"/>
                <circle cx="14" cy="14" r="5" fill="url(#msgGradTyping)"/>
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

export function saveChatHistory() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const typing     = document.getElementById('typing-msg');
    const typingHTML = typing ? typing.outerHTML : null;
    if (typing) typing.remove();

    localStorage.setItem('chatHistory', container.innerHTML);

    if (typingHTML) container.insertAdjacentHTML('beforeend', typingHTML);
}

export function loadChatHistory() {
    const history   = localStorage.getItem('chatHistory');
    const container = document.getElementById('chat-messages');
    if (!history || !container) return;

    const defaultMsg = container.querySelector('.bot-message');
    if (defaultMsg) defaultMsg.remove();

    container.innerHTML = history;
    bindMicroActions(container);
    container.scrollTop = container.scrollHeight;
}

export function clearChatHistory() {
    claudeHistory = [];
    geminiHistory = [];
    localStorage.removeItem('chatHistory');
    const container = document.getElementById('chat-messages');
    if (container) container.innerHTML = '';
}
