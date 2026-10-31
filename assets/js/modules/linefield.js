/**
 * 量化线场（Quantized Line Field）—— 首页 Hero 的 ErisPulse 标志可视化
 *
 * 规则概要（源自量化线场风格规范，适配 ErisPulse 宽版词标）：
 *  - 初始化时把 eplogo.svg 栅格化一次，采样为 120×48 亮度表；之后任何
 *    尺寸/DPR 变化都不再重新采样、不再读取像素。
 *  - 每帧画 120 列 × 24 段竖线（每段取相邻两行均值），亮度经缓慢下流的
 *    value noise 微调后按 0.12/0.42/0.89 阈值量化成四档，线宽只用
 *    0.38/1.12/2.28/3.80 × 格宽/5.25，四档透明度 0.15/0.64/0.93/1。
 *  - 指针/触控产生径向脉冲，线段用阻尼弹簧（k=145, c=19）散开并复位；
 *    静止后回到网格坐标，动画全程不调用 Math.random（噪声来自固定 seed
 *    的 xorshift 表）。
 *  - 检测框来自当前线场的亮度积分图（7×7 窗口 + NMS + 目标跟踪弹簧
 *    k=144, c=24），指针悬浮或键盘聚焦时出现——它是视觉效果，不是 AI。
 *  - 动效跟随站点设置（body.no-animations）与系统 prefers-reduced-motion；
 *    页面不可见 / 卡片滚出视口时暂停。
 */

const GRID_W = 120;          // 网格列数
const GRID_H = 48;           // 网格行数
const SEG_ROWS = GRID_H / 2; // 段数（每段跨两行）
const SS = 5;                // 每格超采样像素
const LOGO_AR = 1720 / 600;  // eplogo.svg viewBox 比例（不依赖浏览器给出的 natural size）

const LINE_W = [0.38, 1.12, 2.28, 3.80];
const SEG_ALPHA = [0.15, 0.64, 0.93, 1];
const THRESH = [0.12, 0.42, 0.89];
const SEG_GAP = 0.7;         // 段间窄缝（px）

const NOISE_SEED = 7319;
const BRAND_SEED = 3;        // 品牌噪声水平偏移

const SPRING_K = 145, SPRING_C = 19;
const DET_K = 144, DET_C = 24;

// 运行状态
let card = null, canvas = null, ctx = null;
let brightness = null;                    // Float32Array(GRID_W*GRID_H)
let segState = null;                      // Float32Array(SEG_ROWS*GRID_W*4) 每段 x,y,vx,vy
let segBright = null;                     // Float32Array(SEG_ROWS*GRID_W) 本帧调整后亮度
let noiseTable = null;
let scanField = new Float32Array(GRID_W * GRID_H);
let integral = new Float32Array((GRID_W + 1) * (GRID_H + 1));
let detTargets = [];                      // { id, gx, gy, x, y, vx, vy, alpha, fresh }
let detNextId = 1;

let cssW = 0, cssH = 0, dpr = 1;
let motionOn = true;
let inView = true, pageVisible = !document.hidden;
let cardFocused = false;
let rafId = 0, lastFrameT = 0, animT = 0;
let lastScanAt = 0;

let inkColor = '#4aa3dd';
let detColor = '#267dff';
let mqlDpr = null;

const pointer = { has: false, x: 0, y: 0, px: 0, py: 0, pulse: 0 };
let overlayAlpha = 0;

/* 动效跟随站点设置：设置页「动画」开关写入 body.no-animations，
   叠加系统 prefers-reduced-motion；两者任一生效即静止。 */
const reduceMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');

function computeMotion() {
    return !document.body.classList.contains('no-animations') && !reduceMotionMql.matches;
}

// ==================== 噪声（固定 seed，动画中无 Math.random） ====================

function buildNoise() {
    const N = 128;
    const table = new Float32Array(N * N);
    let s = NOISE_SEED >>> 0;
    const next = () => {
        s ^= s << 13; s >>>= 0;
        s ^= s >>> 17;
        s ^= s << 5; s >>>= 0;
        return s;
    };
    for (let i = 0; i < N * N; i++) table[i] = (next() / 4294967295) * 2 - 1;
    return table;
}

function sampleNoise(x, y) {
    const N = 128;
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % N) + N) % N, y0 = ((yi % N) + N) % N;
    const x1 = (x0 + 1) % N, y1 = (y0 + 1) % N;
    const a = noiseTable[y0 * N + x0], b = noiseTable[y0 * N + x1];
    const c = noiseTable[y1 * N + x0], d = noiseTable[y1 * N + x1];
    const top = a + (b - a) * sx, bottom = c + (d - c) * sx;
    return top + (bottom - top) * sy;
}

// ==================== 一次性采样 ====================

function sampleLogoOnce() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const w = GRID_W * SS, h = GRID_H * SS;
                const off = document.createElement('canvas');
                off.width = w; off.height = h;
                const g = off.getContext('2d', { willReadFrequently: true });
                if (!g) { reject(new Error('canvas 2d unavailable')); return; }
                g.fillStyle = '#000';
                g.fillRect(0, 0, w, h);
                // contain 居中（比例用 viewBox 硬编码，避免浏览器对无宽高 SVG 的 natural size 差异）
                let dw, dh;
                if (LOGO_AR > w / h) { dw = w; dh = w / LOGO_AR; } else { dh = h; dw = h * LOGO_AR; }
                g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
                const data = g.getImageData(0, 0, w, h).data;
                const L = new Float32Array(GRID_W * GRID_H);
                for (let gy = 0; gy < GRID_H; gy++) {
                    for (let gx = 0; gx < GRID_W; gx++) {
                        let sum = 0;
                        for (let sy = 0; sy < SS; sy++) {
                            const rowBase = (gy * SS + sy) * w;
                            for (let sx = 0; sx < SS; sx++) {
                                const p = (rowBase + gx * SS + sx) * 4;
                                sum += 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
                            }
                        }
                        L[gy * GRID_W + gx] = sum / (SS * SS * 255);
                    }
                }
                off.width = 0; off.height = 0;   // 释放像素缓冲
                resolve(L);
            } catch (e) { reject(e); }
        };
        img.onerror = () => reject(new Error('eplogo.svg 加载失败'));
        img.src = 'assets/img/eplogo.svg';
    });
}

// ==================== 物理 ====================

function stepSegments(dt) {
    // 脉冲衰减
    pointer.pulse *= Math.exp(-dt * 5.5);
    if (pointer.pulse < 0.001) pointer.pulse = 0;

    const cellW = cssW / GRID_W, cellH = cssH / GRID_H;
    const R = cssW / 4;                       // 作用半径 = 绘制区宽 1/4
    const usePointer = pointer.has && pointer.pulse > 0;
    const sub = Math.max(1, Math.ceil(dt / (1 / 30)));
    const h = dt / sub;

    for (let i = 0; i < sub; i++) {
        for (let s = 0; s < SEG_ROWS * GRID_W; s++) {
            const o = s * 4;
            let tx = 0, ty = 0;
            if (usePointer) {
                const col = s % GRID_W, row = (s / GRID_W) | 0;
                const sx = (col + 0.5) * cellW + segState[o];
                const sy = (row * 2 + 1) * cellH + segState[o + 1];
                const dx = sx - pointer.x, dy = sy - pointer.y;
                const d = Math.hypot(dx, dy);
                if (d > 0.001 && d < R) {
                    const f = (1 - d / R) * (1 - d / R) * pointer.pulse * 25;
                    tx = (dx / d) * f;
                    ty = (dy / d) * f * 0.58;
                }
            }
            // 阻尼弹簧（半隐式欧拉）
            const ax = SPRING_K * (tx - segState[o]) - SPRING_C * segState[o + 2];
            const ay = SPRING_K * (ty - segState[o + 1]) - SPRING_C * segState[o + 3];
            segState[o + 2] += ax * h;
            segState[o + 3] += ay * h;
            segState[o] += segState[o + 2] * h;
            segState[o + 1] += segState[o + 3] * h;
        }
    }
}

// ==================== 检测框（当前线场的确定性扫描） ====================

function scanDetection(now) {
    if (now - lastScanAt < 100) return;
    lastScanAt = now;

    // 1) 由当前（噪声+位移后的）线场重建亮度场
    scanField.fill(0);
    for (let s = 0; s < SEG_ROWS * GRID_W; s++) {
        const col = s % GRID_W, row = (s / GRID_W) | 0;
        const b = segBright[s];
        if (b <= 0.02) continue;
        const gx = Math.min(GRID_W - 1.001, Math.max(0, col + segState[s * 4] / (cssW / GRID_W)));
        const gyF = row * 2 + 1 + segState[s * 4 + 1] / (cssH / GRID_H);
        const gy = Math.min(GRID_H - 1.001, Math.max(0, gyF));
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const fx = gx - x0, fy = gy - y0;
        const y1 = Math.min(GRID_H - 1, y0 + 1), x1 = Math.min(GRID_W - 1, x0 + 1);
        scanField[y0 * GRID_W + x0] += b * (1 - fx) * (1 - fy);
        scanField[y0 * GRID_W + x1] += b * fx * (1 - fy);
        scanField[y1 * GRID_W + x0] += b * (1 - fx) * fy;
        scanField[y1 * GRID_W + x1] += b * fx * fy;
    }

    // 2) 积分图 + 7×7 窗口均值
    const IW = GRID_W + 1;
    for (let y = 0; y <= GRID_H; y++) {
        let rowSum = 0;
        for (let x = 0; x <= GRID_W; x++) {
            rowSum += (x < GRID_W && y < GRID_H) ? scanField[y * GRID_W + x] : 0;
            integral[y * IW + x] = rowSum + (y ? integral[(y - 1) * IW + x] : 0);
        }
    }
    const half = 3;
    const cands = [];
    for (let cy = half; cy + half < GRID_H; cy++) {
        for (let cx = half; cx + half < GRID_W; cx++) {
            const x0 = cx - half, y0 = cy - half, x1 = cx + half + 1, y1 = cy + half + 1;
            const s = integral[y1 * IW + x1] - integral[y0 * IW + x1] - integral[y1 * IW + x0] + integral[y0 * IW + x0];
            cands.push({ cx, cy, score: s / 49, used: false });
        }
    }
    cands.sort((a, b) => b.score - a.score);
    if (!cands.length || cands[0].score < 0.04) { fadeOutTargets(); return; }

    let pool = cands.filter(c => c.score >= cands[0].score * 0.48);
    // 连续性权重：靠近上一帧目标的候选小幅加分，避免相近分数乱跳
    for (const c of pool) {
        let w = 0;
        for (const t of detTargets) {
            const d2 = (c.cx - t.gx) ** 2 + (c.cy - t.gy) ** 2;
            w = Math.max(w, 0.025 * Math.exp(-d2 / 128));
        }
        c.score += w;
    }
    pool.sort((a, b) => b.score - a.score);

    // 3) 空间非极大值抑制（16 格；不足两个区域放宽到 12 格），最多 3 个
    const picked = [];
    let minDist = 16;
    for (let pass = 0; pass < 2 && picked.length < 3; pass++) {
        for (const c of pool) {
            if (picked.length >= 3) break;
            if (c.used) continue;
            if (picked.every(p => Math.hypot(p.cx - c.cx, p.cy - c.cy) >= minDist)) {
                picked.push(c); c.used = true;
            }
        }
        if (picked.length >= 2) break;
        minDist = 12;
    }
    if (!picked.length) { fadeOutTargets(); return; }

    // 4) 与旧目标匹配（12 格以内保留身份）
    const next = [];
    for (const c of picked) {
        const gx = c.cx + 1, gy = c.cy + 1;   // 选中窗口向外扩一格
        let best = null, bestD = 12;
        for (const t of detTargets) {
            const d = Math.hypot(t.gx - gx, t.gy - gy);
            if (d < bestD) { bestD = d; best = t; }
        }
        if (best) {
            best.gx = gx; best.gy = gy; best.matched = true;
            next.push(best);
        } else {
            next.push({ id: detNextId++, gx, gy, x: gx, y: gy, vx: 0, vy: 0, alpha: 0, matched: true });
        }
    }
    detTargets = next;
}

function fadeOutTargets() {
    detTargets.forEach(t => t.matched = false);
}

function stepDetection(dt, overlayTarget) {
    overlayAlpha += (overlayTarget - overlayAlpha) * (1 - Math.exp(-dt * 16));
    const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / sub;
    for (let i = 0; i < sub; i++) {
        for (const t of detTargets) {
            const ax = DET_K * (t.gx - t.x) - DET_C * t.vx;
            const ay = DET_K * (t.gy - t.y) - DET_C * t.vy;
            t.vx += ax * h; t.vy += ay * h;
            t.x += t.vx * h; t.y += t.vy * h;
        }
    }
    for (const t of detTargets) {
        t.alpha += ((t.matched ? 1 : 0) - t.alpha) * (1 - Math.exp(-dt * 16));
    }
    detTargets = detTargets.filter(t => t.matched || t.alpha > 0.04);
}

// ==================== 绘制 ====================

function tierOf(b) {
    if (b < THRESH[0]) return 0;
    if (b < THRESH[1]) return 1;
    if (b < THRESH[2]) return 2;
    return 3;
}

function renderLines() {
    const cellW = cssW / GRID_W, cellH = cssH / GRID_H;
    const unit = cellW / 5.25;
    ctx.clearRect(0, 0, cssW, cssH);

    // 计算每段调整后亮度（含噪声），并按四档分组
    const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    for (let row = 0; row < SEG_ROWS; row++) {
        for (let col = 0; col < GRID_W; col++) {
            const s = row * GRID_W + col;
            const base = (brightness[row * 2 * GRID_W + col] + brightness[(row * 2 + 1) * GRID_W + col]) / 2;
            const n = sampleNoise(col * 0.15 + BRAND_SEED, row * 0.16 - animT * 0.17);
            const b = base * 0.94 + n * 0.12 * (0.25 + base * 0.75);
            segBright[s] = Math.max(0, Math.min(1, b));
            const tier = tierOf(segBright[s]);
            const o = s * 4;
            const x = (col + 0.5) * cellW + segState[o];
            const y1 = row * 2 * cellH + SEG_GAP / 2 + segState[o + 1];
            const y2 = y1 + cellH * 2 - SEG_GAP;
            const p = paths[tier];
            p.moveTo(x, y1);
            p.lineTo(x, y2);
        }
    }

    ctx.lineCap = 'butt';
    for (let tier = 0; tier < 4; tier++) {
        ctx.lineWidth = LINE_W[tier] * unit;
        ctx.globalAlpha = SEG_ALPHA[tier];
        ctx.strokeStyle = inkColor;
        ctx.stroke(paths[tier]);
    }
    ctx.globalAlpha = 1;
}

function renderOverlay() {
    if (overlayAlpha < 0.04 || !detTargets.length) return;
    const cellW = cssW / GRID_W, cellH = cssH / GRID_H;
    ctx.save();
    ctx.globalAlpha = overlayAlpha;
    ctx.strokeStyle = detColor;
    ctx.fillStyle = detColor;
    ctx.lineWidth = 1;
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

    const box = 4.5;   // 半宽（格）——7×7 窗口扩一格
    const pts = detTargets.filter(t => t.alpha > 0.04).map(t => ({
        x: t.x * cellW, y: t.y * cellH, alpha: t.alpha, gx: Math.round(t.x), gy: Math.round(t.y),
    }));

    // 框之间的细连线（透明度取两端较低者）
    for (let i = 0; i + 1 < pts.length; i++) {
        ctx.globalAlpha = overlayAlpha * Math.min(pts[i].alpha, pts[i + 1].alpha) * 0.55;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    for (const p of pts) {
        ctx.globalAlpha = overlayAlpha * p.alpha;
        const x0 = p.x - box * cellW, y0 = p.y - box * cellH;
        const w = box * 2 * cellW, hh = box * 2 * cellH;
        // 淡填充
        ctx.fillStyle = 'rgba(38,125,255,0.06)';
        ctx.fillRect(x0, y0, w, hh);
        ctx.fillStyle = detColor;
        // 角标（四角 L 形短线）
        const c = Math.min(8, w / 3);
        ctx.beginPath();
        ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0);
        ctx.moveTo(x0 + w - c, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, y0 + c);
        ctx.moveTo(x0 + w, y0 + hh - c); ctx.lineTo(x0 + w, y0 + hh); ctx.lineTo(x0 + w - c, y0 + hh);
        ctx.moveTo(x0 + c, y0 + hh); ctx.lineTo(x0, y0 + hh); ctx.lineTo(x0, y0 + hh - c);
        ctx.stroke();
        // 坐标
        ctx.fillText(`${p.gx},${p.gy}`, x0 + 3, y0 - 4 > 9 ? y0 - 4 : y0 + hh + 11);
    }
    ctx.restore();
}

function renderStatic() {
    if (!ctx || !brightness || cssW === 0) return;
    renderLines();
    renderOverlay();
}

// ==================== 生命周期 ====================

function animating() {
    return motionOn && inView && pageVisible && brightness;
}

function frame(now) {
    rafId = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameT) / 1000));
    lastFrameT = now;
    animT += dt;

    stepSegments(dt);
    renderLines();
    scanDetection(now);
    stepDetection(dt, pointer.has || cardFocused ? 1 : 0);
    renderOverlay();

    if (animating()) schedule();
    else rafId = 0;
}

function schedule() {
    if (!rafId && animating()) {
        rafId = requestAnimationFrame(frame);
    }
}

function fit() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const d = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    if (rect.width === cssW && rect.height === cssH && d === dpr) return;
    cssW = rect.width; cssH = rect.height; dpr = d;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!animating()) renderStatic();   // 暂停时尺寸变化也要补静帧
}

function readTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    inkColor = dark ? '#6a9df0' : '#4aa3dd';
    detColor = dark ? '#5b9dff' : '#267dff';
}

/* 动效状态变化（设置开关 / 系统偏好）：静止时补一帧稳定静帧 */
function applyMotion(on) {
    if (motionOn === on) return;
    motionOn = on;
    if (on) {
        lastFrameT = performance.now();
        schedule();
    } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        renderStatic();
    }
}

function fallbackToLogoImage() {
    if (!card) return;
    card.classList.add('linefield-fallback');
    const img = document.createElement('img');
    img.src = 'assets/img/eplogo.svg';
    img.alt = 'ErisPulse';
    img.className = 'linefield-fallback-logo';
    card.appendChild(img);
}

// ==================== 入口 ====================

export function initLineField() {
    card = document.getElementById('linefield-card');
    if (!card) return;
    canvas = document.getElementById('linefield-canvas');

    if (!canvas || !canvas.getContext) { fallbackToLogoImage(); return; }
    ctx = canvas.getContext('2d');
    if (!ctx || typeof Path2D === 'undefined') { fallbackToLogoImage(); return; }

    noiseTable = buildNoise();
    segState = new Float32Array(SEG_ROWS * GRID_W * 4);
    segBright = new Float32Array(SEG_ROWS * GRID_W);
    readTheme();

    // 主题变化 → 换墨色
    new MutationObserver(readTheme).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-theme'],
    });

    // 指针 / 触控
    card.addEventListener('pointerenter', e => {
        const r = canvas.getBoundingClientRect();
        pointer.has = true; pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
        pointer.px = pointer.x; pointer.py = pointer.y;
    });
    card.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
        if (Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py) > 1.5) {
            pointer.pulse = 1;
            pointer.px = pointer.x; pointer.py = pointer.y;
        }
        schedule();
    });
    card.addEventListener('pointerleave', () => { pointer.has = false; });
    card.addEventListener('pointerdown', e => {
        const r = canvas.getBoundingClientRect();
        pointer.has = true; pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
        pointer.pulse = 1;
        schedule();
    });

    // 键盘聚焦显示检测框
    card.addEventListener('focus', () => { cardFocused = true; schedule(); });
    card.addEventListener('blur', () => { cardFocused = false; });

    // 动效跟随站点设置与系统偏好
    motionOn = computeMotion();
    new MutationObserver(() => applyMotion(computeMotion())).observe(document.body, {
        attributes: true, attributeFilter: ['class'],
    });
    try {
        reduceMotionMql.addEventListener('change', () => applyMotion(computeMotion()));
    } catch (e) { /* 旧浏览器不支持 change 监听时忽略 */ }

    // 滚出视口 / 页面隐藏 → 暂停
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            inView = entries.some(e => e.isIntersecting);
            if (inView) { lastFrameT = performance.now(); schedule(); }
        }, { threshold: 0.01 }).observe(card);
    }
    document.addEventListener('visibilitychange', () => {
        pageVisible = !document.hidden;
        if (pageVisible) { lastFrameT = performance.now(); schedule(); }
    });

    // 尺寸变化不重采样，只重建像素缓冲
    if ('ResizeObserver' in window) {
        new ResizeObserver(() => fit()).observe(card);
    } else {
        window.addEventListener('resize', fit);
    }
    // DPR 单独变化（CSS 尺寸不变）也要更新 backing store
    try {
        mqlDpr = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        const onDpr = () => {
            fit();
            mqlDpr = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
            mqlDpr.addEventListener('change', onDpr);
        };
        mqlDpr.addEventListener('change', onDpr);
    } catch (e) { /* 不支持 resolution 查询时退回 resize */ }

    // 唯一一次像素采样
    sampleLogoOnce().then(L => {
        brightness = L;
        fit();
        if (motionOn) { lastFrameT = performance.now(); schedule(); }
        else renderStatic();
    }).catch(err => {
        console.warn('[linefield] 采样失败，退化为静态 logo:', err);
        fallbackToLogoImage();
    });
}
