/**
 * ErisPulse Hero Canvas — Nebula Constellation Network
 * 全屏随机分布的星座网络，带星云光晕、粒子拖尾、鼠标引力场
 */
(function () {
    'use strict';

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const CFG = {
        nodeCount: 55,
        hubRadius: 6,
        nodeRadius: 2.8,
        edgeMaxDist: 180,
        mouseRadius: 200,
        gravityStrength: 25,
        particleSpeed: 1.2,
        maxParticles: 100,
        trailLength: 6,
        pulseSpeed: 2.5,
        pulseMaxRadius: 400,
        breathSpeed: 0.002,
        breathAmp: 0.35,
        nebulaCount: 4,
        snippetCount: 7,
    };

    let canvas, ctx, W, H;
    let nodes = [], particles = [], pulses = [], nebulae = [], snippets = [];
    let mouse = { x: -9999, y: -9999, active: false };
    let rafId = null, noAnim = false;
    let pRGB = [74, 156, 216], aRGB = [124, 196, 168];
    let bgRGB = [249, 248, 244], textRGB = [44, 62, 80];
    let hoveredNode = null, selectedNode = null;
    let nodeTooltip = null;

    const EVENT_LABELS = {
        hub: ['EventBus', 'on_message()', 'on_connect()'],
        adapter: ['Yunhu', 'Telegram', 'OneBot12', 'Email'],
        module: ['@command', '@notice', '@request', '@meta', 'SendDSL', 'Storage', '@schedule', 'Middleware', 'Plugin', 'Config'],
    };
    const CODE_SNIPPETS = [
        '@command("hello")', 'await event.reply()', 'sdk.adapter.get()',
        'async def on_load()', 'Send.To("group").Text()', '@notice.on_friend_add()',
        'sdk.storage.set()', 'sdk.logger.info()', '@message.on_message()',
        'sdk.run(keep_running=True)', '@request.on_group_req()', 'from ErisPulse import sdk',
    ];

    function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rgba(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }
    function rand(a, b) { return Math.random() * (b - a) + a; }

    function readColors() {
        try {
            const s = getComputedStyle(document.documentElement);
            const p = s.getPropertyValue('--hero-primary-rgb').trim();
            const a = s.getPropertyValue('--hero-accent-rgb').trim();
            const bg = s.getPropertyValue('--hero-bg-rgb').trim();
            if (p) pRGB = p.split(',').map(Number);
            if (a) aRGB = a.split(',').map(Number);
            if (bg) bgRGB = bg.split(',').map(Number);
            const tx = s.getPropertyValue('--hero-text-rgb').trim();
            if (tx) textRGB = tx.split(',').map(Number);
        } catch (_) {}
    }

    /* ===== 星云光晕 ===== */
    function createNebulae() {
        nebulae = [];
        for (let i = 0; i < CFG.nebulaCount; i++) {
            const useAccent = Math.random() < 0.35;
            const baseRGB = useAccent ? aRGB : pRGB;
            nebulae.push({
                x: rand(W * 0.1, W * 0.9),
                y: rand(H * 0.1, H * 0.9),
                radius: rand(Math.min(W, H) * 0.2, Math.min(W, H) * 0.45),
                rgb: [
                    baseRGB[0] + rand(-20, 20),
                    baseRGB[1] + rand(-20, 20),
                    baseRGB[2] + rand(-20, 20),
                ].map(v => Math.round(Math.max(0, Math.min(255, v)))),
                alpha: rand(0.03, 0.07),
                vx: rand(-0.08, 0.08),
                vy: rand(-0.06, 0.06),
                phase: rand(0, Math.PI * 2),
                breathSpeed: rand(0.0008, 0.0015),
            });
        }
    }

    function updateNebulae(time) {
        for (const n of nebulae) {
            n.x += n.vx;
            n.y += n.vy;
            // 边界反弹
            if (n.x < -n.radius * 0.3 || n.x > W + n.radius * 0.3) n.vx *= -1;
            if (n.y < -n.radius * 0.3 || n.y > H + n.radius * 0.3) n.vy *= -1;
            n.currentAlpha = n.alpha * (0.8 + 0.2 * Math.sin(time * n.breathSpeed + n.phase));
        }
    }

    function drawNebulae() {
        for (const n of nebulae) {
            const r = Math.max(1, n.radius);
            const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
            g.addColorStop(0, rgba(n.rgb, n.currentAlpha));
            g.addColorStop(0.4, rgba(n.rgb, n.currentAlpha * 0.5));
            g.addColorStop(1, rgba(n.rgb, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ===== 节点（全屏随机分布） ===== */
    function createNodes() {
        nodes = [];
        const pad = 30;

        // 中心 hub 节点
        const cx = W / 2, cy = H / 2;
        nodes.push({
            x: cx, y: cy, ox: cx, oy: cy, r: CFG.hubRadius,
            type: 'hub', phase: rand(0, 6.28), energy: 0,
            label: 'EventBus', drawR: CFG.hubRadius,
        });

        // 4 个适配器节点 - 分布在画布四个象限中心附近
        const adapterLabels = EVENT_LABELS.adapter;
        const quadrantCenters = [
            { x: W * 0.25, y: H * 0.3 },
            { x: W * 0.75, y: H * 0.3 },
            { x: W * 0.25, y: H * 0.7 },
            { x: W * 0.75, y: H * 0.7 },
        ];
        for (let i = 0; i < 4; i++) {
            const qc = quadrantCenters[i];
            const x = qc.x + rand(-W * 0.1, W * 0.1);
            const y = qc.y + rand(-H * 0.1, H * 0.1);
            nodes.push({
                x, y, ox: x, oy: y, r: CFG.nodeRadius + 1.2,
                type: 'adapter', phase: rand(0, 6.28), energy: 0,
                label: adapterLabels[i], drawR: CFG.nodeRadius + 1.2,
            });
        }

        // 模块节点 - 全屏随机分布，带最小间距避免重叠
        const moduleCount = CFG.nodeCount - 5;
        const labelArr = EVENT_LABELS.module;
        const minDist = 40;
        for (let i = 0; i < moduleCount; i++) {
            let x, y, attempts = 0;
            do {
                x = rand(pad, W - pad);
                y = rand(pad, H - pad);
                attempts++;
            } while (attempts < 50 && nodes.some(n => dist(n, { x, y }) < minDist));

            nodes.push({
                x, y, ox: x, oy: y, r: CFG.nodeRadius,
                type: 'module', phase: rand(0, 6.28), energy: 0,
                label: labelArr[i % labelArr.length], drawR: CFG.nodeRadius,
            });
        }
    }

    /* ===== 动态邻近连线（每帧计算，不用 edges 数组） ===== */
    function drawEdges() {
        const maxD = CFG.edgeMaxDist;
        const maxD2 = maxD * maxD;
        // hub 连接所有适配器
        const hub = nodes[0];
        for (let i = 1; i <= 4; i++) {
            const n = nodes[i];
            const en = Math.max(hub.energy, n.energy);
            ctx.beginPath();
            ctx.moveTo(hub.x, hub.y);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = rgba(pRGB, 0.06 + en * 0.25);
            ctx.lineWidth = 0.5 + en * 1.8;
            ctx.stroke();
        }

        // 所有节点之间的邻近连线（星座效果）
        for (let i = 1; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 > maxD2) continue;
                const d = Math.sqrt(d2);
                const ratio = 1 - d / maxD;
                const en = Math.max(a.energy, b.energy);
                const alpha = ratio * (0.04 + en * 0.18);
                if (alpha < 0.005) continue;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = rgba(pRGB, alpha);
                ctx.lineWidth = 0.3 + ratio * 0.6 + en * 1.0;
                ctx.stroke();
            }
        }
    }

    /* ===== 代码片段漂浮 ===== */
    function createSnippets() {
        snippets = [];
        for (let i = 0; i < CFG.snippetCount; i++) {
            snippets.push({
                text: CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)],
                x: rand(W * 0.02, W * 0.98),
                y: rand(H * 0.05, H * 0.95),
                alpha: 0,
                targetAlpha: rand(0.03, 0.08),
                vx: rand(-0.12, 0.12),
                vy: rand(-0.08, 0.08),
                size: rand(10, 13),
                life: rand(500, 1000),
                age: 0,
            });
        }
    }

    function updateSnippets() {
        for (const s of snippets) {
            s.x += s.vx;
            s.y += s.vy;
            s.age++;
            const fadeIn = 80, fadeOut = 80;
            if (s.age < fadeIn) s.alpha = lerp(0, s.targetAlpha, s.age / fadeIn);
            else if (s.age > s.life - fadeOut) s.alpha = lerp(s.targetAlpha, 0, (s.age - s.life + fadeOut) / fadeOut);
            else s.alpha = s.targetAlpha;
            if (s.age >= s.life) {
                s.text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
                s.x = rand(W * 0.02, W * 0.98);
                s.y = rand(H * 0.05, H * 0.95);
                s.age = 0;
                s.life = rand(500, 1000);
                s.targetAlpha = rand(0.03, 0.08);
            }
        }
    }

    function drawSnippets() {
        ctx.font = '11px "Fira Code", "Courier New", monospace';
        for (const s of snippets) {
            if (s.alpha < 0.003) continue;
            ctx.fillStyle = rgba(pRGB, s.alpha);
            ctx.fillText(s.text, s.x, s.y);
        }
    }

    /* ===== 粒子（带拖尾） ===== */
    function getConnectedEdges(node) {
        // 返回与 node 连接的所有 {from, to} 对（基于距离阈值）
        const result = [];
        const maxD = CFG.edgeMaxDist;
        for (let i = 0; i < nodes.length; i++) {
            const other = nodes[i];
            if (other === node) continue;
            if (dist(node, other) < maxD) {
                // hub 始终连接适配器
                if (node.type === 'hub' && other.type === 'adapter') {
                    result.push({ from: node, to: other });
                } else if (other.type === 'hub' && node.type === 'adapter') {
                    result.push({ from: other, to: node });
                } else if (node.type !== 'hub' && other.type !== 'hub') {
                    result.push({ from: node, to: other });
                }
            }
        }
        return result;
    }

    function spawnParticle(edge, fromNode) {
        if (particles.length >= CFG.maxParticles) return;
        const trail = [];
        particles.push({
            edge, t: fromNode ? 0 : 1, dir: fromNode ? 1 : -1,
            speed: CFG.particleSpeed * (0.7 + Math.random() * 0.5),
            alpha: 0, trail,
        });
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            // 记录拖尾位置
            const e = p.edge;
            const cx = lerp(e.from.x, e.to.x, p.t);
            const cy = lerp(e.from.y, e.to.y, p.t);
            p.trail.unshift({ x: cx, y: cy, alpha: p.alpha });
            if (p.trail.length > CFG.trailLength) p.trail.pop();

            p.t += p.dir * p.speed * 0.006;
            p.alpha = Math.min(1, p.alpha + 0.06);

            if (p.t > 1 || p.t < 0) {
                const target = p.t > 1 ? p.edge.to : p.edge.from;
                if (target.energy < 0.3) {
                    const edges = getConnectedEdges(target);
                    const filtered = edges.filter(e => e !== p.edge);
                    for (const ne of filtered) {
                        if (Math.random() < 0.25) {
                            const isFrom = ne.from === target;
                            spawnParticle(ne, isFrom);
                        }
                    }
                }
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        for (const p of particles) {
            // 绘制拖尾
            for (let j = p.trail.length - 1; j >= 1; j--) {
                const t = p.trail[j];
                const ratio = 1 - j / p.trail.length;
                const a = t.alpha * ratio * 0.4;
                const r = 0.8 + ratio * 0.6;
                ctx.beginPath();
                ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
                ctx.fillStyle = rgba(aRGB, a);
                ctx.fill();
            }
            // 绘制粒子主体
            if (p.trail.length > 0) {
                const head = p.trail[0];
                const r = 1.4 + p.alpha * 1.0;
                ctx.beginPath();
                ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
                ctx.fillStyle = rgba(aRGB, p.alpha * 0.9);
                ctx.fill();
                // 光晕
                const gl = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r * 4);
                gl.addColorStop(0, rgba(aRGB, p.alpha * 0.2));
                gl.addColorStop(1, rgba(aRGB, 0));
                ctx.fillStyle = gl;
                ctx.beginPath();
                ctx.arc(head.x, head.y, r * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /* ===== 脉冲 ===== */
    function spawnPulse(x, y) {
        pulses.push({ x, y, radius: 0, alpha: 0.5, hitNodes: new Set() });
    }

    function updatePulses() {
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.radius += CFG.pulseSpeed;
            p.alpha *= 0.984;
            for (const n of nodes) {
                if (p.hitNodes.has(n)) continue;
                if (Math.abs(dist(p, n) - p.radius) < 20) {
                    p.hitNodes.add(n);
                    n.energy = Math.min(1, n.energy + 0.6);
                    const edges = getConnectedEdges(n);
                    for (const e of edges) {
                        if (Math.random() > 0.4) continue;
                        const isFrom = e.from === n;
                        spawnParticle(e, isFrom);
                    }
                }
            }
            if (p.radius > CFG.pulseMaxRadius || p.alpha < 0.01) pulses.splice(i, 1);
        }
    }

    function drawPulses() {
        for (const p of pulses) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(aRGB, p.alpha * 0.3);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // 内环
            if (p.radius > 10) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
                ctx.strokeStyle = rgba(aRGB, p.alpha * 0.12);
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }

    /* ===== 鼠标引力场 + 节点更新 ===== */
    function updateNodes(time) {
        for (const n of nodes) {
            // 呼吸效果
            const breath = Math.sin(time * CFG.breathSpeed + n.phase) * CFG.breathAmp;
            n.drawR = Math.max(1, n.r + breath);

            // 鼠标距离 → 能量
            const md = dist(n, mouse);
            n.energy = lerp(n.energy, mouse.active ? Math.max(0, 1 - md / CFG.mouseRadius) : 0, 0.06);

            // 鼠标引力场：节点轻微偏移向鼠标
            if (mouse.active && md < CFG.mouseRadius && md > 1) {
                const force = (1 - md / CFG.mouseRadius) * CFG.gravityStrength;
                const angle = Math.atan2(mouse.y - n.oy, mouse.x - n.ox);
                n.x = lerp(n.x, n.ox + Math.cos(angle) * force, 0.08);
                n.y = lerp(n.y, n.oy + Math.sin(angle) * force, 0.08);
            } else {
                n.x = lerp(n.x, n.ox, 0.03);
                n.y = lerp(n.y, n.oy, 0.03);
            }
        }

        // 鼠标附近自动生成粒子
        if (mouse.active) {
            for (const n of nodes) {
                if (Math.random() > 0.015) continue;
                const d = dist(n, mouse);
                if (d < CFG.mouseRadius) {
                    const edges = getConnectedEdges(n);
                    if (edges.length === 0) continue;
                    const e = edges[Math.floor(Math.random() * edges.length)];
                    spawnParticle(e, e.from === n);
                }
            }
        }
    }

    function drawNodes() {
        for (const n of nodes) {
            const e = n.energy;
            const isHov = n === hoveredNode || n === selectedNode;
            const baseA = n.type === 'hub' ? 0.8 : 0.4;
            const alpha = baseA + e * 0.4 + (isHov ? 0.3 : 0);
            const color = n.type === 'hub' ? aRGB : (n.type === 'adapter' ? aRGB : pRGB);
            const r = n.drawR + e * 2.5 + (isHov ? 2 : 0);

            // 光晕
            if (e > 0.06 || isHov) {
                const glR = r * 6;
                const gl = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glR);
                gl.addColorStop(0, rgba(color, (e + (isHov ? 0.3 : 0)) * 0.2));
                gl.addColorStop(1, rgba(color, 0));
                ctx.fillStyle = gl;
                ctx.beginPath();
                ctx.arc(n.x, n.y, glR, 0, Math.PI * 2);
                ctx.fill();
            }

            // 节点本体
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = rgba(color, alpha);
            ctx.fill();

            // 悬浮外环
            if (isHov) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
                ctx.strokeStyle = rgba(color, 0.4);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    /* ===== Tooltip ===== */
    function updateTooltip() {
        if (!nodeTooltip) {
            nodeTooltip = document.getElementById('hero-node-tooltip');
        }
        const target = hoveredNode;
        if (target && target.label) {
            if (!nodeTooltip) {
                nodeTooltip = document.createElement('div');
                nodeTooltip.id = 'hero-node-tooltip';
                nodeTooltip.style.cssText = 'position:fixed;pointer-events:none;z-index:10;font:600 12px "Fira Code",monospace;padding:4px 10px;border-radius:6px;transition:opacity 0.15s;white-space:nowrap;';
                document.querySelector('.hero-section').appendChild(nodeTooltip);
            }
            const rect = canvas.getBoundingClientRect();
            nodeTooltip.style.left = (rect.left + target.x + 14) + 'px';
            nodeTooltip.style.top = (rect.top + target.y - 10) + 'px';
            nodeTooltip.style.background = rgba(target.type === 'hub' ? aRGB : pRGB, 0.15);
            nodeTooltip.style.color = rgba(textRGB, 0.9);
            nodeTooltip.style.border = '1px solid ' + rgba(target.type === 'hub' ? aRGB : pRGB, 0.3);
            nodeTooltip.style.backdropFilter = 'blur(6px)';
            nodeTooltip.style.opacity = '1';
            nodeTooltip.textContent = target.label;
        } else if (nodeTooltip) {
            nodeTooltip.style.opacity = '0';
        }
    }

    /* ===== 网格背景 ===== */
    function drawGrid() {
        ctx.fillStyle = rgba(pRGB, 0.03);
        const gs = 50;
        for (let x = gs; x < W; x += gs) {
            for (let y = gs; y < H; y += gs) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    /* ===== 鼠标光圈 ===== */
    function drawMouseGlow() {
        if (!mouse.active || mouse.x < 0) return;
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CFG.mouseRadius);
        g.addColorStop(0, rgba(pRGB, 0.06));
        g.addColorStop(0.5, rgba(pRGB, 0.02));
        g.addColorStop(1, rgba(pRGB, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CFG.mouseRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    /* ===== 主循环 ===== */
    function update(time) {
        updateNebulae(time);
        updateNodes(time);
        updateParticles();
        updatePulses();
        updateSnippets();

        hoveredNode = null;
        if (mouse.active) {
            for (const n of nodes) {
                if (dist(n, mouse) < n.drawR + 14) { hoveredNode = n; break; }
            }
        }
        updateTooltip();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = rgba(bgRGB, 1);
        ctx.fillRect(0, 0, W, H);

        drawNebulae();
        drawGrid();
        drawMouseGlow();
        drawSnippets();
        drawEdges();
        drawPulses();
        drawParticles();
        drawNodes();
    }

    function loop(time) {
        if (!noAnim) update(time);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    /* ===== Resize ===== */
    function resize() {
        const section = canvas.parentElement;
        const rect = section.getBoundingClientRect();
        W = rect.width; H = rect.height;
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        createNodes();
        createNebulae();
        createSnippets();
        particles = [];
        pulses = [];
    }

    /* ===== 事件处理 ===== */
    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMove(e) {
        const p = getCanvasPos(e);
        mouse.x = p.x; mouse.y = p.y; mouse.active = true;
        canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';
    }

    function onLeave() {
        mouse.active = false; mouse.x = -9999; mouse.y = -9999;
        canvas.style.cursor = 'crosshair';
    }

    function onClick(e) {
        const p = getCanvasPos(e);
        let clicked = null;
        for (const n of nodes) { if (dist(n, p) < n.drawR + 14) { clicked = n; break; } }
        if (clicked) {
            selectedNode = clicked;
            spawnBurst(clicked);
            spawnPulse(clicked.x, clicked.y);
            setTimeout(() => { selectedNode = null; }, 1500);
        } else {
            spawnPulse(p.x, p.y);
        }
    }

    function onTouchMove(e) {
        // 不调用 preventDefault — 允许页面正常滚动
        const t = e.touches[0];
        const p = getCanvasPos(t);
        mouse.x = p.x; mouse.y = p.y; mouse.active = true;
    }

    function onTouchStart(e) {
        const t = e.touches[0];
        const p = getCanvasPos(t);
        mouse.x = p.x; mouse.y = p.y; mouse.active = true;
        let clicked = null;
        for (const n of nodes) { if (dist(n, p) < n.drawR + 20) { clicked = n; break; } }
        if (clicked) {
            selectedNode = clicked;
            spawnBurst(clicked);
            spawnPulse(clicked.x, clicked.y);
            setTimeout(() => { selectedNode = null; }, 1500);
        } else {
            spawnPulse(p.x, p.y);
        }
    }

    function onTouchEnd() {
        mouse.active = false; mouse.x = -9999; mouse.y = -9999;
    }

    function spawnBurst(node) {
        const edges = getConnectedEdges(node);
        for (const e of edges) {
            if (Math.random() < 0.65) spawnParticle(e, e.from === node);
        }
    }

    let resizeTimer;
    function debResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); }

    /* ===== 初始化 / 销毁 ===== */
    function init() {
        canvas = document.getElementById('hero-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        noAnim = document.body.classList.contains('no-animations');
        readColors();
        resize();
        canvas.addEventListener('mousemove', onMove, { passive: true });
        canvas.addEventListener('mouseleave', onLeave, { passive: true });
        canvas.addEventListener('click', onClick, { passive: true });
        canvas.addEventListener('touchmove', onTouchMove, { passive: true });
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('resize', debResize);
        new MutationObserver(readColors).observe(document.documentElement, {
            attributes: true, attributeFilter: ['data-theme', 'class', 'style']
        });
        rafId = requestAnimationFrame(loop);
    }

    function destroy() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        window.removeEventListener('resize', debResize);
    }

    window.HeroCanvas = { init, destroy };
})();