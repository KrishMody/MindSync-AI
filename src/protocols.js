// ============================
// Protocols — Library & Modal
// ============================
import { showToast } from './auth.js';

const PROTOCOLS = [
    {
        id: 'box-breathing',
        name: 'Box Breathing',
        category: 'stress',
        duration: 5,
        color: 'cyan',
        gradient: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.05))',
        icon: '<path d="M10 3C10 3 5 5 5 10C5 13 7 15 10 16C13 15 15 13 15 10C15 5 10 3 10 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 7V10M10 10L8 12M10 10L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
        description: 'Calm your nerves and clear your head with a simple 4-count breathing loop. Even one round makes a difference.',
        steps: [
            'Sit up straight and breathe all the air out of your lungs.',
            'Breathe in slowly through your nose for **4 seconds**, feeling your chest and belly expand.',
            'Hold your breath for **4 seconds**. Keep your body relaxed — don\'t tense your shoulders.',
            'Breathe out slowly through your mouth for **4 seconds** until your lungs feel empty.',
            'Hold empty for **4 seconds**, then start the cycle again. Repeat **4 to 6 times**.',
        ]
    },
    {
        id: 'alpha-wave',
        name: 'Alpha Wave Tuning',
        category: 'focus',
        duration: 15,
        color: 'purple',
        gradient: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(124,58,237,0.05))',
        icon: '<path d="M2 10C4 7 5 5 7 8C8.5 10.5 9.5 6 11 8C12.5 10 13.5 7 15 9C16 10.5 17 9 18 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
        description: 'Use sound and stillness to put your brain into a calm, creative state — the sweet spot for focused thinking.',
        steps: [
            'Find a quiet place, put on headphones, and play soft ambient or binaural beats music.',
            'Close your eyes and breathe slowly. Breathe in for **4 seconds**, out for **6 seconds**.',
            'Picture a place that feels calm to you — a beach, a forest, or just a quiet room.',
            'Let your thoughts come and go without grabbing onto any of them. Just watch them pass.',
            'Stay like this for **10–15 minutes**. When you\'re done, open your eyes slowly and sit for a moment before moving.',
        ]
    },
    {
        id: 'nsdr',
        name: 'NSDR Protocol',
        category: 'sleep',
        duration: 20,
        color: 'pink',
        gradient: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(236,72,153,0.05))',
        icon: '<path d="M13 3C10 3 7 5.5 7 9C7 12.5 10 15 13 15C11 15 9 13 9 11C9 8 11 6 14 6C13.7 4.5 13.4 3.5 13 3Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
        description: 'A quiet, lying-down rest that gives your brain a deep recharge — no actual sleep needed. Popular with top performers.',
        steps: [
            'Lie flat on your back somewhere comfortable. Use a pillow if you need one.',
            'Close your eyes and take **5 slow breaths** to settle in.',
            'Starting at your feet, slowly notice how each part of your body feels. Work your way up to your head.',
            'If your mind wanders, gently bring it back to your body — no stress, just refocus.',
            'Stay still and relaxed for **20 minutes**. You don\'t need to fall asleep. Just rest deeply.',
        ]
    },
    {
        id: 'gratitude-mapping',
        name: 'Gratitude Mapping',
        category: 'memory',
        duration: 8,
        color: 'pink',
        gradient: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(124,58,237,0.1))',
        icon: '<path d="M10 15C10 15 3 11 3 6.5C3 4.5 4.8 3 7 3C8.2 3 9.3 3.6 10 4.5C10.7 3.6 11.8 3 13 3C15.2 3 17 4.5 17 6.5C17 11 10 15 10 15Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
        description: 'A quick and proven way to shift your mood and strengthen your memory by writing down what went right today.',
        steps: [
            'Grab a pen and paper, or open the notes app on your phone.',
            'Write down **3 things** that went okay today — big or small. "Had a good coffee" counts.',
            'Next to each one, write **one sentence** about why it happened.',
            'Then write **one sentence** about how it made you feel.',
            'Read all three back to yourself slowly. Let the good feeling land before you move on.',
        ]
    },
    {
        id: 'neural-priming',
        name: 'Neural Priming',
        category: 'focus',
        duration: 10,
        color: 'amber',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.05))',
        icon: '<path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
        description: 'Wake up your brain and body before a big work session. Gets your focus chemicals firing in just 10 minutes.',
        steps: [
            'Put on fast, energetic music that you like — anything with a strong beat works.',
            'Stand up and move around for **2 minutes**. Jump, stretch, shake it out — whatever feels good.',
            'Splash **cold water** on your face and wrists. Dry off and take 3 slow deep breaths.',
            'Sit down at your desk, look at your task, and write down **the single thing** you\'ll work on.',
            'Start a **25-minute focus timer** and begin immediately. Don\'t wait to feel ready — just start.',
        ]
    },
    {
        id: 'focus-anchor',
        name: 'Focus Anchor',
        category: 'focus',
        duration: 12,
        color: 'pink',
        gradient: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(6,182,212,0.1))',
        icon: '<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/>',
        description: 'Train your brain to stay on one thing at a time. Simple but powerful for anyone who gets distracted easily.',
        steps: [
            'Choose **one specific task** you want to work on. Write it down on a sticky note or piece of paper.',
            'Put your phone face-down or in another room. Close all browser tabs except what you need.',
            'Set a timer for **10 minutes** and work only on that task. If your mind wanders, look at the sticky note.',
            'When the timer goes off, stop — even if you\'re mid-sentence. Take a **2-minute break**.',
            'Repeat up to **4 rounds**. After 4 rounds, take a longer 15-minute break before starting again.',
        ]
    },
    {
        id: 'limbic-calm',
        name: 'Limbic Calm',
        category: 'stress',
        duration: 15,
        color: 'green',
        gradient: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(6,182,212,0.1))',
        icon: '<path d="M10 3C8 5 5 7 5 10C5 13 7 15 10 15C13 15 15 13 15 10C15 7 12 5 10 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8C10 8 8 10 10 12C12 10 10 8 10 8Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
        description: 'Release built-up stress using your breath and imagination. Slows your heart rate and lowers tension in under 15 minutes.',
        steps: [
            'Sit in a comfortable chair, loosen tight clothing, and let your hands rest in your lap.',
            'Close your eyes and breathe in for **5 seconds**, then breathe out for **7 seconds**. The long exhale is what calms you.',
            'Imagine a warm, soft glow in the middle of your chest. With every breath out, picture it getting a little bigger.',
            'Let your shoulders drop away from your ears. Unclench your jaw. Let your hands go soft.',
            'Stay with this breathing pattern for **10 minutes**, then slowly open your eyes and sit quietly for a moment.',
        ]
    },
    {
        id: 'synaptic-link',
        name: 'Synaptic Link',
        category: 'memory',
        duration: 25,
        color: 'purple',
        gradient: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.1))',
        icon: '<circle cx="5" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="5" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 10L13 6M7 10L13 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
        description: 'A step-by-step memory technique for learning and actually keeping new information — no cramming needed.',
        steps: [
            'Pick **one thing** you want to remember — a fact, a name, a concept, or a skill.',
            'Say it out loud **3 times** slowly, as if you\'re explaining it to someone else.',
            'Connect it to something you already know. Draw a quick sketch, write a comparison, or make up a silly story using it.',
            'Cover it up and try to recall it from memory. Write down what you remember.',
            'Check your answer, fill in what you missed, then test yourself again in **5 minutes** and again after **20 minutes**.',
        ]
    },
    {
        id: '4-7-8-breathing',
        name: '4-7-8 Breathing',
        category: 'stress',
        duration: 5,
        color: 'cyan',
        gradient: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(74,222,128,0.1))',
        icon: '<path d="M10 3V17M6 6L10 3L14 6M6 14L10 17L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
        description: 'One of the fastest ways to reduce anxiety and fall asleep. Works by slowing your nervous system down in minutes.',
        steps: [
            'Sit up straight or lie down. Place the tip of your tongue behind your upper front teeth and keep it there.',
            'Breathe in quietly through your nose for **4 seconds**.',
            'Hold your breath for **7 seconds**. Don\'t strain — just hold calmly.',
            'Breathe out through your mouth with a whooshing sound for **8 seconds**.',
            'That\'s one cycle. Repeat **3 more times** for a total of 4. You can do this anytime you feel stressed or before bed.',
        ]
    },
    {
        id: 'body-scan',
        name: 'Body Scan',
        category: 'sleep',
        duration: 15,
        color: 'purple',
        gradient: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.08))',
        icon: '<path d="M10 2C10 2 10 4 10 5C10 6 9 7 9 8V14C9 15 10 16 10 16C10 16 11 15 11 14V8C11 7 10 6 10 5C10 4 10 2 10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 5C7 5 5 7 5 10C5 12 6 13 7 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 5C13 5 15 7 15 10C15 12 14 13 13 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
        description: 'A gentle, guided way to relax your whole body from head to toe. Perfect before bed or anytime you feel tense.',
        steps: [
            'Lie flat on your back or sit comfortably. Close your eyes and take **3 slow deep breaths**.',
            'Bring your attention to your feet. Notice any tightness or warmth. Breathe in, and as you breathe out, let your feet completely relax.',
            'Move slowly up your body — calves, knees, thighs, hips. At each spot, breathe out and let go of any tension.',
            'Continue up through your stomach, chest, hands, arms, shoulders, neck, and face. **Take your time** — there\'s no rush.',
            'Once you reach the top of your head, take **3 more slow breaths**. Open your eyes when you\'re ready.',
        ]
    },
    {
        id: 'cold-reset',
        name: 'Cold Water Reset',
        category: 'focus',
        duration: 3,
        color: 'cyan',
        gradient: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(74,222,128,0.1))',
        icon: '<path d="M10 2L10 8M7 5L10 8L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10C5 10 4 12 5 14C6 16 8 17 10 17C12 17 14 16 15 14C16 12 15 10 15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
        description: 'A 3-minute trick to instantly snap out of brain fog. Cold water on your face triggers an alertness response right away.',
        steps: [
            'Go to a sink and run the cold water tap for **20 seconds** until it\'s properly cold.',
            'Run cold water over both your wrists for **30 seconds** each. This cools your blood and wakes your body up.',
            'Splash **cold water on your face** 5 to 10 times. Don\'t rush it.',
            'Pat your face dry and stand straight. Take **5 slow, deep breaths** through your nose.',
            'Notice how much more awake you feel. You\'re ready to focus — go back to work within **2 minutes** of finishing.',
        ]
    },
    {
        id: 'power-nap',
        name: 'Power Nap',
        category: 'sleep',
        duration: 20,
        color: 'amber',
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(124,58,237,0.1))',
        icon: '<path d="M13 3C10 3 7 5.5 7 9C7 12.5 10 15 13 15C11 15 9 13 9 11C9 8 11 6 14 6C13.7 4.5 13.4 3.5 13 3Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 16L7 13M16 16L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
        description: 'A short, timed rest that boosts your energy and thinking for hours. The trick is keeping it under 20 minutes.',
        steps: [
            'Set **two alarms**: one for 20 minutes from now, and a backup 5 minutes after that.',
            'Lie down or recline somewhere dim and quiet. Use an eye mask or pull the blinds if you can.',
            'Close your eyes and breathe slowly. **Don\'t try to force yourself to sleep** — just let your body rest.',
            'If thoughts keep coming, imagine a simple object (like a candle flame) and gently keep your attention on it.',
            'When the alarm goes off, **get up immediately** — don\'t snooze. Have a glass of water and give yourself **5 minutes** before going back to tasks.',
        ]
    },
];

// ============================
// State
// ============================
let activeCategory = 'all';
let searchQuery    = '';

// ============================
// Init
// ============================
export function initProtocolsPage() {
    renderProtocols();
    setupSearch();
    setupFilters();
}

// ============================
// Render Grid
// ============================
function renderProtocols() {
    const grid = document.getElementById('protocols-grid');
    if (!grid) return;

    const query    = searchQuery.toLowerCase();
    const filtered = PROTOCOLS.filter(p => {
        const matchCat   = activeCategory === 'all' || p.category === activeCategory;
        const matchQuery = !query ||
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query);
        return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="protocols-empty">No protocols found for "<strong>${searchQuery}</strong>"</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="protocol-card glass-card" onclick="openProtocolModal('${p.id}')">
            <div class="protocol-card-top">
                <div class="protocol-card-icon-circle color-${p.color}">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">${p.icon}</svg>
                </div>
                <span class="protocol-card-duration">${p.duration} MIN</span>
            </div>
            <h3 class="protocol-card-title">${p.name}</h3>
            <p class="protocol-card-desc">${p.description}</p>
        </div>
    `).join('');
}

// ============================
// Search
// ============================
function setupSearch() {
    const input = document.getElementById('protocols-search-input');
    if (!input) return;
    input.value = '';
    input.oninput = (e) => {
        searchQuery = e.target.value;
        renderProtocols();
    };
}

// ============================
// Filters
// ============================
function setupFilters() {
    const filters = document.querySelectorAll('#protocols-filters .chip');
    filters.forEach(btn => {
        btn.onclick = () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            renderProtocols();
        };
    });
}

// ============================
// Modal
// ============================
export function openProtocolModal(id) {
    const protocol = PROTOCOLS.find(p => p.id === id);
    if (!protocol) return;

    const saved   = getSaved();
    const isSaved = saved.includes(id);

    // Populate viz area
    document.getElementById('proto-modal-viz').style.background = protocol.gradient;
    document.getElementById('proto-modal-viz-icon').innerHTML =
        `<svg width="32" height="32" viewBox="0 0 20 20" fill="none">${protocol.icon}</svg>`;
    document.getElementById('proto-modal-viz-icon').className =
        `proto-modal-icon-circle color-${protocol.color}`;

    // Header
    document.getElementById('proto-modal-title').textContent = protocol.name;

    // Steps
    document.getElementById('proto-modal-steps').innerHTML = protocol.steps
        .map((step, i) => `
            <div class="proto-step">
                <span class="proto-step-num">${i + 1}</span>
                <p class="proto-step-text">${parseHighlights(step)}</p>
            </div>
        `).join('');

    // Save button state
    const saveBtn = document.getElementById('proto-save-btn');
    saveBtn.textContent = isSaved ? 'Saved ✓' : 'Save';
    saveBtn.classList.toggle('saved', isSaved);
    saveBtn.onclick = () => toggleSaveProtocol(id);

    // Start button
    document.getElementById('proto-start-btn').onclick = () => startProtocol(id);

    // Show
    const modal = document.getElementById('protocol-modal');
    modal.style.display = 'flex';
}

export function closeProtocolModal() {
    document.getElementById('protocol-modal').style.display = 'none';
}

// ============================
// Save & Start
// ============================
export function toggleSaveProtocol(id) {
    const saved = getSaved();
    const idx   = saved.indexOf(id);
    if (idx === -1) saved.push(id);
    else saved.splice(idx, 1);
    localStorage.setItem('savedProtocols', JSON.stringify(saved));

    const saveBtn = document.getElementById('proto-save-btn');
    const isSaved = idx === -1;
    saveBtn.textContent = isSaved ? 'Saved ✓' : 'Save';
    saveBtn.classList.toggle('saved', isSaved);
    showToast(isSaved ? 'Protocol saved.' : 'Protocol removed.', 'success');
}

export function startProtocol(id) {
    const p = PROTOCOLS.find(p => p.id === id);
    if (!p) return;
    closeProtocolModal();
    showToast(`${p.name} started. Follow the steps and take your time.`, 'success');
}

// ============================
// Helpers
// ============================
function getSaved() {
    try { return JSON.parse(localStorage.getItem('savedProtocols') || '[]'); }
    catch { return []; }
}

function parseHighlights(text) {
    return text.replace(/\*\*(.+?)\*\*/g, '<span class="step-highlight">$1</span>');
}
