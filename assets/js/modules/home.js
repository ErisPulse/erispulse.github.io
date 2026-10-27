








import { I18n } from '../i18n.js';
import { CONFIG } from '../config.js';

 
var featuresInitialized = false;
var featuresPrevActive = -1;
var featuresUpdateFn = null;
var featuresMeasureFn = null;

var bannerTimer = null;
var bannerCurrentIndex = 0;

export function setupHomeAnimations() {
    var reduceMotion = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animationsOff = document.body.classList.contains('no-animations') || reduceMotion;

    if (!animationsOff && !featuresInitialized) {
        featuresInitialized = true;
        setupScrollDrivenFeatures();
    } else if (!animationsOff && featuresUpdateFn) {
        featuresPrevActive = -1;
         
        if (featuresMeasureFn) featuresMeasureFn();
        requestAnimationFrame(featuresUpdateFn);
    }
     
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
         
        pane.style.removeProperty('--stack-scale');
        pane.style.removeProperty('--stack-dim');
        pane.style.removeProperty('--stack-shift');
    });
}










function setupScrollDrivenFeatures() {
    var section = document.getElementById('features-scroll-section');
    var stage = document.getElementById('features-scroll-stage');
    var panes = Array.prototype.slice.call(document.querySelectorAll('.feature-immersive'));
    var navContainer = document.getElementById('feature-immersive-nav');

    if (!section || !stage || panes.length === 0) return;

    var COUNT = panes.length;

     
    var SHRINK_FIRST = 0.06;
    var SHRINK_LAYER = 0.018;
    var SCALE_MIN = 0.84;
    var DIM_FIRST = 0.42;
    var DIM_LAYER = 0.12;
    var DIM_MAX = 0.66;
    var SHIFT_PER_LAYER = 8;    
    var SHIFT_MAX_DEPTH = 2.5;

     
    if (navContainer) {
        navContainer.innerHTML = '';
        panes.forEach(function (_, i) {
            var dot = document.createElement('div');
            dot.className = 'feature-nav-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('data-index', i);
            dot.addEventListener('click', function () {
                var seatY = seatScrollY(i);
                if (seatY !== null) {
                    window.scrollTo({ top: seatY, behavior: 'smooth' });
                }
            });
            navContainer.appendChild(dot);
        });
    }

    var dots = navContainer ? navContainer.querySelectorAll('.feature-nav-dot') : [];

     
    var paneH = 0;
    var tops = [];

    function measure() {
        paneH = panes[0].getBoundingClientRect().height || 0;
        tops = panes.map(function (pane) {
            var t = parseFloat(getComputedStyle(pane).top);
            return isNaN(t) ? 0 : t;
        });
    }

     
    function seatScrollY(i) {
        if (!paneH) return null;
        var stageTopDoc = stage.getBoundingClientRect().top + (window.pageYOffset || 0);
        return stageTopDoc + i * paneH - (tops[i] || 0) + 4;
    }

    function clamp01(v) {
        return v < 0 ? 0 : (v > 1 ? 1 : v);
    }

    function update() {
        if (document.body.classList.contains('no-animations')) return;

        var vh = window.innerHeight;
        var rect = stage.getBoundingClientRect();
        var stageTopDoc = rect.top + (window.pageYOffset || 0);
        var scrolled = window.pageYOffset || 0;

        if (navContainer) {
            navContainer.classList.toggle('visible', rect.top < vh && rect.bottom > 0);
        }

         
        if (rect.bottom < 0 || rect.top > vh) return;

         
        var topIdx = 0;
        for (var j = COUNT - 1; j >= 0; j--) {
            if (scrolled >= stageTopDoc + j * paneH - (tops[j] || 0)) {
                topIdx = j;
                break;
            }
        }

         
        var next = topIdx + 1;
        var p = 0;
        if (next < COUNT) {
            var enterY = stageTopDoc + next * paneH - vh;
            var seatY = stageTopDoc + next * paneH - (tops[next] || 0);
            p = clamp01((scrolled - enterY) / Math.max(1, seatY - enterY));
        }

        for (var i = 0; i < COUNT; i++) {
             
            var depth = (i <= topIdx) ? (topIdx - i + p) : 0;
            var full = Math.min(depth, 1);
            var extra = Math.max(0, depth - 1);

            panes[i].style.setProperty('--stack-scale',
                Math.max(SCALE_MIN, 1 - SHRINK_FIRST * full - SHRINK_LAYER * extra).toFixed(4));
            panes[i].style.setProperty('--stack-dim',
                Math.min(DIM_MAX, DIM_FIRST * full + DIM_LAYER * extra).toFixed(3));
            panes[i].style.setProperty('--stack-shift',
                (-(SHIFT_PER_LAYER * Math.min(depth, SHIFT_MAX_DEPTH))).toFixed(1) + 'px');
        }

        setActive(topIdx);
    }

    function setActive(index) {
        if (index === featuresPrevActive) return;

         
        panes.forEach(function (pane, i) {
            pane.classList.toggle('active', i === index);
        });

        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === index);
        });

        featuresPrevActive = index;
    }

    featuresMeasureFn = measure;
    featuresUpdateFn = update;

    measure();

    function onScroll() {
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
        requestAnimationFrame(function () {
            measure();
            update();
        });
    }, { passive: true });

    setTimeout(update, 100);

    if (typeof Prism !== 'undefined') {
        panes.forEach(function (pane) {
            var code = pane.querySelector('code');
            if (code) {
                try { Prism.highlightElement(code); } catch (e) {   }
            }
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
    if (!document.getElementById('hero-stats')) return;

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
