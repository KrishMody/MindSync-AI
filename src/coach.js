// ============================
// AI Coach — Claude + Gemini
// ============================
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const claude = CLAUDE_API_KEY ? new Anthropic({
    apiKey: CLAUDE_API_KEY,
    baseURL: '/api/claude',
    dangerouslyAllowBrowser: true,
}) : null;

// Separate message histories for each provider
let claudeHistory = [];
let geminiHistory = [];

function buildSystemPrompt() {
    const burnout = localStorage.getItem('ms_burnout_score') || localStorage.getItem('baselineCognitiveLoad') || 'unknown';
    const checkinKey = `dailyCheckIn_${new Date().toDateString()}`;
    const checkin = JSON.parse(localStorage.getItem(checkinKey) || '{}');
    const sleep  = checkin.sleep  || 'unknown';
    const stress = checkin.stress || 'unknown';
    const mood   = checkin.mood   || 'unknown';

    return `You are MindSync, an advanced AI mental wellness coach for high-performance individuals.
Your role is to help users manage cognitive load, prevent burnout, and optimize mental performance.

Current user context:
- Burnout/cognitive load score: ${burnout}/100
- Today's sleep: ${sleep} hours
- Today's stress level: ${stress}/100
- Today's mood: ${mood}

Guidelines:
- Be warm, evidence-based, and actionable. Give concrete micro-actions.
- Keep responses concise (2-4 short paragraphs max).
- Never diagnose psychiatric conditions. Direct crisis situations to professional help.
- Use CBT and mindfulness techniques where appropriate.
- Reference the user's actual data when relevant.`;
}

// ============================
// Claude (Anthropic SDK + streaming)
// ============================
async function callClaude(userMessage) {
    if (!claude) throw new Error('No Claude key');

    claudeHistory.push({ role: 'user', content: userMessage });
    if (claudeHistory.length > 20) claudeHistory = claudeHistory.slice(-20);

    // Create the bot message bubble immediately and stream into it
    const { el, contentEl } = createBotMessageEl();
    const container = document.getElementById('chat-messages');
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;

    let fullReply = '';

    try {
        const stream = claude.messages.stream({
            model: 'claude-haiku-4-5',
            max_tokens: 1000,
            system: buildSystemPrompt(),
            messages: claudeHistory,
        });

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                fullReply += event.delta.text;
                contentEl.innerHTML = `<p>${mdToHtml(fullReply)}</p>`;
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (err) {
        el.remove();
        if (err instanceof Anthropic.RateLimitError) throw new Error('rate_limit');
        if (err instanceof Anthropic.AuthenticationError) throw new Error('auth_error');
        throw err;
    }

    if (!fullReply) {
        el.remove();
        throw new Error('empty_response');
    }

    claudeHistory.push({ role: 'assistant', content: fullReply });
    bindMicroActions(el);
    saveChatHistory();
    return fullReply;
}

// ============================
// Gemini (browser SDK)
// ============================
async function callGemini(userMessage) {
    if (!GEMINI_API_KEY) throw new Error('No Gemini key');

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: buildSystemPrompt(),
        generationConfig: { maxOutputTokens: 800 },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
    });

    const history = geminiHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();
    if (!reply) throw new Error('empty_response');

    geminiHistory.push({ role: 'user', content: userMessage });
    geminiHistory.push({ role: 'assistant', content: reply });
    if (geminiHistory.length > 20) geminiHistory = geminiHistory.slice(-20);

    return reply;
}

// ============================
// Bot message element factory
// ============================
function createBotMessageEl() {
    const el = document.createElement('div');
    el.className = 'chat-message bot-message';
    el.innerHTML = `
        <div class="message-avatar">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <line x1="14" y1="14" x2="14" y2="4"  stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="23" y2="11" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="20" y2="22" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="8"  y2="22" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="5"  y2="11" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="4"  x2="23" y2="11" stroke="url(#msgGrad)" stroke-width="0.8" stroke-linecap="round" opacity="0.28"/>
                <line x1="23" y1="11" x2="20" y2="22" stroke="url(#msgGrad)" stroke-width="0.8" stroke-linecap="round" opacity="0.28"/>
                <line x1="5"  y1="11" x2="8"  y2="22" stroke="url(#msgGrad)" stroke-width="0.8" stroke-linecap="round" opacity="0.28"/>
                <circle cx="14" cy="4"  r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="23" cy="11" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="20" cy="22" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="8"  cy="22" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="5"  cy="11" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="14" cy="14" r="3.5" fill="url(#msgGrad)"/>
            </svg>
        </div>
        <div class="message-content"></div>
    `;
    return { el, contentEl: el.querySelector('.message-content') };
}

// ============================
// Markdown → safe HTML
// ============================
function mdToHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n+/g, '</p><p>')
        .replace(/^(?!<[uol])(.+)$/gm, (_, line) => line.startsWith('<') ? line : line)
        .trim();
}

// ============================
// Public API
// ============================
export async function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg   = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';
    input.disabled = true;

    try {
        // Try Claude (streaming), fall back to Gemini
        try {
            await callClaude(msg);
        } catch (claudeErr) {
            console.warn('Claude failed, falling back to Gemini:', claudeErr.message);
            showTyping();
            const reply = await callGemini(msg);
            removeTyping();
            addMessage(mdToHtml(reply), 'bot');
        }
    } catch (err) {
        removeTyping();
        console.error('AI error:', err);

        // Use contextual fallback for known quick actions; generic error otherwise
        const fallback = generateFallbackResponse(msg);
        if (fallback) {
            showTyping();
            await new Promise(r => setTimeout(r, 1200));
            removeTyping();
            addMessage(mdToHtml(fallback), 'bot');
        } else {
            let errMsg = "I'm having trouble connecting right now. Please try again in a moment.";
            if (err.message === 'rate_limit') errMsg = "I'm receiving too many requests right now — please wait a moment before trying again.";
            if (err.message === 'auth_error') errMsg = "There's a configuration issue on my end. Please contact support.";
            showTyping();
            await new Promise(r => setTimeout(r, 1200));
            removeTyping();
            addMessage(errMsg, 'bot');
        }
    } finally {
        input.disabled = false;
        input.focus();
    }
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
    const initials  = localStorage.getItem('currentUserInitials') || 'U';

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
                <line x1="14" y1="14" x2="14" y2="4"  stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="23" y2="11" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="20" y2="22" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="8"  y2="22" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="14" x2="5"  y2="11" stroke="url(#msgGrad)" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
                <line x1="14" y1="4"  x2="23" y2="11" stroke="url(#msgGrad)" stroke-width="0.8" stroke-linecap="round" opacity="0.28"/>
                <line x1="23" y1="11" x2="20" y2="22" stroke="url(#msgGrad)" stroke-width="0.8" stroke-linecap="round" opacity="0.28"/>
                <line x1="5"  y1="11" x2="8"  y2="22" stroke="url(#msgGrad)" stroke-width="0.8" stroke-linecap="round" opacity="0.28"/>
                <circle cx="14" cy="4"  r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="23" cy="11" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="20" cy="22" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="8"  cy="22" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="5"  cy="11" r="2"   fill="url(#msgGrad)" opacity="0.8"/>
                <circle cx="14" cy="14" r="3.5" fill="url(#msgGrad)"/>
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
    const typing = document.getElementById('typing-msg');
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

// ============================
// Offline / Fallback Responses
// ============================
function getLiveData() {
    const checkinKey = `dailyCheckIn_${new Date().toDateString()}`;
    const checkin    = JSON.parse(localStorage.getItem(checkinKey) || '{}');
    const sleep   = checkin.sleep  ? parseFloat(checkin.sleep)    : null;
    const stress  = checkin.stress ? parseInt(checkin.stress, 10) : null;
    const mood    = checkin.mood   || null;
    const burnout = parseInt(
        localStorage.getItem('ms_burnout_score') ||
        localStorage.getItem('baselineCognitiveLoad') || '0', 10
    ) || null;
    return { sleep, stress, mood, burnout };
}

function getRecentCheckins(n) {
    const today = new Date();
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const raw = localStorage.getItem(`dailyCheckIn_${d.toDateString()}`);
        if (!raw) continue;
        try {
            const p = JSON.parse(raw);
            result.push({
                sleep:  parseFloat(p.sleep)    || 0,
                stress: parseInt(p.stress, 10) || 0,
                mood:   p.mood || 'neutral',
                day:    d.toLocaleDateString('en-US', { weekday: 'short' }),
            });
        } catch { /* skip */ }
    }
    return result;
}

function avg(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

// Pick a variant based on current hour so it rotates but stays stable per session
function pick(arr) {
    return arr[Math.floor(Date.now() / 3600000) % arr.length];
}

function fallbackOverwhelmed({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const hasSleep  = sleep  !== null;
    const highStress = hasStress && stress > 70;
    const lowSleep   = hasSleep  && sleep  < 6.5;
    const stressStr  = hasStress ? `**${stress}%**` : 'elevated';
    const sleepStr   = hasSleep  ? `**${sleep} hours**` : 'unknown';

    if (highStress && lowSleep) {
        return pick([
            `Your data explains exactly what you're feeling — stress at ${stressStr} and only ${sleepStr} of sleep is a compounding load. Together they shrink your cognitive buffer to almost nothing.\n\nTwo things to do right now:\n- **Box breathe:** inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times.\n- **Stop and list:** write every open task on paper, then pick just one to act on.\n\nThe **Limbic Calm** protocol in the Protocols section is purpose-built for this state — it targets both stress regulation and nervous system reset.`,
            `${stressStr} stress and ${sleepStr} of sleep — that combination is working against you hard right now. This isn't a character flaw, it's a system under excess load.\n\nImmediate step: **step away from your screen for 5 minutes.** Physical distance resets the prefrontal cortex faster than anything else.\n\nThen run through the **4-7-8 Breathing** protocol — one session can drop perceived stress noticeably within minutes.`,
        ]);
    }
    if (highStress) {
        return pick([
            `Your stress is at ${stressStr} today — that's in the high range. Overwhelm at this level means your working memory is saturated, not that you're incapable.\n\nTry this now: exhale fully, then **breathe in for 4 counts, hold 4, out for 4**. Two or three rounds activates your parasympathetic nervous system and creates a gap between stimulus and reaction.\n\nThe **Box Breathing** protocol in the Protocols section walks you through a full 5-minute reset.`,
            `At ${stressStr} stress, your nervous system is in a high-alert state — it's amplifying everything. The overwhelmed feeling is real, but it's your brain over-indexing on threat signals.\n\nOne effective pattern interrupt: **write down the single most important thing you need to do next.** Just one. This collapses the overwhelm into something actionable.\n\nPair that with the **Limbic Calm** protocol for a full nervous system reset.`,
        ]);
    }
    if (lowSleep) {
        return pick([
            `You got ${sleepStr} of sleep last night — below the recovery threshold. Overwhelm with low sleep is often exhaustion wearing an anxiety costume.\n\nBefore pushing through: a **20-minute NSDR rest** (lie down, eyes closed, slow breathing — no actual sleep needed) restores roughly 30–40% of the cognitive clarity that sleep would have provided.\n\nYou'll find the **NSDR Protocol** in the Protocols section.`,
            `${sleepStr} of sleep significantly reduces your stress tolerance — the same situations feel twice as hard. Your nervous system is running on a depleted buffer.\n\nMost useful right now: **don't try to solve the overwhelm, solve the sleep debt first.** A **20-minute Power Nap** or NSDR session will reset your baseline more than any productivity technique.`,
        ]);
    }
    const moodNote = mood ? ` Your mood check-in shows **${mood}**.` : '';
    return pick([
        `Feeling overwhelmed is a valid signal — it usually means your working memory is saturated.${moodNote}\n\nOne immediate technique: **write down everything on your mind** as a list. Externalising it reduces cognitive load instantly. Then pick just **one thing** to act on next.\n\nThe **Focus Anchor** protocol in the Protocols section is designed for exactly this state.`,
        `Overwhelm often means too many open loops running in your head, not that the work is impossible.${moodNote}\n\nTry a **brain dump**: set a 5-minute timer and write everything you're worried about, no filtering. Once it's on paper, it stops looping. Then identify the one action that would make the biggest dent.\n\nThe **Neural Priming** protocol can help you re-enter a focused state after.`,
    ]);
}

function fallbackFocus({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const hasSleep  = sleep  !== null;
    const lowSleep  = hasSleep  && sleep  < 6.5;
    const highStress = hasStress && stress > 65;
    const sleepStr  = hasSleep  ? `**${sleep} hours**` : 'below average';
    const stressStr = hasStress ? `**${stress}%**` : 'moderate';

    if (lowSleep) {
        return pick([
            `You're working with ${sleepStr} of sleep — focus will feel harder because your prefrontal cortex is running at reduced capacity. That's the biology, not a focus problem.\n\nBest approach right now: use **shorter focused sprints** (15–20 minutes) instead of trying to hold 90-minute blocks. Your focus bandwidth is smaller today — work with it, not against it.\n\nThe **Cold Water Reset** protocol (3 mins) can give you a quick alertness spike before each sprint.`,
            `${sleepStr} of sleep reduces your working memory capacity and makes distractions feel magnetic. Pushing for long focus blocks right now will backfire.\n\nInstead: **25-minute Pomodoros with strict 5-minute breaks.** Matching the work interval to your current capacity is more effective than forcing a longer session.\n\nThe **Neural Priming** protocol is worth running before you start — it fires up dopamine pathways in 10 minutes.`,
        ]);
    }
    if (highStress) {
        return pick([
            `Your stress is at ${stressStr} — at this level the brain's threat-detection systems are competing with your focus network. They share the same cognitive resources.\n\nThe most effective sequence: **5 minutes of breathing first, then focus.** Trying to focus over a stressed nervous system is fighting an uphill battle.\n\nRun the **Box Breathing** or **4-7-8 Breathing** protocol first, then use **Focus Anchor** to lock in on one task.`,
            `At ${stressStr} stress, your attention will keep getting pulled toward concerns and threat signals. That's a feature of your nervous system, not a flaw.\n\nBefore trying to focus: **write down the thing that's worrying you most** and note one small step you can take later. This closes the open loop that's stealing attention.\n\nThen try the **Alpha Wave Tuning** protocol — it's specifically designed to shift your brain into calm-focused mode.`,
        ]);
    }
    const moodNote = mood && mood !== 'neutral' ? ` You checked in as feeling **${mood}** today.` : '';
    return pick([
        `For a focused state right now:${moodNote}\n\n- **Kill distractions first:** phone face down, all non-essential tabs closed.\n- **Write your one target task** on a sticky note where you can see it.\n- **Start a 25-minute timer** and begin immediately — don't wait to feel ready.\n\nThe **Neural Priming** protocol in the Protocols section can help you ramp up focus fast. The **Focus Anchor** is ideal if your mind keeps wandering mid-session.`,
        `Best conditions for focus right now:${moodNote}\n\n- **Work in a single window.** Multi-tasking kills deep focus — one tab, one task.\n- **Set a specific output goal** ("finish the intro paragraph", not "work on the essay").\n- **Use a 20-minute sprint** to build momentum — extend once you're in flow.\n\nThe **Alpha Wave Tuning** protocol is worth trying before a long session — ambient sound and breathing shift your brain into a productive state within 15 minutes.`,
    ]);
}

function fallbackProgress(history) {
    if (history.length < 2) {
        return `I don't have enough check-in data to summarise your progress yet — you've logged **${history.length} day${history.length !== 1 ? 's' : ''}** so far.\n\nComplete your daily check-in each morning to unlock a full progress summary. The more consistently you log, the more accurate the patterns become.`;
    }

    const stresses = history.map(d => d.stress);
    const sleeps   = history.map(d => d.sleep);
    const avgS  = avg(stresses);
    const avgSl = avg(sleeps);

    const half        = Math.max(1, Math.floor(history.length / 2));
    const earlyStress = avg(stresses.slice(0, half));
    const lateStress  = avg(stresses.slice(half));
    const stressTrend = lateStress - earlyStress; // + = rising

    const moodCounts = history.reduce((acc, d) => { acc[d.mood] = (acc[d.mood] || 0) + 1; return acc; }, {});
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    const trendLabel = stressTrend > 8 ? '📈 trending up' : stressTrend < -8 ? '📉 trending down (positive)' : '➡ stable';
    const sleepNote  = avgSl !== null ? (avgSl >= 7 ? `**${avgSl.toFixed(1)} hrs** (healthy range)` : `**${avgSl.toFixed(1)} hrs** (below the 7-hour threshold)`) : 'not logged';
    const stressNote = avgS !== null  ? `**${Math.round(avgS)}%** — ${trendLabel}` : 'not logged';

    return pick([
        `Here's your progress over the last **${history.length} days**:\n\n- **Avg stress level:** ${stressNote}\n- **Avg sleep:** ${sleepNote}\n- **Most common mood:** ${dominantMood}\n\n${stressTrend > 8 ? 'Your stress has been rising — this is worth paying attention to before it compounds.' : stressTrend < -8 ? 'Your stress has been declining — your recovery strategy is working.' : 'Your stress has been stable.'} ${avgSl !== null && avgSl < 7 ? 'Sleep is your biggest lever right now — even 30 extra minutes per night compounds quickly.' : 'Sleep looks consistent, which is the foundation for everything else.'}\n\nFull trend graphs are on the **Insights** page.`,
        `**${history.length}-day summary:**\n\n- **Stress:** ${stressNote}\n- **Sleep avg:** ${sleepNote}\n- **Dominant mood:** ${dominantMood}\n\n${avgS !== null && avgS > 70 ? 'Your average stress is in the elevated range — the Insights page will show you exactly when the spikes occur.' : avgS !== null && avgS < 45 ? 'Your average stress is in a healthy range — good baseline to maintain.' : 'Stress is in the moderate range — manageable but worth monitoring.'}\n\nCheck the **Insights** page for the full 30-day cognitive baseline and the performance vs. cognitive load chart.`,
    ]);
}

function fallbackCognitiveScore({ stress, sleep, mood, burnout }) {
    const hasScore = burnout !== null && burnout > 0;
    const score    = hasScore ? burnout : (stress !== null ? Math.round(stress * 0.8 + (sleep !== null ? Math.max(0, (7 - sleep) * 5) : 0)) : null);
    const scoreStr = score !== null ? `**${score}/100**` : '**not yet calculated**';

    const state = score === null ? 'unknown'
        : score > 80 ? 'critical'
        : score > 65 ? 'elevated'
        : score > 45 ? 'moderate'
        : 'healthy';

    const stateDescriptions = {
        critical: 'You are in a high-load state — your cognitive reserves are significantly depleted.',
        elevated: 'Your cognitive load is elevated. You have capacity, but it is being stretched.',
        moderate: 'Moderate load — sustainable for now, but worth monitoring.',
        healthy:  'Your cognitive system is in a healthy range. Good time to build or deepen focus.',
        unknown:  'No baseline score calculated yet — complete a daily check-in to generate your score.',
    };

    const inputs = [];
    if (stress !== null) inputs.push(`stress **${stress}%**`);
    if (sleep  !== null) inputs.push(`sleep **${sleep} hrs**`);
    if (mood   !== null) inputs.push(`mood **${mood}**`);
    const inputLine = inputs.length ? `\nToday's inputs: ${inputs.join(', ')}.` : '';

    return pick([
        `Your current cognitive load score is ${scoreStr}.${inputLine}\n\n${stateDescriptions[state]}\n\n${state === 'critical' || state === 'elevated' ? 'Priority actions: protect your next sleep window, reduce decision load where possible, and run a short breathing protocol before your next work block.' : state === 'moderate' ? 'You\'re in a workable zone. Maintaining your sleep consistency and stress practices will keep you here.' : 'This is the baseline to protect. Log your check-ins daily to catch early drift before it compounds.'}\n\nFull historical trends are on the **Insights** page.`,
        `Cognitive load score: ${scoreStr}.${inputLine}\n\n${stateDescriptions[state]}\n\n${state === 'critical' ? 'At this level, trying to push through with more effort typically makes performance worse, not better. A structured recovery protocol will restore more capacity than grinding.' : state === 'elevated' ? 'The Protocols section has several tools that directly target this range — **Box Breathing** and **Limbic Calm** are the most relevant right now.' : state === 'moderate' ? 'A well-targeted focus protocol can shift you from moderate into the optimal zone. Check the Protocols section for options.' : 'This is a great time to consolidate — the **Synaptic Link** memory protocol works best when your baseline is clean.'}\n\nYour score history lives on the **Insights** page.`,
    ]);
}

function generateFallbackResponse(userMessage) {
    const m = userMessage.toLowerCase();
    const d = getLiveData();

    if (m.includes('overwhelmed')) return fallbackOverwhelmed(d);
    if (m.includes('focus'))       return fallbackFocus(d);
    if (m.includes('progress') || m.includes('summarize') || m.includes('summarise')) {
        return fallbackProgress(getRecentCheckins(7));
    }
    if (m.includes('cognitive') || m.includes('score')) return fallbackCognitiveScore(d);

    // Not a known quick action — no contextual fallback
    return null;
}
