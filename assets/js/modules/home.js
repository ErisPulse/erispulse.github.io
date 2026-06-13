/**
 * 首页交互：Hero canvas 之外的动画
 *  - Banner 轮播
 *  - 滚动驱动的特性展示
 *  - 安装命令浮层（Install Overlay）
 */

import { I18n } from '../i18n.js';

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
    var startBtn = document.getElementById('hero-start-btn');
    var expanded = document.getElementById('hero-actions-expanded');
    var overlay = document.getElementById('hero-install-overlay');
    var installBtn = document.getElementById('hero-install-btn');
    var closeBtn = document.getElementById('install-overlay-close');
    var copyBtn = document.getElementById('install-copy-btn');
    var copyIcon = document.getElementById('install-copy-icon');
    var codeText = document.getElementById('install-code-text');
    var codePrefix = document.getElementById('install-code-prefix');
    var tabs = overlay ? overlay.querySelectorAll('.install-tab') : [];

    if (startBtn && expanded) {
        function collapseExpanded() {
            if (!expanded.classList.contains('visible')) return;
            expanded.classList.remove('visible');
            setTimeout(function () {
                startBtn.classList.remove('hidden');
                startBtn.classList.remove('hiding');
            }, 300);
        }

        startBtn.addEventListener('click', function () {
            startBtn.classList.add('hiding');
            setTimeout(function () {
                startBtn.classList.add('hidden');
                expanded.classList.add('visible');
            }, 300);
        });

        document.addEventListener('click', function (e) {
            if (expanded.classList.contains('visible') &&
                !expanded.contains(e.target) &&
                e.target !== startBtn &&
                !startBtn.contains(e.target)) {
                collapseExpanded();
            }
        });
    }

    if (!overlay || !installBtn) return;

    var commands = {
        windows: function () { return I18n.t('install.winCmd'); },
        unix: function () { return I18n.t('install.unixCmd'); }
    };

    function updateCommand(platform) {
        if (!codeText || !codePrefix) return;
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

    var isWin = navigator.platform && navigator.platform.indexOf('Win') !== -1;
    if (isWin) {
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
