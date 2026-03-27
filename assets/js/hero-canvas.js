/**
 * ErisPulse Hero Canvas — Event Pulse Network
 */
(function () {
    'use strict';

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const CFG = {
        nodeCount: 35,
        hubRadius: 7,
        nodeRadius: 3.2,
        edgeMaxDist: 200,
        mouseRadius: 160,
        particleSpeed: 1.0,
        maxParticles: 80,
        pulseSpeed: 2.2,
        pulseMaxRadius: 350,
        breathSpeed: 0.002,
        breathAmp: 0.35,
    };

    let canvas, ctx, W, H;
    let nodes = [], edges = [], particles = [], pulses = [], snippets = [];
    let mouse = { x: -9999, y: -9999, active: false };
    let rafId = null, noAnim = false;
    let pRGB = [90, 99, 223], aRGB = [94, 209, 179];
    let bgRGB = [10, 10, 26], textRGB = [255, 255, 255];
    let hoveredNode = null, selectedNode = null;
    let nodeTooltip = null;

    const EVENT_LABELS = {
        hub: ['EventBus', 'on_message()', 'on_connect()'],
        adapter: ['Yunhu', 'Telegram', 'OneBot12', 'Email'],
        module: ['@command', '@notice', '@request', '@meta', 'SendDSL', 'Storage'],
    };
    const CODE_SNIPPETS = [
        '@command("hello")', 'await event.reply()', 'sdk.adapter.get()',
        'async def on_load()', 'Send.To("group").Text()', '@notice.on_friend_add()',
        'sdk.storage.set()', 'sdk.logger.info()', '@message.on_message()',
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

    function createNodes() {
        nodes = [];
        const cx = W / 2, cy = H / 2;
        const spread = Math.min(W, H) * 0.42;

        nodes.push({ x: cx, y: cy, ox: cx, oy: cy, r: CFG.hubRadius, type: 'hub', phase: rand(0, 6.28), energy: 0, label: 'EventBus' });

        const innerR = spread * 0.3;
        const angles4 = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
        const labels = EVENT_LABELS.adapter;
        for (let i = 0; i < 4; i++) {
            const ang = angles4[i] + rand(-0.15, 0.15);
            const x = cx + Math.cos(ang) * innerR;
            const y = cy + Math.sin(ang) * innerR;
            nodes.push({ x, y, ox: x, oy: y, r: CFG.nodeRadius + 1.2, type: 'adapter', phase: rand(0, 6.28), energy: 0, label: labels[i] });
        }

        const outerCount = CFG.nodeCount - 5;
        for (let i = 0; i < outerCount; i++) {
            const ang = (Math.PI * 2 / outerCount) * i + rand(-0.12, 0.12);
            const r = spread * (0.65 + Math.random() * 0.35);
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            const labelArr = EVENT_LABELS.module;
            nodes.push({ x, y, ox: x, oy: y, r: CFG.nodeRadius, type: 'module', phase: rand(0, 6.28), energy: 0, label: labelArr[i % labelArr.length] });
        }
    }

    function createEdges() {
        edges = [];
        const hub = nodes[0];
        for (let i = 1; i <= 4; i++) edges.push({ from: hub, to: nodes[i], w: 0.8 });

        for (let i = 1; i <= 4; i++) {
            const targets = [];
            for (let j = 5; j < nodes.length; j++) {
                if (dist(nodes[i], nodes[j]) < CFG.edgeMaxDist * 1.15) targets.push(j);
            }
            const sh = targets.sort(() => Math.random() - 0.5);
            const cnt = Math.min(2 + Math.floor(Math.random() * 3), sh.length);
            for (let k = 0; k < cnt; k++) edges.push({ from: nodes[i], to: nodes[sh[k]], w: 0.45 });
        }

        for (let j = 5; j < nodes.length; j++) {
            if (Math.random() < 0.2) edges.push({ from: hub, to: nodes[j], w: 0.25 });
        }

        for (let i = 5; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (dist(nodes[i], nodes[j]) < CFG.edgeMaxDist * 0.55 && Math.random() < 0.1) {
                    edges.push({ from: nodes[i], to: nodes[j], w: 0.15 });
                }
            }
        }
    }

    function createSnippets() {
        snippets = [];
        for (let i = 0; i < 6; i++) {
            snippets.push({
                text: CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)],
                x: rand(W * 0.05, W * 0.95),
                y: rand(H * 0.1, H * 0.9),
                alpha: 0,
                targetAlpha: rand(0.04, 0.1),
                vx: rand(-0.15, 0.15),
                vy: rand(-0.1, 0.1),
                size: rand(10, 13),
                life: rand(400, 800),
                age: 0,
            });
        }
    }

    function spawnParticle(edge, fromNode) {
        if (particles.length >= CFG.maxParticles) return;
        particles.push({ edge, t: fromNode ? 0 : 1, dir: fromNode ? 1 : -1, speed: CFG.particleSpeed * (0.7 + Math.random() * 0.5), alpha: 0 });
    }

    function spawnPulse(x, y) {
        pulses.push({ x, y, radius: 0, alpha: 0.5, hitNodes: new Set() });
    }

    function spawnBurst(node) {
        for (const e of edges) {
            const isFrom = e.from === node, isTo = e.to === node;
            if ((isFrom || isTo) && Math.random() < 0.7) spawnParticle(e, isFrom);
        }
    }

    function update(time) {
        for (const n of nodes) {
            const breath = Math.sin(time * CFG.breathSpeed + n.phase) * CFG.breathAmp;
            n.drawR = Math.max(1, n.r + breath);
            const md = dist(n, mouse);
            n.energy = lerp(n.energy, mouse.active ? Math.max(0, 1 - md / CFG.mouseRadius) : 0, 0.06);
        }

        if (mouse.active) {
            for (const e of edges) {
                if (Math.random() > 0.02) continue;
                const dF = dist(e.from, mouse), dT = dist(e.to, mouse);
                if (dF < CFG.mouseRadius || dT < CFG.mouseRadius) spawnParticle(e, dF < dT);
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.t += p.dir * p.speed * 0.007;
            p.alpha = Math.min(1, p.alpha + 0.05);
            if (p.t > 1 || p.t < 0) {
                const target = p.t > 1 ? p.edge.to : p.edge.from;
                if (target.energy < 0.25) {
                    for (const e of edges) {
                        if (e === p.edge) continue;
                        const iF = e.from === target, iT = e.to === target;
                        if ((iF || iT) && Math.random() < 0.3) spawnParticle(e, iF);
                    }
                }
                particles.splice(i, 1);
            }
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.radius += CFG.pulseSpeed;
            p.alpha *= 0.984;
            for (const n of nodes) {
                if (p.hitNodes.has(n)) continue;
                if (Math.abs(dist(p, n) - p.radius) < 18) {
                    p.hitNodes.add(n);
                    n.energy = Math.min(1, n.energy + 0.6);
                    for (const e of edges) {
                        if (Math.random() > 0.45) continue;
                        const iF = e.from === n, iT = e.to === n;
                        if (iF || iT) spawnParticle(e, iF);
                    }
                }
            }
            if (p.radius > CFG.pulseMaxRadius || p.alpha < 0.01) pulses.splice(i, 1);
        }

        for (const s of snippets) {
            s.x += s.vx;
            s.y += s.vy;
            s.age++;
            if (s.age < 60) s.alpha = lerp(0, s.targetAlpha, s.age / 60);
            else if (s.age > s.life - 60) s.alpha = lerp(s.targetAlpha, 0, (s.age - s.life + 60) / 60);
            if (s.age >= s.life) {
                s.text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
                s.x = rand(W * 0.05, W * 0.95);
                s.y = rand(H * 0.1, H * 0.9);
                s.age = 0;
                s.life = rand(400, 800);
                s.targetAlpha = rand(0.04, 0.1);
            }
        }

        hoveredNode = null;
        if (mouse.active) {
            for (const n of nodes) {
                if (dist(n, mouse) < n.drawR + 12) { hoveredNode = n; break; }
            }
        }
        updateTooltip();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = rgba(bgRGB, 1);
        ctx.fillRect(0, 0, W, H);

        // Grid dots
        ctx.fillStyle = rgba(pRGB, 0.04);
        const gs = 40;
        for (let x = gs; x < W; x += gs) {
            for (let y = gs; y < H; y += gs) {
                ctx.fillRect(x, y, 1, 1);
            }
        }

        if (mouse.active && mouse.x > 0) {
            const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CFG.mouseRadius);
            g.addColorStop(0, rgba(pRGB, 0.08));
            g.addColorStop(1, rgba(pRGB, 0));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        // Snippets
        ctx.font = '11px "Fira Code", "Courier New", monospace';
        for (const s of snippets) {
            ctx.fillStyle = rgba(pRGB, s.alpha);
            ctx.fillText(s.text, s.x, s.y);
        }

        // Edges
        for (const e of edges) {
            const en = Math.max(e.from.energy, e.to.energy);
            ctx.beginPath();
            ctx.moveTo(e.from.x, e.from.y);
            ctx.lineTo(e.to.x, e.to.y);
            ctx.strokeStyle = rgba(pRGB, 0.05 + en * 0.2 * e.w);
            ctx.lineWidth = 0.4 + en * 1.5 * e.w;
            ctx.stroke();
        }

        // Pulses
        for (const p of pulses) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(aRGB, p.alpha * 0.35);
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Particles
        for (const p of particles) {
            const e = p.edge;
            const x = lerp(e.from.x, e.to.x, p.t);
            const y = lerp(e.from.y, e.to.y, p.t);
            const r = 1.2 + p.alpha * 1.2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = rgba(aRGB, p.alpha * 0.9);
            ctx.fill();
            const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
            gl.addColorStop(0, rgba(aRGB, p.alpha * 0.25));
            gl.addColorStop(1, rgba(aRGB, 0));
            ctx.fillStyle = gl;
            ctx.beginPath();
            ctx.arc(x, y, r * 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nodes
        for (const n of nodes) {
            const e = n.energy;
            const isHov = n === hoveredNode || n === selectedNode;
            const baseA = n.type === 'hub' ? 0.75 : 0.35;
            const alpha = baseA + e * 0.45 + (isHov ? 0.3 : 0);
            const color = n.type === 'hub' ? aRGB : pRGB;
            const r = n.drawR + e * 2.5 + (isHov ? 2 : 0);

            if (e > 0.08 || isHov) {
                const gl = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
                gl.addColorStop(0, rgba(color, (e + (isHov ? 0.3 : 0)) * 0.22));
                gl.addColorStop(1, rgba(color, 0));
                ctx.fillStyle = gl;
                ctx.beginPath();
                ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = rgba(color, alpha);
            ctx.fill();

            if (isHov) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
                ctx.strokeStyle = rgba(color, 0.4);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

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

    function loop(time) {
        if (!noAnim) update(time);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function resize() {
        const section = canvas.parentElement;
        const rect = section.getBoundingClientRect();
        W = rect.width; H = rect.height;
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        createNodes(); createEdges(); createSnippets();
    }

    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMove(e) {
        const p = getCanvasPos(e);
        mouse.x = p.x; mouse.y = p.y; mouse.active = true;
        canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';
    }
    function onLeave() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; canvas.style.cursor = 'crosshair'; }
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
    function onTouchMove(e) { e.preventDefault(); const t = e.touches[0]; const p = getCanvasPos(t); mouse.x = p.x; mouse.y = p.y; mouse.active = true; }
    function onTouchStart(e) {
        const t = e.touches[0]; const p = getCanvasPos(t);
        mouse.x = p.x; mouse.y = p.y; mouse.active = true;
        let clicked = null;
        for (const n of nodes) { if (dist(n, p) < n.drawR + 20) { clicked = n; break; } }
        if (clicked) { selectedNode = clicked; spawnBurst(clicked); spawnPulse(clicked.x, clicked.y); setTimeout(() => { selectedNode = null; }, 1500); }
        else spawnPulse(p.x, p.y);
    }
    function onTouchEnd() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; }

    let resizeTimer;
    function debResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); }

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
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('resize', debResize);
        new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
        rafId = requestAnimationFrame(loop);
    }

    function destroy() { if (rafId) cancelAnimationFrame(rafId); rafId = null; window.removeEventListener('resize', debResize); }
    window.HeroCanvas = { init, destroy };
})();