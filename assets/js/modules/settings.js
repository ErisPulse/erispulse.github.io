/**
 * 设置与主题：用户偏好持久化、主题切换、全局语言切换器、设置页表单
 *
 * 说明：语言切换的核心逻辑 handleLanguageSwitch 定义在 docs.js
 * （因为它需要重置文档导航状态），本模块只负责 UI 绑定并委托调用。
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { state, saveUserSettings } from '../core/state.js';
import { showMessage } from '../core/notify.js';
import { AuthManager } from '../core/auth.js';
import { CommunityManager } from './community.js';
import * as docs from './docs.js';
import * as home from './home.js';

// 仅设置模块使用的本地状态
let currentTheme = 'light';

export function applyUserSettings() {
    applyThemeSetting();

    if (!state.userSettings.animations) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }

    if (state.userSettings.compactLayout) {
        document.body.classList.add('compact-layout');
    } else {
        document.body.classList.remove('compact-layout');
    }

    if (state.userSettings.showLineNumbers) {
        document.body.classList.add('show-line-numbers');
        document.querySelectorAll('pre').forEach(function (pre) {
            pre.classList.add('line-numbers');
        });
    } else {
        document.body.classList.remove('show-line-numbers');
    }

    if (!state.userSettings.stickyNav) {
        document.body.classList.add('no-sticky-nav');
    } else {
        document.body.classList.remove('no-sticky-nav');
    }
}

function applyThemeSetting() {
    if (state.userSettings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', state.userSettings.theme);
    }
    updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

export function setupThemeToggle() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || (prefersDark ? 'dark' : 'light');
    applyTheme();
}

function applyTheme() {
    applyThemeSetting();
}

function toggleTheme(event) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    state.userSettings.theme = newTheme;
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, newTheme);
    saveUserSettings();

    var x, y;
    var btn = document.getElementById('theme-toggle');
    if (event && typeof event.clientX === 'number' && event.clientX > 0) {
        x = event.clientX;
        y = event.clientY;
    } else if (btn) {
        var rect = btn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    } else {
        x = window.innerWidth / 2;
        y = 0;
    }

    var supportsVT = typeof document.startViewTransition === 'function';
    var animationsEnabled = !document.body.classList.contains('no-animations');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsVT && animationsEnabled && !reduceMotion) {
        var maxRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        if (newTheme === 'dark') {
            document.documentElement.classList.remove('theme-reveal-out');
        } else {
            document.documentElement.classList.add('theme-reveal-out');
        }

        document.documentElement.classList.add('theme-transitioning');

        var transition = document.startViewTransition(function () {
            applyThemeSetting();
        });

        transition.ready.then(function () {
            if (newTheme === 'dark') {
                document.documentElement.animate(
                    {
                        clipPath: [
                            'circle(0px at ' + x + 'px ' + y + 'px)',
                            'circle(' + maxRadius + 'px at ' + x + 'px ' + y + 'px)'
                        ]
                    },
                    {
                        duration: 320,
                        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        pseudoElement: '::view-transition-new(root)'
                    }
                );
            } else {
                document.documentElement.animate(
                    {
                        clipPath: [
                            'circle(' + maxRadius + 'px at ' + x + 'px ' + y + 'px)',
                            'circle(0px at ' + x + 'px ' + y + 'px)'
                        ]
                    },
                    {
                        duration: 320,
                        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        pseudoElement: '::view-transition-old(root)'
                    }
                );
            }
        });

        transition.finished.then(function () {
            document.documentElement.classList.remove('theme-reveal-out');
            document.documentElement.classList.remove('theme-transitioning');
        });
    } else {
        applyThemeSetting();
    }
}

// ==================== 全局语言切换 ====================

export function setupGlobalLangSwitcher() {
    const switcher = document.getElementById('global-lang-switcher');
    const btn = document.getElementById('lang-switcher-btn');
    if (!switcher || !btn) return;

    // 设置初始按钮标签和激活状态
    docs.updateLangSwitcherUI();

    // 点击按钮 → 切换下拉
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        switcher.classList.toggle('open');
    });

    // 点击语言选项 → 切换语言
    switcher.querySelectorAll('.lang-switcher-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.stopPropagation();
            const newLang = this.getAttribute('data-lang');
            if (newLang && newLang !== I18n.getLang()) {
                docs.handleLanguageSwitch(newLang, e.clientX, e.clientY);
            }
            switcher.classList.remove('open');

            // 移动端：切换后收起汉堡菜单
            if (window.innerWidth <= 768) {
                const hamburger = document.getElementById('hamburger');
                const navContainer = document.getElementById('nav-container');
                if (hamburger && navContainer) {
                    hamburger.classList.remove('active');
                    navContainer.classList.remove('active');
                }
            }
        });
    });

    // 点击页面其他区域关闭下拉
    document.addEventListener('click', function (e) {
        if (!switcher.contains(e.target)) {
            switcher.classList.remove('open');
        }
    });
}

// ==================== 设置页表单 ====================

export function setupSettings() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if (document.getElementById('reset-settings')) {
        document.getElementById('reset-settings').addEventListener('click', function () {
            if (confirm(I18n.t('settings.resetConfirm'))) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                location.reload();
            }
        });
    }

    if (document.getElementById('animations-toggle')) {
        document.getElementById('animations-toggle').addEventListener('change', function () {
            state.userSettings.animations = this.checked;
            saveUserSettings();
            home.resetFeatureCards();
            if (this.checked) {
                document.body.classList.remove('no-animations');
                home.setupHomeAnimations();
            } else {
                document.body.classList.add('no-animations');
            }
        });
    }

    if (document.getElementById('compact-layout')) {
        document.getElementById('compact-layout').addEventListener('change', function () {
            state.userSettings.compactLayout = this.checked;
            saveUserSettings();
            if (this.checked) {
                document.body.classList.add('compact-layout');
            } else {
                document.body.classList.remove('compact-layout');
            }
        });
    }

    if (document.getElementById('show-line-numbers')) {
        document.getElementById('show-line-numbers').addEventListener('change', function () {
            state.userSettings.showLineNumbers = this.checked;
            saveUserSettings();

            if (this.checked) {
                document.body.classList.add('show-line-numbers');
                document.querySelectorAll('pre').forEach(pre => {
                    pre.classList.add('line-numbers');
                });
                Prism.highlightAll();
            } else {
                document.body.classList.remove('show-line-numbers');
                document.querySelectorAll('pre').forEach(pre => {
                    pre.classList.remove('line-numbers');
                });
            }
        });
    }

    if (document.getElementById('sticky-nav')) {
        document.getElementById('sticky-nav').addEventListener('change', function () {
            state.userSettings.stickyNav = this.checked;
            saveUserSettings();
            if (this.checked) {
                document.body.classList.remove('no-sticky-nav');
            } else {
                document.body.classList.add('no-sticky-nav');
            }
        });
    }

    // 离线优先模式
    if (document.getElementById('disable-online-refresh')) {
        document.getElementById('disable-online-refresh').addEventListener('change', function () {
            state.userSettings.disableOnlineCacheRefresh = this.checked;
            saveUserSettings();
            var msg = this.checked
                ? I18n.t('settings.offlineFirstOn')
                : I18n.t('settings.offlineFirstOff');
            showMessage(msg, 'success');
        });
    }

    // 管理文档缓存
    if (document.getElementById('manage-docs-cache-btn')) {
        document.getElementById('manage-docs-cache-btn').addEventListener('click', function () {
            docs.openDocsCacheModal();
        });
    }

    // 清除全部语言文档缓存
    if (document.getElementById('clear-all-docs-cache-btn')) {
        document.getElementById('clear-all-docs-cache-btn').addEventListener('click', function () {
            docs.clearAllDocsContentCache();
        });
    }

    if (document.getElementById('close-docs-cache-modal')) {
        document.getElementById('close-docs-cache-modal').addEventListener('click', docs.closeDocsCacheModal);
    }

    if (document.getElementById('docs-cache-modal')) {
        document.getElementById('docs-cache-modal').addEventListener('click', function (e) {
            if (e.target === this) docs.closeDocsCacheModal();
        });
    }

    setTimeout(initSettingsForm, 100);
    setupAccountCard();
}

// ==================== 设置页账户卡片 ====================
// 登录入口收敛到设置页与功能弹窗内，导航栏不再放全局按钮

function escapeHtmlSetting(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
}

function setupAccountCard() {
    if (!document.getElementById('settings-account')) return;
    renderAccountCard();
    document.addEventListener('erispulse-auth-changed', renderAccountCard);
    document.addEventListener('erispulse-lang-changed', renderAccountCard);
}

function renderAccountCard() {
    var box = document.getElementById('settings-account');
    if (!box) return;
    var auth = AuthManager.getAuthState();

    if (AuthManager.isLoggedIn() && auth && auth.user) {
        var user = auth.user;
        var providerNames = { github: 'GitHub', codeberg: 'Codeberg', yunhu: '云湖' };
        box.innerHTML =
            '<div class="account-card-user">' +
            '<img class="account-card-avatar" src="' + escapeHtmlSetting(user.avatar_url || '') + '" alt="" referrerpolicy="no-referrer">' +
            '<div class="account-card-id">' +
            '<span class="account-card-name">' + escapeHtmlSetting(user.name || user.login || '') + '</span>' +
            '<span class="account-card-provider">' + escapeHtmlSetting(providerNames[auth.provider] || auth.provider || '') + '</span>' +
            '</div>' +
            '<button class="btn btn-outline btn-sm" id="account-logout-btn"><span data-i18n="submit.logout">退出登录</span></button>' +
            '</div>' +
            '<div class="account-card-mine">' +
            '<button class="account-mine-row" id="account-my-modules-btn">' +
            '<span><i class="fas fa-box-open"></i> ' + escapeHtmlSetting(I18n.t('account.myModules')) + '</span>' +
            '<span class="account-mine-count" id="account-module-count">…</span>' +
            '</button>' +
            '<div class="account-mine-row account-mine-static">' +
            '<span><i class="far fa-comments"></i> ' + escapeHtmlSetting(I18n.t('account.myDiscussions')) + '</span>' +
            '<span class="account-mine-count" id="account-discussion-count">…</span>' +
            '</div>' +
            '<div id="account-discussion-list" class="account-discussion-list">' +
            '<p class="account-card-loading"><i class="fas fa-spinner fa-spin"></i> ' + escapeHtmlSetting(I18n.t('manage.loading')) + '</p>' +
            '</div>' +
            '</div>';

        box.querySelector('#account-logout-btn').addEventListener('click', function () {
            AuthManager.logout();
            showMessage(I18n.t('submit.logoutSuccess'), 'success');
        });
        box.querySelector('#account-my-modules-btn').addEventListener('click', function () {
            document.dispatchEvent(new CustomEvent('erispulse-open-submit-modal', { detail: { tab: 'my-modules' } }));
        });

        loadAccountModuleCount(auth);
        loadAccountDiscussions(user);
    } else {
        box.innerHTML =
            '<p class="account-card-hint">' + escapeHtmlSetting(I18n.t('account.loginHint')) + '</p>' +
            '<div class="account-card-login">' +
            '<button class="btn btn-outline btn-sm" data-account-provider="github"><i class="fab fa-github"></i> GitHub</button>' +
            '<button class="btn btn-outline btn-sm" data-account-provider="codeberg"><img src="assets/img/codeberg.svg" alt="" width="14" height="14"> Codeberg</button>' +
            '<button class="btn btn-outline btn-sm" data-account-provider="yunhu"><img src="assets/img/yunhu.png" alt="" width="14" height="14"> 云湖</button>' +
            '</div>' +
            '<p class="account-card-note">' + escapeHtmlSetting(I18n.t('account.whereUsed')) + '</p>';

        box.querySelectorAll('[data-account-provider]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                AuthManager.startOAuthLogin(btn.getAttribute('data-account-provider'), 'settings');
            });
        });
    }
}

function initSettingsForm() {
    if (document.getElementById('animations-toggle')) {
        document.getElementById('animations-toggle').checked = state.userSettings.animations;
    }
    if (document.getElementById('compact-layout')) {
        document.getElementById('compact-layout').checked = state.userSettings.compactLayout;
    }
    if (document.getElementById('show-line-numbers')) {
        document.getElementById('show-line-numbers').checked = state.userSettings.showLineNumbers;
    }
    if (document.getElementById('sticky-nav')) {
        document.getElementById('sticky-nav').checked = state.userSettings.stickyNav;
    }
    if (document.getElementById('disable-online-refresh')) {
        document.getElementById('disable-online-refresh').checked = state.userSettings.disableOnlineCacheRefresh !== false;
    }
    docs.updateDocsCacheStatus();
}

// 我发布的模块数：走现有 /api/my-modules 端点（token 无效时显示 --）
function loadAccountModuleCount(auth) {
    var countEl = document.getElementById('account-module-count');
    if (!countEl) return;
    fetch(CONFIG.API.myModules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: auth.accessToken, provider: auth.provider })
    })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            countEl.textContent = data && data.modules ? String(data.modules.length) : '--';
        })
        .catch(function () {
            countEl.textContent = '--';
        });
}

// 我发布的讨论：从社区数据链（共享缓存 → Worker → 静态快照）按作者过滤，
// 展示最近 3 条，点击直接打开站内详情弹窗
function loadAccountDiscussions(user) {
    var listEl = document.getElementById('account-discussion-list');
    var countEl = document.getElementById('account-discussion-count');
    if (!listEl || !countEl) return;

    function apply(discussions) {
        if (!Array.isArray(discussions)) return false;
        var mine = discussions.filter(function (d) {
            return d.author && user.login && d.author.login === user.login;
        });
        countEl.textContent = String(mine.length);
        if (!mine.length) {
            listEl.innerHTML = '<p class="account-card-empty">' + escapeHtmlSetting(I18n.t('account.noDiscussions')) + '</p>';
            return true;
        }
        listEl.innerHTML = mine.slice(0, 3).map(function (d) {
            return '<a class="account-discussion-item" href="' + escapeHtmlSetting(d.html_url || '#community') + '" data-number="' + d.number + '">' +
                '<span class="account-discussion-title">' + escapeHtmlSetting(d.title || '') + '</span>' +
                '<span class="account-discussion-meta"><i class="far fa-comment"></i> ' + (typeof d.comments === 'number' ? d.comments : 0) + '</span>' +
                '</a>';
        }).join('');
        listEl.querySelectorAll('.account-discussion-item').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                CommunityManager.openDetail(a.getAttribute('data-number'));
            });
        });
        return true;
    }

    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('erispulse-community-cache')); } catch (e) {}
    if (cached && cached.data && apply(cached.data.discussions)) return;

    fetch(CONFIG.API.discussions)
        .then(function (resp) {
            if (!resp.ok) throw new Error('worker ' + resp.status);
            return resp.json();
        })
        .then(function (data) {
            if (apply(data && data.discussions)) {
                try {
                    localStorage.setItem('erispulse-community-cache', JSON.stringify({ data: data, source: 'worker', fetchedAt: Date.now() }));
                } catch (e) {}
            }
        })
        .catch(function () {
            fetch('assets/data/discussions.json', { cache: 'no-cache' })
                .then(function (resp) {
                    if (!resp.ok) throw new Error('snapshot ' + resp.status);
                    return resp.json();
                })
                .then(function (data) {
                    if (!apply(data && data.discussions)) {
                        countEl.textContent = '--';
                        listEl.innerHTML = '';
                    }
                })
                .catch(function () {
                    countEl.textContent = '--';
                    listEl.innerHTML = '';
                });
        });
}
