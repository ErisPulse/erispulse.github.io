/**
 * 模块市场：分类 / 筛选 / 搜索 / 排序 / 渲染卡片、市场模态框（安装/文档）
 */

import { CONFIG } from '../config.js?v=c644e0bc94';
import { I18n } from '../i18n.js?v=c644e0bc94';
import { state } from '../core/state.js?v=c644e0bc94';
import { showMessage } from '../core/notify.js?v=c644e0bc94';
import { enhanceGitHubMarkdown } from '../core/gh-markdown.js?v=c644e0bc94';
import { fetchSdkVersions, getCachedSdkVersions } from '../core/sdk-versions.js?v=c644e0bc94';

// 标签云折叠阈值：全站标签上百个，默认只展示热度最高的若干项
const TAG_PREVIEW_LIMIT = 18;

// 卡片内标签上限：卡片标签位固定为一行，放不下的折叠成「+N」按钮，
// 点开弹出悬浮面板查看全部标签（标签数量不设上限，卡片内只做概览）
const CARD_TAG_LIMIT = 5;

// 互斥标记：已验证 / 未验证 同时选中没有意义，选一个自动清掉另一个
const EXCLUSIVE_FLAGS = { verified: 'unverified', unverified: 'verified' };

const SORT_MODES = ['default', 'name', 'newest'];

/** README 渲染依赖的 CDN 脚本就绪等待上限（ms） */
const README_LIBS_TIMEOUT_MS = 12000;

// 分类：后端（packages.json）只存编号，展示名按当前语言取 i18n 的
// category.<key>，编号表见 config.js 的 MODULE_CATEGORIES
const CATEGORY_KEYS = new Map(CONFIG.MODULE_CATEGORIES.map(item => [item.id, item.key]));

function categoryKey(id) {
    return CATEGORY_KEYS.get(Number(id)) || '';
}

function categoryLabel(id) {
    const key = categoryKey(id);
    return key ? I18n.t('category.' + key) : '';
}

// 分类 → 数据来源
const CATEGORY_SOURCE = {
    all: () => [...state.allModules, ...state.allAdapters],
    modules: () => state.allModules,
    adapters: () => state.allAdapters
};

// 仅市场模块使用的本地状态
let activeCategory = 'all';
let searchQuery = '';
let activeFlags = new Set();
let activeCategories = new Set();
let activeTags = new Set();
let sdkCeiling = '';        // 空串表示「不限」
let sdkVersionOptions = getCachedSdkVersions();  // PyPI 实时版本（降序），为空时回退到索引内的版本
let sortMode = 'default';
let activeLang = '';        // 界面语言筛选（语言代码，空串表示不限）
let tagsExpanded = false;
let authorFilter = '';      // 作者筛选（来自点击卡片作者行；空串表示不限）
let allTags = [];           // [{ tag, count }]，按热度降序
let allCategories = [];     // [{ id, count }]，按 config.js 的分类顺序

export function setupMarketplace() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeCategory = this.dataset.category;

            if (activeCategory === 'all') {
                history.pushState(null, null, '#market');
            } else {
                history.pushState(null, null, `#market/${activeCategory}`);
            }

            renderModules();
        });
    });

    // 快速筛选：按钮固定，状态由 JS 维护
    const flagBox = document.getElementById('market-flag-filters');
    if (flagBox) {
        flagBox.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            toggleFlag(chip.dataset.flag);
            renderModules();
        });
    }

    // 标签筛选：标签按钮动态生成，使用事件委托
    const tagBox = document.getElementById('market-tag-filters');
    if (tagBox) {
        tagBox.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-tag');
            if (!chip) return;

            if (chip.dataset.action === 'toggle-all') {
                tagsExpanded = !tagsExpanded;
                renderTags();
                return;
            }

            const tag = chip.dataset.tag;
            if (activeTags.has(tag)) activeTags.delete(tag);
            else activeTags.add(tag);

            renderTags();
            renderModules();
        });
    }

    // 分类筛选：按钮由数据动态生成，使用事件委托
    const categoryBox = document.getElementById('market-category-filters');
    if (categoryBox) {
        categoryBox.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-tag');
            if (!chip) return;

            const id = Number(chip.dataset.category);
            if (activeCategories.has(id)) activeCategories.delete(id);
            else activeCategories.add(id);

            renderCategories();
            renderModules();
        });
    }

    // 标签悬浮面板：点击面板与按钮之外、按 Esc、滚动或改窗口尺寸都收起
    document.addEventListener('click', (e) => {
        if (!tagPopoverState) return;
        if (tagPopoverState.panel.contains(e.target) || tagPopoverState.anchor.contains(e.target)) return;
        hideTagPopover();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideTagPopover();
    });
    window.addEventListener('scroll', hideTagPopover, true);
    window.addEventListener('resize', hideTagPopover);

    const sdkSelect = document.getElementById('market-sdk-select');
    if (sdkSelect) {
        sdkSelect.addEventListener('change', function () {
            sdkCeiling = this.value;
            renderModules();
        });
    }

    const sortSelect = document.getElementById('market-sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            sortMode = this.value;
            renderModules();
        });
    }

    const langSelect = document.getElementById('market-lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', function () {
            activeLang = this.value;
            renderModules();
        });
    }

    const resetBtn = document.getElementById('market-filter-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    // 筛选折叠条：默认收起，点击展开/收起
    const toggleBtn = document.getElementById('market-filter-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('market-filters');
            const open = panel.hidden;
            panel.hidden = !open;
            toggleBtn.setAttribute('aria-expanded', String(open));
            toggleBtn.classList.toggle('open', open);
        });
    }

    // 作者筛选 chip：点击移除作者筛选
    const authorChip = document.getElementById('market-author-chip');
    if (authorChip) {
        authorChip.addEventListener('click', () => {
            authorFilter = '';
            updateFilterCount();
            renderModules();
        });
    }

    const searchInput = document.getElementById('module-search');
    if (!searchInput) return;
    var _searchTimer = null;
    searchInput.addEventListener('input', function () {
        searchQuery = this.value.trim();
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(renderModules, 300);
    });
}

/**
 * 切换快速筛选标记（已验证 / 未验证 互斥）
 * @param {string} flag
 */
function toggleFlag(flag) {
    if (!flag) return;

    if (activeFlags.has(flag)) {
        activeFlags.delete(flag);
    } else {
        activeFlags.add(flag);
        const exclusive = EXCLUSIVE_FLAGS[flag];
        if (exclusive) activeFlags.delete(exclusive);
    }
}

/**
 * 清空全部筛选条件（含搜索词）
 */
function resetFilters() {
    activeFlags.clear();
    activeCategories.clear();
    activeTags.clear();
    sdkCeiling = '';
    sortMode = 'default';
    searchQuery = '';
    tagsExpanded = false;
    activeLang = '';
    authorFilter = '';
    updateFilterCount();

    const searchInput = document.getElementById('module-search');
    if (searchInput) searchInput.value = '';
    const sdkSelect = document.getElementById('market-sdk-select');
    if (sdkSelect) sdkSelect.value = '';
    const sortSelect = document.getElementById('market-sort-select');
    if (sortSelect) sortSelect.value = 'default';

    renderCategories();
    renderTags();
    renderModules();
}

export async function loadModuleData() {
    try {
        const response = await fetch(CONFIG.API.packages);
        if (!response.ok) throw new Error('模块API请求失败');
        const data = await response.json();

        state.allModules = mapCategory(data.modules, 'module');
        state.allAdapters = mapCategory(data.adapters, 'adapter');

        updateStats();
        buildFilterUI();
        renderModules();

    } catch (error) {
        console.error('加载模块数据失败:', error);
        showError(I18n.t('market.loadFailed'));
    }
}

/**
 * 归一化索引条目：不同分类的字段缺失情况不一致，统一补默认值
 * @param {object} source 分类容器（name → 条目）
 * @param {string} type 分类标识
 * @returns {Array<object>}
 */
function mapCategory(source, type) {
    return Object.entries(source || {}).map(([name, info]) => ({
        name,
        package: info.package,
        version: info.version,
        author: info.author || 'Unknown',
        description: info.description || '',
        repository: info.repository || '',
        min_sdk_version: info.min_sdk_version || '',
        submitted_at: info.submitted_at || '',
        submitted_by: info.submitted_by || '',
        official: info.official === true,
        verified: info.verified !== false,
        featured: info.featured === true,
        hidden: info.hidden === true,
        // 分类编号：后端存数字（0 表示索引里没有分类），展示名按当前语言渲染
        category: Number(info.category) || 0,
        tags: Array.isArray(info.tags) ? info.tags.map(String) : [],
        logo: info.logo || '',
        erisdev_site: info.erisdev_site || '',
        i18n: Array.isArray(info.i18n) ? info.i18n.map(String) : [],
        type
    }));
}

export function updateStats() {
    const modules = state.allModules.filter(pkg => !pkg.hidden);
    const adapters = state.allAdapters.filter(pkg => !pkg.hidden);
    // 分类计数徽章（分段控制器按钮上）
    setText('category-count-all', modules.length + adapters.length);
    setText('category-count-modules', modules.length);
    setText('category-count-adapters', adapters.length);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function toggleHidden(id, hidden) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('is-hidden', hidden);
}

/**
 * 构建筛选控件：排序下拉、SDK 版本下拉、标签云
 * 数据刷新后调用；标签云与 SDK 下拉基于「全部分类」，保证切换分类时筛选上下文稳定
 */
function buildFilterUI() {
    const sortLabels = {
        default: 'market.sort.default',
        name: 'market.sort.name',
        newest: 'market.sort.newest'
    };
    const sortSelect = document.getElementById('market-sort-select');
    if (sortSelect) {
        sortSelect.innerHTML = SORT_MODES.map(mode =>
            `<option value="${mode}" data-i18n="${sortLabels[mode]}">${I18n.t(sortLabels[mode])}</option>`
        ).join('');
        sortSelect.value = sortMode;
    }

    renderSdkOptions();
    refreshSdkVersions();

    // 标签热度统计（隐藏条目不计入）
    const counter = new Map();
    collectAll().forEach(pkg => {
        if (pkg.hidden) return;
        pkg.tags.forEach(tag => counter.set(tag, (counter.get(tag) || 0) + 1));
    });
    allTags = [...counter.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    // 数据刷新后可能已不存在的标签，清理掉避免筛选结果恒为空
    const known = new Set(allTags.map(item => item.tag));
    activeTags = new Set([...activeTags].filter(tag => known.has(tag)));

    toggleHidden('market-tag-row', allTags.length === 0);

    // 分类统计（隐藏条目与没有分类编号的条目不计入）
    const categoryCounter = new Map();
    collectAll().forEach(pkg => {
        if (pkg.hidden || !CATEGORY_KEYS.has(pkg.category)) return;
        categoryCounter.set(pkg.category, (categoryCounter.get(pkg.category) || 0) + 1);
    });
    allCategories = CONFIG.MODULE_CATEGORIES
        .filter(item => categoryCounter.has(item.id))
        .map(item => ({ id: item.id, count: categoryCounter.get(item.id) }));

    // 数据刷新后可能已不存在的分类，清理掉避免筛选结果恒为空
    const knownCategories = new Set(allCategories.map(item => item.id));
    activeCategories = new Set([...activeCategories].filter(id => knownCategories.has(id)));

    toggleHidden('market-category-row', allCategories.length === 0);

    renderTags();
    renderCategories();

    renderLangOptions();
}

/**
 * 语言下拉：候选是条目里出现过的语言代码（大小写不敏感归一），
 * 展示名用 Intl.DisplayNames 的原生写法（如 zh → 中文、de → Deutsch）
 */
function renderLangOptions() {
    const langSelect = document.getElementById('market-lang-select');
    if (!langSelect) return;

    const counter = new Map();
    collectAll().forEach(pkg => {
        if (pkg.hidden || !Array.isArray(pkg.i18n)) return;
        pkg.i18n.forEach(code => {
            if (typeof code !== 'string' || !code) return;
            const key = code.toLowerCase();
            counter.set(key, (counter.get(key) || 0) + 1);
        });
    });

    const codes = [...counter.keys()].sort();
    // 数据刷新后可能已不存在的语言，清理掉避免筛选结果恒为空
    if (activeLang && !counter.has(activeLang)) activeLang = '';

    langSelect.innerHTML = `<option value="" data-i18n="market.filter.language.any">${I18n.t('market.filter.language.any')}</option>` +
        codes.map(code => `<option value="${escapeHtml(code)}">${escapeHtml(langNativeName(code))} (${escapeHtml(code)}) · ${counter.get(code)}</option>`).join('');
    langSelect.value = activeLang;

    // 没有任何条目声明语言时，标签和下拉一起隐藏
    const langEmpty = codes.length === 0;
    const langLabel = document.getElementById('market-lang-label');
    langSelect.classList.toggle('is-hidden', langEmpty);
    if (langLabel) langLabel.classList.toggle('is-hidden', langEmpty);
}

/** 语言代码 → 原生语言名（Intl.DisplayNames，失败回退代码本身） */
const _langNameCache = new Map();
function langNativeName(code) {
    if (_langNameCache.has(code)) return _langNameCache.get(code);
    let name = code;
    try {
        name = new Intl.DisplayNames([code], { type: 'language' }).of(code) || code;
    } catch (e) { /* 非法代码回退原样 */ }
    _langNameCache.set(code, name);
    return name;
}

/**
 * SDK 版本下拉：候选是 PyPI 上 ErisPulse 的实时版本，
 * 接口拿不到时回退到索引里出现过的版本，保证筛选仍可用
 */
function renderSdkOptions() {
    const sdkSelect = document.getElementById('market-sdk-select');
    if (!sdkSelect) return;

    const versions = sdkVersionOptions.length > 0 ? sdkVersionOptions : collectSdkVersions();
    // 已选版本若不在候选里（如接口刷新后该版本被撤下），仍保留条目，避免 UI 与筛选状态不一致
    const selected = sdkCeiling && !versions.includes(sdkCeiling) ? [sdkCeiling] : [];

    sdkSelect.innerHTML = `<option value="" data-i18n="market.filter.sdk.any">${I18n.t('market.filter.sdk.any')}</option>` +
        [...versions, ...selected].map(version => `<option value="${escapeHtml(version)}">${escapeHtml(version)}</option>`).join('');
    sdkSelect.value = sdkCeiling;
}

/**
 * 拉取 PyPI 实时版本并就地刷新下拉；失败时静默保持当前候选
 */
async function refreshSdkVersions() {
    const versions = await fetchSdkVersions();
    if (versions.length === 0) return;

    sdkVersionOptions = versions;
    renderSdkOptions();
}

/**
 * 渲染标签云：已选标签始终可见，其余按热度截断
 */
function renderTags() {
    const box = document.getElementById('market-tag-filters');
    if (!box) return;

    const selected = allTags.filter(item => activeTags.has(item.tag));
    const rest = allTags.filter(item => !activeTags.has(item.tag));
    const limit = Math.max(0, TAG_PREVIEW_LIMIT - selected.length);
    const shown = tagsExpanded ? rest : rest.slice(0, limit);
    const collapsible = rest.length > shown.length || tagsExpanded;

    box.innerHTML = [
        ...selected.map(item => tagChipHtml(item, true)),
        ...shown.map(item => tagChipHtml(item, false)),
        collapsible
            ? `<button type="button" class="filter-tag filter-tag-more" data-action="toggle-all">
                <i class="fas fa-chevron-${tagsExpanded ? 'up' : 'down'}"></i>
                <span data-i18n="${tagsExpanded ? 'market.filter.tagsLess' : 'market.filter.tagsMore'}">${I18n.t(tagsExpanded ? 'market.filter.tagsLess' : 'market.filter.tagsMore')}</span>
            </button>`
            : ''
    ].join('');

    I18n.applyTranslations();
}

function tagChipHtml(item, isActive) {
    return `<button type="button" class="filter-tag${isActive ? ' active' : ''}" data-tag="${escapeHtml(item.tag)}">
        ${escapeHtml(item.tag)}<span class="filter-tag-count">${item.count}</span>
    </button>`;
}

/**
 * 渲染分类筛选：编号 → 当前语言名称
 * 文字带 data-i18n，切换语言后由 applyTranslations 就地更新
 */
function renderCategories() {
    const box = document.getElementById('market-category-filters');
    if (!box) return;

    box.innerHTML = allCategories.map(item => {
        const active = activeCategories.has(item.id);
        const key = categoryKey(item.id);
        return `<button type="button" class="filter-tag${active ? ' active' : ''}" data-category="${item.id}">
            <span data-i18n="category.${key}">${escapeHtml(categoryLabel(item.id))}</span><span class="filter-tag-count">${item.count}</span>
        </button>`;
    }).join('');

    I18n.applyTranslations();
}

// 托管域名映射：module_type:module_name → fqdn（来自 workbench 公开接口，仅含已生效域名）
let _siteMap = null;
async function loadSiteMap() {
    if (_siteMap) return _siteMap;
    try {
        const r = await fetch('https://workbench.erisdev.com/api/public/domains');
        const d = await r.json();
        _siteMap = new Map((d.domains || []).map(x => [x.module_type + ':' + x.module_name, x.fqdn]));
    } catch (e) { _siteMap = new Map(); }
    return _siteMap;
}

/** 分类编号 → 占位线性图标（与市场筛选的分类一致） */
const CATEGORY_PLACEHOLDER_ICONS = {
    1: 'fa-wrench',
    2: 'fa-gamepad',
    3: 'fa-sliders',
    4: 'fa-bell',
    5: 'fa-robot',
    6: 'fa-plug',
    7: 'fa-chart-column',
};

/**
 * 模块头图占位：分类线性图标；适配器固定插头，无分类用方块
 * @param {object} pkg 模块条目
 * @returns {string}
 */
function modulePlaceholderHtml(pkg) {
    const icon = pkg.type === 'adapter' ? 'fa-plug'
        : (CATEGORY_PLACEHOLDER_ICONS[Number(pkg.category)] || 'fa-cube');
    return `<span class="module-logo-tile module-logo-ph"><i class="fas ${icon}" aria-hidden="true"></i></span>`;
}

/**
 * 模块头图标记：索引 logo 覆盖于占位之上，加载成功即隐藏占位、失败则露出
 * @param {object} pkg 模块条目
 * @returns {string}
 */
function moduleLogoHtml(pkg) {
    const ph = modulePlaceholderHtml(pkg);
    if (!pkg.logo) return ph;
    return ph + `<img class="module-logo-img" src="${escapeHtml(pkg.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onload="this.previousElementSibling.style.display='none'" onerror="this.remove()">`;
}

/** 作者行小头像：仅 GitHub 仓库可由拥有者名拼接地址；与主图同源时跳过 */
function authorAvatarHtml(pkg) {
    const m = String(pkg.repository || '').match(/^https?:\/\/github\.com\/([^/]+)\//i);
    if (!m) return '';
    const ava = `https://github.com/${m[1]}.png`;
    if (pkg.logo && String(pkg.logo).split('?')[0] === ava) return '';
    return `<img class="author-ava" src="${ava}?size=64" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`;
}

export async function renderModules() {
    const modulesGrid = document.getElementById('modules-grid');
    if (!modulesGrid) return;
    const siteMap = await loadSiteMap();

    // 重建卡片会连带移除「+N」按钮，先收起可能已打开的标签面板
    hideTagPopover();

    const packagesToShow = applyFilters().map(p => {
        // 索引存完整地址，公开接口存裸域名；仅接受 https，其余视为无网站
        const raw = String(p.erisdev_site || siteMap.get(p.type + ':' + p.name) || '');
        const url = raw && !raw.includes(':') ? 'https://' + raw : raw;
        return { ...p, _site: url.startsWith('https://') ? url : '' };
    });
    updateFilterSummary(packagesToShow.length);

    if (packagesToShow.length === 0) {
        modulesGrid.innerHTML = emptyStateHtml();
        const clearBtn = modulesGrid.querySelector('[data-action="clear-filters"]');
        if (clearBtn) clearBtn.addEventListener('click', resetFilters);
        return;
    }

    modulesGrid.innerHTML = packagesToShow.map(cardHtml).join('');

    document.querySelectorAll('[data-action="install"]').forEach(btn => {
        btn.addEventListener('click', () => showInstallModal(btn.dataset.package));
    });

    document.querySelectorAll('[data-action="docs"]').forEach(btn => {
        btn.addEventListener('click', () => showDocsModal(btn.dataset.package, btn.dataset.repo));
    });

    document.querySelectorAll('[data-action="all-tags"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTagPopover(btn);
        });
    });

    modulesGrid.querySelectorAll('.module-author').forEach(el => {
        el.addEventListener('click', () => {
            authorFilter = el.dataset.author || '';
            updateFilterCount();
            renderModules();
        });
    });

    // 卡片内的 data-i18n 文本需要按当前语言落位
    I18n.applyTranslations();
}

function cardHtml(pkg, index) {
    const pkgCategoryKey = categoryKey(pkg.category);
    const badges = [
        // 分类：编号由后端存储，名称按当前语言渲染
        pkgCategoryKey
            ? `<span class="module-badge badge-category"><i class="fas fa-layer-group"></i> <span data-i18n="category.${pkgCategoryKey}">${escapeHtml(categoryLabel(pkg.category))}</span></span>`
            : '',
        pkg.featured
            ? `<span class="module-badge badge-featured"><i class="fas fa-star"></i> <span data-i18n="market.filter.featured">${I18n.t('market.filter.featured')}</span></span>`
            : '',
        pkg.official
            ? `<span class="module-badge badge-official"><i class="fas fa-check-circle"></i> <span data-i18n="market.filter.official">${I18n.t('market.filter.official')}</span></span>`
            : '',
        pkg._site
            ? `<a class="module-badge badge-site" href="${escapeHtml(pkg._site)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(pkg._site)}"><i class="fas fa-globe"></i> ${I18n.t('market.moduleSite')}</a>`
            : '',
        pkg.verified
            ? ''
            : `<span class="module-badge badge-unverified"><i class="fas fa-exclamation-triangle"></i> <span data-i18n="market.unverified">${I18n.t('market.unverified')}</span></span>`
    ].join('');

    return `
        <div class="module-card${pkg.featured ? ' is-featured' : ''}" data-package="${escapeHtml(pkg.package)}" style="animation-delay: ${index * 0.05}s">
            <div class="module-header">
                <div class="module-icon module-logo">
                    ${moduleLogoHtml(pkg)}
                </div>
                <div>
                    <h3 class="module-name">${escapeHtml(pkg.name)}</h3>
                    <div class="module-meta-row">
                        <div class="module-version">v${escapeHtml(pkg.version)}</div>
                        ${badges}
                    </div>
                </div>
            </div>
            <p class="module-desc">${escapeHtml(pkg.description)}</p>
            ${cardTagsHtml(pkg.tags)}
            ${cardI18nHtml(pkg.i18n)}
            <div class="module-footer">
                <div class="module-footer-info">
                    <div class="module-author" data-author="${escapeHtml(pkg.author)}" role="button" tabindex="0" title="${escapeHtml(I18n.t('market.filterByAuthor'))} · ${escapeHtml(pkg.author)}">${authorAvatarHtml(pkg)}<span>${escapeHtml(pkg.author)}</span></div>
                    ${pkg.min_sdk_version ? `<div class="module-sdk"><i class="fas fa-code-branch"></i> SDK ≥ ${escapeHtml(pkg.min_sdk_version)}</div>` : ''}
                </div>
                <div class="module-actions">
                    <button class="module-btn" data-action="install" data-package="${escapeHtml(pkg.package)}">
                        <i class="fas fa-download"></i> ${I18n.t('market.install')}
                    </button>
                    ${pkg.repository ? `<button class="module-btn secondary" data-action="docs" data-package="${escapeHtml(pkg.package)}" data-repo="${escapeHtml(pkg.repository)}">
                        <i class="fas fa-book"></i> ${I18n.t('market.docs')}
                    </button>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * 卡片标签概览：单行，最多 CARD_TAG_LIMIT 个，其余折叠为可点击的「+N」
 *
 * 容器始终渲染（即使没有标签）：标签位高度固定，保证卡片等高。
 * 标签列表可以被裁切，「+N」放在列表之外；
 * 完整标签点开「+N」后由悬浮面板展示（面板内容取自卡片对应的条目）。
 *
 * @param {string[]} tags
 * @returns {string} 标签区 HTML
 */
/**
 * 卡片界面语言：原生语言名芯片（最多 4 个，超出折叠为 +N）
 * @param {string[]} langs
 * @returns {string} 语言区 HTML，无语言时返回空串
 */
function cardI18nHtml(langs) {
    if (!Array.isArray(langs) || langs.length === 0) return '';
    const shown = langs.slice(0, 4).map(code => `<span class="module-lang">${escapeHtml(langNativeName(code))}</span>`).join('');
    const rest = langs.length > 4 ? `<span class="module-lang module-lang-more">+${langs.length - 4}</span>` : '';
    return `<div class="module-i18n"><i class="fas fa-language" title="${escapeHtml(I18n.t('market.i18n'))}"></i>${shown}${rest}</div>`;
}

function cardTagsHtml(tags) {
    const overflow = tags.length > CARD_TAG_LIMIT;
    const visible = tags.slice(0, overflow ? CARD_TAG_LIMIT - 1 : CARD_TAG_LIMIT);
    const rest = tags.length - visible.length;

    return `
            <div class="module-tags">
                <div class="module-tags-list">
                    ${visible.map(tag => `<span class="module-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
                ${rest > 0
                    ? `<button type="button" class="module-tag module-tag-more" data-action="all-tags" title="${escapeHtml(tags.join(', '))}" aria-label="${escapeHtml(I18n.t('market.tags.more', { count: rest }))}">+${rest}</button>`
                    : ''}
            </div>
            `;
}

function emptyStateHtml() {
    const filtered = hasActiveFilters();
    return `
        <div class="empty-state">
            <img class="empty-state-mascot" src="assets/img/mascot-hero.webp" alt="" aria-hidden="true" loading="lazy">
            <h3 class="empty-state-title">${I18n.t(filtered ? 'market.empty.filtered' : 'market.empty')}</h3>
            <p class="empty-state-desc">${I18n.t('market.empty.hint')}</p>
            ${filtered ? `<button type="button" class="filter-reset empty-state-action" data-action="clear-filters">
                <i class="fas fa-times-circle"></i> ${I18n.t('market.filter.reset')}
            </button>` : ''}
        </div>
    `;
}

/**
 * 按当前分类 / 搜索 / 快速筛选 / 标签 / SDK 版本筛选并排序
 * @returns {Array<object>}
 */
function applyFilters() {
    const source = CATEGORY_SOURCE[activeCategory] || CATEGORY_SOURCE.all;
    let packages = source().filter(pkg => !pkg.hidden);

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        packages = packages.filter(pkg => matchesQuery(pkg, query));
    }

    if (activeFlags.size > 0) {
        packages = packages.filter(pkg => {
            for (const flag of activeFlags) {
                if (flag === 'featured' && !pkg.featured) return false;
                if (flag === 'official' && !pkg.official) return false;
                if (flag === 'verified' && !pkg.verified) return false;
                if (flag === 'unverified' && pkg.verified) return false;
                if (flag === 'site' && !pkg.erisdev_site) return false;
            }
            return true;
        });
    }

    // 多选分类取并集：一个条目只有一个分类，取交集会恒为空
    if (activeCategories.size > 0) {
        packages = packages.filter(pkg => activeCategories.has(pkg.category));
    }

    // 多选标签取并集：命中任意一个所选标签即展示
    if (activeTags.size > 0) {
        packages = packages.filter(pkg => pkg.tags.some(tag => activeTags.has(tag)));
    }

    if (authorFilter) {
        packages = packages.filter(pkg => pkg.author === authorFilter);
    }

    // 界面语言：单选，条目的 i18n 列表大小写不敏感命中
    if (activeLang) {
        packages = packages.filter(pkg => Array.isArray(pkg.i18n) &&
            pkg.i18n.some(code => typeof code === 'string' && code.toLowerCase() === activeLang));
    }

    // SDK 上限无法解析时忽略该条件（例如下拉被外部写入非法值），避免比较时抛错
    const ceiling = parseVersion(sdkCeiling);
    if (ceiling) {
        packages = packages.filter(pkg => {
            const required = parseVersion(pkg.min_sdk_version);
            return required === null || compareVersion(required, ceiling) <= 0;
        });
    }

    return sortPackages(packages);
}

/**
 * 名称 / 描述 / 作者 / 包名 / 标签 / 提交者 均可命中搜索
 */
function matchesQuery(pkg, query) {
    return [
        pkg.name,
        pkg.description,
        pkg.author,
        pkg.package,
        pkg.submitted_by,
        pkg.tags.join(' ')
    ].some(field => String(field || '').toLowerCase().includes(query));
}

function sortPackages(packages) {
    const sorted = [...packages];

    if (sortMode === 'name') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'newest') {
        sorted.sort((a, b) => (Date.parse(b.submitted_at) || 0) - (Date.parse(a.submitted_at) || 0));
    } else {
        // 默认排序：推荐位置顶；Array#sort 稳定，其余保持索引文件顺序
        sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return sorted;
}

function updateFilterSummary(count) {
    updateFilterCount();
    document.querySelectorAll('#market-flag-filters .filter-chip').forEach(chip => {
        chip.classList.toggle('active', activeFlags.has(chip.dataset.flag));
    });

    const filtered = hasActiveFilters();
    toggleHidden('market-filter-reset', !filtered);

    const summary = document.getElementById('market-summary');
    if (summary) {
        summary.textContent = I18n.t(filtered ? 'market.summary.filtered' : 'market.summary', { count });
    }
}

function hasActiveFilters() {
    return activeFlags.size > 0 || activeCategories.size > 0 || activeTags.size > 0 ||
        Boolean(sdkCeiling) || Boolean(activeLang) || Boolean(authorFilter) || Boolean(searchQuery);
}

/** 折叠条角标与作者筛选 chip 的同步 */
function updateFilterCount() {
    const n = activeFlags.size + activeCategories.size + activeTags.size
        + (sdkCeiling ? 1 : 0) + (activeLang ? 1 : 0) + (authorFilter ? 1 : 0) + (searchQuery ? 1 : 0);
    const el = document.getElementById('market-filter-count');
    if (el) {
        el.textContent = n;
        el.classList.toggle('is-hidden', n === 0);
    }
    const chip = document.getElementById('market-author-chip');
    if (chip) {
        chip.classList.toggle('is-hidden', !authorFilter);
        const nm = document.getElementById('market-author-chip-name');
        if (nm) nm.textContent = authorFilter;
    }
}

function collectAll() {
    return CATEGORY_SOURCE.all();
}

/**
 * SDK 版本回退候选：PyPI 接口不可用时，取索引中出现过的裸版本号（X.Y.Z），降序
 */
function collectSdkVersions() {
    const versions = new Set();
    collectAll().forEach(pkg => {
        if (pkg.hidden) return;
        const raw = String(pkg.min_sdk_version || '').trim();
        if (/^\d+(?:\.\d+)+$/.test(raw)) versions.add(raw);
    });

    return [...versions].sort((a, b) => compareVersion(parseVersion(b), parseVersion(a)));
}

/**
 * 宽松解析版本号：取数字主体，`2.7.0-dev.0` 视为 2.7.0
 * @returns {number[]|null} 无法解析时返回 null（视为不限版本）
 */
function parseVersion(value) {
    const match = String(value || '').trim().match(/^\d+(?:\.\d+)*/);
    return match ? match[0].split('.').map(Number) : null;
}

function compareVersion(a, b) {
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
        const left = a[i] || 0;
        const right = b[i] || 0;
        if (left !== right) return left < right ? -1 : 1;
    }
    return 0;
}

function escapeHtml(value) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(value ?? '').replace(/[&<>"']/g, char => map[char]);
}

function getIconByType(type) {
    const icons = {
        'module': '<i class="fas fa-puzzle-piece"></i>',
        'adapter': '<i class="fas fa-plug"></i>',
        'cli': '<i class="fas fa-terminal"></i>'
    };
    return icons[type] || '<i class="fas fa-box"></i>';
}

function showError(message) {
    const modulesGrid = document.getElementById('modules-grid');
    modulesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
            <h3>${message}</h3>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer;">
                ${I18n.t('market.reload')}
            </button>
        </div>
    `;
}

// ==================== 卡片标签悬浮面板 ====================

let tagPopoverState = null;   // { panel, anchor }

/**
 * 打开 / 收起「+N」对应的标签悬浮面板（同一个按钮再次点击即收起）
 * @param {HTMLElement} anchor 卡片上的「+N」按钮
 */
function toggleTagPopover(anchor) {
    if (tagPopoverState && tagPopoverState.anchor === anchor) {
        hideTagPopover();
        return;
    }
    hideTagPopover();

    const card = anchor.closest('.module-card');
    const pkg = card ? findPackage(card.dataset.package) : null;
    if (!pkg || pkg.tags.length === 0) return;

    const panel = document.createElement('div');
    panel.className = 'tag-popover';
    panel.innerHTML = `
        <div class="tag-popover-title">${escapeHtml(I18n.t('market.tags.all'))}</div>
        <div class="tag-popover-tags">${pkg.tags.map(tag => `<span class="module-tag">${escapeHtml(tag)}</span>`).join('')}</div>
    `;

    document.body.appendChild(panel);
    positionTagPopover(panel, anchor);

    anchor.classList.add('is-active');
    tagPopoverState = { panel, anchor };
}

/**
 * 定位面板：默认贴在按钮下方，越界时翻到上方并贴边
 */
function positionTagPopover(panel, anchor) {
    const rect = anchor.getBoundingClientRect();
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.max(gap, Math.min(rect.left, viewportWidth - panel.offsetWidth - gap));
    let top = rect.bottom + gap;
    if (top + panel.offsetHeight > viewportHeight - gap) {
        top = Math.max(gap, rect.top - panel.offsetHeight - gap);
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}

function hideTagPopover() {
    if (!tagPopoverState) return;
    tagPopoverState.panel.remove();
    tagPopoverState.anchor.classList.remove('is-active');
    tagPopoverState = null;
}

// ==================== 市场模态框 ====================

export function setupModals() {
    var closeModalBtn = document.getElementById('close-modal');
    var moduleModal = document.getElementById('module-modal');
    if (closeModalBtn && moduleModal) {
        closeModalBtn.addEventListener('click', function () {
            moduleModal.classList.remove('active');
        });

        moduleModal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var mm = document.getElementById('module-modal');
            var sm = document.getElementById('submit-module-modal');
            if (mm) mm.classList.remove('active');
            if (sm) sm.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

export function showInstallModal(packageName) {
    const pkg = findPackage(packageName);
    if (!pkg) return;

    const modal = document.getElementById('module-modal');
    const modalContent = document.getElementById('module-modal-content');

    modalContent.innerHTML = `
        <h3>${escapeHtml(pkg.name)} v${escapeHtml(pkg.version)}</h3>
        <p>${escapeHtml(pkg.description)}</p>

        <h4 style="margin-top: 1.5rem;">${I18n.t('market.installCmd')}</h4>
        <pre style="background: var(--bg); padding: 1rem; border-radius: var(--radius);"><code>epsdk install ${escapeHtml(pkg.package)}</code></pre>

        ${pkg.min_sdk_version ? `
        <h4 style="margin-top: 1.5rem;">${I18n.t('market.minSdkVersion')}</h4>
        <p>≥ ${escapeHtml(pkg.min_sdk_version)}</p>
        ` : ''}

        ${pkg.submitted_at ? `
        <h4 style="margin-top: 1.5rem;">${I18n.t('market.submittedAt')}</h4>
        <p>${escapeHtml(String(pkg.submitted_at).slice(0, 10))}</p>
        ` : ''}

        ${pkg.tags.length > 0 ? `
        <h4 style="margin-top: 1.5rem;">${I18n.t('modal.tags')}</h4>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${pkg.tags.map(tag => `<span class="module-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ` : ''}

        ${Array.isArray(pkg.i18n) && pkg.i18n.length > 0 ? `
        <h4 style="margin-top: 1.5rem;">${I18n.t('market.i18n')}</h4>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${pkg.i18n.map(code => `<span class="module-tag">${escapeHtml(langNativeName(code))} (${escapeHtml(code)})</span>`).join('')}
        </div>
        ` : ''}

        ${pkg.repository ? `
        <h4 style="margin-top: 1.5rem;">${I18n.t('modal.repoInfo')}</h4>
        <p><a href="${escapeHtml(pkg.repository)}" target="_blank">${I18n.t('modal.viewSource')}</a></p>
        ${pkg._site ? `<p><a href="${escapeHtml(pkg._site)}" target="_blank" rel="noopener noreferrer">${I18n.t('market.moduleSite')}</a> · ${escapeHtml(pkg._site)}</p>` : ''}
        ` : ''}
    `;

    modal.classList.add('active');
}

/**
 * 按包名在全部分类中查找条目（市场卡片的安装/文档按钮都用它定位）
 * @param {string} packageName
 * @returns {object|undefined}
 */
function findPackage(packageName) {
    return collectAll().find(pkg => pkg.package === packageName);
}

export async function showDocsModal(packageName, repoUrl) {
    const pkg = findPackage(packageName);
    if (!pkg || !repoUrl) return;

    const modal = document.getElementById('module-modal');
    const modalContent = document.getElementById('module-modal-content');

    modalContent.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="loader-spinner"></div>
            <p>${I18n.t('docs.loadingModuleDoc')}</p>
        </div>
    `;

    modal.classList.add('active');

    // marked / DOMPurify / Prism 是 defer 的 CDN 脚本，未就绪时等待，超时按加载失败处理
    try {
        await waitForGlobal(['marked', 'DOMPurify', 'Prism'], README_LIBS_TIMEOUT_MS);
    } catch (e) {
        showReadmeError(modalContent, pkg);
        return;
    }

    let markdown;
    try {
        markdown = await fetchReadmeContent(repoUrl);
    } catch (error) {
        console.error('获取文档失败:', error);
        showReadmeError(modalContent, pkg);
        return;
    }

    // README 来自第三方仓库：渲染结果经 DOMPurify 消毒后写入 DOM。
    // 钩子须经 addHook 注册，作为配置项传入不生效
    DOMPurify.addHook('afterSanitizeAttributes', readmeLinkHook);
    let htmlContent;
    try {
        htmlContent = DOMPurify.sanitize(enhanceGitHubMarkdown(marked.parse(markdown)), {
            FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['style'],
            ADD_ATTR: ['target'],
        });
    } finally {
        DOMPurify.removeHook('afterSanitizeAttributes', readmeLinkHook);
    }

    modalContent.innerHTML = `
        <div class="markdown-content">
            <h3>${escapeHtml(pkg.name)} v${escapeHtml(pkg.version)}</h3>
            ${htmlContent}
        </div>
    `;

    document.querySelectorAll('#module-modal-content pre code').forEach((block) => {
        if (!block.className || !block.className.startsWith('language-')) {
            block.classList.add('language-python');
        }
        Prism.highlightElement(block);
    });
}

/** 消毒钩子：README 内的链接在新窗口打开并切断来源页的引用 */
function readmeLinkHook(node) {
    if (node.tagName !== 'A') return;
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
}

/** 文档弹窗的加载失败态 */
function showReadmeError(modalContent, pkg) {    modalContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle" style="color: var(--wr-c);"></i>
            <h3>${I18n.t('modal.loadDocFailed')}</h3>
            <p><a href="${escapeHtml(pkg.repository)}" target="_blank" rel="noopener noreferrer">${I18n.t('modal.viewSource')}</a></p>
        </div>
    `;
}

/**
 * 轮询等待全局变量就绪
 * @param {string[]} names 全局变量名
 * @param {number} timeoutMs 超时毫秒数，超时拒绝
 */
function waitForGlobal(names, timeoutMs) {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const timer = setInterval(() => {
            if (names.every(name => typeof window[name] !== 'undefined')) {
                clearInterval(timer);
                resolve();
            } else if (Date.now() - startedAt > timeoutMs) {
                clearInterval(timer);
                reject(new Error('libraries not ready: ' + names.join(', ')));
            }
        }, 100);
    });
}

/** 仓库默认分支的候选，按序尝试 */
const README_BRANCHES = ['main', 'master'];

/**
 * 拉取仓库 README：依次尝试候选分支，不经 GitHub API 查询默认分支
 * @param {string} repoUrl 仓库地址
 * @returns {Promise<string>} README Markdown
 * @throws {Error} 全部候选分支都取不到时抛出
 */
async function fetchReadmeContent(repoUrl) {
    const path = String(repoUrl).replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '').split('/');
    const [owner, repo] = path;
    if (!owner || !repo) throw new Error('invalid repository URL');

    const host = new URL(repoUrl).host;
    const base = host === 'codeberg.org'
        ? `https://codeberg.org/${owner}/${repo}/raw/branch/`
        : `${CONFIG.DEFAULT_USER_SETTINGS.gh_proxy}https://raw.githubusercontent.com/${owner}/${repo}/`;

    for (const branch of README_BRANCHES) {
        try {
            const response = await fetch(`${base}${branch}/README.md`, { cache: 'force-cache' });
            if (response.ok) return await response.text();
        } catch (e) { /* 单个候选失败继续尝试下一个 */ }
    }
    throw new Error('README not found on any candidate branch');
}
