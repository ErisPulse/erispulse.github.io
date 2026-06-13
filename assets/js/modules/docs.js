/**
 * 文档中心：三级导航、搜索浮层、面包屑、文档加载/渲染、
 * 离线本地化（下载/缓存管理）、版本更新检测、语言切换核心逻辑。
 *
 * 这里集中了所有文档视图相关的状态与函数；handleLanguageSwitch /
 * updateLangSwitcherUI 也定义于此（因为它们需要重置文档导航状态）。
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { state, saveUserSettings } from '../core/state.js';
import { showMessage, showActionToast, escapeHtml, timeAgo } from '../core/notify.js';
import { DocsIndexManager } from './docs-index.js';
import { DocsContentCache } from './docs-cache.js';
import { renderModules } from './marketplace.js';
import { resetBanner } from './home.js';
import { updateView } from './nav.js';

// 导航状态管理（仅文档模块内部使用）
let currentNavState = 'categories'; // 'categories', 'documents', 'chapters'
let currentCategory = null;
let currentDocPath = null;
let currentChapterToc = [];

var _docsLibsLoaded = false;
var _docsIndexesLoaded = false;

// ==================== 语言切换（核心逻辑） ====================

/**
 * 更新全局语言切换器按钮标签和选项激活状态
 */
export function updateLangSwitcherUI() {
    const switcher = document.getElementById('global-lang-switcher');
    if (!switcher) return;

    const lang = I18n.getLang();
    const label = switcher.querySelector('.lang-label');
    if (label) {
        label.textContent = I18n.getLanguageName(lang);
    }

    switcher.querySelectorAll('.lang-switcher-option').forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

/**
 * 统一处理语言切换（全局切换器和文档侧边栏切换器共用）
 */
export function handleLanguageSwitch(lang) {
    console.log('切换语言:', lang);

    const prevDocPath = currentDocPath;

    I18n.setLang(lang, true);
    updateLangSwitcherUI();

    DocsIndexManager.clearCache();
    DocsIndexManager.loadMapping().then(() => {
        DocsIndexManager.loadSearchIndex();
        if (prevDocPath) {
            navigateToDocument(prevDocPath);
        }
    }).catch(err => {
        console.error('切换语言失败:', err);
        showMessage(I18n.t('common.langSwitchFailed'), 'error');
    });

    if (prevDocPath) {
        const docsContent = document.getElementById('docs-content');
        if (docsContent) {
            docsContent.innerHTML = `
                <div style="text-align: center; padding: 3rem 0;">
                    <i class="fas fa-spinner fa-pulse fa-3x"></i>
                    <p>${I18n.t('docs.loading')}</p>
                </div>
            `;
        }
    } else {
        showCategoryLevel();
        updateBreadcrumb(null);
        history.pushState(null, null, '#docs');

        currentNavState = 'categories';
        currentCategory = null;
        currentDocPath = null;
        currentChapterToc = [];

        const docsContent = document.getElementById('docs-content');
        if (docsContent) {
            docsContent.innerHTML = `
                <div>
                    <h1>${I18n.t('docs.welcome')}</h1>
                    <p>${I18n.t('docs.welcome.desc')}</p>
                    <p>${I18n.t('docs.welcome.hint')}</p>
                </div>
            `;
        }
    }

    updateDocsActionButtons();
    updateDocsCacheStatus();

    if (document.getElementById('market-view').classList.contains('active')) {
        renderModules();
    }

    resetBanner();

    showMessage(I18n.t('common.langSwitched', { name: I18n.getLanguageName(lang) }), 'success');
}

// ==================== 文档版本更新检测 ====================

export async function runBackgroundVersionCheck() {
    if (state.versionNotified || !navigator.onLine) return;

    var langs = I18n.getSupportedLanguages();
    var hasAnyLocalized = langs.some(function (l) {
        return DocsContentCache.isLocalized(l.code);
    });
    if (!hasAnyLocalized) return;

    try {
        var remoteVersion = await fetchSdkVersion();
        if (!remoteVersion) return;

        var outdated = langs.filter(function (l) {
            var v = DocsContentCache.getLocalizedVersion(l.code);
            return v && v !== 'unknown' && v !== remoteVersion;
        });

        if (outdated.length > 0) {
            state.versionNotified = true;
            var firstOld = DocsContentCache.getLocalizedVersion(outdated[0].code) || '?';
            showActionToast(
                I18n.t('settings.docsCacheUpdateToast', { old: firstOld, new: remoteVersion }),
                I18n.t('settings.docsCacheGoUpdate'),
                function () {
                    history.pushState(null, null, '#settings');
                    updateView('settings');
                    updateDocsCacheStatus();
                    checkDocsVersionUpdate();
                }
            );
        }
    } catch (e) {
        // 网络异常时静默
    }
}

// ==================== 文档模块初始化 ====================

function setupLanguageSwitcher() {
    const langSelect = document.getElementById('lang-select');
    if (!langSelect) return;

    langSelect.value = I18n.getLang();

    langSelect.addEventListener('change', function () {
        const newLang = this.value;
        if (newLang !== I18n.getLang()) {
            handleLanguageSwitch(newLang);
        }
    });
}

export function loadDocsLibs() {
    if (_docsLibsLoaded) return;
    _docsLibsLoaded = true;
    var libs = [
        'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js'
    ];
    libs.forEach(function (url) {
        var s = document.createElement('script');
        s.src = url;
        s.defer = true;
        if (url.includes('mermaid')) {
            s.onload = function () { if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: false }); };
        }
        document.head.appendChild(s);
    });
}

export function loadDocsIndexes() {
    if (_docsIndexesLoaded) return;
    _docsIndexesLoaded = true;
    DocsIndexManager.loadMapping().catch(err => {
        console.error('映射索引加载失败:', err);
    });
    DocsIndexManager.loadSearchIndex().catch(err => {
        console.error('搜索索引加载失败:', err);
    });
}

export function setupDocumentation() {
    setupLanguageSwitcher();
    renderDocsNavigation();
    setupDocumentationSearch();
    setupBreadcrumbNavigation();
    setupDocumentActions();
    setupDocumentationResponsive();
    setupGlobalNavigationEvents();

    DocsIndexManager.onLoad(function (type, success, data, error) {
        if (type === 'mapping' || type === 'search') {
            renderDocsNavigation();
            if (DocsIndexManager.isLoaded()) {
                console.log('文档索引加载完成');

                const hash = window.location.hash.substring(1);
                if (hash === 'docs') {
                    showCategoryLevel();
                }

                setTimeout(runBackgroundVersionCheck, 2000);
            }
        }

        if (!success && error) {
            console.error(`加载${type === 'mapping' ? '映射' : '搜索'}索引失败:`, error);
            if (type === 'mapping') {
                const docsContent = document.getElementById('docs-content');
                if (docsContent && !DocsIndexManager.mapping) {
                    docsContent.innerHTML = `
                        <div class="error-message" style="text-align: center; padding: 3rem 0;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                            <h3>${I18n.t('docs.loadIndexFailed')}</h3>
                            <p>${error.message}</p>
                            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer;">
                                <i class="fas fa-sync-alt"></i> ${I18n.t('market.reload')}
                            </button>
                        </div>
                    `;
                }
            }
        }
    });
}

// ==================== 三级导航系统 ====================

function renderDocsNavigation() {
    const navContainer = document.querySelector('.docs-nav-container');
    if (!navContainer) {
        console.warn('renderDocsNavigation: 导航容器未找到');
        return;
    }

    const mapping = DocsIndexManager.mapping;
    console.log('renderDocsNavigation: 映射索引状态', mapping ? '已加载' : '未加载');

    if (!mapping || !mapping.categories) {
        navContainer.innerHTML = `<p style="padding: 1rem; text-align: center; color: var(--text-secondary);">${I18n.t('common.loading')}</p>`;
        return;
    }

    showCategoryLevel();
}

export function showCategoryLevel() {
    currentNavState = 'categories';
    currentCategory = null;

    const navContainer = document.querySelector('.docs-nav-container');
    const mapping = DocsIndexManager.mapping;

    if (!mapping || !mapping.categories) return;

    let navHtml = '<div class="docs-nav-view">';
    navHtml += '<div class="category-list">';

    for (const [categoryId, category] of Object.entries(mapping.categories)) {
        const icon = getCategoryIcon(categoryId);
        navHtml += `
            <div class="category-item" data-category="${categoryId}">
                <i class="category-icon fas ${icon}"></i>
                <span class="category-name">${categoryId}</span>
                <span class="doc-count">${category.count || 0}</span>
                <i class="chevron fas fa-chevron-right"></i>
            </div>
        `;
    }

    navHtml += '</div></div>';

    navContainer.innerHTML = navHtml;

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function () {
            const categoryId = this.getAttribute('data-category');
            showDocumentList(categoryId);
        });
    });
}

function renderDocItemHtml(doc) {
    const isActive = doc.path === currentDocPath ? 'active' : '';
    const icon = getDocIcon(doc.path);
    return `
        <a href="#docs/${doc.path}" class="doc-item ${isActive}" data-doc="${doc.path}" data-title="${doc.title}">
            <i class="fas ${icon}"></i>
            <span>${doc.title}</span>
        </a>
    `;
}

function showDocumentList(categoryId) {
    currentNavState = 'documents';
    currentCategory = categoryId;

    const navContainer = document.querySelector('.docs-nav-container');
    const mapping = DocsIndexManager.mapping;
    const category = mapping.categories[categoryId];

    if (!category) return;

    const rootDocs = category.documents || [];
    const subgroups = category.subgroups || {};
    const subGroupKeys = Object.keys(subgroups);

    let navHtml = '<div class="docs-nav-view">';

    navHtml += `
        <div class="docs-nav-breadcrumb">
            <a class="breadcrumb-back" data-action="back-to-categories">
                <i class="fas fa-arrow-left"></i>
                <span>${I18n.t('docs.backToCategories')}</span>
            </a>
            <span class="breadcrumb-title">${categoryId}</span>
        </div>
    `;

    if (subGroupKeys.length > 0) {
        if (rootDocs.length > 0) {
            navHtml += '<div class="doc-list">';
            rootDocs.forEach(doc => { navHtml += renderDocItemHtml(doc); });
            navHtml += '</div>';
        }

        subGroupKeys.forEach(subKey => {
            const sg = subgroups[subKey];
            navHtml += `
                <div class="doc-subgroup">
                    <div class="doc-subgroup-header" data-subgroup="${subKey}">
                        <i class="fas fa-folder-open"></i>
                        <span>${sg.name}</span>
                        <span class="subgroup-count">${sg.documents.length}</span>
                        <i class="fas fa-chevron-down subgroup-chevron"></i>
                    </div>
                    <div class="doc-list subgroup-docs">
            `;
            sg.documents.forEach(doc => { navHtml += renderDocItemHtml(doc); });
            navHtml += '</div></div>';
        });
    } else {
        navHtml += '<div class="doc-list">';
        rootDocs.forEach(doc => { navHtml += renderDocItemHtml(doc); });
        navHtml += '</div>';
    }

    navHtml += '</div>';
    navContainer.innerHTML = navHtml;

    navContainer.querySelector('.breadcrumb-back')?.addEventListener('click', showCategoryLevel);

    navContainer.querySelectorAll('.doc-subgroup-header').forEach(header => {
        header.addEventListener('click', function (e) {
            e.stopPropagation();
            const subgroup = this.closest('.doc-subgroup');
            subgroup.classList.toggle('collapsed');
        });
    });
}

function showChapterToc(docPath) {
    currentNavState = 'chapters';
    currentDocPath = docPath;

    const navContainer = document.querySelector('.docs-nav-container');
    const docTitle = DocsIndexManager.getDocumentTitle(docPath);

    if (!currentChapterToc || currentChapterToc.length === 0) {
        return;
    }

    let navHtml = '<div class="docs-nav-view">';

    navHtml += `
        <div class="docs-nav-breadcrumb">
            <a class="breadcrumb-back" data-action="back-to-docs">
                <i class="fas fa-arrow-left"></i>
                <span>${I18n.t('docs.backToDocs')}</span>
            </a>
            <span class="breadcrumb-title">${docTitle || I18n.t('docs.toc')}</span>
        </div>
    `;

    navHtml += '<div class="chapter-toc">';

    currentChapterToc.forEach(item => {
        const levelIcon = getChapterLevelIcon(item.level);
        navHtml += `
            <div class="chapter-item" data-target="${item.id}">
                <span class="chapter-level">${levelIcon}</span>
                <span class="chapter-text">${item.text}</span>
            </div>
        `;
    });

    navHtml += '</div></div>';

    navContainer.innerHTML = navHtml;

    navContainer.querySelector('.breadcrumb-back')?.addEventListener('click', () => {
        if (currentCategory) {
            showDocumentList(currentCategory);
        } else {
            showCategoryLevel();
        }
    });

    updateActiveChapter();
}

function updateActiveChapter() {
    const headers = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6');
    const chapterItems = document.querySelectorAll('.chapter-item');

    if (headers.length === 0 || chapterItems.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                chapterItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-target') === id) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: '-20% 0% -80% 0%'
    });

    headers.forEach(header => observer.observe(header));
}

function syncNavigationState(docPath) {
    currentDocPath = docPath;
    updateDocsActionButtons();

    const category = DocsIndexManager.getDocumentCategory(docPath);
    currentCategory = category ? category.name : null;

    if (currentNavState === 'chapters' && currentChapterToc.length > 0) {
        document.querySelectorAll('.doc-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-doc') === docPath) {
                item.classList.add('active');
            }
        });
    }

    const hash = window.location.hash.substring(1);

    if (hash === 'docs') {
        showCategoryLevel();
        return;
    }
}

export function navigateToDocument(docPath, targetLine = null, keyword = null) {
    history.pushState(null, null, `#docs/${docPath}`);

    syncNavigationState(docPath);

    loadDocument(docPath, targetLine, keyword);
    updateBreadcrumb(docPath);

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function getCategoryIcon(categoryId) {
    const iconMap = {
        '快速开始': 'fa-rocket',
        '开发指南': 'fa-code',
        'API参考': 'fa-book',
        '配置': 'fa-cog',
        '部署': 'fa-server'
    };
    return iconMap[categoryId] || 'fa-folder';
}

function getDocIcon(docPath) {
    if (docPath.endsWith('.md')) {
        return 'fa-file-alt';
    }
    const ext = docPath.split('.').pop();
    const iconMap = {
        'py': 'fa-file-code',
        'js': 'fa-file-code',
        'json': 'fa-file-code',
        'yaml': 'fa-file-code',
        'yml': 'fa-file-code',
        'txt': 'fa-file-alt'
    };
    return iconMap[ext] || 'fa-file-alt';
}

function getChapterLevelIcon(level) {
    return `H${level}`;
}

function setupGlobalNavigationEvents() {
    const navContainer = document.querySelector('.docs-nav-container');
    if (!navContainer) return;

    const oldHandler = navContainer._navClickHandler;
    if (oldHandler) {
        navContainer.removeEventListener('click', oldHandler);
    }

    const clickHandler = function (e) {
        const categoryItem = e.target.closest('.category-item');
        if (categoryItem) {
            const categoryId = categoryItem.getAttribute('data-category');
            e.preventDefault();
            e.stopPropagation();
            showDocumentList(categoryId);
            return;
        }

        const docItem = e.target.closest('.doc-item');
        if (docItem) {
            const docPath = docItem.getAttribute('data-doc');
            if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
            e.preventDefault();
            e.stopPropagation();
            navigateToDocument(docPath);
            return;
        }

        const chapterItem = e.target.closest('.chapter-item');
        if (chapterItem) {
            const targetId = chapterItem.getAttribute('data-target');
            e.preventDefault();
            e.stopPropagation();
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.querySelectorAll('.chapter-item').forEach(i => i.classList.remove('active'));
                chapterItem.classList.add('active');
            }
            return;
        }

        const breadcrumbBack = e.target.closest('.breadcrumb-back');
        if (breadcrumbBack) {
            const action = breadcrumbBack.getAttribute('data-action');
            e.preventDefault();
            e.stopPropagation();
            if (action === 'back-to-categories') {
                showCategoryLevel();
            } else if (action === 'back-to-docs') {
                if (currentCategory) {
                    showDocumentList(currentCategory);
                } else {
                    showCategoryLevel();
                }
            }
            return;
        }
    };

    navContainer._navClickHandler = clickHandler;
    navContainer.addEventListener('click', clickHandler, false);
}

// ==================== 搜索浮层 ====================

function setupDocumentationSearch() {
    const searchTrigger = document.createElement('button');
    searchTrigger.type = 'button';
    searchTrigger.className = 'docs-search-trigger';
    searchTrigger.innerHTML = `<i class="fas fa-search"></i> ${I18n.t('docs.searchTrigger')}`;

    const sidebarHeader = document.querySelector('.docs-sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.appendChild(searchTrigger);
    }

    createSearchOverlay();

    searchTrigger.addEventListener('click', function () {
        openSearchOverlay();
    });

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchOverlay();
        }

        if (e.key === 'Escape') {
            closeSearchOverlay();
        }
    });
}

function createSearchOverlay() {
    if (document.querySelector('.docs-search-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'docs-search-overlay';
    overlay.innerHTML = `
        <button class="docs-search-close-btn" title="关闭 (ESC)">
            <i class="fas fa-times"></i>
        </button>
        <div class="docs-search-overlay-content">
            <div class="docs-search-overlay-wrapper">
                <i class="fas fa-search"></i>
                <input type="text" class="docs-search-overlay-input" placeholder="${I18n.t('docs.searchPlaceholder')}" autocomplete="off">
            </div>
            <div class="search-shortcut-hint">
                ${I18n.t('docs.searchHint')}
            </div>
            <div class="docs-search-results" id="overlay-search-results">
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>${I18n.t('docs.searchEmpty')}</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const searchInput = overlay.querySelector('.docs-search-overlay-input');
    const closeBtn = overlay.querySelector('.docs-search-close-btn');

    let searchTimeout;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim();
            if (query.length > 0) {
                performOverlaySearch(query);
            } else {
                clearOverlaySearchResults();
            }
        }, 300);
    });

    closeBtn.addEventListener('click', function () {
        closeSearchOverlay();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeSearchOverlay();
        }
    });

    overlay.addEventListener('keydown', function (e) {
        const results = overlay.querySelectorAll('.search-result-item');
        if (results.length === 0) return;

        const currentIndex = Array.from(results).findIndex(item => item.classList.contains('keyboard-focused'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, results.length - 1);
            focusResultItem(results[nextIndex]);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex === -1 ? results.length - 1 : Math.max(currentIndex - 1, 0);
            focusResultItem(results[prevIndex]);
        } else if (e.key === 'Enter' && currentIndex !== -1) {
            e.preventDefault();
            results[currentIndex].click();
        }
    });
}

function openSearchOverlay() {
    const overlay = document.querySelector('.docs-search-overlay');
    if (!overlay) return;

    overlay.classList.add('active');
    const searchInput = overlay.querySelector('.docs-search-overlay-input');
    searchInput.value = '';
    searchInput.placeholder = I18n.t('docs.searchPlaceholder');
    searchInput.focus();
    clearOverlaySearchResults();
    document.body.style.overflow = 'hidden';
}

function closeSearchOverlay() {
    const overlay = document.querySelector('.docs-search-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function focusResultItem(item) {
    document.querySelectorAll('.search-result-item').forEach(i => i.classList.remove('keyboard-focused'));
    item.classList.add('keyboard-focused');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function performOverlaySearch(query) {
    if (!DocsIndexManager.searchIndex) {
        const resultsContainer = document.getElementById('overlay-search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>${I18n.t('docs.searchIndexLoading')}</p>
                </div>
            `;
        }
        return;
    }

    const results = DocsIndexManager.searchDocuments(query);
    displayOverlaySearchResults(results, query);
}

function displayOverlaySearchResults(results, query) {
    const resultsContainer = document.getElementById('overlay-search-results');
    if (!resultsContainer) return;

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>${I18n.t('docs.noResults')}</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = `
        <div class="search-results-header">
            <h4>${I18n.t('docs.searchResults')} (${results.length})</h4>
        </div>
        <div class="search-results-list">
            ${results.map((result, index) => `
                <div class="search-result-item" data-doc="${result.document}" data-line="${result.line}" data-keyword="${result.keyword}" tabindex="${index}">
                    <div class="result-title">${result.title}</div>
                    <div class="result-meta">
                        <span class="result-doc">${result.document}</span>
                        <span class="result-level">H${result.level}</span>
                    </div>
                    <div class="result-snippet">...${result.keyword}...</div>
                </div>
            `).join('')}
        </div>
    `;

    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function () {
            const docPath = this.getAttribute('data-doc');
            const line = parseInt(this.getAttribute('data-line'));
            const keyword = this.getAttribute('data-keyword');
            navigateToDocument(docPath, line, keyword);
            closeSearchOverlay();
        });
    });
}

function clearOverlaySearchResults() {
    const resultsContainer = document.getElementById('overlay-search-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div class="search-no-results">
            <i class="fas fa-search"></i>
            <p>${I18n.t('docs.searchEmpty')}</p>
        </div>
    `;
}

// ==================== 面包屑 ====================

function setupBreadcrumbNavigation() {
    const breadcrumb = document.querySelector('.docs-breadcrumb');
    if (breadcrumb) {
        breadcrumb.addEventListener('click', function (e) {
            if (e.target.closest('.breadcrumb-link')?.getAttribute('href') === '#docs') {
                e.preventDefault();
                showCategoryLevel();
            }
        });
    }
}

export function updateBreadcrumb(docPath) {
    const breadcrumb = document.querySelector('.docs-breadcrumb');
    if (!breadcrumb) return;

    const category = DocsIndexManager.getDocumentCategory(docPath);
    const docTitle = DocsIndexManager.getDocumentTitle(docPath);

    if (!docPath || docPath === 'home') {
        breadcrumb.innerHTML = `<span class="current">${I18n.t('docs.title')}</span>`;
        return;
    }

    if (category) {
        breadcrumb.innerHTML = `
            <a href="#docs" class="breadcrumb-link">
                <i class="fas fa-home breadcrumb-icon"></i>
                <span>${I18n.t('docs.title')}</span>
            </a>
            <span class="separator">/</span>
            <span class="breadcrumb-category">${category.name}</span>
            <span class="separator">/</span>
            <span class="current">${docTitle || docPath}</span>
        `;
    } else {
        breadcrumb.innerHTML = `
            <a href="#docs" class="breadcrumb-link">
                <i class="fas fa-home breadcrumb-icon"></i>
                <span>${I18n.t('docs.title')}</span>
            </a>
            <span class="separator">/</span>
            <span class="current">${docTitle || docPath}</span>
        `;
    }
}

// ==================== 文档操作按钮 ====================

function setupDocumentActions() {
    const editBtn = document.querySelector('.docs-action-btn:nth-child(1)');
    if (editBtn) {
        editBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const editUrl = getEditUrl(currentDocPath);
            if (editUrl) {
                window.open(editUrl, '_blank');
            }
        });
    }

    const shareBtn = document.querySelector('.docs-action-btn:nth-child(2)');
    if (shareBtn) {
        shareBtn.addEventListener('click', function (e) {
            e.preventDefault();
            shareDocument();
        });
    }

    updateDocsActionButtons();
}

export function updateDocsActionButtons() {
    const editBtn = document.querySelector('.docs-action-btn:nth-child(1)');
    if (editBtn) {
        const editUrl = getEditUrl(currentDocPath);
        if (editUrl) {
            editBtn.setAttribute('href', editUrl);
            editBtn.setAttribute('target', '_blank');
            editBtn.setAttribute('rel', 'noopener noreferrer');
        } else {
            editBtn.setAttribute('href', '#');
            editBtn.removeAttribute('target');
            editBtn.removeAttribute('rel');
        }
    }
}

function shareDocument() {
    const currentUrl = window.location.href;
    const currentDoc = currentDocPath;
    const docTitle = DocsIndexManager.getDocumentTitle(currentDoc) || currentDoc;

    if (navigator.share) {
        navigator.share({
            title: docTitle,
            text: `${I18n.t('docs.title')} - ErisPulse`,
            url: currentUrl
        });
    } else {
        navigator.clipboard.writeText(currentUrl).then(() => {
            showMessage(I18n.t('docs.linkCopied'), 'success');
        }).catch(() => {
            const tempInput = document.createElement('input');
            tempInput.value = currentUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showMessage(I18n.t('docs.linkCopied'), 'success');
        });
    }
}

function setupDocumentationResponsive() {
    function handleResize() {
        moveTocToSidebar();
        setupGlobalNavigationEvents();
    }

    window.addEventListener('resize', handleResize);
    handleResize();
}

function getEditUrl(docPath) {
    if (!docPath) return null;
    const lang = I18n.getLang();
    return CONFIG.DOCS.githubBaseUrl + lang + '/' + docPath;
}

// ==================== 文档离线本地化 ====================

async function fetchSdkVersion() {
    const urls = [CONFIG.DOCS.pyprojectUrl, CONFIG.DOCS.pyprojectRawUrl];
    for (const url of urls) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const text = await resp.text();
            const match = text.match(/^version\s*=\s*["']([^"']+)["']/m);
            if (match && match[1]) {
                return match[1].trim();
            }
        } catch (e) {
            // 尝试下一个 URL
        }
    }
    return null;
}

async function ensureDocsIndexLoaded() {
    if (DocsIndexManager.isLoaded()) return true;

    try {
        await Promise.all([
            DocsIndexManager.loadMapping(),
            DocsIndexManager.loadSearchIndex()
        ]);
        return DocsIndexManager.isLoaded();
    } catch (e) {
        console.error('加载文档索引失败:', e);
        return false;
    }
}

export async function downloadAllDocs(targetLang, triggerBtn) {
    const lang = targetLang || I18n.getLang();

    if (!(await ensureDocsIndexLoaded())) {
        showMessage(I18n.t('settings.docsCacheNeedIndex'), 'error');
        return;
    }

    const mapping = DocsIndexManager.mapping;
    if (!mapping || !mapping.categories) {
        showMessage(I18n.t('settings.docsCacheNeedIndex'), 'error');
        return;
    }

    const allDocs = DocsIndexManager.getAllDocuments();
    if (allDocs.length === 0) {
        showMessage(I18n.t('settings.docsCacheNeedIndex'), 'error');
        return;
    }

    const btn = triggerBtn || document.querySelector('.docs-cache-download-lang[data-lang="' + lang + '"]');
    const progressWrap = document.getElementById('docs-download-progress');
    const progressBar = document.getElementById('docs-download-progress-bar');
    const progressText = document.getElementById('docs-download-progress-text');

    document.querySelectorAll('.docs-cache-download-lang').forEach(function (button) {
        button.disabled = true;
        button.classList.add('loading');
    });
    if (btn) { btn.disabled = true; btn.classList.add('loading'); }
    if (progressWrap) progressWrap.style.display = '';

    if (progressText) progressText.textContent = I18n.t('settings.docsCacheFetchingVersion');
    let sdkVersion = null;
    try {
        sdkVersion = await fetchSdkVersion();
    } catch (e) {
        console.warn('获取 SDK 版本失败:', e);
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < allDocs.length; i++) {
        const doc = allDocs[i];
        const pct = Math.round(((i) / allDocs.length) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = I18n.t('settings.docsCacheProgress', { done: i, total: allDocs.length });

        try {
            const url = CONFIG.DOCS.baseUrl + lang + '/' + doc.path;
            const resp = await fetch(url);
            if (resp.ok) {
                const content = await resp.text();
                DocsContentCache.set(lang, doc.path, content, null);
                success++;
            } else {
                failed++;
            }
        } catch (e) {
            failed++;
        }
        await new Promise(r => setTimeout(r, 5));
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = I18n.t('settings.docsCacheProgress', { done: allDocs.length, total: allDocs.length });

    const localizedTag = sdkVersion || 'unknown';
    DocsContentCache.setLocalized(lang, localizedTag);
    state.userSettings.docsLocalized = state.userSettings.docsLocalized || {};
    state.userSettings.docsLocalized[lang] = localizedTag;
    saveUserSettings();

    document.querySelectorAll('.docs-cache-download-lang').forEach(function (button) {
        button.disabled = false;
        button.classList.remove('loading');
    });
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
    setTimeout(function () {
        if (progressWrap) progressWrap.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';
    }, 1500);

    updateDocsCacheStatus();
    showMessage(I18n.t('settings.docsCacheDownloaded', { success: success, failed: failed }), failed > 0 ? 'error' : 'success');
}

export function clearDocsContentCache(lang) {
    const targetLang = lang || I18n.getLang();
    DocsContentCache.clearLang(targetLang);
    state.userSettings.docsLocalized = state.userSettings.docsLocalized || {};
    delete state.userSettings.docsLocalized[targetLang];
    saveUserSettings();
    updateDocsCacheStatus();
    showMessage(I18n.t('settings.docsCacheLangCleared', { lang: I18n.getLanguageName(targetLang) }), 'success');
}

export function clearAllDocsContentCache() {
    if (!confirm(I18n.t('settings.docsCacheClearAllConfirm'))) return;

    DocsContentCache.clearAll();
    state.userSettings.docsLocalized = {};
    saveUserSettings();
    updateDocsCacheStatus();
    checkDocsVersionUpdate();
    showMessage(I18n.t('settings.docsCacheAllCleared'), 'success');
}

export function openDocsCacheModal() {
    updateDocsCacheStatus();
    checkDocsVersionUpdate();

    if (!DocsIndexManager.isLoaded()) {
        DocsIndexManager.loadMapping().catch(function (e) {
            console.warn('预热文档映射索引失败:', e);
        });
        DocsIndexManager.loadSearchIndex().catch(function (e) {
            console.warn('预热搜索索引失败:', e);
        });
    }

    var modal = document.getElementById('docs-cache-modal');
    if (modal) modal.classList.add('active');
}

export function closeDocsCacheModal() {
    var modal = document.getElementById('docs-cache-modal');
    if (modal) modal.classList.remove('active');
}

export function updateDocsCacheStatus() {
    const tableEl = document.getElementById('docs-cache-lang-table');
    if (!tableEl) return;

    const currentLang = I18n.getLang();
    const rows = DocsContentCache.getAllLangStats().sort(function (a, b) {
        if (a.code === currentLang) return -1;
        if (b.code === currentLang) return 1;
        return 0;
    });
    const html = rows.map(function (stat) {
        const hasCache = stat.count > 0;
        const status = stat.localized ? 'localized' : (hasCache ? 'partial' : 'empty');
        const icon = stat.localized ? '<i class="fas fa-check-circle"></i>' : (hasCache ? '<i class="fas fa-folder-open"></i>' : '<i class="fas fa-cloud"></i>');
        const currentBadge = stat.code === currentLang
            ? `<span class="docs-cache-current-badge"><i class="fas fa-location-arrow"></i> ${I18n.t('settings.docsCacheCurrentLang')}</span>`
            : '';
        const statusText = stat.localized
            ? I18n.t('settings.docsCacheLocalized', { count: stat.count, version: stat.version ? I18n.t('settings.docsCacheVersion', { version: stat.version }) : I18n.t('settings.docsCacheNoVersion') })
            : (hasCache ? I18n.t('settings.docsCachePartial', { count: stat.count }) : I18n.t('settings.docsCacheEmpty'));
        const versionText = stat.version ? I18n.t('settings.docsCacheVersion', { version: stat.version }) : I18n.t('settings.docsCacheNoVersion');
        return `<div class="docs-cache-lang-row ${status}">
            <img class="docs-cache-lang-cover" src="assets/img/logo.png" alt="ErisPulse">
            <div class="docs-cache-lang-main">
                <strong>${escapeHtml(stat.name)} ${currentBadge}</strong>
                <span>${icon} ${escapeHtml(statusText)} · ${escapeHtml(versionText)}</span>
            </div>
            <div class="docs-cache-lang-actions">
                <button class="btn btn-outline docs-cache-download-lang" data-lang="${escapeHtml(stat.code)}" ${navigator.onLine ? '' : 'disabled'}>
                    <i class="fas fa-download"></i> ${I18n.t('settings.docsCacheDownloadLang')}
                </button>
                <button class="btn btn-outline docs-cache-clear-lang" data-lang="${escapeHtml(stat.code)}" ${hasCache ? '' : 'disabled'}>
                    <i class="fas fa-trash-alt"></i> ${I18n.t('settings.docsCacheClearLang')}
                </button>
            </div>
        </div>`;
    }).join('');

    tableEl.innerHTML = html;

    tableEl.querySelectorAll('.docs-cache-download-lang').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const lang = btn.getAttribute('data-lang');
            if (!navigator.onLine) {
                showMessage(I18n.t('settings.docsCacheOfflineDownload'), 'error');
                return;
            }
            downloadAllDocs(lang, btn);
        });
    });

    tableEl.querySelectorAll('.docs-cache-clear-lang').forEach(function (btn) {
        btn.addEventListener('click', function () {
            clearDocsContentCache(btn.getAttribute('data-lang'));
        });
    });
}

export async function checkDocsVersionUpdate() {
    const hintEl = document.getElementById('docs-cache-version-hint');
    if (!hintEl) return;
    if (!navigator.onLine) { hintEl.style.display = 'none'; return; }

    const lang = I18n.getLang();
    if (!DocsContentCache.isLocalized(lang)) { hintEl.style.display = 'none'; return; }

    const cachedVersion = DocsContentCache.getLocalizedVersion(lang);
    if (!cachedVersion || cachedVersion === 'unknown') { hintEl.style.display = 'none'; return; }

    try {
        const remoteVersion = await fetchSdkVersion();
        if (remoteVersion && remoteVersion !== cachedVersion) {
            hintEl.style.display = '';
            hintEl.innerHTML = '<i class="fas fa-sync-alt"></i> ' +
                I18n.t('settings.docsCacheUpdateAvailable', { old: cachedVersion, new: remoteVersion });
        } else {
            hintEl.style.display = 'none';
        }
    } catch (e) {
        hintEl.style.display = 'none';
    }
}

// ==================== 文档内容加载与渲染 ====================

export async function loadDocument(docPath, targetLine = null, keyword = null) {
    const docsContent = document.getElementById('docs-content');
    docsContent.innerHTML = `
        <div style="text-align: center; padding: 3rem 0;">
            <i class="fas fa-spinner fa-pulse fa-3x"></i>
            <p>${I18n.t('docs.loading')}</p>
        </div>
    `;

    clearToc();

    const lang = I18n.getLang();
    const offline = !navigator.onLine;
    const refreshDisabled = state.userSettings.disableOnlineCacheRefresh;
    const cached = DocsContentCache.getRaw(lang, docPath);

    if (cached && (offline || refreshDisabled || DocsContentCache.isFresh(cached))) {
        _renderDocContent(docPath, cached.content, cached.commitInfo, targetLine, keyword);
        return;
    }

    try {
        const docUrl = CONFIG.DOCS.baseUrl + lang + '/' + docPath;
        const docResponse = await fetch(docUrl);
        if (!docResponse.ok) {
            throw new Error(`HTTP ${docResponse.status}`);
        }

        const docContent = await docResponse.text();

        let commitInfo = null;
        try {
            const apiBaseUrl = 'https://api.github.com/repos/ErisPulse/ErisPulse/commits?path=' + docPath;
            const commitResponse = await fetch(apiBaseUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (commitResponse.ok) {
                const commitData = await commitResponse.json();
                if (commitData && commitData.length > 0 && commitData[0].commit) {
                    commitInfo = commitData[0];
                }
            }
        } catch (commitError) {
            console.warn('获取提交信息失败:', commitError);
        }

        DocsContentCache.set(lang, docPath, docContent, commitInfo);

        _renderDocContent(docPath, docContent, commitInfo, targetLine, keyword);

    } catch (error) {
        console.error('加载文档失败:', error);
        if (cached) {
            _renderDocContent(docPath, cached.content, cached.commitInfo, targetLine, keyword);
        } else {
            showDocumentError(docsContent, error);
        }
    }
}

function _renderDocContent(docPath, markdownContent, commitInfo, targetLine, keyword) {
    const docsContent = document.getElementById('docs-content');
    let htmlContent = marked.parse(markdownContent);

    htmlContent = addTableOfContents(htmlContent);
    htmlContent = wrapTables(htmlContent);

    docsContent.innerHTML = htmlContent;
    addDocumentMetaInfo(docsContent, docPath, commitInfo);

    if (docPath === 'ai-support/README.md') {
        injectAiMaterialDownloads(docsContent);
    }

    setTimeout(() => {
        if (currentChapterToc.length > 0) {
            showChapterToc(docPath);
        }

        if (keyword) {
            setTimeout(() => scrollToKeyword(keyword), 300);
        }
        else if (targetLine) {
            setTimeout(() => scrollToLine(targetLine), 300);
        }

        document.querySelectorAll('#docs-content a[href^="#"]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        document.querySelectorAll('#docs-content a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetDocId = getDocIdFromPath(href);
                    if (targetDocId) {
                        navigateToDocument(targetDocId);
                    } else {
                        showDocumentLinkWarning(href);
                    }
                });
            }
        });

        if (typeof mermaid !== 'undefined') {
            mermaid.init(undefined, document.querySelectorAll('.language-mermaid'));
        }

        renderCharts();

        document.querySelectorAll('#docs-content pre code:not(.language-mermaid)').forEach((block) => {
            if (!block.className || !block.className.startsWith('language-')) {
                block.classList.add('language-python');
            }

            if (state.userSettings.showLineNumbers) {
                block.classList.add('line-numbers');
            }

            Prism.highlightElement(block);
        });
    }, 100);
}

function scrollToKeyword(keyword) {
    if (!keyword) return;

    setTimeout(() => {
        const docsContent = document.getElementById('docs-content');
        if (!docsContent) return;

        const walker = document.createTreeWalker(
            docsContent,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const lowerKeyword = keyword.toLowerCase();
        let targetElement = null;
        let targetNode = null;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.textContent && node.textContent.toLowerCase().includes(lowerKeyword)) {
                targetNode = node;
                targetElement = node.parentElement;
                break;
            }
        }

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            if (targetNode.parentNode && targetNode.parentNode.parentNode) {
                const originalStyle = targetNode.parentNode.style.backgroundColor;
                targetNode.parentNode.style.transition = 'background-color 0.3s ease';
                targetNode.parentNode.style.backgroundColor = 'rgba(var(--primary-rgb), 0.3)';
                targetNode.parentNode.style.borderLeft = '4px solid var(--primary)';

                setTimeout(() => {
                    targetNode.parentNode.style.backgroundColor = originalStyle;
                    targetNode.parentNode.style.borderLeft = '';
                }, 2000);
            }

            showMessage(I18n.t('docs.keywordLocated', { keyword }), 'success');
        } else {
            showMessage(I18n.t('docs.keywordNotFound'), 'warning');
        }
    }, 500);
}

function scrollToLine(lineNumber) {
    document.getElementById('docs-content').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    showMessage(I18n.t('docs.docLoaded'), 'success');
}

function getDocIdFromPath(filePath) {
    let normalizedPath = filePath.replace(/\\/g, '/');

    normalizedPath = normalizedPath.replace(/\.md$/, '');

    if (normalizedPath.startsWith('../') || normalizedPath.startsWith('./') || !normalizedPath.includes('/')) {
        const currentDoc = window.location.hash.split('/')[1];
        if (currentDoc) {
            const resolvedPath = resolveRelativePath(currentDoc.replace(/\.md$/, ''), normalizedPath);
            if (resolvedPath) {
                normalizedPath = resolvedPath;
            }
        }
    }

    if (normalizedPath.startsWith('docs/')) {
        normalizedPath = normalizedPath.substring(5);
    }

    const allDocs = DocsIndexManager.getAllDocuments();

    let doc = allDocs.find(d => {
        const docPath = d.path.replace(/\\/g, '/').replace(/\.md$/, '').replace(/^docs\//, '');
        return docPath === normalizedPath;
    });

    if (!doc) {
        doc = fuzzyMatchDocument(normalizedPath, allDocs);
    }

    return doc ? doc.path : null;
}

function fuzzyMatchDocument(targetPath, allDocs) {
    const normalizedTarget = targetPath.toLowerCase().replace(/\.md$/, '');
    const targetFileName = normalizedTarget.split('/').pop();

    for (const doc of allDocs) {
        const docPath = doc.path.replace(/\\/g, '/');
        const normalizedDocPath = docPath.toLowerCase().replace(/\.md$/, '').replace(/^docs\//, '');
        const docFileName = normalizedDocPath.split('/').pop();

        if (docFileName === targetFileName) {
            return doc;
        }

        if (normalizedDocPath === normalizedTarget) {
            return doc;
        }

        if (normalizedDocPath.includes(normalizedTarget) || normalizedTarget.includes(normalizedDocPath)) {
            return doc;
        }

        if (docPath.endsWith(`${targetPath}.md`)) {
            return doc;
        }
    }

    return null;
}

function resolveRelativePath(basePath, relativePath) {
    const baseParts = basePath.split('/');

    if (relativePath.startsWith('./')) {
        relativePath = relativePath.substring(2);
    }

    const relativeParts = relativePath.split('/');

    const resultParts = [...baseParts];
    resultParts.pop();

    for (const part of relativeParts) {
        if (part === '..') {
            if (resultParts.length > 0) {
                resultParts.pop();
            }
        } else if (part === '.') {
            continue;
        } else if (part) {
            resultParts.push(part);
        }
    }

    return resultParts.join('/');
}

function clearToc() {
    const existingToc = document.querySelector('.table-of-contents');
    if (existingToc) {
        existingToc.remove();
    }
}

function addTableOfContents(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems = [];

    headers.forEach((header, index) => {
        const headerText = header.textContent.trim();
        const id = `section-${index}-${headerText.toLowerCase().replace(/\s+/g, '-')}`;
        header.id = id;

        tocItems.push({
            level: parseInt(header.tagName.charAt(1)),
            text: headerText,
            id: id
        });
    });

    currentChapterToc = tocItems;

    return tempDiv.innerHTML;
}

function wrapTables(htmlContent) {
    return htmlContent.replace(/<table([^>]*)>/gi, '<div class="table-wrapper"><table$1>').replace(/<\/table>/gi, '</table></div>');
}

function moveTocToSidebar() {
    // 已弃用：TOC 现在集成到左侧导航栏的章节目录中
}

function renderCharts() {
    const chartContainers = document.querySelectorAll('.chart-container');

    chartContainers.forEach(container => {
        if (container.querySelector('canvas')) return;

        const chartType = container.dataset.chartType || 'line';
        const chartData = JSON.parse(container.dataset.chartData || '{}');

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        new Chart(canvas, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    });
}

function addDocumentMetaInfo(docsContent, docPath, commitInfo) {
    const metaContainer = document.createElement('div');
    metaContainer.style.marginTop = '2rem';
    metaContainer.style.paddingTop = '1.5rem';
    metaContainer.style.borderTop = '1px solid var(--border)';

    if (commitInfo) {
        const commitDate = new Date(commitInfo.commit.author.date);
        const formattedDate = commitDate.toLocaleString(I18n.getLang(), {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const relativeTime = timeAgo(commitDate);

        let commitMessage = commitInfo.commit.message;
        if (commitMessage.includes('\n')) {
            commitMessage = commitMessage.split('\n')[0];
        }

        const commitCard = document.createElement('div');
        commitCard.style.background = 'var(--card-bg)';
        commitCard.style.padding = '1rem';
        commitCard.style.borderRadius = 'var(--radius)';
        commitCard.style.boxShadow = 'var(--shadow-sm)';
        commitCard.style.marginBottom = '1rem';

        commitCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${commitInfo.author.avatar_url}" alt="${commitInfo.commit.author.name}" style="width: 40px; height: 40px; border-radius: 50%;" referrerpolicy="no-referrer">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.9rem; margin-bottom: 0.25rem;">
                        <span style="font-weight: 500; color: var(--text);">${commitInfo.commit.author.name}</span>
                        <span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: 0.5rem;">
                            ${I18n.t('docs.updatedAgo', { time: relativeTime })}
                        </span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${commitMessage}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                        ${formattedDate}
                    </div>
                </div>
            </div>
        `;

        metaContainer.appendChild(commitCard);
    }

    const navContainer = document.createElement('div');
    navContainer.style.display = 'flex';
    navContainer.style.justifyContent = 'space-between';
    navContainer.style.flexWrap = 'wrap';
    navContainer.style.gap = '1rem';
    navContainer.style.marginTop = '1rem';

    const navLinksContainer = document.createElement('div');
    navLinksContainer.style.display = 'flex';
    navLinksContainer.style.gap = '0.5rem';

    const allDocs = DocsIndexManager.getAllDocuments();
    const currentIndex = allDocs.findIndex(d => d.path === docPath);

    if (currentIndex > 0) {
        const prevDoc = allDocs[currentIndex - 1];
        const prevLink = document.createElement('a');
        prevLink.href = '#docs/' + prevDoc.path;
        prevLink.style.display = 'inline-flex';
        prevLink.style.alignItems = 'center';
        prevLink.style.gap = '0.5rem';
        prevLink.style.background = 'var(--card-bg)';
        prevLink.style.color = 'var(--text)';
        prevLink.style.padding = '0.5rem 1rem';
        prevLink.style.borderRadius = 'var(--radius)';
        prevLink.style.textDecoration = 'none';
        prevLink.style.transition = 'var(--transition)';
        prevLink.style.border = '1px solid var(--border)';
        prevLink.innerHTML = `<i class="fas fa-arrow-left"></i> ${prevDoc.title}`;
        prevLink.style.fontSize = '0.9rem';
        prevLink.classList.add('doc-nav-link');

        prevLink.addEventListener('mouseenter', function () {
            this.style.borderColor = 'var(--primary)';
            this.style.transform = 'translateY(-2px)';
        });

        prevLink.addEventListener('mouseleave', function () {
            this.style.borderColor = 'var(--border)';
            this.style.transform = 'translateY(0)';
        });

        prevLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToDocument(prevDoc.path);
        });

        navLinksContainer.appendChild(prevLink);
    }

    if (currentIndex < allDocs.length - 1) {
        const nextDoc = allDocs[currentIndex + 1];
        const nextLink = document.createElement('a');
        nextLink.href = '#docs/' + nextDoc.path;
        nextLink.style.display = 'inline-flex';
        nextLink.style.alignItems = 'center';
        nextLink.style.gap = '0.5rem';
        nextLink.style.background = 'var(--card-bg)';
        nextLink.style.color = 'var(--text)';
        nextLink.style.padding = '0.5rem 1rem';
        nextLink.style.borderRadius = 'var(--radius)';
        nextLink.style.textDecoration = 'none';
        nextLink.style.transition = 'var(--transition)';
        nextLink.style.border = '1px solid var(--border)';
        nextLink.innerHTML = ` ${nextDoc.title} <i class="fas fa-arrow-right"></i>`;
        nextLink.style.fontSize = '0.9rem';
        nextLink.classList.add('doc-nav-link');

        nextLink.addEventListener('mouseenter', function () {
            this.style.borderColor = 'var(--primary)';
            this.style.transform = 'translateY(-2px)';
        });

        nextLink.addEventListener('mouseleave', function () {
            this.style.borderColor = 'var(--border)';
            this.style.transform = 'translateY(0)';
        });

        nextLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateToDocument(nextDoc.path);
        });

        navLinksContainer.appendChild(nextLink);
    }

    navContainer.appendChild(navLinksContainer);
    metaContainer.appendChild(navContainer);
    docsContent.appendChild(metaContainer);
}

function showDocumentLinkWarning(linkUrl) {
    const message = I18n.t('docs.linkWarning', { link: linkUrl });
    showMessage(message, 'warning');
}

function showDocumentError(docsContent, error) {
    let errorMessage = error.message;
    let suggestion = I18n.t('docs.retryHint');
    let showRetryButton = false;

    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = I18n.t('docs.networkError');
        suggestion = I18n.t('docs.networkHint');
        showRetryButton = true;
    } else if (errorMessage.includes('API rate limit exceeded')) {
        errorMessage = I18n.t('docs.rateLimit');
        suggestion = I18n.t('docs.rateLimitHint');
    } else if (errorMessage.includes('HTTP')) {
        const statusMatch = errorMessage.match(/HTTP (\d+)/);
        if (statusMatch) {
            const statusCode = statusMatch[1];
            errorMessage = `${I18n.t('docs.serverError')}: HTTP ${statusCode}`;

            if (statusCode === '404') {
                suggestion = I18n.t('docs.noDoc');
            } else if (statusCode === '403') {
                suggestion = I18n.t('docs.forbidden');
            } else if (statusCode === '500') {
                suggestion = I18n.t('docs.serverError');
            }
        }
    }

    let errorHTML = `
        <div class="error-message" style="text-align: center; padding: 3rem 0;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
            <h3>${I18n.t('docs.loadFailed')}</h3>
            <p>${errorMessage}</p>
            <p style="color: var(--secondary); margin-bottom: 1.5rem;">${suggestion}</p>
    `;

    if (showRetryButton) {
        errorHTML += `
            <button onclick="location.reload()" 
                style="background: var(--primary); color: white; border: none; 
                    padding: 0.75rem 1.5rem; border-radius: 50px; 
                    cursor: pointer; transition: var(--transition);">
                <i class="fas fa-sync-alt"></i> ${I18n.t('market.reload')}
            </button>
        `;
    }

    errorHTML += `</div>`;
    docsContent.innerHTML = errorHTML;
}

function injectAiMaterialDownloads(docsContent) {
    var lang = I18n.getLang();
    var baseUrl = 'https://github.com/ErisPulse/ErisPulse/releases/latest/download/';
    var materials = [
        { type: 'ModuleDev', icon: 'fa-puzzle-piece' },
        { type: 'AdapterDev', icon: 'fa-plug' },
        { type: 'Full', icon: 'fa-book-open' }
    ];

    var labels = {
        'zh-CN': {
            title: 'AI 物料下载',
            subtitle: '下载对应语言的开发物料，投喂给 AI 即可快速生成代码',
            download: '下载',
            items: {
                'ModuleDev': { title: '模块开发物料', desc: '适用于开发功能模块' },
                'AdapterDev': { title: '适配器开发物料', desc: '适用于开发平台适配器' },
                'Full': { title: '完整开发参考', desc: '适用于复杂开发场景' }
            }
        },
        'en': {
            title: 'AI Material Downloads',
            subtitle: 'Download language-specific materials for AI-assisted development',
            download: 'Download',
            items: {
                'ModuleDev': { title: 'Module Dev Material', desc: 'For developing functional modules' },
                'AdapterDev': { title: 'Adapter Dev Material', desc: 'For developing platform adapters' },
                'Full': { title: 'Full Dev Reference', desc: 'For complex development scenarios' }
            }
        },
        'zh-TW': {
            title: 'AI 物料下載',
            subtitle: '下載對應語言的開發物料，投餵給 AI 即可快速生成程式碼',
            download: '下載',
            items: {
                'ModuleDev': { title: '模組開發物料', desc: '適用於開發功能模組' },
                'AdapterDev': { title: '介面卡開發物料', desc: '適用於開發平台介面卡' },
                'Full': { title: '完整開發參考', desc: '適用於複雜開發場景' }
            }
        },
        'ja': {
            title: 'AI 素材ダウンロード',
            subtitle: '言語別の開発素材をダウンロードしてAIに読み込ませれば、すぐにコードを生成できます',
            download: 'ダウンロード',
            items: {
                'ModuleDev': { title: 'モジュール開発素材', desc: '機能モジュールの開発に' },
                'AdapterDev': { title: 'アダプター開発素材', desc: 'プラットフォームアダプターの開発に' },
                'Full': { title: '完全開発リファレンス', desc: '複雑な開発シナリオに' }
            }
        },
        'ru': {
            title: 'Загрузка материалов для ИИ',
            subtitle: 'Скачайте материалы для вашего языка и передайте их ИИ для быстрой генерации кода',
            download: 'Скачать',
            items: {
                'ModuleDev': { title: 'Материалы для модулей', desc: 'Для разработки функциональных модулей' },
                'AdapterDev': { title: 'Материалы для адаптеров', desc: 'Для разработки платформенных адаптеров' },
                'Full': { title: 'Полный справочник', desc: 'Для сложных сценариев разработки' }
            }
        }
    };

    var l = labels[lang] || labels['en'];

    var cardsHtml = '<div class="ai-doc-download-section">';
    cardsHtml += '<h3>' + l.title + '</h3>';
    cardsHtml += '<p class="ai-doc-download-subtitle">' + l.subtitle + '</p>';
    cardsHtml += '<div class="ai-doc-download-cards">';

    materials.forEach(function (mat) {
        var url = baseUrl + 'ErisPulse-' + mat.type + '-' + lang + '.md';
        var item = l.items[mat.type];
        cardsHtml += '<div class="ai-doc-download-card">';
        cardsHtml += '<div class="ai-doc-download-icon"><i class="fas ' + mat.icon + '"></i></div>';
        cardsHtml += '<div class="ai-doc-download-info">';
        cardsHtml += '<h4>' + item.title + '</h4>';
        cardsHtml += '<p>' + item.desc + '</p>';
        cardsHtml += '</div>';
        cardsHtml += '<a class="ai-doc-download-btn" href="' + url + '" target="_blank" rel="noopener">';
        cardsHtml += '<i class="fas fa-download"></i> ' + l.download;
        cardsHtml += '</a>';
        cardsHtml += '</div>';
    });

    cardsHtml += '</div></div>';

    var target = docsContent.querySelector('h2, h3');
    if (target) {
        target.insertAdjacentHTML('afterend', cardsHtml);
    } else {
        docsContent.insertAdjacentHTML('afterbegin', cardsHtml);
    }
}
