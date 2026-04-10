/**
 * ErisPulse 网站主 JavaScript 文件
 */

// ==================== 全局配置 ====================
const CONFIG = {
    // 网站基础配置
    SITE: {
        name: 'ErisPulse',
        description: '高性能异步机器人开发框架',
        version: '2.0.0',
        url: 'https://www.erisdev.com',
        github: 'https://github.com/ErisPulse',
        author: 'ErisPulse Team'
    },

    // 友链配置
    FRIEND_LINKS: [
        {
            name: 'Python',
            url: 'https://www.python.org',
            description: 'Python 官方网站',
            icon: 'fab fa-python'
        },
        {
            name: 'OneBot',
            url: 'https://12.onebot.dev',
            description: 'OneBot12 协议规范',
            icon: 'fas fa-robot'
        },
        {
            name: 'GitHub',
            url: 'https://github.com',
            description: '全球最大的代码托管平台',
            icon: 'fab fa-github'
        },
        {
            name: 'Codeberg',
            url: 'https://codeberg.org',
            description: '自由、开源的代码托管社区',
            icon: 'fas fa-code-branch'
        }
    ],

    // 文档配置
    DOCS: {
        baseUrl: 'https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/',
        githubBaseUrl: 'https://github.com/ErisPulse/ErisPulse/edit/Develop/v2/docs/',
        
        // 索引文件配置
        index: {
            cdnUrl: 'https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/_meta/',
            githubUrl: 'https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/_meta/',
            mappingFile: 'docs-mapping.json',
            searchIndexFile: 'docs-search-index.json',
            cacheExpiry: 24 * 60 * 60 * 1000, // 24小时
            storageKeys: {
                mapping: 'erispulse-docs-mapping',
                searchIndex: 'erispulse-docs-search-index',
                searchHistory: 'erispulse-search-history'
            }
        }
    },

    // 应用设置
    SETTINGS_VERSION: '1.0',
    STORAGE_KEYS: {
        SETTINGS: 'erispulse-settings',
        THEME: 'theme'
    },
    DEFAULT_USER_SETTINGS: {
        version: '1.0',
        theme: 'auto',
        animations: true,
        compactLayout: false,
        showLineNumbers: false,
        stickyNav: true,
        gh_proxy: 'https://cdn.gh-proxy.org/'
    },

    // API 端点
    API: {
        contributors: 'https://api.github.com/repos/ErisPulse/ErisPulse/contributors',
        packages: 'https://erisdev.com/packages.json'
    }
};

// ==================== 索引管理器 ====================
const DocsIndexManager = (function() {
    let mappingCache = null;
    let searchIndexCache = null;
    let isLoadingMapping = false;
    let isLoadingSearchIndex = false;
    let loadCallbacks = [];
    
    /**
     * 获取当前语言的索引文件名
     */
    function getLanguageIndexFile(filename) {
        const lang = I18n.getLang();
        return `${lang}/${filename}`;
    }
    
    /**
     * 加载映射索引（三层降级策略）
     */
    async function loadMapping() {
        if (isLoadingMapping && mappingCache) {
            return mappingCache;
        }
        
        isLoadingMapping = true;
        
        try {
            console.log('尝试从CDN加载映射索引...');
            const lang = I18n.getLang();
            const langFilename = getLanguageIndexFile(CONFIG.DOCS.index.mappingFile);
            const data = await loadFromCDN(langFilename);
            mappingCache = data;
            saveToCache(CONFIG.DOCS.index.storageKeys.mapping, data);
            console.log(`✓ 从CDN成功加载${lang}映射索引`);
            notifyLoadCallbacks('mapping', true, data);
            return data;
        } catch (cdnError) {
            console.warn('CDN加载失败，尝试从GitHub加载...', cdnError);
            try {
                const data = await loadFromGitHub(CONFIG.DOCS.index.mappingFile);
                mappingCache = data;
                saveToCache(CONFIG.DOCS.index.storageKeys.mapping, data);
                console.log('✓ 从GitHub成功加载映射索引');
                notifyLoadCallbacks('mapping', true, data);
                return data;
            } catch (githubError) {
                console.warn('GitHub加载失败，尝试从缓存加载...', githubError);
                try {
                    const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.mapping);
                    mappingCache = data;
                    console.log('✓ 从缓存成功加载映射索引');
                    notifyLoadCallbacks('mapping', true, data);
                    return data;
                } catch (cacheError) {
                    console.error('所有加载方式均失败', cacheError);
                    const error = new Error(I18n.t('docs.loadIndexFailed'));
                    notifyLoadCallbacks('mapping', false, null, error);
                    throw error;
                }
            }
        } finally {
            isLoadingMapping = false;
        }
    }
    
    /**
     * 加载搜索索引（三层降级策略）
     */
    async function loadSearchIndex() {
        if (isLoadingSearchIndex && searchIndexCache) {
            return searchIndexCache;
        }
        
        isLoadingSearchIndex = true;
        
        try {
            console.log('尝试从CDN加载搜索索引...');
            const lang = I18n.getLang();
            const langFilename = getLanguageIndexFile(CONFIG.DOCS.index.searchIndexFile);
            const data = await loadFromCDN(langFilename);
            searchIndexCache = data;
            saveToCache(CONFIG.DOCS.index.storageKeys.searchIndex, data);
            console.log(`✓ 从CDN成功加载${lang}搜索索引`);
            notifyLoadCallbacks('search', true, data);
            return data;
        } catch (cdnError) {
            console.warn('CDN加载失败，尝试从GitHub加载...', cdnError);
            try {
                const data = await loadFromGitHub(CONFIG.DOCS.index.searchIndexFile);
                searchIndexCache = data;
                saveToCache(CONFIG.DOCS.index.storageKeys.searchIndex, data);
                console.log('✓ 从GitHub成功加载搜索索引');
                notifyLoadCallbacks('search', true, data);
                return data;
            } catch (githubError) {
                console.warn('GitHub加载失败，尝试从缓存加载...', githubError);
                try {
                    const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.searchIndex);
                    searchIndexCache = data;
                    console.log('✓ 从缓存成功加载搜索索引');
                    notifyLoadCallbacks('search', true, data);
                    return data;
                } catch (cacheError) {
                    console.error('所有加载方式均失败', cacheError);
                    const error = new Error(I18n.t('docs.loadIndexFailed'));
                    notifyLoadCallbacks('search', false, null, error);
                    throw error;
                }
            }
        } finally {
            isLoadingSearchIndex = false;
        }
    }
    
    /**
     * 注册加载完成回调
     */
    function onLoad(callback) {
        loadCallbacks.push(callback);
    }
    
    /**
     * 通知所有回调
     */
    function notifyLoadCallbacks(type, success, data, error = null) {
        loadCallbacks.forEach(callback => {
            try {
                callback(type, success, data, error);
            } catch (e) {
                console.error('回调执行失败:', e);
            }
        });
    }
    
    /**
     * 检查是否正在加载
     */
    function isLoaded() {
        return mappingCache !== null && searchIndexCache !== null;
    }
    
    /**
     * 从CDN加载
     */
    async function loadFromCDN(filename) {
        const url = CONFIG.DOCS.index.cdnUrl + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CDN请求失败: ${response.status}`);
        }
        return await response.json();
    }
    
    /**
     * 从GitHub加载
     */
    async function loadFromGitHub(filename) {
        const url = CONFIG.DOCS.index.githubUrl + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GitHub请求失败: ${response.status}`);
        }
        return await response.json();
    }
    
    /**
     * 从缓存加载
     */
    async function loadFromCache(storageKey) {
        try {
            const cached = localStorage.getItem(storageKey);
            if (!cached) {
                throw new Error('缓存不存在');
            }
            
            const data = JSON.parse(cached);
            
            // 检查缓存是否过期
            if (data.timestamp && Date.now() - data.timestamp > CONFIG.DOCS.index.cacheExpiry) {
                throw new Error('缓存已过期');
            }
            
            return data.content;
        } catch (error) {
            throw new Error(`缓存加载失败: ${error.message}`);
        }
    }
    
    /**
     * 保存到缓存
     */
    function saveToCache(storageKey, content) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                content: content
            };
            localStorage.setItem(storageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('保存缓存失败:', error);
        }
    }
    
    /**
     * 获取文档路径
     */
    function getDocumentPath(docId) {
        if (!mappingCache || !mappingCache.categories) {
            return null;
        }
        
        for (const categoryName of Object.keys(mappingCache.categories)) {
            const category = mappingCache.categories[categoryName];
            if (category.documents) {
                const doc = category.documents.find(d => d.path === docId || d.path.includes(docId));
                if (doc) {
                    return doc.path;
                }
            }
        }
        return null;
    }
    
    /**
     * 获取文档标题
     */
    function getDocumentTitle(docPath) {
        if (!mappingCache || !mappingCache.categories) {
            return null;
        }
        
        for (const categoryName of Object.keys(mappingCache.categories)) {
            const category = mappingCache.categories[categoryName];
            if (category.documents) {
                const doc = category.documents.find(d => d.path === docPath);
                if (doc) {
                    return doc.title;
                }
            }
        }
        return null;
    }
    
    /**
     * 获取文档分类
     */
    function getDocumentCategory(docPath) {
        if (!mappingCache || !mappingCache.categories) {
            return null;
        }
        
        for (const [categoryName, category] of Object.entries(mappingCache.categories)) {
            if (category.documents) {
                const doc = category.documents.find(d => d.path === docPath);
                if (doc) {
                    return {
                        name: categoryName,
                        title: category.name,
                        description: category.description
                    };
                }
            }
        }
        return null;
    }
    
    /**
     * 获取所有文档列表
     */
    function getAllDocuments() {
        if (!mappingCache || !mappingCache.categories) {
            return [];
        }
        
        const docs = [];
        for (const [categoryName, category] of Object.entries(mappingCache.categories)) {
            if (category.documents) {
                category.documents.forEach(doc => {
                    docs.push({
                        path: doc.path,
                        title: doc.title,
                        level: doc.level,
                        category: categoryName
                    });
                });
            }
        }
        return docs;
    }
    
    /**
     * 搜索文档
     */
    function searchDocuments(query) {
        if (!searchIndexCache || !searchIndexCache.keywords) {
            return [];
        }
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [keyword, occurrences] of Object.entries(searchIndexCache.keywords)) {
            if (keyword.toLowerCase().includes(lowerQuery) || lowerQuery.includes(keyword.toLowerCase())) {
                occurrences.forEach(occurrence => {
                    results.push({
                        document: occurrence.document,
                        title: occurrence.title,
                        line: occurrence.line,
                        level: occurrence.level,
                        keyword: keyword,
                        relevance: calculateRelevance(query, keyword)
                    });
                });
            }
        }
        
        // 按相关性排序
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results;
    }
    
    /**
     * 计算相关性
     */
    function calculateRelevance(query, keyword) {
        const lowerQuery = query.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();
        
        // 精确匹配
        if (lowerKeyword === lowerQuery) {
            return 100;
        }
        
        // 开头匹配
        if (lowerKeyword.startsWith(lowerQuery)) {
            return 80;
        }
        
        // 包含匹配
        if (lowerKeyword.includes(lowerQuery)) {
            return 60;
        }
        
        return 0;
    }
    
    /**
     * 清除缓存
     */
    function clearCache() {
        try {
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.mapping);
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.searchIndex);
            console.log('缓存已清除');
        } catch (error) {
            console.warn('清除缓存失败:', error);
        }
    }
    
    // 公共API
    return {
        loadMapping,
        loadSearchIndex,
        onLoad,
        isLoaded,
        getDocumentPath,
        getDocumentTitle,
        getDocumentCategory,
        getAllDocuments,
        searchDocuments,
        clearCache,
        get mapping() { return mappingCache; },
        get searchIndex() { return searchIndexCache; }
    };
})();

// ==================== 主应用对象 ====================
const ErisPulseApp = (function () {
    // ==================== 私有变量 ====================
    let currentTheme = 'light';
    let allModules = [];
    let allAdapters = [];
    let allCliExtensions = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };

    // ==================== 初始化模块 ====================
    function init() {
        // 初始化 i18n（应用所有 data-i18n 翻译）
        I18n.init();
        
        setupStorage();
        loadUserSettings();
        applyUserSettings();
        registerServiceWorker();
        setupThemeToggle();
        setupHamburgerMenu();
        setupViewSwitching();
        setupGlobalLangSwitcher();
        setupMarketplace();
        setupDocumentation();
        setupModals();
        setupSettings();
        renderFriendLinks();
        setupHomeAnimations();
        setupCopyCode();
    }

    // ==================== 全局语言切换 ====================
    function setupGlobalLangSwitcher() {
        const switcher = document.getElementById('global-lang-switcher');
        const btn = document.getElementById('lang-switcher-btn');
        if (!switcher || !btn) return;

        // 设置初始按钮标签和激活状态
        updateLangSwitcherUI();

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
                    handleLanguageSwitch(newLang);
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

    /**
     * 更新语言切换器按钮标签和选项激活状态
     */
    function updateLangSwitcherUI() {
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
    function handleLanguageSwitch(lang) {
        console.log('切换语言:', lang);

        // 使用 I18n 模块设置语言（同步所有 UI data-i18n 元素 + localStorage）
        I18n.setLang(lang, true);

        // 更新全局语言切换器按钮标签和激活状态
        updateLangSwitcherUI();

        // 清除文档缓存并重新加载
        DocsIndexManager.clearCache();
        DocsIndexManager.loadMapping().then(() => {
            DocsIndexManager.loadSearchIndex();
        }).catch(err => {
            console.error('切换语言失败:', err);
            showMessage(I18n.t('common.langSwitchFailed'), 'error');
        });

        // 回到文档首页（如果当前在文档视图）
        showCategoryLevel();
        updateBreadcrumb(null);
        history.pushState(null, null, '#docs');

        // 重置导航状态
        currentNavState = 'categories';
        currentCategory = null;
        currentDocPath = null;
        currentChapterToc = [];

        // 更新文档默认欢迎文本
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

        // 如果当前在模块市场，重新渲染模块卡片以更新按钮文字
        if (document.getElementById('market-view').classList.contains('active')) {
            renderModules();
        }

        showMessage(I18n.t('common.langSwitched', { name: I18n.getLanguageName(lang) }), 'success');
    }

    function setupStorage() {
        try {
            const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);

                if (!parsedSettings.version || parsedSettings.version !== CONFIG.SETTINGS_VERSION) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                    userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };
                    return;
                }

                userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS, ...parsedSettings };
            }
        } catch (e) {
            console.warn('Failed to load user settings:', e);
            userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };
        }
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js')
                    .then(function (registration) {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(function (err) {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    }

    // ==================== 主题和设置模块 ====================
    function loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);

                if (!parsedSettings.version || parsedSettings.version !== CONFIG.SETTINGS_VERSION) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                    userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };
                    return;
                }

                userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS, ...parsedSettings };
            }
        } catch (e) {
            console.warn('Failed to load user settings:', e);
            userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };
        }
    }

    function saveUserSettings() {
        try {
            userSettings.version = CONFIG.SETTINGS_VERSION;
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(userSettings));
        } catch (e) {
            console.warn('Failed to save user settings:', e);
        }
    }

    function applyUserSettings() {
        applyThemeSetting();

        if (!userSettings.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }

        if (userSettings.compactLayout) {
            document.body.classList.add('compact-layout');
        } else {
            document.body.classList.remove('compact-layout');
        }

        if (userSettings.showLineNumbers) {
            document.body.classList.add('show-line-numbers');
        } else {
            document.body.classList.remove('show-line-numbers');
        }

        if (!userSettings.stickyNav) {
            document.body.classList.add('no-sticky-nav');
        } else {
            document.body.classList.remove('no-sticky-nav');
        }
    }

    function applyThemeSetting() {
        if (userSettings.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', userSettings.theme);
        }
        updateThemeToggleIcon();
    }

    function updateThemeToggleIcon() {
        const icon = document.getElementById('theme-toggle-icon');
        if (!icon) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    }

    function setupThemeToggle() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || (prefersDark ? 'dark' : 'light');
        applyTheme();
    }

    function applyTheme() {
        applyThemeSetting();
    }

    function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        userSettings.theme = newTheme;
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, newTheme);
        saveUserSettings();
        applyThemeSetting();
    }

    // ==================== UI交互模块 ====================
    function setupHamburgerMenu() {
        const hamburger = document.getElementById('hamburger');
        const navContainer = document.getElementById('nav-container');

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navContainer.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!navContainer.contains(e.target) && e.target !== hamburger) {
                hamburger.classList.remove('active');
                navContainer.classList.remove('active');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navContainer.classList.remove('active');
                }
            });
        });
    }

    function setupViewSwitching() {
        const viewLinks = document.querySelectorAll('[data-view]');
        const viewContainers = document.querySelectorAll('.view-container');

        window.addEventListener('hashchange', switchViewByHash);

        viewLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const view = this.getAttribute('data-view');
                updateView(view);
            });
        });

        switchViewByHash();
    }

    function switchViewByHash() {
        const hash = window.location.hash.substring(1);
        let view = 'home';

        if (hash.startsWith('docs')) {
            view = 'docs';
            const docMatch = hash.match(/docs\/(.+)/);
            if (docMatch && docMatch[1]) {
                setTimeout(() => {
                    navigateToDocument(docMatch[1]);
                }, 500);
            }
        } else if (hash.startsWith('market')) {
            view = 'market';
            const categoryMatch = hash.match(/market\/(.+)/);
            if (categoryMatch && categoryMatch[1]) {
                setTimeout(() => {
                    const categoryBtn = document.querySelector(`.category-btn[data-category="${categoryMatch[1]}"]`);
                    if (categoryBtn) {
                        categoryBtn.click();
                    }
                }, 500);
            }
        } else if (hash === 'changelog' || hash.startsWith('dev-') ||
            hash.startsWith('cli') || hash.startsWith('quick-start') ||
            hash.startsWith('adapter-standards') || hash.startsWith('use-core') ||
            hash.startsWith('platform-features') || hash.startsWith('ai-module')) {
            view = 'docs';
            const docPath = hash === 'changelog' ? 'changelog' : hash;
            setTimeout(() => {
                navigateToDocument(docPath);
            }, 500);
        } else if (hash === 'about') {
            view = 'about';
        } else if (hash === 'settings') {
            view = 'settings';
        }

        updateView(view);
    }

    function updateView(view) {
        document.querySelectorAll('[data-view]').forEach(link => link.classList.remove('active'));
        if (document.querySelector(`[data-view="${view}"]`)) {
            document.querySelector(`[data-view="${view}"]`).classList.add('active');
        }

        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        if (view === 'market') {
            loadModuleData();
        }

        if (view === 'about') {
            loadContributors();
        }
    }

    function showMessage(message, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;

        Object.assign(messageEl.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: 'var(--radius)',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(20px)',
            opacity: '0',
            transition: 'all 0.3s ease',
            background: type === 'success' ? 'var(--primary)' : type === 'error' ? '#ef4444' : '#64748b'
        });

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.transform = 'translateY(0)';
            messageEl.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            messageEl.style.transform = 'translateY(20px)';
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }, 3000);
    }

    // ==================== 友链功能 ====================
    function renderFriendLinks() {
        const container = document.getElementById('friend-links-container');
        if (!container) return;

        if (CONFIG.FRIEND_LINKS.length === 0) {
            container.innerHTML = `<p class="no-friend-links">${I18n.t('common.noData')}</p>`;
            return;
        }

        const linksHtml = CONFIG.FRIEND_LINKS.map(link => `
            <a href="${link.url}" target="_blank" class="friend-link" rel="noopener noreferrer">
                <i class="${link.icon || 'fas fa-link'}"></i>
                <div class="friend-link-info">
                    <span class="friend-link-name">${link.name}</span>
                    <span class="friend-link-desc">${link.description}</span>
                </div>
            </a>
        `).join('');

        container.innerHTML = linksHtml;
    }

    // ==================== 设置模块 ====================
    function setupSettings() {
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
                userSettings.animations = this.checked;
                saveUserSettings();
                if (this.checked) {
                    document.body.classList.remove('no-animations');
                } else {
                    document.body.classList.add('no-animations');
                }
            });
        }

        if (document.getElementById('compact-layout')) {
            document.getElementById('compact-layout').addEventListener('change', function () {
                userSettings.compactLayout = this.checked;
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
                userSettings.showLineNumbers = this.checked;
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
                userSettings.stickyNav = this.checked;
                saveUserSettings();
                if (this.checked) {
                    document.body.classList.remove('no-sticky-nav');
                } else {
                    document.body.classList.add('no-sticky-nav');
                }
            });
        }

        setTimeout(initSettingsForm, 100);
    }

    function initSettingsForm() {
        if (document.getElementById('animations-toggle')) {
            document.getElementById('animations-toggle').checked = userSettings.animations;
        }
        if (document.getElementById('compact-layout')) {
            document.getElementById('compact-layout').checked = userSettings.compactLayout;
        }
        if (document.getElementById('show-line-numbers')) {
            document.getElementById('show-line-numbers').checked = userSettings.showLineNumbers;
        }
        if (document.getElementById('sticky-nav')) {
            document.getElementById('sticky-nav').checked = userSettings.stickyNav;
        }
    }

    // ==================== 模块市场模块 ====================
    function setupMarketplace() {
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

        const searchInput = document.getElementById('module-search');
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim();
            renderModules();
        });
    }

    async function loadModuleData() {
        try {
            const response = await fetch(CONFIG.API.packages);
            if (!response.ok) throw new Error('模块API请求失败');
            const data = await response.json();

            allModules = Object.entries(data.modules || {}).map(([name, info]) => ({
                name,
                package: info.package,
                version: info.version,
                author: info.author,
                description: info.description,
                repository: info.repository,
                official: info.official || false,
                tags: info.tags || [],
                type: 'module'
            }));

            allAdapters = Object.entries(data.adapters || {}).map(([name, info]) => ({
                name,
                package: info.package,
                version: info.version,
                author: info.author || 'Unknown',
                description: info.description,
                repository: info.repository,
                official: info.official || false,
                tags: info.tags || [],
                type: 'adapter'
            }));

            allCliExtensions = Object.entries(data.cli_extensions || {}).map(([name, info]) => ({
                name,
                package: info.package,
                version: info.version,
                author: info.author || 'Unknown',
                description: info.description,
                repository: info.repository,
                official: info.official || false,
                tags: info.tags || [],
                type: 'cli',
                command: info.command || []
            }));

            updateStats();
            renderModules();

        } catch (error) {
            console.error('加载模块数据失败:', error);
            showError(I18n.t('market.loadFailed'));
        }
    }

    function updateStats() {
        const totalCount = allModules.length + allAdapters.length + allCliExtensions.length;
        document.getElementById('total-all-modules').textContent = totalCount;
        document.getElementById('total-modules').textContent = allModules.length;
        document.getElementById('adapter-count').textContent = allAdapters.length;
        document.getElementById('cli-count').textContent = allCliExtensions.length;
        document.getElementById('contributors-count').textContent = '--';
    }

    function renderModules() {
        const modulesGrid = document.getElementById('modules-grid');
        modulesGrid.innerHTML = '';

        let packagesToShow = [];

        if (activeCategory === 'all') {
            packagesToShow = [...allModules, ...allAdapters, ...allCliExtensions];
        } else if (activeCategory === 'modules') {
            packagesToShow = allModules;
        } else if (activeCategory === 'adapters') {
            packagesToShow = allAdapters;
        } else if (activeCategory === 'cli') {
            packagesToShow = allCliExtensions;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            packagesToShow = packagesToShow.filter(pkg =>
                pkg.name.toLowerCase().includes(query) ||
                pkg.description.toLowerCase().includes(query)
            );
        }

        if (packagesToShow.length === 0) {
            modulesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>${I18n.t('market.empty')}</h3>
                    <p>${I18n.t('market.empty.hint')}</p>
                </div>
            `;
            return;
        }

        packagesToShow.forEach((pkg, index) => {
            const card = document.createElement('div');
            card.className = 'module-card';
            card.style.animationDelay = `${index * 0.1}s`;

            const cliBadge = pkg.type === 'cli' ? '<span class="module-tag">CLI</span>' : '';
            const commandInfo = pkg.command && pkg.command.length > 0 ?
                `<p style="font-size: 0.85rem; margin-top: 0.5rem;"><i class="fas fa-terminal"></i> ${I18n.t('market.commands')}: ${pkg.command.join(', ')}</p>` : '';

            card.innerHTML = `
                <div class="module-header">
                    <div class="module-icon">
                        ${getIconByType(pkg.type)}
                    </div>
                    <div>
                        <h3 class="module-name">${pkg.name}</h3>
                        <div class="module-version">v${pkg.version}</div>
                    </div>
                </div>
                <p class="module-desc">${pkg.description}</p>
                ${commandInfo}
                ${pkg.tags.length > 0 ? `
                <div class="module-tags">
                    ${pkg.tags.map(tag => `<span class="module-tag">${tag}</span>`).join('')}
                    ${cliBadge}
                </div>
                ` : ''}
                <div class="module-footer">
                    <div class="module-author">${pkg.author}</div>
                    <div class="module-actions">
                        <button class="module-btn" data-action="install" data-package="${pkg.package}">
                            <i class="fas fa-download"></i> ${I18n.t('market.install')}
                        </button>
                        ${pkg.repository ? `<button class="module-btn" data-action="docs" data-package="${pkg.package}" data-repo="${pkg.repository}">
                            <i class="fas fa-book"></i> ${I18n.t('market.docs')}
                        </button>` : ''}
                    </div>
                </div>
            `;

            modulesGrid.appendChild(card);
        });

        document.querySelectorAll('[data-action="install"]').forEach(btn => {
            btn.addEventListener('click', () => showInstallModal(btn.dataset.package));
        });

        document.querySelectorAll('[data-action="docs"]').forEach(btn => {
            btn.addEventListener('click', () => showDocsModal(btn.dataset.package, btn.dataset.repo));
        });
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

    async function loadContributors() {
        try {
            const response = await fetch(CONFIG.API.contributors);
            if (!response.ok) throw new Error('贡献者API请求失败');
            const contributors = await response.json();

            document.getElementById('contributors-count').textContent = contributors.length;

            const container = document.getElementById('contributors-container');
            container.innerHTML = '';

            contributors.slice(0, 12).forEach(contributor => {
                const contributorElement = document.createElement('div');
                contributorElement.className = 'contributor';
                contributorElement.innerHTML = `
                    <img src="${contributor.avatar_url}" alt="${contributor.login}" class="contributor-avatar">
                    <span class="contributor-name">${contributor.login}</span>
                `;
                contributorElement.onclick = () => window.open(contributor.html_url, '_blank');
                container.appendChild(contributorElement);
            });
        } catch (error) {
            console.error('加载贡献者数据失败:', error);
        }
    }

    // ==================== 文档模块 ====================
    // 导航状态管理
    let currentNavState = 'categories'; // 'categories', 'documents', 'chapters'
    let currentCategory = null;
    let currentDocPath = null;
    let currentChapterToc = [];

    // ==================== 语言切换模块 ====================
    function setupLanguageSwitcher() {
        const langSelect = document.getElementById('lang-select');
        if (!langSelect) return;
        
        // 设置当前语言的选中状态（与全局切换器同步）
        langSelect.value = I18n.getLang();
        
        // 绑定change事件 — 委托给统一的 handleLanguageSwitch
        langSelect.addEventListener('change', function() {
            const newLang = this.value;
            if (newLang !== I18n.getLang()) {
                handleLanguageSwitch(newLang);
            }
        });
    }

    function setupDocumentation() {
        // 立即初始化UI，不等待索引加载
        setupLanguageSwitcher();
        renderDocsNavigation();
        setupDocumentationSearch();
        setupBreadcrumbNavigation();
        setupDocumentActions();
        setupDocumentationResponsive();
        setupGlobalNavigationEvents();

        // 注册索引加载回调
        DocsIndexManager.onLoad(function(type, success, data, error) {
            if (type === 'mapping' || type === 'search') {
                renderDocsNavigation();
                
                if (DocsIndexManager.isLoaded()) {
                    console.log('文档索引加载完成');
                    
                    const hash = window.location.hash.substring(1);
                    if (hash === 'docs') {
                        showCategoryLevel();
                    }
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

        DocsIndexManager.loadMapping().catch(err => {
            console.error('映射索引加载失败:', err);
        });
        DocsIndexManager.loadSearchIndex().catch(err => {
            console.error('搜索索引加载失败:', err);
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

    function showCategoryLevel() {
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
                    <span class="doc-count">${category.documents?.length || 0}</span>
                    <i class="chevron fas fa-chevron-right"></i>
                </div>
            `;
        }

        navHtml += '</div></div>';

        navContainer.innerHTML = navHtml;

        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-category');
                showDocumentList(categoryId);
            });
        });
    }

    function showDocumentList(categoryId) {
        console.log('showDocumentList: 显示文档列表, categoryId =', categoryId);
        currentNavState = 'documents';
        currentCategory = categoryId;
        
        const navContainer = document.querySelector('.docs-nav-container');
        const mapping = DocsIndexManager.mapping;
        const category = mapping.categories[categoryId];
        
        if (!category || !category.documents) {
            console.warn('showDocumentList: 分类或文档不存在', { categoryId, category });
            return;
        }
        
        console.log('showDocumentList: 找到', category.documents.length, '个文档');

        const categoryName = categoryId;
        
        let navHtml = '<div class="docs-nav-view">';
        
        navHtml += `
            <div class="docs-nav-breadcrumb">
                <a class="breadcrumb-back" data-action="back-to-categories">
                    <i class="fas fa-arrow-left"></i>
                    <span>${I18n.t('docs.backToCategories')}</span>
                </a>
                <span class="breadcrumb-title">${categoryName}</span>
            </div>
        `;

        navHtml += '<div class="doc-list">';
        
        category.documents.forEach(doc => {
            const isActive = doc.path === currentDocPath ? 'active' : '';
            const icon = getDocIcon(doc.path);
            navHtml += `
                <div class="doc-item ${isActive}" data-doc="${doc.path}" data-title="${doc.title}">
                    <i class="fas ${icon}"></i>
                    <span>${doc.title}</span>
                </div>
            `;
        });

        navHtml += '</div></div>';

        navContainer.innerHTML = navHtml;

        navContainer.querySelector('.breadcrumb-back')?.addEventListener('click', showCategoryLevel);
    }

    function showChapterToc(docPath) {
        console.log('showChapterToc: 显示章节目录, docPath =', docPath, 'currentChapterToc.length =', currentChapterToc.length);
        
        currentNavState = 'chapters';
        currentDocPath = docPath;
        
        const navContainer = document.querySelector('.docs-nav-container');
        const docTitle = DocsIndexManager.getDocumentTitle(docPath);
        
        if (!currentChapterToc || currentChapterToc.length === 0) {
            console.warn('showChapterToc: 章节目录为空');
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
            console.log('showChapterToc: 点击面包屑返回, currentCategory =', currentCategory);
            if (currentCategory) {
                showDocumentList(currentCategory);
            } else {
                showCategoryLevel();
            }
        });
        
        console.log('showChapterToc: 章节目录已渲染,等待全局事件委托处理点击');

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
        console.log('syncNavigationState: 同步导航状态, docPath =', docPath);

        currentDocPath = docPath;

        const category = DocsIndexManager.getDocumentCategory(docPath);
        currentCategory = category ? category.name : null;

        console.log('syncNavigationState: 当前分类 =', currentCategory, 'currentNavState =', currentNavState);

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

    function navigateToDocument(docPath, targetLine = null, keyword = null) {
        console.log('navigateToDocument: 开始导航到文档', { docPath, targetLine, keyword });
        
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

        console.log('setupGlobalNavigationEvents: 设置全局事件委托');

        const oldHandler = navContainer._navClickHandler;
        if (oldHandler) {
            navContainer.removeEventListener('click', oldHandler);
        }

        const clickHandler = function(e) {
            console.log('全局导航事件触发，目标元素:', e.target);

            const categoryItem = e.target.closest('.category-item');
            if (categoryItem) {
                const categoryId = categoryItem.getAttribute('data-category');
                console.log('点击分类项:', categoryId);
                e.preventDefault();
                e.stopPropagation();
                showDocumentList(categoryId);
                return;
            }

            const docItem = e.target.closest('.doc-item');
            if (docItem) {
                const docPath = docItem.getAttribute('data-doc');
                console.log('点击文档项，docPath =', docPath);
                e.preventDefault();
                e.stopPropagation();
                navigateToDocument(docPath);
                return;
            }

            const chapterItem = e.target.closest('.chapter-item');
            if (chapterItem) {
                const targetId = chapterItem.getAttribute('data-target');
                console.log('点击章节项，targetId =', targetId);
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
                console.log('点击面包屑返回，action =', action);
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

    function performDocumentSearch(query) {
        const results = DocsIndexManager.searchDocuments(query);
        displaySearchResults(results, query);
    }

    function displaySearchResults(results, query) {
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'docs-search-results';

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>${I18n.t('docs.noResults')}</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <h4>${I18n.t('docs.searchResults')} (${results.length})</h4>
                </div>
                <div class="search-results-list">
                    ${results.map(result => `
                        <div class="search-result-item" data-doc="${result.document}" data-line="${result.line}">
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
        }

        const existingResults = document.querySelector('.docs-search-results');
        if (existingResults) {
            existingResults.remove();
        }

        const sidebar = document.querySelector('.docs-sidebar');
        if (sidebar) {
            sidebar.appendChild(resultsContainer);
        }

        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function () {
                const docPath = this.getAttribute('data-doc');
                const line = parseInt(this.getAttribute('data-line'));
                navigateToDocument(docPath, line);
                clearSearchResults();
            });
        });
    }

    function clearSearchResults() {
        const existingResults = document.querySelector('.docs-search-results');
        if (existingResults) {
            existingResults.remove();
        }
    }

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

    function updateBreadcrumb(docPath) {
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

    function setupDocumentActions() {
        const editBtn = document.querySelector('.docs-action-btn:nth-child(1)');
        if (editBtn) {
            editBtn.addEventListener('click', function (e) {
                e.preventDefault();
                const currentDoc = window.location.hash.split('/')[1];
                const editUrl = getEditUrl(currentDoc);
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
    }

    function shareDocument() {
        const currentUrl = window.location.href;
        const currentDoc = window.location.hash.split('/')[1];
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
            console.log('handleResize: 窗口大小变化，重新设置全局事件委托');
            moveTocToSidebar();
            setupGlobalNavigationEvents();
        }

        window.addEventListener('resize', handleResize);
        handleResize();
    }

    function getEditUrl(docPath) {
        return CONFIG.DOCS.githubBaseUrl + docPath;
    }

    async function loadDocument(docPath, targetLine = null, keyword = null) {
        const docsContent = document.getElementById('docs-content');
        docsContent.innerHTML = `
            <div style="text-align: center; padding: 3rem 0;">
                <i class="fas fa-spinner fa-pulse fa-3x"></i>
                <p>${I18n.t('docs.loading')}</p>
            </div>
        `;

        clearToc();

        try {
            const lang = I18n.getLang();
            const docUrl = CONFIG.DOCS.baseUrl + lang + '/' + docPath;
            const docResponse = await fetch(docUrl);
            if (!docResponse.ok) {
                throw new Error(`HTTP ${docResponse.status}`);
            }

            const docContent = await docResponse.text();
            let htmlContent = marked.parse(docContent);

            htmlContent = addTableOfContents(htmlContent);
            htmlContent = wrapTables(htmlContent);

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

            docsContent.innerHTML = htmlContent;
            addDocumentMetaInfo(docsContent, docPath, commitInfo);

        } catch (error) {
            console.error('加载文档失败:', error);
            showDocumentError(docsContent, error);
        }

        setTimeout(() => {
            console.log('loadDocument: 文档加载完成, currentNavState =', currentNavState, 'currentChapterToc.length =', currentChapterToc.length);
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

                if (userSettings.showLineNumbers) {
                    block.classList.add('line-numbers');
                }

                Prism.highlightElement(block);
            });
        }, 100);
    }

    function scrollToKeyword(keyword) {
        if (!keyword) {
            console.warn('scrollToKeyword: 关键词为空');
            return;
        }

        console.log('scrollToKeyword: 搜索关键词', keyword);

        setTimeout(() => {
            const docsContent = document.getElementById('docs-content');
            if (!docsContent) {
                console.warn('scrollToKeyword: 文档内容未找到');
                return;
            }

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

                console.log('已滚动到关键词位置:', keyword);
                showMessage(I18n.t('docs.keywordLocated', { keyword }), 'success');
            } else {
                console.warn('未找到关键词:', keyword);
                showMessage(I18n.t('docs.keywordNotFound'), 'warning');
            }
        }, 500);
    }

    function scrollToLine(lineNumber) {
        console.log('scrollToLine: 行号跳转功能已禁用，滚动到文档顶部');
        
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

    function addScrollSpy() {
        // 已弃用：滚动监听现在在 showChapterToc 中处理
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
                    <img src="${commitInfo.author.avatar_url}" alt="${commitInfo.commit.author.name}" style="width: 40px; height: 40px; border-radius: 50%;">
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

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return I18n.t('time.yearsAgo', { n: interval });
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return I18n.t('time.monthsAgo', { n: interval });
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return I18n.t('time.daysAgo', { n: interval });
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return I18n.t('time.hoursAgo', { n: interval });
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return I18n.t('time.minutesAgo', { n: interval });
        return I18n.t('time.secondsAgo', { n: Math.floor(seconds) });
    }

    // ==================== 模态框模块 ====================
    function setupModals() {
        document.getElementById('close-modal').addEventListener('click', function () {
            document.getElementById('module-modal').classList.remove('active');
        });

        document.getElementById('module-modal').addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }

    function showInstallModal(packageName) {
        const pkg = [...allModules, ...allAdapters, ...allCliExtensions].find(m => m.package === packageName);
        if (!pkg) return;

        const modal = document.getElementById('module-modal');
        const modalContent = document.getElementById('module-modal-content');

        modalContent.innerHTML = `
            <h3>${pkg.name} v${pkg.version}</h3>
            <p>${pkg.description}</p>
            
            <h4 style="margin-top: 1.5rem;">${I18n.t('market.installCmd')}</h4>
            <pre style="background: var(--bg); padding: 1rem; border-radius: var(--radius);"><code>epsdk install ${pkg.package}</code></pre>
            
            ${pkg.type === 'cli' && pkg.command && pkg.command.length > 0 ? `
            <h4 style="margin-top: 1.5rem;">${I18n.t('modal.availableCommands')}</h4>
            <ul>
                ${pkg.command.map(cmd => `<li><code>epsdk ${cmd}</code></li>`).join('')}
            </ul>
            ` : ''}
            
            ${pkg.tags.length > 0 ? `
            <h4 style="margin-top: 1.5rem;">${I18n.t('modal.tags')}</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${pkg.tags.map(tag => `<span class="module-tag">${tag}</span>`).join('')}
            </div>
            ` : ''}
            
            ${pkg.repository ? `
            <h4 style="margin-top: 1.5rem;">${I18n.t('modal.repoInfo')}</h4>
            <p><a href="${pkg.repository}" target="_blank">${I18n.t('modal.viewSource')}</a></p>
            ` : ''}
        `;

        modal.classList.add('active');
    }

    function showDocsModal(packageName, repoUrl) {
        const pkg = [...allModules, ...allAdapters, ...allCliExtensions].find(m => m.package === packageName);
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

        fetchReadmeContent(repoUrl).then(markdown => {
            const htmlContent = marked.parse(markdown);

            modalContent.innerHTML = `
                <div class="markdown-content">
                    <h3>${pkg.name} v${pkg.version}</h3>
                    ${htmlContent}
                </div>
            `;

            document.querySelectorAll('#module-modal-content pre code').forEach((block) => {
                if (!block.className || !block.className.startsWith('language-')) {
                    block.classList.add('language-python');
                }
                Prism.highlightElement(block);
            });
        }).catch(error => {
            console.error('获取文档失败:', error);
            modalContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
                    <h3>${I18n.t('modal.loadDocFailed')}</h3>
                    <p><a href="${pkg.repository}" target="_blank">${I18n.t('modal.viewSource')}</a></p>
                </div>
            `;
        });
    }

    async function fetchReadmeContent(repoUrl) {
        try {
            const repoPath = repoUrl.replace('https://github.com/', '');
            const [owner, repo] = repoPath.split('/');

            const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            const repoData = await repoInfo.json();
            const defaultBranch = repoData.default_branch;

            const readmeUrl = CONFIG.DEFAULT_USER_SETTINGS.gh_proxy + `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`;
            const response = await fetch(readmeUrl);

            if (!response.ok) {
                throw new Error('README文件不存在或无法访问');
            }

            return await response.text();
        } catch (error) {
            console.error('获取README失败:', error);
            throw error;
        }
    }

    // ==================== 首页功能 ====================
    function setupHomeAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const featureObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cards = entry.target.querySelectorAll('.feature-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate');
                        }, index * 100);
                    });
                }
            });
        }, observerOptions);

        const featuresSection = document.querySelector('.features-section');
        if (featuresSection) {
            featureObserver.observe(featuresSection);
        }

        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const steps = entry.target.querySelectorAll('.step-item');
                    steps.forEach((step, index) => {
                        setTimeout(() => {
                            step.style.opacity = '1';
                            step.style.transform = 'translateY(0)';
                        }, index * 150);
                    });
                }
            });
        }, observerOptions);

        const stepsSection = document.querySelector('.steps-section');
        if (stepsSection) {
            stepObserver.observe(stepsSection);
        }
    }

    function setupCopyCode() {
        const copyBtn = document.getElementById('copy-code-btn');
        if (!copyBtn) return;

        const codeBlock = document.querySelector('.code-block code');
        if (!codeBlock) return;

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = `<i class="fas fa-check"></i> ${I18n.t('demo.copied')}`;
                copyBtn.style.background = 'var(--accent)';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                showMessage(I18n.t('common.copyFailed'), 'error');
            }
        });
    }

    // ==================== 公共API ====================
    return {
        init: init,
        loadDocument: loadDocument,
        showInstallModal: showInstallModal,
        showDocsModal: showDocsModal,
        clearToc: clearToc,
        moveTocToSidebar: moveTocToSidebar,
        setupHomeAnimations: setupHomeAnimations,
        setupCopyCode: setupCopyCode
    };
})();

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        loader.classList.add('hidden');

        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 500);

    if (typeof HeroCanvas !== 'undefined') {
        HeroCanvas.init();
    }

    ErisPulseApp.init();
});