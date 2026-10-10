/**
 * 社区模块：GitHub Discussions 镜像展示 + 登录互动（发讨论 / 回帖）
 *
 * 数据链：localStorage 缓存(5min) → Worker /api/discussions → 静态快照 assets/data/discussions.json
 * 写操作（发帖/回帖）经 Worker 转发用户 GitHub token，错误码约定见 workers/index.js 社区段：
 *   AUTH_FAILED / PERMISSION_DENIED / GITHUB_ONLY / RATE_LIMITED / GITHUB_ERROR
 *
 * 深链：#community/<number> 直接打开对应讨论详情（nav.js 解析后回调 openDetail）。
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { showMessage } from '../core/notify.js';
import { AuthManager } from '../core/auth.js';
import { enhanceGitHubMarkdown } from '../core/gh-markdown.js';

export const CommunityManager = (function () {
    var STORAGE_KEY = 'erispulse-community-cache';
    var CACHE_TTL = 5 * 60 * 1000;
    var DETAIL_TTL = 60 * 1000;
    var GH_DISCUSSIONS_URL = 'https://github.com/ErisPulse/ErisPulse/discussions';

    var state = {
        list: [],
        page: 1,
        lastPage: 1,
        source: null, // 'worker' | 'snapshot'
        fetchedAt: null,
        activeCategory: 'all',
        loadingMore: false,
        categories: null, // 分类全集（版块 + 创建表单共用）
        detailCache: {}, // number -> { discussion, comments, fetchedAt }
    };

    var els = {};

    // ==================== 工具 ====================

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function timeAgo(iso) {
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
        try {
            return new Date(iso).toLocaleDateString();
        } catch (e) {
            return '';
        }
    }

    // 分类本地化名：i18n 里按 slug 收录了 GitHub 官方 6 分类，未知分类回退 GitHub 原名
    function categoryLabel(category) {
        if (!category) return '';
        var key = 'community.cat.' + category.slug;
        var text = I18n.t(key);
        return text !== key ? text : (category.name || category.slug);
    }

    // 列表摘要：剥掉 markdown 标记与 HTML 注释，只留可读文本
    function stripMarkdown(text) {
        if (!text) return '';
        return String(text)
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/[*_~`#>|]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    // REST API 的 category.emoji 是 :short_code: 文本，映射为原生 emoji；未知短代码返回空串隐藏
    var CATEGORY_EMOJI = {
        mega: '📣', speech_balloon: '💬', bulb: '💡',
        ballot_box_with_check: '🗳️', ballot_box: '🗳️',
        question_answer: '🙏', raised_hands: '🙌', pray: '🙏',
    };

    function categoryEmoji(category) {
        if (!category || !category.emoji) return '';
        var code = String(category.emoji).replace(/^:+|:+$/g, '');
        return CATEGORY_EMOJI[code] || '';
    }

    function githubAuthed() {
        var auth = AuthManager.getAuthState ? AuthManager.getAuthState() : null;
        return !!(auth && auth.provider === 'github' && auth.accessToken);
    }

    /**
     * 用户生成内容的最小消毒：去掉可执行/表单类标签、on* 事件属性与 javascript: 链接。
     * DOMParser 解析不会执行任何脚本，随后仅在内存 DOM 上清洗再取 innerHTML。
     */
    function sanitizeHtml(html) {
        try {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var forbidden = {
                SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1,
                INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, LINK: 1, META: 1, BASE: 1,
            };
            (function walk(node) {
                Array.prototype.slice.call(node.children || []).forEach(function (child) {
                    if (forbidden[child.tagName]) {
                        child.remove();
                        return;
                    }
                    Array.prototype.slice.call(child.attributes || []).forEach(function (attr) {
                        var name = attr.name.toLowerCase();
                        var value = String(attr.value || '').trim().toLowerCase().replace(/\s+/g, '');
                        if (name.indexOf('on') === 0 ||
                            ((name === 'href' || name === 'src') && value.indexOf('javascript:') === 0)) {
                            child.removeAttribute(attr.name);
                        }
                    });
                    walk(child);
                });
            })(doc.body);
            return doc.body.innerHTML;
        } catch (e) {
            return '<p>' + escapeHtml(String(html || '')) + '</p>';
        }
    }

    function renderMarkdown(text) {
        if (!text) return '';
        var html = '';
        try {
            if (window.marked) {
                html = window.marked.parse ? window.marked.parse(text) : window.marked(text);
            }
        } catch (e) { /* 渲染失败回退纯文本 */ }
        if (!html) html = '<p>' + escapeHtml(text) + '</p>';
        // GitHub Alerts（> [!NOTE] 等）转提示框，再消毒
        return sanitizeHtml(enhanceGitHubMarkdown(html));
    }

    function highlightCode(root) {
        if (!window.Prism || !root) return;
        root.querySelectorAll('pre code').forEach(function (block) {
            try { window.Prism.highlightElement(block); } catch (e) { /* 忽略高亮失败 */ }
        });
    }

    // ==================== 缓存 ====================

    function readCache() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.data || !Array.isArray(parsed.data.discussions)) return null;
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function writeCache(data, source) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                data: data,
                source: source,
                fetchedAt: Date.now(),
            }));
        } catch (e) { /* 存储满等异常忽略 */ }
    }

    // ==================== 数据加载 ====================

    /**
     * 视图激活入口（nav.js 调用）。5 分钟内的缓存直接渲染；
     * 有旧缓存时先渲染旧数据再后台刷新，保证秒开。
     * 惰性初始化兜底：SEO 入口页直开时视图切换可能早于 app.js 的 init 调用。
     */
    function loadDiscussions(force) {
        if (!els.list) init();
        if (!els.list) return Promise.resolve();
        var cached = readCache();
        if (cached) {
            var fresh = Date.now() - cached.fetchedAt < CACHE_TTL;
            if (fresh && !force) {
                applyData(cached.data, cached.source, cached.fetchedAt);
                return Promise.resolve();
            }
            applyData(cached.data, cached.source, cached.fetchedAt);
        }
        return refreshList();
    }

    async function refreshList() {
        // 全量分类（版块格子常显 6 分类用）；失败不影响列表
        fetch(CONFIG.API.discussionCategories)
            .then(function (resp) { return resp.json(); })
            .then(function (data) {
                if (data && Array.isArray(data.categories) && data.categories.length) {
                    state.categories = data.categories;
                    renderFilters();
                }
            })
            .catch(function () { /* 版块保持列表派生 */ });

        // 主源：Worker 实时（边缘缓存 15 分钟）
        try {
            var resp = await fetch(CONFIG.API.discussions, { cache: 'no-cache' });
            if (!resp.ok) throw new Error('worker ' + resp.status);
            var data = await resp.json();
            if (!data || !Array.isArray(data.discussions)) throw new Error('bad payload');
            applyData(data, 'worker', Date.now());
            writeCache(data, 'worker');
            return;
        } catch (e) {
            console.warn('[community] Worker 数据源失败:', e);
        }

        // 兜底源：Actions 定时同步的静态快照（同源）
        try {
            var resp2 = await fetch('assets/data/discussions.json', { cache: 'no-cache' });
            if (!resp2.ok) throw new Error('snapshot ' + resp2.status);
            var data2 = await resp2.json();
            if (!data2 || !Array.isArray(data2.discussions)) throw new Error('bad payload');
            var ts = data2.generated_at ? new Date(data2.generated_at).getTime() : Date.now();
            applyData(data2, 'snapshot', isNaN(ts) ? Date.now() : ts);
            writeCache(data2, 'snapshot');
            return;
        } catch (e2) {
            console.warn('[community] 快照数据源失败:', e2);
        }

        if (!state.list.length) showError();
    }

    function applyData(data, source, fetchedAt) {
        state.list = data.discussions || [];
        state.page = data.page || 1;
        state.lastPage = data.last_page || 1;
        state.source = source;
        state.fetchedAt = fetchedAt || Date.now();
        renderSourceBadge();
        renderFilters();
        renderList();
        if (els.loadMoreWrap) {
            els.loadMoreWrap.style.display = state.lastPage > state.page ? '' : 'none';
        }
    }

    function renderSourceBadge() {
        if (!els.sourceBadge) return;
        var key = state.source === 'snapshot' ? 'community.source.snapshot' : 'community.source.live';
        els.sourceBadge.innerHTML = '<i class="fas fa-circle"></i> ' +
            escapeHtml(I18n.t(key, { time: timeAgo(new Date(state.fetchedAt || Date.now()).toISOString()) }));
        els.sourceBadge.style.display = '';
    }

    function showError() {
        if (!els.list) return;
        els.list.innerHTML =
            '<div class="community-state community-state-error">' +
            '<i class="fas fa-cloud-arrow-down" style="font-size:1.6rem;"></i>' +
            '<p>' + escapeHtml(I18n.t('community.loadError')) + '</p>' +
            '<div class="community-error-actions">' +
            '<button class="btn community-btn-ghost" data-community-retry>' + escapeHtml(I18n.t('community.retry')) + '</button>' +
            '<a class="btn community-btn-primary" href="' + GH_DISCUSSIONS_URL + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(I18n.t('community.githubDiscussions')) + '</a>' +
            '</div></div>';
        var retry = els.list.querySelector('[data-community-retry]');
        if (retry) retry.addEventListener('click', function () { loadDiscussions(true); });
    }

    // ==================== 列表渲染 ====================

    function renderFilters() {
        if (!els.filters) return;

        // 版块全集：优先分类端点（全部 6 分类常显，含 0 条），回退列表内出现过的分类
        var cats = [];
        if (state.categories && state.categories.length) {
            cats = state.categories;
        } else {
            var seen = {};
            state.list.forEach(function (d) {
                var c = d && d.category;
                if (c && c.slug && !seen[c.slug]) {
                    seen[c.slug] = true;
                    cats.push(c);
                }
            });
        }

        // 论坛版块格子：全部 + 各分类（emoji 大图标 + 本地化名 + 数量），点击即筛选
        var countAll = state.list.length;
        var html = '<button class="community-board' + (state.activeCategory === 'all' ? ' active' : '') + '" data-cat="all">' +
            '<span class="community-board-emoji">🏠</span>' +
            '<span class="community-board-name">' + escapeHtml(I18n.t('community.filterAll')) + '</span>' +
            '<span class="community-board-count">' + countAll + '</span>' +
            '</button>';

        cats.forEach(function (c) {
            var count = state.list.filter(function (d) { return d.category && d.category.slug === c.slug; }).length;
            var emoji = categoryEmoji(c);
            html += '<button class="community-board' + (state.activeCategory === c.slug ? ' active' : '') + '" data-cat="' + escapeHtml(c.slug) + '">' +
                '<span class="community-board-emoji">' + (emoji || '💬') + '</span>' +
                '<span class="community-board-name">' + escapeHtml(categoryLabel(c)) + '</span>' +
                '<span class="community-board-count">' + count + '</span>' +
                '</button>';
        });
        els.filters.innerHTML = html;

        els.filters.querySelectorAll('.community-board').forEach(function (board) {
            board.addEventListener('click', function () {
                state.activeCategory = board.getAttribute('data-cat') || 'all';
                renderFilters();
                renderList();
            });
        });
    }

    function avatarHtml(author) {
        if (author && author.avatar_url) {
            return '<img class="discussion-avatar" src="' + escapeHtml(author.avatar_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">';
        }
        return '<span class="discussion-avatar discussion-avatar-fallback"><i class="fas fa-user"></i></span>';
    }

    function renderCard(d) {
        var c = d.category;
        var comments = typeof d.comments === 'number' ? d.comments : 0;
        var cleanExcerpt = stripMarkdown(d.excerpt);
        var ellipsis = cleanExcerpt && (d.excerpt || '').length >= 280 ? '…' : '';
        return '<article class="discussion-card" data-number="' + d.number + '" tabindex="0" role="button" aria-label="' + escapeHtml(d.title || '') + '">' +
            '<div class="discussion-card-top">' +
            (c
                ? '<span class="discussion-cat-chip">' + (function(){ var e = categoryEmoji(c); return e ? escapeHtml(e) + ' ' : ''; })() + escapeHtml(categoryLabel(c)) + '</span>'
                : '') +
            '<span class="discussion-card-comments"><i class="far fa-comment"></i> ' + comments + '</span>' +
            '</div>' +
            '<h3 class="discussion-card-title">' + escapeHtml(d.title || '') + '</h3>' +
            (cleanExcerpt
                ? '<p class="discussion-card-excerpt">' + escapeHtml(cleanExcerpt) + ellipsis + '</p>'
                : '') +
            '<div class="discussion-card-meta">' +
            avatarHtml(d.author) +
            '<span class="discussion-author">' + escapeHtml(d.author ? d.author.login : '') + '</span>' +
            '<span class="discussion-dot">·</span>' +
            '<span class="discussion-time">' + escapeHtml(timeAgo(d.created_at)) + '</span>' +
            '</div>' +
            '</article>';
    }

    function renderList() {
        if (!els.list) return;
        var items = state.list.filter(function (d) {
            return state.activeCategory === 'all' || (d.category && d.category.slug === state.activeCategory);
        });

        if (!items.length) {
            els.list.innerHTML = '<div class="community-state">' +
                '<i class="far fa-comment-dots" style="font-size:1.6rem;"></i>' +
                '<p>' + escapeHtml(I18n.t('community.empty')) + '</p>' +
                '<button class="btn community-btn-primary" id="community-empty-new">' +
                '<i class="fas fa-plus"></i> ' + escapeHtml(I18n.t('community.newDiscussion')) + '</button>' +
                '</div>';
            var emptyNew = document.getElementById('community-empty-new');
            if (emptyNew) emptyNew.addEventListener('click', openCreateModal);
            return;
        }

        els.list.innerHTML = items.map(renderCard).join('');
        els.list.querySelectorAll('.discussion-card').forEach(function (card) {
            card.addEventListener('click', function () {
                openDetail(card.getAttribute('data-number'));
            });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDetail(card.getAttribute('data-number'));
                }
            });
        });
    }

    async function loadMore() {
        if (state.loadingMore || state.source !== 'worker') return;
        state.loadingMore = true;
        if (els.loadMoreBtn) els.loadMoreBtn.disabled = true;
        try {
            var next = state.page + 1;
            var resp = await fetch(CONFIG.API.discussions + '?page=' + next, { cache: 'no-cache' });
            if (!resp.ok) throw new Error('worker ' + resp.status);
            var data = await resp.json();
            if (!data || !Array.isArray(data.discussions)) throw new Error('bad payload');
            var known = {};
            state.list.forEach(function (d) { known[d.number] = true; });
            var added = data.discussions.filter(function (d) { return !known[d.number]; });
            state.list = state.list.concat(added);
            state.page = data.page || next;
            state.lastPage = data.last_page || state.page;
            renderFilters();
            renderList();
            if (els.loadMoreWrap && state.lastPage <= state.page) {
                els.loadMoreWrap.style.display = 'none';
            }
        } catch (e) {
            showMessage(I18n.t('community.loadError'), 'error');
        } finally {
            state.loadingMore = false;
            if (els.loadMoreBtn) els.loadMoreBtn.disabled = false;
        }
    }

    // ==================== 详情弹窗 ====================

    function openOverlay(overlay) {
        if (!overlay) return;
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeOverlay(overlay) {
        if (!overlay) return;
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        // 另一个弹窗可能仍开着，只有都关了才恢复滚动
        if (!document.querySelector('.community-overlay.active')) {
            document.body.style.overflow = '';
        }
    }

    async function openDetail(number) {
        number = parseInt(number, 10);
        if (!number || !els.detailBody) return;
        openOverlay(els.detailOverlay);
        els.detailBody.innerHTML = '<div class="community-state community-loading">' +
            '<i class="fas fa-spinner fa-spin"></i><span>' + escapeHtml(I18n.t('community.loading')) + '</span></div>';

        var data = state.detailCache[number];
        if (data && Date.now() - data.fetchedAt > DETAIL_TTL) data = null;

        if (!data) {
            try {
                var resp = await fetch(CONFIG.API.discussionDetail + '?number=' + number, { cache: 'no-cache' });
                if (!resp.ok) throw new Error('detail ' + resp.status);
                var json = await resp.json();
                if (!json || !json.discussion) throw new Error('bad payload');
                data = { discussion: json.discussion, comments: json.comments || [], fetchedAt: Date.now() };
                state.detailCache[number] = data;
            } catch (e) {
                // Worker 不可用时兜底：浏览器直连 GitHub API（匿名，CORS 开放）
                try {
                    var gh = await fetch('https://api.github.com/repos/ErisPulse/ErisPulse/discussions/' + number, {
                        headers: { Accept: 'application/vnd.github+json' },
                    });
                    if (!gh.ok) throw new Error('github ' + gh.status);
                    var d = await gh.json();
                    data = {
                        discussion: {
                            number: d.number,
                            title: d.title,
                            body: typeof d.body === 'string' ? d.body.slice(0, 20000) : '',
                            author: d.user ? { login: d.user.login, avatar_url: d.user.avatar_url, html_url: d.user.html_url } : null,
                            category: d.category ? { name: d.category.name, slug: d.category.slug, emoji: d.category.emoji } : null,
                            comments: d.comments,
                            created_at: d.created_at,
                            updated_at: d.updated_at,
                            html_url: d.html_url,
                            state: d.state,
                            locked: d.locked,
                        },
                        comments: [],
                        fetchedAt: Date.now(),
                    };
                    state.detailCache[number] = data;
                } catch (e2) {
                    // 最终兜底：Worker 未部署或匿名限额耗尽时，用列表缓存里的
                    // 摘要渲染基础详情（partial 态，正文后提示去 GitHub 看全文）
                    var cached_list = readCache();
                    var pool = (state.list && state.list.length ? state.list : (cached_list && cached_list.data && cached_list.data.discussions) || []);
                    var listItem = null;
                    for (var i = 0; i < pool.length; i++) {
                        if (pool[i].number === number) { listItem = pool[i]; break; }
                    }
                    if (listItem) {
                        data = {
                            discussion: Object.assign({}, listItem, { body: listItem.excerpt || '' }),
                            comments: [],
                            fetchedAt: Date.now(),
                            partial: true,
                        };
                        state.detailCache[number] = data;
                    } else {
                        els.detailBody.innerHTML = '<div class="community-state community-state-error">' +
                            '<p>' + escapeHtml(I18n.t('community.detail.notFound')) + '</p>' +
                            '<a class="btn community-btn-primary" href="' + GH_DISCUSSIONS_URL + '" target="_blank" rel="noopener noreferrer">' +
                            escapeHtml(I18n.t('community.githubDiscussions')) + '</a></div>';
                        return;
                    }
                }
            }
        }

        renderDetail(data);
    }

    function commentHtml(c) {
        var replies = (c.replies || []).map(function (r) {
            return '<div class="community-comment">' +
                '<div class="community-comment-head">' + avatarHtml(r.author) +
                '<span class="discussion-author">' + escapeHtml(r.author ? r.author.login : '') + '</span>' +
                '<span>' + escapeHtml(timeAgo(r.created_at)) + '</span></div>' +
                '<div class="community-md">' + renderMarkdown(r.body) + '</div>' +
                '</div>';
        }).join('');

        return '<div class="community-comment">' +
            '<div class="community-comment-head">' + avatarHtml(c.author) +
            '<span class="discussion-author">' + escapeHtml(c.author ? c.author.login : '') + '</span>' +
            '<span>' + escapeHtml(timeAgo(c.created_at)) + '</span></div>' +
            '<div class="community-md">' + renderMarkdown(c.body) + '</div>' +
            (replies ? '<div class="community-comment-replies">' + replies + '</div>' : '') +
            '</div>';
    }

    function replyAreaHtml(d) {
        if (d.locked) {
            return '<div class="community-reply-locked"><span><i class="fas fa-lock"></i>' +
                escapeHtml(I18n.t('community.detail.locked')) + '</span>' +
                '<a class="community-github-link" href="' + escapeHtml(d.html_url || GH_DISCUSSIONS_URL) + '" target="_blank" rel="noopener noreferrer">' +
                escapeHtml(I18n.t('community.detail.viewOnGithub')) + '</a></div>';
        }
        if (!AuthManager.isLoggedIn() || !githubAuthed()) {
            return '<div class="community-reply-login"><span>' + escapeHtml(I18n.t('community.detail.loginToReply')) + '</span>' +
                '<button class="btn community-btn-primary" data-community-login><i class="fab fa-github"></i> GitHub</button></div>';
        }
        var auth = AuthManager.getAuthState();
        var user = auth && auth.user ? auth.user : {};
        return '<div class="community-reply-box">' +
            '<div class="community-reply-user">' + avatarHtml(user) +
            '<span>' + escapeHtml(I18n.t('community.detail.replyingAs', { name: user.name || user.login || '' })) + '</span></div>' +
            '<textarea id="community-reply-input" class="community-textarea" rows="3" maxlength="20000" placeholder="' +
            escapeHtml(I18n.t('community.detail.replyPlaceholder')) + '"></textarea>' +
            '<p class="community-form-error" id="community-reply-error" style="display:none;"></p>' +
            '<div class="community-form-actions">' +
            '<a class="community-github-link" href="' + escapeHtml(d.html_url || GH_DISCUSSIONS_URL) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(I18n.t('community.detail.viewOnGithub')) + '</a>' +
            '<button class="btn community-btn-primary" id="community-reply-submit">' +
            '<i class="fas fa-paper-plane"></i> <span>' + escapeHtml(I18n.t('community.detail.replySubmit')) + '</span></button>' +
            '</div></div>';
    }

    function renderDetail(data) {
        var d = data.discussion;
        var total = typeof d.comments === 'number' ? d.comments : (data.comments || []).length;
        els.detailBody.innerHTML =
            '<div class="community-detail-head">' +
            (d.category
                ? '<div><span class="discussion-cat-chip">' + (function(){ var e = categoryEmoji(d.category); return e ? escapeHtml(e) + ' ' : ''; })() +
                  escapeHtml(categoryLabel(d.category)) + '</span></div>'
                : '') +
            '<h2 class="community-detail-title">' + escapeHtml(d.title || '') + '</h2>' +
            '<div class="community-detail-meta">' + avatarHtml(d.author) +
            '<span class="discussion-author">' + escapeHtml(d.author ? d.author.login : '') + '</span>' +
            '<span>' + escapeHtml(timeAgo(d.created_at)) + '</span>' +
            '<a class="community-github-link" href="' + escapeHtml(d.html_url || GH_DISCUSSIONS_URL) + '" target="_blank" rel="noopener noreferrer">' +
            '<i class="fas fa-arrow-up-right-from-square"></i> ' + escapeHtml(I18n.t('community.detail.viewOnGithub')) + '</a>' +
            '</div></div>' +
            '<div class="community-md">' + renderMarkdown(d.body) + '</div>' +
            (data.partial
                ? '<p class="community-partial-note"><i class="fas fa-circle-info"></i> ' +
                  escapeHtml(I18n.t('community.detail.partial')) + '</p>'
                : '') +
            '<h3 class="community-comments-title"><i class="far fa-comments"></i> ' +
            escapeHtml(I18n.t('community.detail.comments', { n: total })) + '</h3>' +
            '<div class="community-comments">' +
            ((data.comments || []).length
                ? data.comments.map(commentHtml).join('')
                : '<p class="community-comments-empty">' + escapeHtml(I18n.t('community.detail.noComments')) + '</p>') +
            '</div>' +
            replyAreaHtml(d);

        highlightCode(els.detailBody);
        els.detailBody.querySelectorAll('.community-md a').forEach(function (a) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });

        var loginBtn = els.detailBody.querySelector('[data-community-login]');
        if (loginBtn) {
            loginBtn.addEventListener('click', function () {
                AuthManager.startOAuthLogin('github', 'community');
            });
        }

        var replyBtn = els.detailBody.querySelector('#community-reply-submit');
        if (replyBtn) {
            replyBtn.addEventListener('click', function () {
                submitComment(d.number);
            });
        }
    }

    function showReplyError(message, needsReauth) {
        var box = document.getElementById('community-reply-error');
        if (!box) return;
        box.innerHTML = '<span>' + escapeHtml(message) + '</span>' +
            (needsReauth
                ? '<button class="btn community-btn-primary" data-reply-reauth>' + escapeHtml(I18n.t('community.create.reauth')) + '</button>'
                : '');
        box.style.display = '';
        var reauth = box.querySelector('[data-reply-reauth]');
        if (reauth) {
            reauth.addEventListener('click', function () {
                AuthManager.startOAuthLogin('github', 'community');
            });
        }
    }

    async function submitComment(number) {
        var input = document.getElementById('community-reply-input');
        var btn = document.getElementById('community-reply-submit');
        if (!input || !btn) return;
        var body = input.value.trim();
        if (!body) return;

        var auth = AuthManager.getAuthState();
        if (!auth || auth.provider !== 'github' || !auth.accessToken) {
            showReplyError(I18n.t('community.detail.loginToReply'), false);
            return;
        }

        btn.disabled = true;
        var label = btn.querySelector('span');
        var original = label ? label.textContent : '';
        if (label) label.textContent = I18n.t('community.create.submitting');

        try {
            var resp = await fetch(CONFIG.API.discussionComment, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: auth.accessToken,
                    provider: auth.provider,
                    number: number,
                    body: body,
                }),
            });
            var data = await resp.json().catch(function () { return {}; });

            if (!resp.ok) {
                if (data.code === 'PERMISSION_DENIED') {
                    showReplyError(I18n.t('community.create.reauthDesc'), true);
                } else if (data.code === 'GITHUB_ERROR' && String(data.details || '').includes('404')) {
                    // GitHub 对缺 Discussions 权限的 token 返回 404 Not Found（而非 403）
                    showReplyError(I18n.t('community.create.reauthDesc'), true);
                } else {
                    showReplyError(data.error || I18n.t('community.msg.commentFailed'), false);
                }
                return;
            }

            showMessage(I18n.t('community.msg.commentSuccess'), 'success');
            var cached = state.detailCache[number];
            if (cached) {
                cached.comments = (cached.comments || []).concat([data.comment].filter(Boolean));
                cached.discussion.comments = (cached.discussion.comments || 0) + 1;
                cached.fetchedAt = Date.now();
                renderDetail(cached);
            } else {
                openDetail(number);
            }
        } catch (e) {
            showReplyError(I18n.t('community.msg.commentFailed'), false);
        } finally {
            btn.disabled = false;
            if (label) label.textContent = original;
        }
    }

    function closeDetailModal() {
        closeOverlay(els.detailOverlay);
    }

    // ==================== 发帖弹窗 ====================

    function openCreateModal() {
        openOverlay(els.createOverlay);
        renderCreateModalState();
    }

    function closeCreateModal() {
        closeOverlay(els.createOverlay);
    }

    function renderCreateModalState() {
        var loginEl = document.getElementById('community-create-login');
        var formEl = document.getElementById('community-create-form');
        if (!loginEl || !formEl) return;

        var auth = AuthManager.getAuthState ? AuthManager.getAuthState() : null;
        if (AuthManager.isLoggedIn() && auth && auth.provider === 'github') {
            loginEl.style.display = 'none';
            formEl.style.display = '';
            renderFormUser(auth);
            loadCreateCategories();
        } else {
            loginEl.style.display = '';
            formEl.style.display = 'none';
        }
    }

    function renderFormUser(auth) {
        var box = document.getElementById('community-form-user');
        if (!box) return;
        var user = auth.user || {};
        box.innerHTML = avatarHtml(user) +
            '<span>' + escapeHtml(I18n.t('community.create.postingAs', { name: user.name || user.login || '' })) + '</span>' +
            '<button type="button" class="community-logout-link">' + escapeHtml(I18n.t('submit.logout')) + '</button>';
        box.querySelector('.community-logout-link').addEventListener('click', function () {
            AuthManager.logout();
            renderCreateModalState();
        });
    }

    async function loadCreateCategories() {
        var select = document.getElementById('community-create-category');
        if (!select) return;

        if (!state.categories) {
            try {
                var resp = await fetch(CONFIG.API.discussionCategories, { cache: 'no-cache' });
                if (!resp.ok) throw new Error('categories ' + resp.status);
                var data = await resp.json();
                if (!data || !Array.isArray(data.categories) || !data.categories.length) throw new Error('empty');
                state.categories = data.categories.map(function (c) {
                    return { id: c.id, name: c.name, slug: c.slug, emoji: c.emoji };
                });
            } catch (e) {
                // 兜底：从已加载的列表/快照数据里取分类（同样带 id）
                var seen = {};
                var cats = [];
                state.list.forEach(function (d) {
                    var c = d && d.category;
                    if (c && c.id && !seen[c.slug]) {
                        seen[c.slug] = true;
                        cats.push({ id: c.id, name: c.name, slug: c.slug, emoji: c.emoji });
                    }
                });
                state.categories = cats;
            }
        }

        var current = select.value;
        select.innerHTML = '<option value="">' +
            escapeHtml(I18n.t('community.create.categoryPlaceholder')) + '</option>' +
            (state.categories || []).map(function (c) {
                var emoji = categoryEmoji(c);
                return '<option value="' + c.slug + '">' +
                    (emoji ? escapeHtml(emoji) + ' ' : '') + escapeHtml(categoryLabel(c)) + '</option>';
            }).join('');
        // 显式置回占位项：占位 option 是 disabled 的，若不加这句 Chrome 会
        // 显示第一个可用分类但 value 仍为空串——看起来选好了、提交却报未选择
        select.value = current || '';
    }

    function showCreateError(message, needsReauth) {
        var box = document.getElementById('community-create-error');
        if (!box) return;
        box.innerHTML = '<span>' + escapeHtml(message) + '</span>' +
            (needsReauth
                ? '<button type="button" class="btn community-btn-primary" data-create-reauth>' + escapeHtml(I18n.t('community.create.reauth')) + '</button>'
                : '');
        box.style.display = '';
        var reauth = box.querySelector('[data-create-reauth]');
        if (reauth) {
            reauth.addEventListener('click', function () {
                AuthManager.startOAuthLogin('github', 'community');
            });
        }
    }

    async function submitCreateDiscussion(e) {
        e.preventDefault();
        var titleInput = document.getElementById('community-create-title');
        var bodyInput = document.getElementById('community-create-body');
        var catSelect = document.getElementById('community-create-category');
        var btn = document.getElementById('community-create-submit');
        var errBox = document.getElementById('community-create-error');
        if (!titleInput || !bodyInput || !catSelect || !btn) return;

        if (errBox) errBox.style.display = 'none';

        var auth = AuthManager.getAuthState();
        if (!auth || auth.provider !== 'github' || !auth.accessToken) {
            renderCreateModalState();
            return;
        }

        var title = titleInput.value.trim();
        var body = bodyInput.value.trim();
        var categorySlug = catSelect.value;
        if (!title || !body || !categorySlug) {
            showCreateError(I18n.t('community.create.missingFields'), false);
            return;
        }

        btn.disabled = true;
        var label = btn.querySelector('span');
        var original = label ? label.textContent : '';
        if (label) label.textContent = I18n.t('community.create.submitting');

        try {
            var resp = await fetch(CONFIG.API.discussionCreate, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: auth.accessToken,
                    provider: auth.provider,
                    title: title,
                    body: body,
                    category_slug: categorySlug,
                }),
            });
            var data = await resp.json().catch(function () { return {}; });

            if (!resp.ok) {
                if (data.code === 'PERMISSION_DENIED') {
                    showCreateError(I18n.t('community.create.reauthDesc'), true);
                } else if (data.code === 'GITHUB_ERROR' && String(data.details || '').includes('404')) {
                    showCreateError(I18n.t('community.create.reauthDesc'), true);
                } else {
                    showCreateError(data.error || I18n.t('community.msg.createFailed'), false);
                }
                return;
            }

            showMessage(I18n.t('community.msg.createSuccess'), 'success');
            closeCreateModal();
            titleInput.value = '';
            bodyInput.value = '';
            catSelect.value = '';
            if (data.discussion && data.discussion.number) {
                state.detailCache[data.discussion.number] = {
                    discussion: data.discussion,
                    comments: [],
                    fetchedAt: Date.now(),
                };
            }
            await loadDiscussions(true);
            if (data.discussion && data.discussion.number) {
                openDetail(data.discussion.number);
            }
        } catch (err) {
            showCreateError(I18n.t('community.msg.createFailed'), false);
        } finally {
            btn.disabled = false;
            if (label) label.textContent = original;
        }
    }

    // ==================== 初始化 ====================

    function init() {
        els.list = document.getElementById('community-list');
        els.filters = document.getElementById('community-boards');
        els.sourceBadge = document.getElementById('community-source-badge');
        els.loadMoreWrap = document.getElementById('community-load-more-wrap');
        els.loadMoreBtn = document.getElementById('community-load-more-btn');
        els.detailOverlay = document.getElementById('community-detail-overlay');
        els.detailBody = document.getElementById('community-detail-body');
        els.createOverlay = document.getElementById('community-create-overlay');
        if (!els.list) return;

        var newBtn = document.getElementById('community-new-btn');
        if (newBtn) newBtn.addEventListener('click', openCreateModal);

        var detailClose = document.getElementById('community-detail-close');
        if (detailClose) detailClose.addEventListener('click', closeDetailModal);

        var createClose = document.getElementById('community-create-close');
        if (createClose) createClose.addEventListener('click', closeCreateModal);

        if (els.loadMoreBtn) els.loadMoreBtn.addEventListener('click', loadMore);

        if (els.detailOverlay) {
            els.detailOverlay.addEventListener('click', function (e) {
                if (e.target === els.detailOverlay) closeDetailModal();
            });
        }
        if (els.createOverlay) {
            els.createOverlay.addEventListener('click', function (e) {
                if (e.target === els.createOverlay) closeCreateModal();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeDetailModal();
                closeCreateModal();
            }
        });

        var loginBtn = document.getElementById('community-create-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function () {
                AuthManager.startOAuthLogin('github', 'community');
            });
        }

        var createForm = document.getElementById('community-create-form');
        if (createForm) createForm.addEventListener('submit', submitCreateDiscussion);

        // OAuth 回跳后刷新弹窗内的登录态
        document.addEventListener('erispulse-auth-changed', function () {
            renderCreateModalState();
        });

        // 语言切换后重渲染（分类名、相对时间都依赖当前语言）
        document.addEventListener('erispulse-lang-changed', function () {
            if (state.list.length) {
                renderSourceBadge();
                renderFilters();
                renderList();
            }
        });
    }

    return {
        init: init,
        loadDiscussions: loadDiscussions,
        openDetail: openDetail,
        // 首页社区速览复用：分类 slug → 本地化名 / 短代码 → 原生 emoji
        categoryLabel: categoryLabel,
        categoryEmoji: categoryEmoji,
    };
})();
