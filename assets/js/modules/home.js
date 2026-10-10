/**
 * 首页交互：Hero canvas 之外的动画
 *  - Banner 轮播
 *  - 滚动驱动的特性展示
 *  - 安装命令浮层（Install Overlay）
 *  - Hero GitHub 实时数据条
 *  - 社区速览条带（最新 Discussions）
 */

import { I18n } from '../i18n.js';
import { CONFIG } from '../config.js';
import { CommunityManager } from './community.js';

// 仅首页模块使用的本地状态
var featuresInitialized = false;
var featuresPrevActive = -1;
var featuresUpdateFn = null;

var bannerTimer = null;
var bannerCurrentIndex = 0;

export function setupHomeAnimations() {
    if (!document.body.classList.contains('no-animations') && !featuresInitialized) {
        featuresInitialized = true;
        setupScrollDrivenFeatures();
    } else if (!document.body.classList.contains('no-animations') && featuresUpdateFn) {
        featuresPrevActive = -1;
        requestAnimationFrame(featuresUpdateFn);
    }
    // Hero 代码窗（产品图）独立高亮，与特性面板同一 Prism 模式
    highlightHeroCode();
    updateHeroMinHeight();
    window.addEventListener('resize', updateHeroMinHeight, { passive: true });
    document.addEventListener('erispulse-lang-changed', updateHeroMinHeight);
}

/**
 * Hero 铺满首屏：实测 hero 距视口顶部的真实距离（固定导航、banner 文字换行、
 * 语言切换后的高度变化全都涵盖），写入 CSS 变量供 min-height 使用。
 * banner 轮播每次切换也会调用（文案行数不同高度会变）。
 */
function updateHeroMinHeight() {
    var hero = document.querySelector('.hero-section');
    var banner = document.querySelector('.ai-vibe-banner');
    if (!hero || !banner) return;
    var top = hero.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight) return;   // 不在首屏视口内不校准
    document.documentElement.style.setProperty('--hero-offset', Math.round(top) + 'px');
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

    function resetBannerTimer(count) {
        clearInterval(bannerTimer);
        bannerTimer = setInterval(function () {
            var nextIndex = (bannerCurrentIndex + 1) % count;
            switchToSlide(nextIndex);
        }, 5000);
    }

    resetBannerTimer(slides.length);
}

export function resetFeatureCards() {
    var panes = document.querySelectorAll('.feature-immersive');
    panes.forEach(function (pane) {
        pane.classList.remove('active');
    });
}

function setupScrollDrivenFeatures() {
    var section = document.getElementById('features-scroll-section');
    var stage = document.getElementById('features-scroll-stage');
    var panes = document.querySelectorAll('.feature-immersive');
    var navContainer = document.getElementById('feature-immersive-nav');

    if (!section || !stage || panes.length === 0) return;

    var navDotsContainer = document.getElementById('feature-immersive-nav');
    if (navDotsContainer) {
        navDotsContainer.innerHTML = '';
        panes.forEach(function (_, i) {
            var dot = document.createElement('div');
            dot.className = 'feature-nav-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('data-index', i);
            dot.addEventListener('click', function () {
                var scrollStart = section.offsetTop;
                var scrollRange = section.offsetHeight - window.innerHeight;
                var targetProgress = i / (panes.length - 1);
                window.scrollTo({ top: scrollStart + scrollRange * targetProgress, behavior: 'smooth' });
            });
            navDotsContainer.appendChild(dot);
        });
    }

    var dots = navDotsContainer ? navDotsContainer.querySelectorAll('.feature-nav-dot') : [];
    var currentActive = 0;
    var rafId = null;

    function update() {
        if (document.body.classList.contains('no-animations')) return;

        var rect = section.getBoundingClientRect();
        var scrollStart = 0;
        var scrollEnd = rect.height - window.innerHeight;
        var scrolled = -rect.top;

        if (navContainer) {
            if (scrolled >= scrollStart && scrolled <= scrollEnd) {
                navContainer.classList.add('visible');
            } else {
                navContainer.classList.remove('visible');
            }
        }

        if (scrolled < scrollStart) {
            setActive(0);
            return;
        }
        if (scrolled > scrollEnd) {
            setActive(panes.length - 1);
            return;
        }

        var progress = scrolled / scrollEnd;
        var featureIndex = Math.min(
            Math.floor(progress * panes.length),
            panes.length - 1
        );

        setActive(featureIndex);
    }

    function setActive(index) {
        if (index === featuresPrevActive) return;

        panes.forEach(function (pane, i) {
            if (i === index) {
                pane.classList.remove('leaving');
                pane.classList.add('active');
            } else if (pane.classList.contains('active')) {
                pane.classList.add('leaving');
                pane.classList.remove('active');
                setTimeout(function () {
                    pane.classList.remove('leaving');
                }, 450);
            } else {
                pane.classList.remove('active', 'leaving');
            }
        });

        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === index);
        });

        featuresPrevActive = index;
    }

    featuresUpdateFn = update;

    function onScroll() {
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            update();
            rafId = null;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
        requestAnimationFrame(update);
    }, { passive: true });

    setTimeout(update, 100);

    if (typeof Prism !== 'undefined') {
        panes.forEach(function (pane) {
            var code = pane.querySelector('code');
            if (code) Prism.highlightElement(code);
        });
    }
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

// ==================== 社区速览条带 ====================

var COMMUNITY_CACHE_KEY = 'erispulse-community-cache';
var teaserList = [];

function escapeHtmlHome(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
}

function timeAgoHome(iso) {
    if (!iso) return '';
    var t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    var min = Math.floor((Date.now() - t) / 60000);
    if (min < 1) return I18n.t('community.time.justNow');
    if (min < 60) return I18n.t('community.time.minutesAgo', { n: min });
    var hours = Math.floor(min / 60);
    if (hours < 24) return I18n.t('community.time.hoursAgo', { n: hours });
    var days = Math.floor(hours / 24);
    if (days < 30) return I18n.t('community.time.daysAgo', { n: days });
    try { return new Date(iso).toLocaleDateString(); } catch (e) { return ''; }
}

function renderTeaser() {
    var grid = document.getElementById('home-community-grid');
    if (!grid) return;

    var items = teaserList.slice(0, 3);
    if (!items.length) {
        grid.innerHTML = '<div class="home-community-empty">' + escapeHtmlHome(I18n.t('home.community.empty')) + '</div>';
        return;
    }

    grid.innerHTML = items.map(function (d) {
        var c = d.category || {};
        return '<a class="home-community-card" href="' + escapeHtmlHome(d.html_url || '#community') + '" data-number="' + d.number + '">' +
            '<div class="home-community-card-top">' +
            (c.name
                ? '<span class="home-community-chip">' + escapeHtmlHome((function(){ var e = CommunityManager.categoryEmoji ? CommunityManager.categoryEmoji(c) : ''; return (e ? e + ' ' : ''); })() + CommunityManager.categoryLabel(c)) + '</span>'
                : '') +
            '<span class="home-community-card-comments"><i class="far fa-comment"></i> ' + (typeof d.comments === 'number' ? d.comments : 0) + '</span>' +
            '</div>' +
            '<span class="home-community-card-title">' + escapeHtmlHome(d.title || '') + '</span>' +
            '<span class="home-community-card-meta">' + escapeHtmlHome(d.author && d.author.login ? d.author.login : '') + ' · ' + escapeHtmlHome(timeAgoHome(d.created_at)) + '</span>' +
            '</a>';
    }).join('');

    // 点击卡片直接打开站内详情弹窗（弹窗在 community 视图片段里，所有页面都已注入）
    grid.querySelectorAll('.home-community-card').forEach(function (card) {
        card.addEventListener('click', function (e) {
            e.preventDefault();
            var number = card.getAttribute('data-number');
            if (number) {
                CommunityManager.openDetail(number);
            } else {
                window.location.hash = 'community';
            }
        });
    });
}

function applyTeaserData(data, source, fetchedAt) {
    if (!data || !Array.isArray(data.discussions)) return;
    teaserList = data.discussions;
    // 写回与社区页共享的缓存键，社区页打开时秒出
    try {
        localStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify({ data: data, source: source, fetchedAt: fetchedAt }));
    } catch (e) { /* 存储异常忽略 */ }
    renderTeaser();
}

/** 首页社区速览：实时优先 —— 缓存仅用于秒出首屏，随后总是拉取实时数据覆盖 */
export function initCommunityTeaser() {
    var grid = document.getElementById('home-community-grid');
    if (!grid) return;

    // 有缓存先秒出（无论新鲜度），实时数据到达后覆盖
    try {
        var cached = JSON.parse(localStorage.getItem(COMMUNITY_CACHE_KEY));
        if (cached && cached.data && Array.isArray(cached.data.discussions) && cached.data.discussions.length) {
            teaserList = cached.data.discussions;
            renderTeaser();
        }
    } catch (e) { /* 缓存损坏忽略 */ }

    fetch(CONFIG.API.discussions)
        .then(function (resp) {
            if (!resp.ok) throw new Error('worker ' + resp.status);
            return resp.json();
        })
        .then(function (data) {
            applyTeaserData(data, 'worker', Date.now());
        })
        .catch(function () {
            // Worker 不可用 → Actions 定时同步的静态快照
            fetch('assets/data/discussions.json', { cache: 'no-cache' })
                .then(function (resp) {
                    if (!resp.ok) throw new Error('snapshot ' + resp.status);
                    return resp.json();
                })
                .then(function (data) {
                    var ts = data && data.generated_at ? new Date(data.generated_at).getTime() : Date.now();
                    applyTeaserData(data, 'snapshot', isNaN(ts) ? Date.now() : ts);
                })
                .catch(function (e) {
                    console.warn('[home] 社区速览加载失败:', e);
                    if (!teaserList.length && grid) {
                        grid.innerHTML = '<div class="home-community-empty">' + escapeHtmlHome(I18n.t('home.community.empty')) + '</div>';
                    }
                });
        });

    // 语言切换后按新语言重渲染（分类名、相对时间）
    document.addEventListener('erispulse-lang-changed', renderTeaser);
}
