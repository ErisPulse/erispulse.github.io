








import { I18n } from '../i18n.js';
import { CONFIG } from '../config.js';

 
var featureScrollBound = false;

var bannerTimer = null;
var bannerCurrentIndex = 0;

export function setupHomeAnimations() {
     
     
     
    setupFeatureStack();
     
    highlightHeroCode();
}

function highlightHeroCode() {
    var heroCode = document.querySelector('.hero-code-window code');
    if (heroCode && typeof Prism !== 'undefined') {
        try { Prism.highlightElement(heroCode); } catch (e) {   }
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

     
    function applyMarquee() {
        if (!bannerText) return 0;
        bannerText.classList.remove('marquee');
        var wrapper = bannerText.parentElement;
        if (!wrapper) return 0;
        var overflow = bannerText.scrollWidth - wrapper.clientWidth;
        if (overflow <= 4) return 0;    

        var duration = Math.max(6000, Math.round(overflow / 30 * 1000));   
        bannerText.style.setProperty('--marquee-distance', (overflow + 16) + 'px');
        bannerText.style.setProperty('--marquee-duration', duration + 'ms');
         
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








function setupFeatureStack() {
    var section = document.getElementById('features-scroll-section');
    if (!section) return;
    unbindFeatureScroll();
    var stage = document.getElementById('features-scroll-stage');
    var panes = Array.prototype.slice.call(section.querySelectorAll('.feature-immersive'));
    if (!stage || !panes.length) return;

     
    panes.forEach(function (pane) {
        if (pane.dataset.fxFx === '1') return;
        pane.dataset.fxFx = '1';
        var code = pane.querySelector('code');
        if (code && typeof Prism !== 'undefined') {
            try { Prism.highlightElement(code); } catch (e) {   }
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
     
    _featureScrollHandler = onScroll;
    tick();
}

 
var _featureScrollHandler = null;

function unbindFeatureScroll() {
    if (_featureScrollHandler) {
        window.removeEventListener('scroll', _featureScrollHandler);
        window.removeEventListener('resize', _featureScrollHandler);
        _featureScrollHandler = null;
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

 
export function initHeroStats() {
    if (!document.getElementById('stat-stars') && !document.getElementById('hero-stats')) return;

    try {
        var cached = JSON.parse(localStorage.getItem(STATS_CACHE_KEY));
        if (cached && cached.stats && Date.now() - cached.fetchedAt < STATS_CACHE_TTL) {
            renderHeroStats(cached.stats);
            return;
        }
    } catch (e) {   }

    fetch(CONFIG.API.siteStats)
        .then(function (resp) {
            if (!resp.ok) throw new Error('stats ' + resp.status);
            return resp.json();
        })
        .then(function (data) {
            if (!data || !data.stats) throw new Error('bad payload');
            try {
                localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ stats: data.stats, fetchedAt: Date.now() }));
            } catch (e) {   }
            renderHeroStats(data.stats);
        })
        .catch(function (e) {
            console.warn('[home] 数据条加载失败，保持降级显示:', e);
        });
}
