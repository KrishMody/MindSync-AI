// ============================
// Charts — Canvas Visualizations
// ============================
import { isNewUser, hasEnoughData } from './userState.js';

export function initCognitiveChart(mode = 'today') {
    const canvas = document.getElementById('cognitiveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width  = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    if (isNewUser()) {
        drawEmptyChartState(ctx, w, h, 'Awaiting cognitive data...');
        return;
    }

    const history = mode === 'month' ? getMonthData() : getWeekData();

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top  - padding.bottom;
    const barW   = chartW / history.length * (mode === 'month' ? 0.7 : 0.6);
    const gap    = chartW / history.length;

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

    const maxVal = Math.max(...history.map(d => d.stress), 1);

    history.forEach((entry, i) => {
        const val      = entry.stress;
        const x        = padding.left + i * gap + (gap - barW) / 2;
        const isDimmed = mode === 'today' && !entry.isToday;

        if (!entry.hasData) {
            // Placeholder stub for days with no check-in
            const stubH = 6;
            const y = padding.top + chartH - stubH;
            ctx.fillStyle = isDimmed ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.14)';
            ctx.beginPath();
            roundedRect(ctx, x, y, barW, stubH, 2);
            ctx.fill();
            return;
        }

        const alpha     = isDimmed ? 0.18 : 0.85;
        const alphaFill = isDimmed ? 0.04 : 0.2;
        const barH = Math.max(6, (val / maxVal) * chartH);
        const y    = padding.top + chartH - barH;

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        if (val > 75) {
            grad.addColorStop(0, `rgba(236,72,153,${alpha})`);
            grad.addColorStop(1, `rgba(236,72,153,${alphaFill})`);
        } else if (val > 50) {
            grad.addColorStop(0, `rgba(124,58,237,${alpha})`);
            grad.addColorStop(1, `rgba(124,58,237,${alphaFill})`);
        } else {
            grad.addColorStop(0, `rgba(6,182,212,${alpha})`);
            grad.addColorStop(1, `rgba(6,182,212,${alphaFill})`);
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        roundedRect(ctx, x, y, barW, barH, 3);
        ctx.fill();

        // Glow ring on today's bar in "today" mode
        if (mode === 'today' && entry.isToday) {
            ctx.strokeStyle = 'rgba(6,182,212,0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            roundedRect(ctx, x - 1, y - 1, barW + 2, barH + 1, 4);
            ctx.stroke();
        }
    });

    // X-axis labels
    ctx.textAlign = 'center';
    history.forEach((entry, i) => {
        const isDimmed = mode === 'today' && !entry.isToday;

        if (mode === 'month') {
            const dayNum = parseInt(entry.dayLabel, 10);
            if (dayNum !== 1 && dayNum % 5 !== 0 && dayNum !== history.length) return;
            ctx.font      = '8px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(148,163,184,0.5)';
        } else {
            ctx.font      = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = (mode === 'today' && entry.isToday)
                ? 'rgba(6,182,212,0.95)'
                : isDimmed
                    ? 'rgba(148,163,184,0.22)'
                    : 'rgba(148,163,184,0.6)';
        }

        const x = padding.left + i * gap + gap / 2;
        ctx.fillText(entry.dayLabel, x, h - 10);
    });
}

export function initPerformanceChart(mode = '1w') {
    const canvas = document.getElementById('performanceCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width  = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    if (!hasEnoughData(3)) {
        drawEmptyChartState(ctx, w, h, 'Insufficient data for performance trends');
        return;
    }

    const dayMap   = { '1w': 7, '1m': 30, '3m': 90, '1y': 365 };
    const numDays  = dayMap[mode] ?? 7;
    const history  = getCheckinHistory(numDays);

    if (history.length < 2) {
        drawEmptyChartState(ctx, w, h, 'Not enough data for this range');
        return;
    }

    const moodScore   = { good: 82, neutral: 62, bad: 38 };
    const performance = history.map(d =>
        Math.min(100, Math.max(0, (moodScore[d.mood] ?? 62) + (d.sleep - 7) * 3))
    );
    const cogLoad = history.map(d => d.stress);

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top  - padding.bottom;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
    }

    drawAreaLine(ctx, performance, padding, chartW, chartH, 'rgba(124,58,237,0.8)', 'rgba(124,58,237,0.05)', w, h);
    drawAreaLine(ctx, cogLoad,     padding, chartW, chartH, 'rgba(6,182,212,0.8)',  'rgba(6,182,212,0.05)',  w, h);

    // X-axis labels — density scales with mode
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.textAlign = 'center';
    history.forEach((d, i) => {
        let label;
        let show = false;

        if (mode === '1w') {
            label = d.date.toLocaleDateString('en-US', { weekday: 'short' });
            show  = true;
        } else if (mode === '1m') {
            label = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            show  = i === 0 || i === history.length - 1 || i % Math.ceil(history.length / 6) === 0;
        } else if (mode === '3m') {
            label = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            show  = i === 0 || d.date.getDate() === 1 || i === history.length - 1;
        } else if (mode === '1y') {
            label = d.date.toLocaleDateString('en-US', { month: 'short' });
            show  = i === 0 || d.date.getDate() === 1 || i === history.length - 1;
        }

        if (!show) return;
        const fontSize = (mode === '3m' || mode === '1y') ? 8 : 10;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        const x = padding.left + (i / Math.max(history.length - 1, 1)) * chartW;
        ctx.fillText(label, x, h - 10);
    });
}

export function initBaselineChart() {
    const canvas = document.getElementById('baselineCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width  = container.offsetWidth * 2;
    canvas.height = container.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const padding = { top: 24, right: 20, bottom: 40, left: 40 };

    if (!hasEnoughData(3)) {
        drawEmptyChartState(ctx, w, h, 'Baseline requires 3+ days of check-ins');
        return;
    }

    const history = getThirtyDayData();

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top  - padding.bottom;
    const gap    = chartW / history.length;
    const barW   = gap * 0.55;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
    }

    // Focus-hours bars (all 30 slots, stubs for missing days)
    const maxFocus = Math.max(...history.map(d => d.sleep), 10);
    history.forEach((entry, i) => {
        const x = padding.left + i * gap + (gap - barW) / 2;
        if (!entry.hasData) {
            ctx.fillStyle = 'rgba(148,163,184,0.08)';
            ctx.beginPath();
            roundedRect(ctx, x, padding.top + chartH - 5, barW, 5, 2);
            ctx.fill();
            return;
        }
        const barH = Math.max(5, (entry.sleep / maxFocus) * chartH);
        const y    = padding.top + chartH - barH;
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, 'rgba(124,58,237,0.65)');
        grad.addColorStop(1, 'rgba(124,58,237,0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        roundedRect(ctx, x, y, barW, barH, 2);
        ctx.fill();
    });

    // Stress overlay line — only connect days that have data
    const maxStress   = Math.max(...history.map(d => d.stress), 70);
    const stressPoints = history
        .filter(e => e.hasData)
        .map((entry, _, arr) => {
            const i = history.indexOf(entry);
            return { x: padding.left + i * gap + gap / 2,
                     y: padding.top + chartH - (entry.stress / maxStress) * chartH };
        });

    if (stressPoints.length >= 2) {
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        let firstStressPoint = true;
        history.forEach((entry, i) => {
            if (!entry.hasData) return;
            const x = padding.left + i * gap + gap / 2;
            const y = padding.top + chartH - (entry.stress / maxStress) * chartH;
            if (firstStressPoint) { ctx.moveTo(x, y); firstStressPoint = false; }
            else                  { ctx.lineTo(x, y); }
        });
        ctx.stroke();

        stressPoints.forEach(p => {
            ctx.fillStyle = '#EC4899';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Month boundary divider — vertical dashed line + month labels
    history.forEach((entry, i) => {
        if (!entry.isMonthStart || i === 0) return;

        const divX = padding.left + i * gap - gap * 0.1;

        // Dashed vertical line
        ctx.save();
        ctx.strokeStyle  = 'rgba(148,163,184,0.35)';
        ctx.lineWidth    = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(divX, padding.top - 10);
        ctx.lineTo(divX, padding.top + chartH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Previous month label (left of divider)
        const prevMonth = history[i - 1].monthName;
        ctx.fillStyle = 'rgba(148,163,184,0.45)';
        ctx.font      = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`← ${prevMonth}`, divX - 4, padding.top - 2);

        // New month label (right of divider)
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.textAlign = 'left';
        ctx.fillText(`${entry.monthName} →`, divX + 4, padding.top - 2);
    });

    // X-axis day labels — show 1st, every 5th, and last
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font      = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    history.forEach((entry, i) => {
        const dayNum = parseInt(entry.dayLabel, 10);
        if (dayNum !== 1 && dayNum % 5 !== 0 && i !== history.length - 1) return;
        const x = padding.left + i * gap + gap / 2;
        ctx.fillStyle = entry.isToday ? 'rgba(6,182,212,0.8)' : 'rgba(148,163,184,0.5)';
        ctx.fillText(entry.dayLabel, x, h - 10);
    });
}

// ============================
// Helpers
// ============================
function parseCheckin(raw) {
    try {
        const { sleep, stress, mood } = JSON.parse(raw);
        return { sleep: parseFloat(sleep) || 0, stress: parseInt(stress, 10) || 0, mood: mood || 'neutral' };
    } catch { return null; }
}

function getCheckinHistory(maxDays) {
    const result = [];
    const today  = new Date();
    for (let i = maxDays - 1; i >= 0; i--) {
        const d   = new Date(today);
        d.setDate(today.getDate() - i);
        const raw = localStorage.getItem('dailyCheckIn_' + d.toDateString());
        if (!raw) continue;
        const parsed = parseCheckin(raw);
        if (!parsed) continue;
        result.push({
            ...parsed,
            date:     new Date(d),
            dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        });
    }
    return result;
}

// Always returns exactly 30 days ending today, spanning prev + current month.
// Each entry carries isMonthStart / monthName so the chart can draw a divider.
function getThirtyDayData() {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (29 - i)); // i=0 → 29 days ago, i=29 → today
        const raw    = localStorage.getItem('dailyCheckIn_' + d.toDateString());
        const parsed = raw ? parseCheckin(raw) : null;
        return {
            sleep:        parsed?.sleep  ?? 0,
            stress:       parsed?.stress ?? 0,
            mood:         parsed?.mood   ?? 'neutral',
            dayLabel:     String(d.getDate()),
            isToday:      d.toDateString() === today.toDateString(),
            hasData:      !!parsed,
            isMonthStart: d.getDate() === 1,
            monthName:    d.toLocaleDateString('en-US', { month: 'short' }),
        };
    });
}

// Returns all 7 days of the current Mon–Sun week, with hasData / isToday flags
function getWeekData() {
    const today     = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
    const monday    = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    return Array.from({ length: 7 }, (_, i) => {
        const d   = new Date(monday);
        d.setDate(monday.getDate() + i);
        const raw    = localStorage.getItem('dailyCheckIn_' + d.toDateString());
        const parsed = raw ? parseCheckin(raw) : null;
        return {
            sleep:    parsed?.sleep    ?? 0,
            stress:   parsed?.stress   ?? 0,
            mood:     parsed?.mood     ?? 'neutral',
            dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
            isToday:  d.toDateString() === today.toDateString(),
            hasData:  !!parsed,
        };
    });
}

// Returns every day of the current calendar month, with hasData / isToday flags
function getMonthData() {
    const today       = new Date();
    const year        = today.getFullYear();
    const month       = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
        const d   = new Date(year, month, i + 1);
        const raw    = localStorage.getItem('dailyCheckIn_' + d.toDateString());
        const parsed = raw ? parseCheckin(raw) : null;
        return {
            sleep:    parsed?.sleep    ?? 0,
            stress:   parsed?.stress   ?? 0,
            mood:     parsed?.mood     ?? 'neutral',
            dayLabel: String(i + 1),
            isToday:  d.toDateString() === today.toDateString(),
            hasData:  !!parsed,
        };
    });
}

function drawEmptyChartState(ctx, w, h, message) {
    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font      = '14px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, w / 2, h / 2);
}

function drawAreaLine(ctx, data, padding, chartW, chartH, strokeColor, fillColor, w, h) {
    const maxVal = 100;
    const step   = chartW / (data.length - 1);
    const points = data.map((val, i) => ({
        x: padding.left + i * step,
        y: padding.top + chartH - (val / maxVal) * chartH,
    }));

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

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) { ctx.moveTo(p.x, p.y); return; }
        const prev = points[i - 1];
        const cpx  = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
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
// Pattern Analysis
// ============================

const PATTERN_DEFS = {
    compounding_load: {
        title: 'Compounding Load Pattern',
        iconType: 'warning', iconColor: '#EC4899',
        texts: [
            'High stress <em>and</em> poor sleep are compounding each other. These two factors amplify cognitive decline — breaking the cycle now is more effective than addressing them separately later.',
            'Your data shows both elevated stress and sleep debt running in parallel. The combined effect on cognition is greater than either alone — a targeted reset is the fastest path out.',
        ],
        stat1Label: 'Avg Stress Level',
        stat2Label: 'Baseline Degradation',
        protocol: '4-7-8-breathing',
    },
    burnout_trajectory: {
        title: 'Burnout Trajectory Detected',
        iconType: 'warning', iconColor: '#EC4899',
        texts: [
            'Rising cognitive load is inverting your performance curve. You\'re expending more effort for diminishing output — a hard reset is needed before the gap widens.',
            'Stress is climbing while performance is sliding. This is a classic pre-burnout signal. Intervention now costs far less than recovery later.',
        ],
        stat1Label: 'Performance Decline',
        stat2Label: 'Stress Trend',
        protocol: 'box-breathing',
    },
    chronic_stress: {
        title: 'Chronic Overload Detected',
        iconType: 'warning', iconColor: '#EC4899',
        texts: [
            'Sustained high stress is narrowing your cognitive bandwidth. Your nervous system is stuck in a high-alert state — active recovery, not just rest, is required.',
            'Your stress levels have been elevated for an extended stretch. Prolonged cortisol elevation damages focus and memory consolidation. A structured calm protocol can reset this.',
        ],
        stat1Label: 'Avg Stress Level',
        stat2Label: 'Recovery Urgency',
        protocol: 'limbic-calm',
    },
    sleep_deficit: {
        title: 'Sleep Deficit Detected',
        iconType: 'warning', iconColor: '#F59E0B',
        texts: [
            'Consistently low sleep is degrading your performance baseline. Memory consolidation, emotional regulation, and focus all depend on adequate sleep — the deficit is compounding daily.',
            'Your average sleep hours are below the threshold needed for full cognitive repair. Even one or two better nights can sharpen your baseline noticeably.',
        ],
        stat1Label: 'Avg Sleep Hours',
        stat2Label: 'Performance Impact',
        protocol: 'nsdr',
    },
    erratic_stress: {
        title: 'Erratic Stress Pattern',
        iconType: 'warning', iconColor: '#F59E0B',
        texts: [
            'Unpredictable stress spikes are destabilising your baseline. Irregular load patterns suggest external triggers overwhelming your regulation system — grounding helps anchor it.',
            'Your stress data shows sharp, inconsistent swings. This volatility is harder on the nervous system than sustained moderate stress. A stabilising protocol will help.',
        ],
        stat1Label: 'Stress Variability',
        stat2Label: 'Stability Score',
        protocol: 'focus-anchor',
    },
    focus_stagnation: {
        title: 'Focus Stagnation Detected',
        iconType: 'info', iconColor: '#06B6D4',
        texts: [
            'Cognitive performance has plateaued. Stress is moderate but your output isn\'t breaking through — neural priming can prime the dopamine pathways needed to shift gears.',
            'Your performance has levelled off despite manageable stress. This is often a signal of under-stimulation rather than overload. A short activation protocol can break the plateau.',
        ],
        stat1Label: 'Avg Performance',
        stat2Label: 'Focus Ceiling Gap',
        protocol: 'neural-priming',
    },
    recovery_in_progress: {
        title: 'Recovery in Progress',
        iconType: 'info', iconColor: '#06B6D4',
        texts: [
            'Stress is trending downward — your system is stabilising. Reinforce this window with a grounding session to lock in the recovery and prevent a rebound.',
            'The downward stress trend in your data is a good sign. Your nervous system is recalibrating. Reinforce with a calm focus session to consolidate the gains.',
        ],
        stat1Label: 'Stress Reduction',
        stat2Label: 'Recovery Trajectory',
        protocol: 'alpha-wave',
    },
    optimal_baseline: {
        title: 'Optimal Baseline Maintained',
        iconType: 'check', iconColor: '#4ADE80',
        texts: [
            'Strong performance and low stress — your cognitive system is well-calibrated. Reinforce with a memory consolidation session to turn today\'s clarity into lasting gains.',
            'Your data shows a healthy balance of performance and recovery. This is the ideal state for deep learning. A memory protocol now will compound the benefits.',
        ],
        stat1Label: 'Avg Performance',
        stat2Label: 'Cognitive Reserve',
        protocol: 'synaptic-link',
    },
    insufficient_data: {
        title: 'Awaiting Pattern Data',
        iconType: 'info', iconColor: '#94A3B8',
        texts: [
            'Not enough check-in data to detect a reliable pattern yet. Complete at least 3 daily check-ins to unlock personalised insights.',
        ],
        stat1Label: 'Check-ins Logged',
        stat2Label: 'Days to Insights',
        protocol: null,
    },
};

function analyzePattern(history) {
    if (history.length < 3) {
        return {
            key: 'insufficient_data',
            s1: `${history.length} / 3`,
            s2: `${Math.max(0, 3 - history.length)} day${3 - history.length !== 1 ? 's' : ''}`,
        };
    }

    const moodScore = { good: 82, neutral: 62, bad: 38 };
    const perf    = history.map(d => Math.min(100, Math.max(0, (moodScore[d.mood] ?? 62) + (d.sleep - 7) * 3)));
    const stress  = history.map(d => d.stress);
    const sleep   = history.map(d => d.sleep);

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgStress = avg(stress);
    const avgPerf   = avg(perf);
    const avgSleep  = avg(sleep);

    const half       = Math.max(1, Math.floor(history.length / 2));
    const stressTrend = avg(stress.slice(half)) - avg(stress.slice(0, half)); // + = rising
    const perfTrend   = avg(perf.slice(half))   - avg(perf.slice(0, half));   // + = improving

    const stressMean   = avgStress;
    const stressStdDev = Math.sqrt(avg(stress.map(v => (v - stressMean) ** 2)));

    const highStress    = avgStress > 70;
    const lowSleep      = avgSleep  < 6.5;
    const risingStress  = stressTrend >  10;
    const decliningPerf = perfTrend   < -8;
    const erratic       = stressStdDev > 20;
    const stressFalling = stressTrend  < -10;
    const goodPerf      = avgPerf  > 72;
    const lowStress     = avgStress < 45;

    if (highStress && lowSleep) return {
        key: 'compounding_load',
        s1: `${Math.round(avgStress)}% stress`,
        s2: `${Math.round((1 - avgPerf / 100) * 100)}% degraded`,
    };
    if (risingStress && decliningPerf) return {
        key: 'burnout_trajectory',
        s1: `${perfTrend > 0 ? '+' : ''}${Math.round(perfTrend)}% trend`,
        s2: `+${Math.round(Math.abs(stressTrend))}% rising`,
    };
    if (highStress) return {
        key: 'chronic_stress',
        s1: `${Math.round(avgStress)}%`,
        s2: avgStress > 85 ? 'Critical' : avgStress > 75 ? 'High' : 'Elevated',
    };
    if (lowSleep) return {
        key: 'sleep_deficit',
        s1: `${avgSleep.toFixed(1)} hrs`,
        s2: `-${Math.max(0, Math.round((7 - avgSleep) * 8))}% perf`,
    };
    if (erratic) return {
        key: 'erratic_stress',
        s1: `±${Math.round(stressStdDev)}%`,
        s2: `${Math.max(0, Math.round(100 - stressStdDev * 2))}%`,
    };
    if (goodPerf && lowStress) return {
        key: 'optimal_baseline',
        s1: `${Math.round(avgPerf)}%`,
        s2: `${Math.round(100 - avgStress)}%`,
    };
    if (stressFalling) return {
        key: 'recovery_in_progress',
        s1: `−${Math.round(Math.abs(stressTrend))}% / week`,
        s2: 'Positive',
    };
    return {
        key: 'focus_stagnation',
        s1: `${Math.round(avgPerf)}%`,
        s2: `${Math.max(0, Math.round(82 - avgPerf))}% gap`,
    };
}

function patternIcon(type, color) {
    if (type === 'check') {
        return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="${color}" stroke-width="1.5"/><path d="M5 8L7 10L11 6" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    if (type === 'info') {
        return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="${color}" stroke-width="1.5"/><path d="M8 7.5V11M8 5.5V5.2" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6V9M8 11V11.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

export function updatePatternCard(mode = '1w') {
    const dayMap  = { '1w': 7, '1m': 30, '3m': 90, '1y': 365 };
    const history = getCheckinHistory(dayMap[mode] ?? 7);
    const result  = analyzePattern(history);
    const def     = PATTERN_DEFS[result.key];

    // Pick one of the available text variants (seeded so it's stable per-session but not always the same)
    const textVariant = def.texts[Math.floor(Date.now() / 3600000) % def.texts.length];

    const titleEl = document.getElementById('pattern-card-title');
    const iconEl  = document.getElementById('pattern-card-icon');
    const textEl  = document.getElementById('pattern-card-text');
    const s1v     = document.getElementById('pattern-stat1-value');
    const s1l     = document.getElementById('pattern-stat1-label');
    const s2v     = document.getElementById('pattern-stat2-value');
    const s2l     = document.getElementById('pattern-stat2-label');
    const btn     = document.getElementById('pattern-apply-btn');

    if (titleEl) titleEl.textContent  = def.title;
    if (iconEl)  iconEl.innerHTML     = patternIcon(def.iconType, def.iconColor);
    if (textEl)  textEl.innerHTML     = textVariant;
    if (s1v)     s1v.textContent      = result.s1;
    if (s1l)     s1l.textContent      = def.stat1Label;
    if (s2v)     s2v.textContent      = result.s2;
    if (s2l)     s2l.textContent      = def.stat2Label;

    if (btn) {
        if (def.protocol) {
            btn.textContent      = 'Apply Recommended Protocol';
            btn.style.opacity    = '';
            btn.style.cursor     = '';
            btn.onclick = () => {
                window.showPage('page-protocols');
                setTimeout(() => window.openProtocolModal(def.protocol), 380);
            };
        } else {
            btn.textContent   = 'Log more check-ins to unlock';
            btn.style.opacity = '0.45';
            btn.style.cursor  = 'default';
            btn.onclick       = null;
        }
    }
}
