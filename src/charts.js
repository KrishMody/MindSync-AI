// ============================
// Charts — Canvas Visualizations
// ============================
import { isNewUser, hasEnoughData } from './userState.js';

export function initCognitiveChart() {
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

    const data  = [35,50,65,80,72,55,90,78,60,45,70,85,65,50,40,55,68,82,75,58,42,55,65,48];
    const hours = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top  - padding.bottom;
    const barW   = chartW / data.length * 0.6;
    const gap    = chartW / data.length;

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
        const x    = padding.left + i * gap + (gap - barW) / 2;
        const barH = (val / maxVal) * chartH;
        const y    = padding.top + chartH - barH;

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        if (val > 75) {
            grad.addColorStop(0, 'rgba(236,72,153,0.8)'); grad.addColorStop(1, 'rgba(236,72,153,0.2)');
        } else if (val > 50) {
            grad.addColorStop(0, 'rgba(124,58,237,0.8)'); grad.addColorStop(1, 'rgba(124,58,237,0.2)');
        } else {
            grad.addColorStop(0, 'rgba(6,182,212,0.8)');  grad.addColorStop(1, 'rgba(6,182,212,0.2)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        roundedRect(ctx, x, y, barW, barH, 3);
        ctx.fill();
    });

    // X-axis labels (every 4th)
    ctx.fillStyle  = 'rgba(148,163,184,0.6)';
    ctx.font       = '10px "JetBrains Mono", monospace';
    ctx.textAlign  = 'center';
    data.forEach((_, i) => {
        if (i % 4 === 0) {
            const x = padding.left + i * gap + gap / 2;
            ctx.fillText(hours[i] + ':00', x, h - 10);
        }
    });
}

export function initPerformanceChart() {
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

    const performance = [65,70,68,75,72,78,80,76,82,79,85,83,78,80,76,82,85,88,84,80,75,78,82,85,80,78,75,72,76,80];
    const cogLoad     = [40,45,50,42,55,48,52,60,55,50,45,48,55,60,65,58,52,48,55,62,58,52,48,45,50,55,58,62,55,50];

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top  - padding.bottom;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
    }

    drawAreaLine(ctx, performance, padding, chartW, chartH, 'rgba(124,58,237,0.8)',  'rgba(124,58,237,0.05)',  w, h);
    drawAreaLine(ctx, cogLoad,     padding, chartW, chartH, 'rgba(6,182,212,0.8)',   'rgba(6,182,212,0.05)',   w, h);

    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font      = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    days.forEach((day, i) => {
        const x = padding.left + (i / (days.length - 1)) * chartW;
        ctx.fillText(day, x, h - 10);
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
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    if (!hasEnoughData(3)) {
        drawEmptyChartState(ctx, w, h, 'Baseline requires 3+ days of check-ins');
        return;
    }

    const focusHours = [5.2,6.1,4.8,7.2,6.5,5.9,7.8,6.2,5.5,6.8,7.1,5.6,6.3,7.5,5.8,6.7,7.3,5.4,6.9,7.0,5.7,6.4,7.2,6.1,5.3,6.6,7.4,5.9,6.8,7.1];
    const stressLevel= [35,42,50,38,45,52,30,48,55,40,35,50,42,32,48,38,30,52,40,35,50,45,32,42,55,38,28,45,36,33];

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top  - padding.bottom;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
    }

    const maxFocus = 10;
    const barW = (chartW / focusHours.length) * 0.5;
    const gap  = chartW / focusHours.length;

    focusHours.forEach((val, i) => {
        const x    = padding.left + i * gap + (gap - barW) / 2;
        const barH = (val / maxFocus) * chartH;
        const y    = padding.top + chartH - barH;

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, 'rgba(124,58,237,0.6)');
        grad.addColorStop(1, 'rgba(124,58,237,0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        roundedRect(ctx, x, y, barW, barH, 2);
        ctx.fill();
    });

    // Stress line
    const maxStress = 70;
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    stressLevel.forEach((val, i) => {
        const x = padding.left + i * gap + gap / 2;
        const y = padding.top + chartH - (val / maxStress) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    stressLevel.forEach((val, i) => {
        const x = padding.left + i * gap + gap / 2;
        const y = padding.top + chartH - (val / maxStress) * chartH;
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font      = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    focusHours.forEach((_, i) => {
        if (i % 5 === 0) {
            const x = padding.left + i * gap + gap / 2;
            ctx.fillText('Day ' + (i + 1), x, h - 10);
        }
    });
}

// ============================
// Helpers
// ============================
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
