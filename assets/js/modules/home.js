/**
 * 首页交互
 *  - Banner 轮播
 *  - Bento 特性网格（入场阶梯淡入 + 悬停聚光）
 *  - 安装命令浮层（Install Overlay）
 *  - Hero GitHub 实时数据条
 *  - 社区速览条带（最新 Discussions）
 */

import { I18n } from '../i18n.js';
import { CONFIG } from '../config.js';

// 仅首页模块使用的本地状态
var featureScrollBound = false;

var bannerTimer = null;
var bannerCurrentIndex = 0;

export function setupHomeAnimations() {
    var reduceMotion = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animationsOff = document.body.classList.contains('no-animations') || reduceMotion;

    if (!animationsOff) setupFeatureStack();
    // Hero 代码窗（产品图）独立高亮
    highlightHeroCode();
}

function highlightHeroCode() {
    var heroCode = document.querySelector('.hero-code-window code');
    if (heroCode && typeof Prism !== 'undefined') {
        try { Prism.highlightElement(heroCode); } catch (e) { /* 高亮失败不影响展示 */ }
    }
}

export function resetBanner() {
    clearInterval(bannerTimer);
    initBannerCarousel();
}

export function initBannerCarousel() {
    var bannerIcon = document.getElementById('banner-icon');
    var bannerText = document.getElementById('banner-text');
    var bannerLink = document.getElementById('banner-link');
    var dotsContainer = document.getElementById('banner-dots');

    if (!bannerText || !bannerLink || !dotsContainer) return;

    var slides = I18n.t('banner.slides');
    if (!slides || !Array.isArray(slides) || slides.length === 0) return;

    dotsContainer.innerHTML = '';
    slides.forEach(function (_, i) {
        var dot = document.createElement('div');
        dot.className = 'ai-vibe-banner-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', function () {
            switchToSlide(i);
            resetBannerTimer(slides.length);
        });
        dotsContainer.appendChild(dot);
    });

    /** 文字溢出容器时启用跑马灯：实测溢出量与滚动时长写入 CSS 变量，返回展示毫秒数 */
    function applyMarquee() {
        if (!bannerText) return 0;
        bannerText.classList.remove('marquee');
        var wrapper = bannerText.parentElement;
        if (!wrapper) return 0;
        var overflow = bannerText.scrollWidth - wrapper.clientWidth;
        if (overflow <= 4) return 0;   // 一屏放得下（PC 宽屏）：纯停留，不滚

        var duration = Math.max(6000, Math.round(overflow / 30 * 1000));  // 30px/s，至少 6s
        bannerText.style.setProperty('--marquee-distance', (overflow + 16) + 'px');
        bannerText.style.setProperty('--marquee-duration', duration + 'ms');
        // 强制重排后启用动画（同帧添加不触发）
        void bannerText.offsetWidth;
        bannerText.classList.add('marquee');
        return duration;
    }

    function switchToSlide(index) {
        var slide = slides[index];
        if (!slide) return;

        bannerText.classList.add('fade-out');

        setTimeout(function () {
            if (bannerIcon) bannerIcon.className = 'fas ' + slide.icon;
            bannerText.textContent = slide.text;
            bannerLink.href = slide.link;

            bannerText.classList.remove('fade-out');
            bannerText.classList.add('fade-in');

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    bannerText.classList.remove('fade-in');
                });
            });
        }, 350);

        var dots = dotsContainer.querySelectorAll('.ai-vibe-banner-dot');
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === index);
        });

        bannerCurrentIndex = index;
        if (typeof updateHeroMinHeight === 'function') updateHeroMinHeight();
    }

    /**
     * 轮播节奏：滚动时长 + 1s 停顿，与最少展示时间 5s 取大
     * （PC 一屏显示全时不会瞬间切走；移动端长文案滚完才切下一条）
     */
    function scheduleNext(count) {
        clearTimeout(bannerTimer);
        var marqueeMs = applyMarquee();
        var wait = Math.max(marqueeMs + 1000, 5000);
        bannerTimer = setTimeout(function () {
            switchToSlide((bannerCurrentIndex + 1) % count);
            scheduleNext(count);
        }, wait);
    }

    scheduleNext(slides.length);

    // 语言切换/视口变化后重测溢出（文案长度变化会改变滚动距离）
    document.addEventListener('erispulse-lang-changed', function () {
        applyMarquee();
    });
    window.addEventListener('resize', function () {
        if (bannerTimer) {
            clearTimeout(bannerTimer);
            scheduleNext(slides.length);
        }
    }, { passive: true });
}

export function resetFeatureCards() {
    var panes = document.querySelectorAll('.feature-immersive');
    panes.forEach(function (pane) {
        pane.classList.remove('active');
        pane.classList.add('in-view');
        var card = pane.querySelector('.feature-immersive-card');
        if (card) {
            card.style.removeProperty('--mx');
            card.style.removeProperty('--my');
        }
    });
}

/**
 * 特性信封舞台：
 *  - 舞台 sticky 居中，section 轨道 = 张数 × 视口高
 *  - 每张卡按滚动进度从信封里抽出（下方一屏 → 居中），到位后被后一张叠加
 *  - 进度由滚动位置直接计算，往回滚按同一路径收回信封
 *  - no-animations / prefers-reduced-motion：退化为纵向平铺，内容始终可读
 */
function setupFeatureStack() {
    var section = document.getElementById('features-scroll-section');
    if (!section) return;
    var stage = document.getElementById('features-scroll-stage');
    var panes = Array.prototype.slice.call(section.querySelectorAll('.feature-immersive'));
    if (!stage || !panes.length) return;

    // 代码高亮只做一次
    panes.forEach(function (pane) {
        if (pane.dataset.fxFx === '1') return;
        pane.dataset.fxFx = '1';
        var code = pane.querySelector('code');
        if (code && typeof Prism !== 'undefined') {
            try { Prism.highlightElement(code); } catch (e) { /* 高亮失败不影响展示 */ }
        }
    });

    var flat = document.body.classList.contains('no-animations')
        || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (flat) {
        section.style.height = 'auto';
        section.classList.add('stack-flat');
        panes.forEach(function (p) {
            p.classList.remove('active', 'leaving');
            p.style.transform = '';
            p.style.opacity = '';
            p.style.zIndex = '';
        });
        return;
    }
    section.classList.remove('stack-flat');
    section.style.height = (panes.length * 100) + 'vh';

    var prev = -1;
    var ticking = false;

    function setActive(index) {
        if (index === prev) return;
        prev = index;
        panes.forEach(function (pane, i) {
            if (i === index) {
                pane.classList.remove('leaving');
                pane.classList.add('active');
            } else if (pane.classList.contains('active')) {
                pane.classList.add('leaving');
                pane.classList.remove('active');
                setTimeout(function () { pane.classList.remove('leaving'); }, 450);
            } else {
                pane.classList.remove('active', 'leaving');
            }
        });
    }

    function tick() {
        ticking = false;
        var rect = section.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        var total = rect.height - vh;
        var scrolled = -rect.top;
        var idx = 0;
        if (total > 0 && scrolled > 0) {
            idx = Math.min(Math.floor((scrolled / total) * panes.length), panes.length - 1);
        }
        setActive(Math.max(0, idx));
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    tick();
}

export function initInstallOverlay() {
    var overlay = document.getElementById('hero-install-overlay');
    var installBtn = document.getElementById('hero-install-btn');
    var closeBtn = document.getElementById('install-overlay-close');
    var copyBtn = document.getElementById('install-copy-btn');
    var copyIcon = document.getElementById('install-copy-icon');
    var codeText = document.getElementById('install-code-text');
    var codePrefix = document.getElementById('install-code-prefix');
    var tabs = overlay ? overlay.querySelectorAll('.install-tab') : [];
    var codeBlock = document.getElementById('install-code-block');
    var androidBlock = document.getElementById('install-android-block');
    var hint = document.getElementById('install-hint');

    if (!overlay || !installBtn) return;

    var commands = {
        windows: function () { return I18n.t('install.winCmd'); },
        unix: function () { return I18n.t('install.unixCmd'); }
    };

    function updateCommand(platform) {
        var isAndroid = platform === 'android';
        // Android 走启动器下载而非命令行
        if (codeBlock) codeBlock.classList.toggle('is-hidden', isAndroid);
        if (androidBlock) androidBlock.classList.toggle('is-hidden', !isAndroid);
        if (hint) hint.classList.toggle('is-hidden', isAndroid);
        if (isAndroid || !codeText || !codePrefix) return;
        codeText.textContent = commands[platform]();
        codeText.title = commands[platform]();
        codePrefix.textContent = platform === 'windows' ? 'PS>' : '$';
    }

    function openOverlay(e) {
        if (e) e.preventDefault();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeOverlay() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    installBtn.addEventListener('click', openOverlay);

    closeBtn.addEventListener('click', closeOverlay);

    overlay.querySelector('.hero-install-backdrop').addEventListener('click', closeOverlay);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeOverlay();
        }
    });

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            updateCommand(tab.dataset.platform);
        });
    });

    var isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
        || (navigator.userAgentData && navigator.userAgentData.mobile);
    var isWin = !isMobileUA && navigator.platform && navigator.platform.indexOf('Win') !== -1;
    if (isMobileUA) {
        // 移动设备默认展示启动器下载
        tabs[0].classList.remove('active');
        var androidTab = overlay.querySelector('.install-tab[data-platform="android"]');
        if (androidTab) androidTab.classList.add('active');
        updateCommand('android');
    } else if (isWin) {
        updateCommand('windows');
    } else {
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
        updateCommand('unix');
    }

    copyBtn.addEventListener('click', function () {
        var text = codeText.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        copyIcon.className = 'fas fa-check';
        copyBtn.classList.add('copied');
        setTimeout(function () {
            copyIcon.className = 'fas fa-copy';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
}

// ==================== Hero GitHub 实时数据条 ====================

var STATS_CACHE_KEY = 'erispulse-site-stats';
var STATS_CACHE_TTL = 10 * 60 * 1000;

function formatCount(n) {
    if (typeof n !== 'number' || isNaN(n)) return '--';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
}

function renderHeroStats(stats) {
    if (!stats) return;
    var map = {
        'stat-stars': formatCount(stats.stars),
        'stat-contributors': formatCount(stats.contributors),
        'stat-release': stats.latest_release || '--',
        'stat-discussions': formatCount(stats.discussions),
    };
    Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && map[id] != null) el.textContent = map[id];
    });
}

/** 单次拉取 /api/stats（Worker 边缘缓存 1h），失败保持 '--' 降级 */
export function initHeroStats() {
    if (!document.getElementById('hero-stats')) return;

    try {
        var cached = JSON.parse(localStorage.getItem(STATS_CACHE_KEY));
        if (cached && cached.stats && Date.now() - cached.fetchedAt < STATS_CACHE_TTL) {
            renderHeroStats(cached.stats);
            return;
        }
    } catch (e) { /* 缓存损坏则忽略 */ }

    fetch(CONFIG.API.siteStats)
        .then(function (resp) {
            if (!resp.ok) throw new Error('stats ' + resp.status);
            return resp.json();
        })
        .then(function (data) {
            if (!data || !data.stats) throw new Error('bad payload');
            try {
                localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ stats: data.stats, fetchedAt: Date.now() }));
            } catch (e) { /* 存储异常忽略 */ }
            renderHeroStats(data.stats);
        })
        .catch(function (e) {
            console.warn('[home] 数据条加载失败，保持降级显示:', e);
        });
}
