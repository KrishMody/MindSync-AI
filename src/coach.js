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

function fallbackAnxious({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const hasSleep  = sleep  !== null;
    const highStress = hasStress && stress > 60;
    const stressStr  = hasStress ? `**${stress}%**` : 'elevated';
    const sleepStr   = hasSleep  ? `**${sleep} hours**` : 'unknown';

    if (highStress) {
        return pick([
            `Anxiety and a stress level of ${stressStr} often feed each other — the stress activates your threat-detection circuits, which generates more anxious thoughts, which raises stress further.\n\nBreak the loop with your body first:\n- **Physiological sigh:** two quick inhales through the nose, then one long exhale through the mouth. This is the fastest known way to calm the autonomic nervous system.\n- **Ground yourself:** name 5 things you can see, 4 you can touch, 3 you can hear. This pulls your attention out of future-worry and into the present.\n\nThe **Limbic Calm** protocol is designed specifically for this state.`,
            `At ${stressStr} stress, anxiety is your nervous system doing exactly what it's designed to do — scanning for threats. The problem is it can't tell the difference between a deadline and a predator.\n\n**Immediate reset:** splash cold water on your face or hold ice cubes for 30 seconds. This triggers the dive reflex and forces your vagus nerve to slow everything down.\n\nFollow up with the **4-7-8 Breathing** protocol — it directly counteracts the fight-or-flight response.`,
        ]);
    }
    const moodNote = mood ? ` You're feeling **${mood}** today.` : '';
    return pick([
        `Anxiety is your brain running simulations of things that haven't happened yet — it's exhausting because you're solving problems that may never arrive.${moodNote}\n\nTry this: **set a 10-minute worry window.** Write down every anxious thought for 10 minutes, then close the notebook and move on. This externalises the loops so they stop spinning in your head.\n\nThe **Box Breathing** protocol is excellent for bringing your baseline down before or after the worry window.`,
        `When anxiety shows up, it usually means your mind is stuck in future-mode — running what-if scenarios on repeat.${moodNote}\n\n**Grounding technique:** press your feet firmly into the floor, feel the pressure, and take 3 slow breaths. This activates your parasympathetic nervous system and anchors you in the present moment.\n\nThe **Alpha Wave Tuning** protocol can help shift your brain out of the anxious frequency range.`,
    ]);
}

function fallbackSad({ stress, sleep, mood }) {
    const hasSleep  = sleep !== null;
    const lowSleep  = hasSleep && sleep < 6.5;
    const sleepStr  = hasSleep ? `**${sleep} hours**` : 'unknown';

    if (lowSleep) {
        return pick([
            `Sadness and ${sleepStr} of sleep are closely linked — sleep deprivation reduces serotonin activity and makes emotional regulation significantly harder. What you're feeling may be partly neurochemical.\n\n**Don't try to think your way out of it right now.** Instead:\n- **Move your body** for even 10 minutes — a walk outside is ideal. Movement increases BDNF and serotonin.\n- **Protect tonight's sleep** — set a firm wind-down alarm 30 minutes before bed.\n\nThe **NSDR Protocol** can help restore some of the emotional resilience that sleep debt takes away.`,
            `${sleepStr} of sleep changes your brain's emotional processing — the amygdala becomes more reactive while the prefrontal cortex (your rational brain) goes quieter. Sadness gets amplified.\n\nMost important thing right now: **be gentle with yourself.** This is biology, not weakness. A 20-minute rest with the **NSDR Protocol** can meaningfully improve your emotional baseline even without actual sleep.`,
        ]);
    }
    const moodNote = mood ? ` Your check-in mood is **${mood}**.` : '';
    return pick([
        `It's okay to feel sad — it's a signal worth listening to, not something to push away.${moodNote}\n\n**Three things that help:**\n- **Acknowledge it out loud** or write it down: "I'm feeling sad right now." Naming emotions reduces their intensity (this is called affect labelling).\n- **Do one small kind thing for yourself** — make tea, step outside, listen to a song you love.\n- **Connect with someone** — even a brief text to a friend activates social bonding circuits.\n\nIf this feeling persists for more than two weeks, consider reaching out to a mental health professional.`,
        `Sadness is your mind telling you something matters — it deserves attention, not dismissal.${moodNote}\n\n**Gentle reset:** go outside if you can. Sunlight exposure — even on a cloudy day — triggers serotonin production. Combine it with a slow 10-minute walk and you're giving your brain three inputs it needs: light, movement, and change of environment.\n\nIf you're feeling persistently low, the **Limbic Calm** protocol can help regulate your emotional baseline. And remember — reaching out to a professional is a sign of strength, not weakness.`,
    ]);
}

function fallbackStress({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const hasSleep  = sleep  !== null;
    const stressStr = hasStress ? `**${stress}%**` : 'unknown';
    const sleepStr  = hasSleep  ? `**${sleep} hours**` : 'unknown';
    const highStress = hasStress && stress > 70;

    if (highStress) {
        return pick([
            `Your stress is at ${stressStr} — that's in the high range. At this level, cortisol is actively impairing your decision-making and memory consolidation.\n\n**Immediate actions:**\n- **Step away from the stressor** for 5 minutes. Physical distance creates psychological distance.\n- **Exhale longer than you inhale** — try 4 counts in, 7 counts out. This directly activates your calming nervous system.\n- **Identify the single biggest stressor** and ask: "What's the smallest action I can take on this right now?"\n\nThe **Limbic Calm** protocol targets exactly this stress range.`,
            `${stressStr} stress means your system is running hot. Cortisol at this level narrows your thinking — you'll fixate on problems and miss solutions.\n\n**Pattern interrupt:** change your physical state. Stand up, stretch, splash cold water on your wrists. Your body leads your mind, not the other way around.\n\nThen: **write down your top 3 stressors and rate each 1–10.** Often one is driving everything else. Target that one first.\n\nThe **Box Breathing** protocol is the fastest way to bring your baseline down.`,
        ]);
    }
    const moodNote = mood ? ` Your mood today: **${mood}**.` : '';
    return pick([
        `Stress is your current reading at ${stressStr}.${moodNote}\n\nSome stress is productive — it sharpens focus and drives action. The key is keeping it in the optimal zone.\n\n**Quick calibration:**\n- If you can name the source clearly → make a plan and take one action.\n- If it feels diffuse and unclear → do a 5-minute brain dump to externalise it.\n- If it's physical (tight shoulders, jaw clenching) → your body needs a reset first.\n\nThe **Focus Anchor** protocol helps channel moderate stress into productive energy.`,
        `Stress at ${stressStr} is manageable but worth addressing before it compounds.${moodNote}\n\n**The 3-3-3 rule:** name 3 things you see, 3 sounds you hear, move 3 parts of your body. This takes 30 seconds and interrupts the stress loop.\n\nThen ask yourself: "Is this stress about something I can control?" If yes, identify the next action. If no, acknowledge it and redirect your energy.\n\nThe **Neural Priming** protocol can help you shift from stressed to focused.`,
    ]);
}

function fallbackSleep({ stress, sleep, mood }) {
    const hasSleep = sleep !== null;
    const sleepStr = hasSleep ? `**${sleep} hours**` : 'unknown';
    const lowSleep = hasSleep && sleep < 6.5;

    if (lowSleep) {
        return pick([
            `You logged ${sleepStr} last night — below the 7-hour recovery threshold. Sleep debt compounds: even one night under 6 hours reduces cognitive performance by ~25%.\n\n**Damage control for today:**\n- **20-minute NSDR or power nap** between 1–3 PM (your natural dip). Set an alarm — longer will make you groggy.\n- **No caffeine after 2 PM** — it has a 6-hour half-life and will steal from tonight's sleep too.\n- **Protect tonight:** set a wind-down alarm 45 minutes before bed. No screens, dim lights.\n\nThe **NSDR Protocol** in the Protocols section is your best tool right now.`,
            `${sleepStr} of sleep means your prefrontal cortex is running at reduced capacity — expect harder focus, shorter patience, and stronger emotional reactions today.\n\n**Priority: don't dig the hole deeper.** Tonight's sleep matters more than today's productivity.\n\n**Sleep hygiene checklist:**\n- Room temperature: 65–68°F / 18–20°C\n- No screens 30 min before bed (or use night mode)\n- No large meals within 2 hours of sleep\n- Consider a 10-minute breathing protocol before bed\n\nThe **4-7-8 Breathing** protocol is clinically effective as a pre-sleep routine.`,
        ]);
    }
    const moodNote = mood ? ` You're feeling **${mood}** today.` : '';
    return pick([
        `Sleep is the foundation of everything — mood, focus, stress tolerance, and cognitive performance all depend on it.${moodNote}\n\n**Optimising your sleep:**\n- **Consistency beats duration** — same bedtime ±30 min, even on weekends.\n- **Morning sunlight** within 30 minutes of waking sets your circadian clock.\n- **Evening wind-down ritual** signals your brain to start producing melatonin.\n\nIf you're struggling to fall asleep, the **NSDR Protocol** trains your nervous system to downshift on command.`,
        `Good sleep architecture is the single highest-leverage habit for mental performance.${moodNote}\n\n**Quick wins:**\n- **Cut screen time 30 min before bed** — blue light suppresses melatonin by up to 50%.\n- **Keep your room cool and dark** — your core temperature needs to drop for deep sleep.\n- **Avoid alcohol before bed** — it fragments REM sleep even if it helps you fall asleep faster.\n\nThe **4-7-8 Breathing** protocol works as a reliable sleep onset tool — try it for 3 nights to build the association.`,
    ]);
}

function fallbackMotivation({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const hasSleep  = sleep  !== null;
    const highStress = hasStress && stress > 65;
    const lowSleep   = hasSleep  && sleep  < 6.5;

    if (highStress || lowSleep) {
        const reasons = [];
        if (highStress) reasons.push(`stress at **${stress}%**`);
        if (lowSleep)   reasons.push(`only **${sleep} hours** of sleep`);
        return pick([
            `Low motivation with ${reasons.join(' and ')} isn't a willpower problem — it's a resource problem. Your brain is conserving energy because it's running low.\n\n**Don't fight it. Work with it:**\n- **Shrink the task:** instead of "finish the project," commit to just 5 minutes. Starting is the hardest part — momentum often follows.\n- **Remove friction:** open the document, put your phone in another room, set a timer. Make starting easier than not starting.\n- **Reward proximity:** place something you enjoy right after the task — your brain needs a reason to engage.\n\nFix the underlying resource issue first — the **NSDR Protocol** can help restore baseline energy.`,
            `Your body is telling you it doesn't have the resources for high motivation right now — ${reasons.join(' and ')} depletes dopamine, which is literally the motivation molecule.\n\n**Hack the system:**\n- **2-minute rule:** if a task takes less than 2 minutes, do it now. Small completions generate dopamine.\n- **Body first:** 10 jumping jacks or a cold face splash. Physical activation bootstraps mental activation.\n- **Lower the bar:** "good enough" output today is better than perfect output never.\n\nAddress the root cause — sleep and stress recovery will bring motivation back naturally.`,
        ]);
    }
    const moodNote = mood ? ` Your mood check-in shows **${mood}**.` : '';
    return pick([
        `Motivation isn't something you wait for — it's something that follows action. The research is clear: **action creates motivation, not the other way around.**${moodNote}\n\n**Getting unstuck:**\n- **Commit to just 2 minutes** of the task you're avoiding. Set a timer. You almost always continue past it.\n- **Change your environment** — move to a different room, a cafe, or just rearrange your desk. Novelty activates dopamine.\n- **Connect to the why** — write one sentence about why this task matters to you, not to anyone else.\n\nThe **Neural Priming** protocol is designed to kickstart your dopamine system before a work session.`,
        `Lack of motivation often means the task feels too big, too vague, or disconnected from what you care about.${moodNote}\n\n**Try this sequence:**\n1. **Define done** — what does "finished" look like? Be specific.\n2. **Find the first physical action** — not "work on report" but "open the document and write the first sentence."\n3. **Set a 15-minute sprint** — give yourself full permission to stop after 15 minutes.\n\nMotivation is a skill, not a feeling. The more you practice starting, the easier it gets. The **Focus Anchor** protocol pairs well with this approach.`,
    ]);
}

function fallbackAngry({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const stressStr = hasStress ? `**${stress}%**` : 'elevated';

    return pick([
        `Anger is one of the most energising emotions — it's not inherently bad, but it needs to be channelled, not suppressed. ${hasStress ? `Your stress at ${stressStr} may be lowering your threshold for frustration.` : ''}\n\n**Immediate cool-down:**\n- **Pause before responding** to anything — count to 10 slowly. This gives your prefrontal cortex time to catch up with your amygdala.\n- **Physical release:** squeeze your fists tight for 5 seconds, then release. Repeat 3 times. This discharges the tension without acting on it.\n- **Name the real trigger:** anger is often a surface emotion covering hurt, fear, or feeling disrespected. What's underneath?\n\nThe **Box Breathing** protocol is effective for bringing down the physiological intensity.`,
        `Frustration and anger mean something important to you is being blocked or violated. That's useful information.${hasStress ? ` Stress at ${stressStr} makes the fuse shorter.` : ''}\n\n**Before you act on it:**\n- **Move your body** — walk, do push-ups, anything physical. Anger is energy that needs an outlet.\n- **Write it out** — uncensored, for your eyes only. Getting it on paper takes it out of the loop in your head.\n- **Ask: "What do I need right now?"** Often it's respect, control, or fairness — naming it helps you pursue it constructively.\n\nThe **Limbic Calm** protocol can help you downshift from reactive to responsive.`,
    ]);
}

function fallbackLonely({ stress, sleep, mood }) {
    const moodNote = mood ? ` Your mood today: **${mood}**.` : '';
    return pick([
        `Loneliness is one of the most underestimated stressors — it activates the same brain regions as physical pain. You're not being dramatic; this is a real neurological signal.${moodNote}\n\n**Small steps that work:**\n- **Reach out to one person** — not a group chat, one specific person. A direct message or call. Connection is quality, not quantity.\n- **Change your environment** — go to a coffee shop, library, or park. Being around people (even strangers) reduces the loneliness signal.\n- **Help someone** — volunteering or simply doing a favour activates social bonding circuits even in brief interactions.\n\nIf loneliness is persistent, consider speaking with a therapist — it's one of the most effective interventions for social isolation.`,
        `Feeling disconnected is your brain's way of saying it needs social input — humans are wired for connection, and isolation is genuinely harmful to cognitive performance and mental health.${moodNote}\n\n**Immediate actions:**\n- **Text or call someone you trust** — even a short exchange helps. Don't wait for the "right" thing to say.\n- **Schedule something social** for this week — having it on the calendar reduces the loneliness even before it happens.\n- **Be around life** — nature, a busy street, a pet. Your mirror neurons respond to any living presence.\n\nIf this has been ongoing, please consider professional support — a therapist can help in ways that self-help cannot.`,
    ]);
}

function fallbackBurnout({ stress, sleep, mood, burnout }) {
    const hasScore = burnout !== null && burnout > 0;
    const scoreStr = hasScore ? `**${burnout}/100**` : null;
    const hasSleep = sleep !== null;
    const sleepStr = hasSleep ? `**${sleep} hours**` : 'unknown';

    return pick([
        `Burnout isn't just being tired — it's a state of chronic resource depletion where rest alone doesn't fully recover you.${scoreStr ? ` Your cognitive load score is ${scoreStr}.` : ''}\n\n**Burnout recovery is a process, not a single action:**\n- **Identify the drain:** is it workload, lack of control, insufficient reward, or value misalignment? Each has a different fix.\n- **Create non-negotiable recovery blocks** — 30 minutes daily that are truly off. No email, no planning, no "productive rest."\n- **Reduce decisions** — simplify meals, clothes, routines. Decision fatigue accelerates burnout.\n\nThe **NSDR Protocol** is essential for burnout recovery — it restores nervous system capacity that sleep alone may not reach.\n\nIf you've felt this way for more than 2 weeks, consider talking to a professional.`,
        `Burnout is your system telling you that output has exceeded input for too long.${scoreStr ? ` Your current cognitive load: ${scoreStr}.` : ''} ${hasSleep ? `Last night's sleep: ${sleepStr}.` : ''}\n\n**The three pillars of burnout recovery:**\n1. **Reduce load** — say no to one thing this week. Just one. Protect that boundary.\n2. **Restore energy** — prioritise sleep above everything. It's not optional; it's the foundation.\n3. **Reconnect with meaning** — burnout often disconnects you from why you started. Write down one thing about your work that still matters to you.\n\n**Important:** burnout can look like depression. If you're feeling hopeless, numb, or persistently exhausted despite rest, please reach out to a mental health professional. That's not failure — it's the smartest intervention available.`,
    ]);
}

function fallbackPanic({ stress, sleep, mood }) {
    return pick([
        `If you're having a panic attack or intense anxiety right now, **you are safe.** What you're feeling is your nervous system in overdrive — it's terrifying but not dangerous.\n\n**Do this right now:**\n1. **Breathe slowly:** inhale 4 counts, exhale 8 counts. The long exhale is the key — it activates your vagus nerve.\n2. **Ground yourself:** press your feet into the floor. Feel the chair beneath you. Touch something cold.\n3. **Name 5 things you can see.** Say them out loud if you can. This pulls your brain out of panic mode and into the present.\n\nPanic peaks in about 10 minutes and always passes. You've survived every one so far.\n\nIf panic attacks are recurring, please speak with a mental health professional — effective treatments exist.\n\n**Crisis resources:** If you're in crisis, contact the 988 Suicide & Crisis Lifeline (call or text 988).`,
        `**You are okay. You are safe.** A panic attack feels like an emergency, but it is your body's alarm system misfiring — not an actual threat.\n\n**Immediate steps:**\n- **Slow your breathing** — panic speeds it up, you need to override that. Breathe in for 4, out for 6–8.\n- **Splash cold water on your face** or hold ice. The cold triggers your dive reflex and forces your heart rate down.\n- **Say out loud:** "This is a panic attack. It will pass. I am safe." Labelling it reduces its power.\n\nDo NOT fight the feelings — observe them like waves. They crest and fade, usually within 10–15 minutes.\n\nIf this is your first panic attack or they're becoming frequent, **please see a doctor or therapist.** Panic disorder is very treatable.\n\n**Crisis resources:** 988 Suicide & Crisis Lifeline (call or text 988).`,
    ]);
}

function fallbackEnergy({ stress, sleep, mood }) {
    const hasSleep = sleep !== null;
    const sleepStr = hasSleep ? `**${sleep} hours**` : 'unknown';
    const lowSleep = hasSleep && sleep < 6.5;

    if (lowSleep) {
        return pick([
            `Low energy with ${sleepStr} of sleep is straightforward — your battery didn't fully charge. Caffeine masks this but doesn't fix it.\n\n**Energy triage:**\n- **Best option:** a 20-minute nap or NSDR session between 1–3 PM. This aligns with your natural circadian dip.\n- **Quick boost:** 2 minutes of intense movement (jumping jacks, stairs, push-ups). This spikes adrenaline and increases blood flow to the brain.\n- **Protect tonight:** no caffeine after 2 PM, wind down 30 min early, keep the room cool and dark.\n\nThe **Cold Water Reset** protocol gives a reliable 2–3 hour energy boost without caffeine.`,
            `${sleepStr} of sleep leaves your adenosine levels high — that's the molecule that makes you feel tired. Caffeine blocks it temporarily, but the debt remains.\n\n**Maximise what you have:**\n- **Work with your energy curve** — do your hardest task in the first 2 hours after waking, when cortisol is naturally highest.\n- **Take micro-breaks every 25 min** — even 60 seconds of standing and stretching prevents the energy crash.\n- **Hydrate** — dehydration mimics fatigue. Drink a full glass of water right now.\n\nThe **NSDR Protocol** is the most effective non-sleep energy restoration tool available.`,
        ]);
    }
    const moodNote = mood ? ` Your mood: **${mood}**.` : '';
    return pick([
        `Low energy despite adequate sleep usually points to one of three things: dehydration, blood sugar instability, or mental fatigue (too many decisions, not enough recovery).${moodNote}\n\n**Quick energy audit:**\n- **Water:** have you had at least 2 glasses today? Dehydration is the #1 hidden energy killer.\n- **Food:** when did you last eat? A protein + complex carb snack stabilises energy for 2–3 hours.\n- **Movement:** have you been sitting for more than 90 minutes? A 5-minute walk resets your circulation.\n\nThe **Neural Priming** protocol can help shift you from sluggish to engaged in about 10 minutes.`,
        `Energy management is about rhythm, not willpower.${moodNote}\n\n**The ultradian cycle:** your brain naturally cycles between 90 minutes of focus and 20 minutes of rest. If you skip the rest phases, energy drops off a cliff.\n\n**Right now:**\n- **Stand up and stretch** — 60 seconds, full body. This alone can shift your state.\n- **Bright light exposure** — step outside or face a bright window. Light is the strongest alertness signal.\n- **Cold stimulus** — cold water on your wrists or face gives a rapid energy spike.\n\nThe **Cold Water Reset** protocol in the Protocols section is quick and effective for energy dips.`,
    ]);
}

function fallbackBreathing({ stress, sleep, mood }) {
    const hasStress = stress !== null;
    const stressStr = hasStress ? `**${stress}%**` : 'your current level';

    return pick([
        `Breathing is one of the most powerful tools you have — it's the only autonomic function you can consciously control, which means it's a direct lever on your nervous system.\n\n**Three protocols for different states:**\n\n- **Calm down (high stress):** 4-7-8 breathing — inhale 4s, hold 7s, exhale 8s. The long exhale activates your parasympathetic system.\n- **Sharpen focus:** Box breathing — inhale 4s, hold 4s, exhale 4s, hold 4s. Creates alert calm.\n- **Quick reset:** Physiological sigh — double inhale through nose, long exhale through mouth. Works in 1–2 breaths.\n\n${hasStress ? `At stress ${stressStr}, the **4-7-8 Breathing** protocol would be most beneficial right now.` : 'Check the **Protocols** section for guided versions of each.'}\n\nEven 6 controlled breaths measurably reduce cortisol levels.`,
        `Breathing techniques work because they directly influence your vagus nerve — the main communication line between your body and brain.\n\n**Match the technique to your goal:**\n\n- **Feeling anxious or stressed?** → Extend your exhale. Try breathing in for 4 counts and out for 8. This signals safety to your brain.\n- **Need to focus?** → Equal ratio breathing. In for 4, out for 4. Steady rhythm = steady mind.\n- **Feeling panicky?** → Physiological sigh. Two sharp inhales through the nose, one long exhale through the mouth. This is what your body does naturally when crying stops — it resets the system.\n\nThe **Box Breathing** and **4-7-8 Breathing** protocols in the Protocols section offer guided sessions. Start with 5 minutes — the effects compound with practice.`,
    ]);
}

function fallbackGratitude({ stress, sleep, mood }) {
    const moodNote = mood ? ` Your mood today is **${mood}**.` : '';
    return pick([
        `Gratitude practice is one of the most evidence-backed interventions in positive psychology — it literally rewires your brain's negativity bias over time.${moodNote}\n\n**How to make it stick:**\n- **Be specific:** "I'm grateful for the 10-minute walk I took at lunch" beats "I'm grateful for my health." Specificity activates the neural pathways more strongly.\n- **Feel it, don't just list it:** pause on each item for 15–20 seconds. The emotional experience is what creates the change.\n- **Three new things each day** — the novelty matters. Don't repeat the same items.\n\n**Right now:** name three things from the last 24 hours that went well, no matter how small. Write them down if you can — writing deepens the effect.`,
        `Gratitude isn't about toxic positivity or ignoring problems — it's about training your brain to notice what's working alongside what isn't.${moodNote}\n\nResearch shows that consistent gratitude practice (even 2 weeks) measurably increases well-being and reduces stress.\n\n**Quick practice:**\n1. Think of one person who made your day slightly better recently.\n2. Think of one thing your body did well today (even just breathing).\n3. Think of one small moment that felt good.\n\nThat's it. Three items, 60 seconds. The simplicity is the point — consistency matters more than depth.`,
    ]);
}

function fallbackHelp({ stress, sleep, mood }) {
    return pick([
        `Here's what I can help you with:\n\n- **Mental wellness coaching** — tell me what you're feeling (stressed, anxious, unmotivated, etc.) and I'll offer evidence-based strategies.\n- **Breathing & protocol guidance** — ask about breathing techniques, focus methods, or sleep optimization.\n- **Progress tracking** — say "show my progress" to see your check-in trends.\n- **Cognitive load score** — ask about your current score and what it means.\n\n**Quick actions** are available below the chat for common needs. You can also just talk to me freely — I'll adapt to what you need.\n\nFor the best experience, complete your daily check-in each morning. The more data I have, the more personalised my guidance becomes.`,
        `I'm MindSync, your AI mental wellness coach. Here's how I can help:\n\n- **Talk about how you're feeling** — I'll offer concrete, evidence-based advice tailored to your check-in data.\n- **Ask for specific help** — focus techniques, stress management, sleep tips, motivation, anxiety support, and more.\n- **Track your progress** — ask me to summarise your recent patterns.\n- **Learn protocols** — ask about breathing, NSDR, or any protocol in the Protocols section.\n\nI work best when you've completed your daily check-in — it lets me personalise responses to your actual state. Try asking me something like "I'm feeling stressed" or "help me focus."`,
    ]);
}

function generateFallbackResponse(userMessage) {
    const m = userMessage.toLowerCase();
    const d = getLiveData();

    // Existing quick actions
    if (m.includes('overwhelmed')) return fallbackOverwhelmed(d);
    if (m.includes('focus') || m.includes('concentrate') || m.includes('distracted'))
        return fallbackFocus(d);
    if (m.includes('progress') || m.includes('summarize') || m.includes('summarise'))
        return fallbackProgress(getRecentCheckins(7));
    if (m.includes('cognitive') || m.includes('score')) return fallbackCognitiveScore(d);

    // Anxiety / worry
    if (m.includes('anxious') || m.includes('anxiety') || m.includes('worried') ||
        m.includes('worry') || m.includes('nervous') || m.includes('uneasy'))
        return fallbackAnxious(d);

    // Sadness / depression
    if (m.includes('sad') || m.includes('depress') || m.includes('down') ||
        m.includes('unhappy') || m.includes('hopeless') || m.includes('empty') ||
        m.includes('crying') || m.includes('miserable'))
        return fallbackSad(d);

    // Stress
    if (m.includes('stress') || m.includes('pressure') || m.includes('tense') ||
        m.includes('tension'))
        return fallbackStress(d);

    // Sleep / tiredness
    if (m.includes('sleep') || m.includes('tired') || m.includes('exhausted') ||
        m.includes('fatigue') || m.includes('insomnia') || m.includes('can\'t sleep') ||
        m.includes('restless'))
        return fallbackSleep(d);

    // Motivation
    if (m.includes('motivat') || m.includes('unmotivat') || m.includes('lazy') ||
        m.includes('procrastinat') || m.includes('stuck') || m.includes('can\'t start') ||
        m.includes('no energy') || m.includes('don\'t feel like'))
        return fallbackMotivation(d);

    // Anger / frustration
    if (m.includes('angry') || m.includes('anger') || m.includes('frustrated') ||
        m.includes('frustrat') || m.includes('irritat') || m.includes('furious') ||
        m.includes('mad') || m.includes('annoyed') || m.includes('rage'))
        return fallbackAngry(d);

    // Loneliness / isolation
    if (m.includes('lonely') || m.includes('alone') || m.includes('isolat') ||
        m.includes('disconnect') || m.includes('no friends') || m.includes('nobody'))
        return fallbackLonely(d);

    // Burnout
    if (m.includes('burnout') || m.includes('burned out') || m.includes('burnt out'))
        return fallbackBurnout(d);

    // Panic
    if (m.includes('panic') || m.includes('panic attack') || m.includes('can\'t breathe') ||
        m.includes('heart racing') || m.includes('freaking out'))
        return fallbackPanic(d);

    // Energy
    if (m.includes('energy') || m.includes('drained') || m.includes('sluggish') ||
        m.includes('lethargic') || m.includes('low energy'))
        return fallbackEnergy(d);

    // Breathing
    if (m.includes('breath') || m.includes('breathing') || m.includes('calm down') ||
        m.includes('relax'))
        return fallbackBreathing(d);

    // Gratitude
    if (m.includes('grateful') || m.includes('gratitude') || m.includes('thankful'))
        return fallbackGratitude(d);

    // Help / what can you do
    if (m.includes('help') || m.includes('what can you') || m.includes('what do you'))
        return fallbackHelp(d);

    // Not a known quick action — no contextual fallback
    return null;
}
