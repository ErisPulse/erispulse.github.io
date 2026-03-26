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

    // 外部依赖配置
    DEPENDENCIES: {
        // Font Awesome
        fontAwesome: {
            css: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            version: '6.4.0'
        },
        // Prism.js (代码高亮)
        prism: {
            core: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js',
            autoloader: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js',
            lineNumbers: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js',
            python: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js',
            theme: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
            themeLineNumbers: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css',
            version: '1.29.0'
        },
        // Marked (Markdown解析)
        marked: {
            js: 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js',
            version: '4.3.0'
        },
        // Chart.js (图表)
        chart: {
            js: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
            version: '3.9.1'
        },
        // Mermaid (图表)
        mermaid: {
            js: 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js',
            version: '10.9.1'
        }
    },

    // 项目依赖列表配置
    PROJECT_DEPENDENCIES: [
        {
            name: "rich",
            url: "https://github.com/Textualize/rich",
            description: "在多个文件中广泛使用（日志、CLI 界面、进度条等）"
        },
        {
            name: "colorama",
            url: "https://github.com/tartley/colorama",
            description: "在 console.py 中用于 Windows 终端颜色初始化"
        },
        {
            name: "aiohttp",
            url: "https://github.com/aio-libs/aiohttp",
            description: "在 package_manager.py 中用于异步 HTTP 请求"
        },
        {
            name: "watchdog",
            url: "https://github.com/gorakhargosh/watchdog",
            description: "在 run.py 中用于文件系统监控"
        },
        {
            name: "toml",
            url: "https://github.com/uiri/toml",
            description: "在 config.py 中用于解析 TOML 配置文件"
        },
        {
            name: "fastapi",
            url: "https://github.com/tiangolo/fastapi",
            description: "在 router.py 中用于构建 Web API"
        },
        {
            name: "hypercorn",
            url: "https://github.com/pgjones/hypercorn",
            description: "在 router.py 中作为 ASGI 服务器"
        },
        {
            name: "packaging",
            url: "https://github.com/pypa/packaging",
            description: "在 package_manager.py 中用于版本比较"
        }
    ],

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
        presetTheme: '',
        customColors: {},
        animations: true,
        compactLayout: false,
        showLineNumbers: false,
        stickyNav: true,
        gh_proxy: 'https://cdn.gh-proxy.org/'
    },
    THEME_PRESETS: {
        ocean: {
            '--primary': '#1e88e5',
            '--primary-rgb': '30, 136, 229',
            '--primary-dark': '#1565c0',
            '--primary-dark-rgb': '21, 101, 192',
            '--accent': '#26c6da',
            '--accent-rgb': '38, 198, 218'
        },
        sunset: {
            '--primary': '#ff7043',
            '--primary-rgb': '255, 112, 67',
            '--primary-dark': '#f4511e',
            '--primary-dark-rgb': '244, 81, 30',
            '--accent': '#ffca28',
            '--accent-rgb': '255, 202, 40'
        },
        forest: {
            '--primary': '#43a047',
            '--primary-rgb': '67, 160, 71',
            '--primary-dark': '#2e7d32',
            '--primary-dark-rgb': '46, 125, 50',
            '--accent': '#9ccc65',
            '--accent-rgb': '156, 204, 101'
        },
        lavender: {
            '--primary': '#8e24aa',
            '--primary-rgb': '142, 36, 170',
            '--primary-dark': '#6a1b9a',
            '--primary-dark-rgb': '106, 27, 154',
            '--accent': '#ab47bc',
            '--accent-rgb': '171, 71, 188'
        }
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
        const lang = localStorage.getItem('erispulse-docs-lang') || 'zh-CN';
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
            const lang = localStorage.getItem('erispulse-docs-lang') || 'zh-CN';
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
                    const error = new Error('无法加载文档索引，请检查网络连接');
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
            const lang = localStorage.getItem('erispulse-docs-lang') || 'zh-CN';
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
                    const error = new Error('无法加载搜索索引，请检查网络连接');
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
    let currentLang = localStorage.getItem('erispulse-docs-lang') || 'zh-CN'; // 当前语言
    let allModules = [];
    let allAdapters = [];
    let allCliExtensions = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };

    // ==================== 初始化模块 ====================
    function init() {
        setupStorage();
        loadUserSettings();
        applyUserSettings();
        registerServiceWorker();
        setupThemeToggle();
        setupHamburgerMenu();
        setupViewSwitching();
        setupMarketplace();
        setupDocumentation();
        setupModals();
        setupSettings();
        renderFriendLinks();
        setupHomeAnimations();
        setupCopyCode();
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

        applyCustomColors();

        if (!userSettings.stickyNav) {
            document.body.classList.add('no-sticky-nav');
        } else {
            document.body.classList.remove('no-sticky-nav');
        }
    }

    function applyThemeSetting() {
        clearAllCustomVariables();

        if (userSettings.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', userSettings.theme);
        }

        if (userSettings.presetTheme && userSettings.presetTheme !== 'default') {
            applyPresetTheme(userSettings.presetTheme, false);
        } else if (userSettings.customColors && hasCustomColors()) {
            applyCustomColors();
        }
    }

    function hasCustomColors() {
        const colors = userSettings.customColors;
        return colors && Object.values(colors).some(color => color && color !== '');
    }

    function clearAllCustomVariables() {
        const root = document.documentElement;
        const customProperties = [
            '--primary', '--primary-dark', '--accent', '--secondary',
            '--text', '--text-secondary', '--text-light',
            '--bg', '--card-bg', '--border',
            '--primary-rgb', '--primary-dark-rgb', '--accent-rgb', '--secondary-rgb',
            '--text-rgb', '--text-secondary-rgb', '--text-light-rgb',
            '--bg-rgb', '--card-bg-rgb', '--border-rgb'
        ];

        customProperties.forEach(prop => {
            root.style.removeProperty(prop);
        });
    }

    function applyCustomColors() {
        const root = document.documentElement;
        const colors = userSettings.customColors;

        if (!colors) return;

        Object.keys(colors).forEach(key => {
            if (colors[key]) {
                root.style.setProperty(key, colors[key]);
            }
        });
    }

    function applyPresetTheme(preset, save = true) {
        clearAllCustomVariables();

        if (preset !== 'default') {
            const theme = CONFIG.THEME_PRESETS[preset];
            if (theme) {
                const root = document.documentElement;
                Object.keys(theme).forEach(key => {
                    root.style.setProperty(key, theme[key]);
                });

                if (save) {
                    userSettings.presetTheme = preset;
                    userSettings.customColors = {};
                    saveUserSettings();
                    showMessage(`已应用 ${getPresetThemeName(preset)} 预设样式`, 'success');
                }
            }
        } else {
            if (save) {
                userSettings.presetTheme = 'default';
                userSettings.customColors = {};
                saveUserSettings();
                showMessage('已恢复默认主题', 'success');
            }
        }
    }

    function getPresetThemeName(preset) {
        const names = {
            'default': '默认',
            'ocean': '海洋风格',
            'sunset': '日落风格',
            'forest': '森林风格',
            'lavender': '薰衣草风格'
        };
        return names[preset] || preset;
    }

    function setupThemeToggle() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || (prefersDark ? 'dark' : 'light');
        applyTheme();
    }

    function applyTheme() {
        applyThemeSetting();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        console.log(isDark);
    }

    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, currentTheme);
        applyTheme();
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
                    // 对于新的三级导航系统，直接调用 navigateToDocument
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
            // 对于新的三级导航系统，直接调用 navigateToDocument
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
            loadDependencies();
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
            container.innerHTML = '<p class="no-friend-links">暂无友链</p>';
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
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', function () {
                userSettings.theme = this.value;
                saveUserSettings();
                applyThemeSetting();
            });
        });

        if (document.getElementById('apply-preset')) {
            document.getElementById('apply-preset').addEventListener('click', function () {
                const preset = document.getElementById('preset-themes').value;
                applyPresetTheme(preset);
            });
        }

        if (document.getElementById('advanced-colors-btn')) {
            document.getElementById('advanced-colors-btn').addEventListener('click', function () {
                openAdvancedColorsModal();
            });
        }

        if (document.getElementById('close-advanced-modal')) {
            document.getElementById('close-advanced-modal').addEventListener('click', function () {
                document.getElementById('advanced-colors-modal').classList.remove('active');
            });
        }

        if (document.getElementById('cancel-advanced-colors')) {
            document.getElementById('cancel-advanced-colors').addEventListener('click', function () {
                document.getElementById('advanced-colors-modal').classList.remove('active');
            });
        }

        if (document.getElementById('apply-advanced-colors')) {
            document.getElementById('apply-advanced-colors').addEventListener('click', function () {
                applyAdvancedColors();
                document.getElementById('advanced-colors-modal').classList.remove('active');
            });
        }

        if (document.getElementById('advanced-colors-modal')) {
            document.getElementById('advanced-colors-modal').addEventListener('click', function (e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
        }

        if (document.getElementById('reset-settings')) {
            document.getElementById('reset-settings').addEventListener('click', function () {
                if (confirm('确定要重置所有设置吗？这将恢复所有选项为默认值。')) {
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
        if (document.querySelector(`input[name="theme"][value="${userSettings.theme}"]`)) {
            document.querySelector(`input[name="theme"][value="${userSettings.theme}"]`).checked = true;
        }

        initPresetSelector();

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

    function initPresetSelector() {
        if (!document.getElementById('preset-themes')) return;

        if (userSettings.presetTheme) {
            document.getElementById('preset-themes').value = userSettings.presetTheme;
        } else if (hasCustomColors()) {
            document.getElementById('preset-themes').value = 'default';
        } else {
            document.getElementById('preset-themes').value = 'default';
        }
    }

    function openAdvancedColorsModal() {
        document.getElementById('advanced-primary').value = userSettings.customColors['--primary'] || '#5a63df';
        document.getElementById('advanced-primary-dark').value = userSettings.customColors['--primary-dark'] || '#555AB8';
        document.getElementById('advanced-accent').value = userSettings.customColors['--accent'] || '#5ED1B3';
        document.getElementById('advanced-bg').value = userSettings.customColors['--bg'] || '#FAFAFA';
        document.getElementById('advanced-text').value = userSettings.customColors['--text'] || '#2D3748';
        document.getElementById('advanced-border').value = userSettings.customColors['--border'] || '#E2E8F0';
        document.getElementById('advanced-card-bg').value = userSettings.customColors['--card-bg'] || '#FFFFFF';

        document.getElementById('advanced-primary-rgb').value = userSettings.customColors['--primary-rgb'] || '90, 99, 223';
        document.getElementById('advanced-accent-rgb').value = userSettings.customColors['--accent-rgb'] || '94, 209, 179';
        document.getElementById('advanced-bg-rgb').value = userSettings.customColors['--bg-rgb'] || '250, 250, 250';
        document.getElementById('advanced-text-rgb').value = userSettings.customColors['--text-rgb'] || '45, 55, 72';
        document.getElementById('advanced-shadow').value = userSettings.customColors['--shadow-sm'] || '0 2px 10px rgba(0, 0, 0, 0.05)';

        document.getElementById('advanced-colors-modal').classList.add('active');
    }

    function applyAdvancedColors() {
        userSettings.presetTheme = '';

        const colorSettings = {
            '--primary': document.getElementById('advanced-primary').value,
            '--primary-dark': document.getElementById('advanced-primary-dark').value,
            '--accent': document.getElementById('advanced-accent').value,
            '--bg': document.getElementById('advanced-bg').value,
            '--text': document.getElementById('advanced-text').value,
            '--border': document.getElementById('advanced-border').value,
            '--card-bg': document.getElementById('advanced-card-bg').value,
            '--primary-rgb': document.getElementById('advanced-primary-rgb').value,
            '--accent-rgb': document.getElementById('advanced-accent-rgb').value,
            '--bg-rgb': document.getElementById('advanced-bg-rgb').value,
            '--text-rgb': document.getElementById('advanced-text-rgb').value,
            '--shadow-sm': document.getElementById('advanced-shadow').value
        };

        userSettings.customColors = colorSettings;
        applyCustomColors();
        saveUserSettings();
        showMessage('颜色设置已应用', 'success');
        initPresetSelector();
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
            showError('加载模块失败，请稍后再试');
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
                    <h3>未找到匹配的模块</h3>
                    <p>尝试不同的搜索关键词或查看所有模块</p>
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
                `<p style="font-size: 0.85rem; margin-top: 0.5rem;"><i class="fas fa-terminal"></i> 命令: ${pkg.command.join(', ')}</p>` : '';

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
                            <i class="fas fa-download"></i> 安装
                        </button>
                        ${pkg.repository ? `<button class="module-btn" data-action="docs" data-package="${pkg.package}" data-repo="${pkg.repository}">
                            <i class="fas fa-book"></i> 文档
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
                    重新加载
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

    function loadDependencies() {
        const container = document.getElementById('dependencies-container');
        container.innerHTML = '';

        CONFIG.PROJECT_DEPENDENCIES.forEach(dep => {
            const depElement = document.createElement('div');
            depElement.className = 'dependency-card';
            depElement.innerHTML = `
                <h3 class="dependency-name">
                    <a href="${dep.url}" target="_blank">${dep.name}</a>
                </h3>
                <p class="dependency-description">${dep.description}</p>
            `;
            container.appendChild(depElement);
        });
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
        
        // 设置当前语言的选中状态
        langSelect.value = currentLang;
        
        // 绑定change事件
        langSelect.addEventListener('change', function() {
            const newLang = this.value;
            if (newLang !== currentLang) {
                switchLanguage(newLang);
            }
        });
    }
    
    /**
     * 切换语言
     */
    function switchLanguage(lang) {
        console.log('切换语言:', lang);
        currentLang = lang;
        localStorage.setItem('erispulse-docs-lang', lang);
        
        // 更新下拉框选中状态
        const langSelect = document.getElementById('lang-select');
        if (langSelect) {
            langSelect.value = lang;
        }
        
        // 清除缓存并重新加载索引
        DocsIndexManager.clearCache();
        DocsIndexManager.loadMapping().then(() => {
            DocsIndexManager.loadSearchIndex();
        }).catch(err => {
            console.error('切换语言失败:', err);
            showMessage('切换语言失败，请重试', 'error');
        });
        
        // 回到文档首页
        showCategoryLevel();
        updateBreadcrumb(null);
        
        // 更新URL到文档首页
        history.pushState(null, null, '#docs');
        
        // 重置导航状态
        currentNavState = 'categories';
        currentCategory = null;
        currentDocPath = null;
        currentChapterToc = [];
        
        // 清空文档内容
        const docsContent = document.getElementById('docs-content');
        if (docsContent) {
            docsContent.innerHTML = `
                <div>
                    <h1>欢迎使用 ErisPulse</h1>
                    <p>ErisPulse 是一个开源的 Python 库，目标是提供一个简单、易于使用的框架，用于构建异步、非阻塞的机器人程序。</p>
                    <p>点击文档导航中的链接，开始探索 ErisPulse 的功能和用法吧。</p>
                </div>
            `;
        }
        
        showMessage(`已切换到${getLanguageName(lang)}`, 'success');
    }
    
    /**
     * 获取语言名称
     */
    function getLanguageName(lang) {
        const names = {
            'zh-CN': '简体中文',
            'en': 'English',
            'zh-TW': '繁體中文'
        };
        return names[lang] || lang;
    }

    function setupDocumentation() {
        // 立即初始化UI，不等待索引加载
        setupLanguageSwitcher(); // 初始化语言切换器
        renderDocsNavigation();
        setupDocumentationSearch();
        setupBreadcrumbNavigation();
        setupDocumentActions();
        setupDocumentationResponsive();
        setupGlobalNavigationEvents(); // 添加全局事件委托

        // 注册索引加载回调
        DocsIndexManager.onLoad(function(type, success, data, error) {
            if (type === 'mapping' || type === 'search') {
                // 更新导航
                renderDocsNavigation();
                
                // 检查是否两个索引都已加载
                if (DocsIndexManager.isLoaded()) {
                    console.log('文档索引加载完成');
                    
                    // 如果当前是 docs 视图且还没有加载文档，显示分类列表
                    const hash = window.location.hash.substring(1);
                    if (hash === 'docs') {
                        showCategoryLevel();
                    }
                }
            }
            
            if (!success && error) {
                console.error(`加载${type === 'mapping' ? '映射' : '搜索'}索引失败:`, error);
                // 只在映射索引失败时显示错误
                if (type === 'mapping') {
                    const docsContent = document.getElementById('docs-content');
                    if (docsContent && !DocsIndexManager.mapping) {
                        docsContent.innerHTML = `
                            <div class="error-message" style="text-align: center; padding: 3rem 0;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                                <h3>无法加载文档索引</h3>
                                <p>${error.message}</p>
                                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer;">
                                    <i class="fas fa-sync-alt"></i> 重新加载
                                </button>
                            </div>
                        `;
                    }
                }
            }
        });

        // 在后台异步加载索引（不阻塞）
        DocsIndexManager.loadMapping().catch(err => {
            console.error('映射索引加载失败:', err);
        });
        DocsIndexManager.loadSearchIndex().catch(err => {
            console.error('搜索索引加载失败:', err);
        });
    }

    // ==================== 三级导航系统 ====================

    /**
     * 渲染初始导航
     */
    function renderDocsNavigation() {
        const navContainer = document.querySelector('.docs-nav-container');
        if (!navContainer) {
            console.warn('renderDocsNavigation: 导航容器未找到');
            return;
        }

        const mapping = DocsIndexManager.mapping;
        console.log('renderDocsNavigation: 映射索引状态', mapping ? '已加载' : '未加载');
        
        if (!mapping || !mapping.categories) {
            navContainer.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-secondary);">加载中...</p>';
            return;
        }

        // 默认显示分类列表
        showCategoryLevel();
    }

    /**
     * 状态1：显示所有分类
     */
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

        // 绑定事件
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-category');
                showDocumentList(categoryId);
            });
        });
    }

    /**
     * 状态2：显示分类下的文档列表
     */
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
        
        // 面包屑
        navHtml += `
            <div class="docs-nav-breadcrumb">
                <a class="breadcrumb-back" data-action="back-to-categories">
                    <i class="fas fa-arrow-left"></i>
                    <span>返回分类</span>
                </a>
                <span class="breadcrumb-title">${categoryName}</span>
            </div>
        `;

        // 文档列表
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

        // 绑定事件 - 使用事件委托
        navContainer.querySelector('.breadcrumb-back')?.addEventListener('click', showCategoryLevel);
    }

    /**
     * 显示文档的章节目录
     */
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
        
        // 面包屑
        navHtml += `
            <div class="docs-nav-breadcrumb">
                <a class="breadcrumb-back" data-action="back-to-docs">
                    <i class="fas fa-arrow-left"></i>
                    <span>返回文档</span>
                </a>
                <span class="breadcrumb-title">${docTitle || '目录'}</span>
            </div>
        `;

        // 章节目录
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

        // 绑定面包屑返回事件
        navContainer.querySelector('.breadcrumb-back')?.addEventListener('click', () => {
            console.log('showChapterToc: 点击面包屑返回, currentCategory =', currentCategory);
            if (currentCategory) {
                showDocumentList(currentCategory);
            } else {
                showCategoryLevel();
            }
        });
        
        // 章节点击事件由全局事件委托处理,这里不需要重复绑定
        console.log('showChapterToc: 章节目录已渲染,等待全局事件委托处理点击');

        // 高亮当前章节并设置滚动监听
        updateActiveChapter();
    }

    /**
     * 更新active章节（基于滚动位置）
     */
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

    /**
     * 同步导航状态（确保所有跳转场景都正确更新）
     */
    function syncNavigationState(docPath) {
        console.log('syncNavigationState: 同步导航状态, docPath =', docPath);

        // 更新当前文档路径
        currentDocPath = docPath;

        // 获取文档的分类
        const category = DocsIndexManager.getDocumentCategory(docPath);
        currentCategory = category ? category.name : null;

        console.log('syncNavigationState: 当前分类 =', currentCategory, 'currentNavState =', currentNavState);

        // 如果当前在章节目录视图，刷新章节列表的active状态
        if (currentNavState === 'chapters' && currentChapterToc.length > 0) {
            document.querySelectorAll('.doc-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-doc') === docPath) {
                    item.classList.add('active');
                }
            });
        }

        // 根据当前hash决定显示哪个视图
        const hash = window.location.hash.substring(1);

        // 如果hash是 "docs"，显示分类列表
        if (hash === 'docs') {
            showCategoryLevel();
            return;
        }

        // 注意: 这里不调用 showChapterToc,因为 loadDocument 会在文档加载完成后调用
        // 如果hash是 "docs/xxx"，文档加载后自然会显示章节目录
    }

    /**
     * 导航到文档
     */
    function navigateToDocument(docPath, targetLine = null, keyword = null) {
        console.log('navigateToDocument: 开始导航到文档', { docPath, targetLine, keyword });
        
        // 更新URL
        history.pushState(null, null, `#docs/${docPath}`);
        
        // 同步导航状态
        syncNavigationState(docPath);
        
        // 加载文档
        loadDocument(docPath, targetLine, keyword);
        updateBreadcrumb(docPath);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * 获取分类图标
     */
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

    /**
     * 获取文档图标
     */
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

    /**
     * 获取章节级别图标
     */
    function getChapterLevelIcon(level) {
        return `H${level}`;
    }

    /**
     * 设置全局导航事件委托（解决resize导致事件丢失的问题）
     */
    function setupGlobalNavigationEvents() {
        const navContainer = document.querySelector('.docs-nav-container');
        if (!navContainer) return;

        console.log('setupGlobalNavigationEvents: 设置全局事件委托');

        // 移除旧的事件监听器（避免重复绑定）
        const oldHandler = navContainer._navClickHandler;
        if (oldHandler) {
            navContainer.removeEventListener('click', oldHandler);
        }

        // 创建新的事件处理器
        const clickHandler = function(e) {
            console.log('全局导航事件触发，目标元素:', e.target);

            // 处理分类项点击
            const categoryItem = e.target.closest('.category-item');
            if (categoryItem) {
                const categoryId = categoryItem.getAttribute('data-category');
                console.log('点击分类项:', categoryId);
                e.preventDefault();
                e.stopPropagation();
                showDocumentList(categoryId);
                return;
            }

            // 处理文档项点击
            const docItem = e.target.closest('.doc-item');
            if (docItem) {
                const docPath = docItem.getAttribute('data-doc');
                console.log('点击文档项，docPath =', docPath);
                e.preventDefault();
                e.stopPropagation();
                navigateToDocument(docPath);
                return;
            }

            // 处理章节项点击
            const chapterItem = e.target.closest('.chapter-item');
            if (chapterItem) {
                const targetId = chapterItem.getAttribute('data-target');
                console.log('点击章节项，targetId =', targetId);
                e.preventDefault();
                e.stopPropagation();
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // 更新active状态
                    document.querySelectorAll('.chapter-item').forEach(i => i.classList.remove('active'));
                    chapterItem.classList.add('active');
                }
                return;
            }

            // 处理面包屑返回点击
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

        // 保存处理器引用并绑定
        navContainer._navClickHandler = clickHandler;
        navContainer.addEventListener('click', clickHandler, false);
    }

    function setupDocumentationSearch() {
        // 创建搜索触发按钮
        const searchTrigger = document.createElement('button');
        searchTrigger.type = 'button';
        searchTrigger.className = 'docs-search-trigger';
        searchTrigger.innerHTML = '<i class="fas fa-search"></i> 搜索文档...';

        const sidebarHeader = document.querySelector('.docs-sidebar-header');
        if (sidebarHeader) {
            sidebarHeader.appendChild(searchTrigger);
        }

        // 创建全屏搜索遮罩层
        createSearchOverlay();

        // 点击触发按钮打开搜索
        searchTrigger.addEventListener('click', function () {
            openSearchOverlay();
        });

        // 快捷键支持
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openSearchOverlay();
            }
            
            // ESC 关闭搜索
            if (e.key === 'Escape') {
                closeSearchOverlay();
            }
        });
    }

    function createSearchOverlay() {
        // 检查是否已存在
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
                    <input type="text" class="docs-search-overlay-input" placeholder="搜索文档..." autocomplete="off">
                </div>
                <div class="search-shortcut-hint">
                    按 <kbd>ESC</kbd> 关闭 · <kbd>↑↓</kbd> 导航结果
                </div>
                <div class="docs-search-results" id="overlay-search-results">
                    <div class="search-no-results">
                        <i class="fas fa-search"></i>
                        <p>输入关键词开始搜索</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 绑定事件
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

        // 关闭按钮点击
        closeBtn.addEventListener('click', function () {
            closeSearchOverlay();
        });

        // 点击遮罩层空白区域关闭
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closeSearchOverlay();
            }
        });

        // 键盘导航
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
        // 移除其他项的焦点
        document.querySelectorAll('.search-result-item').forEach(i => i.classList.remove('keyboard-focused'));
        item.classList.add('keyboard-focused');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function performOverlaySearch(query) {
        // 检查搜索索引是否已加载
        if (!DocsIndexManager.searchIndex) {
            const resultsContainer = document.getElementById('overlay-search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="search-no-results">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>搜索索引加载中...</p>
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
                    <p>未找到相关文档</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h4>搜索结果 (${results.length})</h4>
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

        // 绑定点击事件
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
                <p>输入关键词开始搜索</p>
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
                    <p>未找到相关文档</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <h4>搜索结果 (${results.length})</h4>
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
                // 点击"文档中心"链接时，返回分类列表
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
            breadcrumb.innerHTML = `<span class="current">文档中心</span>`;
            return;
        }

        if (category) {
            breadcrumb.innerHTML = `
                <a href="#docs" class="breadcrumb-link">
                    <i class="fas fa-home breadcrumb-icon"></i>
                    <span>文档中心</span>
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
                    <span>文档中心</span>
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
                text: '查看 ErisPulse 文档',
                url: currentUrl
            });
        } else {
            navigator.clipboard.writeText(currentUrl).then(() => {
                showMessage('链接已复制到剪贴板', 'success');
            }).catch(() => {
                const tempInput = document.createElement('input');
                tempInput.value = currentUrl;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                showMessage('链接已复制到剪贴板', 'success');
            });
        }
    }

    function setupDocumentationResponsive() {
        function handleResize() {
            console.log('handleResize: 窗口大小变化，重新设置全局事件委托');
            moveTocToSidebar();
            // 重新设置全局事件委托，确保事件不会丢失
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
                <p>正在加载文档...</p>
            </div>
        `;

        clearToc();

        try {
            const lang = localStorage.getItem('erispulse-docs-lang') || 'zh-CN';
            const docUrl = CONFIG.DOCS.baseUrl + lang + '/' + docPath;
            const docResponse = await fetch(docUrl);
            if (!docResponse.ok) {
                throw new Error(`文档加载失败: HTTP ${docResponse.status}`);
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
            // 文档加载完成后，自动显示章节目录
            console.log('loadDocument: 文档加载完成, currentNavState =', currentNavState, 'currentChapterToc.length =', currentChapterToc.length);
            if (currentChapterToc.length > 0) {
                showChapterToc(docPath);
            }

            // 如果有关键词，跳转到包含关键词的位置
            if (keyword) {
                setTimeout(() => scrollToKeyword(keyword), 300);
            }
            // 否则如果有目标行号，跳转到该位置
            else if (targetLine) {
                setTimeout(() => scrollToLine(targetLine), 300);
            }

            // 处理文档内的锚点链接（滚动到标题）
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

            // 处理文档内跳转到其他文档的链接
            document.querySelectorAll('#docs-content a[href]').forEach(link => {
                const href = link.getAttribute('href');
                // 只处理非外部链接且非锚点的链接
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
        // 在文档中搜索关键词并滚动到匹配位置
        if (!keyword) {
            console.warn('scrollToKeyword: 关键词为空');
            return;
        }

        console.log('scrollToKeyword: 搜索关键词', keyword);

        // 等待文档内容完全渲染
        setTimeout(() => {
            const docsContent = document.getElementById('docs-content');
            if (!docsContent) {
                console.warn('scrollToKeyword: 文档内容未找到');
                return;
            }

            // 搜索包含关键词的所有文本节点
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
                    // 找到第一个匹配，使用其父元素作为滚动目标
                    targetNode = node;
                    targetElement = node.parentElement;
                    break;
                }
            }

            if (targetElement) {
                // 滚动到目标元素
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // 高亮显示关键词
                if (targetNode.parentNode && targetNode.parentNode.parentNode) {
                    const originalStyle = targetNode.parentNode.style.backgroundColor;
                    targetNode.parentNode.style.transition = 'background-color 0.3s ease';
                    targetNode.parentNode.style.backgroundColor = 'rgba(var(--primary-rgb), 0.3)';
                    targetNode.parentNode.style.borderLeft = '4px solid var(--primary)';

                    // 2秒后移除高亮
                    setTimeout(() => {
                        targetNode.parentNode.style.backgroundColor = originalStyle;
                        targetNode.parentNode.style.borderLeft = '';
                    }, 2000);
                }

                console.log('已滚动到关键词位置:', keyword);
                showMessage(`已定位到 "${keyword}"`, 'success');
            } else {
                console.warn('未找到关键词:', keyword);
                showMessage('未找到指定内容', 'warning');
            }
        }, 500);
    }

    function scrollToLine(lineNumber) {
        // 这个函数暂时不做精确行号跳转
        // 因为行号计算方式与搜索索引不一致
        // 目前只是滚动到文档顶部
        console.log('scrollToLine: 行号跳转功能已禁用，滚动到文档顶部');
        
        document.getElementById('docs-content').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // 添加一个提示消息
        showMessage('文档已加载', 'success');
    }

    function getDocIdFromPath(filePath) {
        // 标准化路径 - 将 \ 替换为 /
        let normalizedPath = filePath.replace(/\\/g, '/');
        
        // 移除 .md 扩展名
        normalizedPath = normalizedPath.replace(/\.md$/, '');
        
        // 处理相对路径（包括 ../、./ 和同目录文件名）
        if (normalizedPath.startsWith('../') || normalizedPath.startsWith('./') || !normalizedPath.includes('/')) {
            // 获取当前文档路径
            const currentDoc = window.location.hash.split('/')[1];
            if (currentDoc) {
                // 解析相对路径
                const resolvedPath = resolveRelativePath(currentDoc.replace(/\.md$/, ''), normalizedPath);
                if (resolvedPath) {
                    normalizedPath = resolvedPath;
                }
            }
        }
        
        // 移除开头的 docs/（如果存在）
        if (normalizedPath.startsWith('docs/')) {
            normalizedPath = normalizedPath.substring(5);
        }
        
        // 尝试直接匹配
        const allDocs = DocsIndexManager.getAllDocuments();
        
        // 精确匹配
        let doc = allDocs.find(d => {
            const docPath = d.path.replace(/\\/g, '/').replace(/\.md$/, '').replace(/^docs\//, '');
            return docPath === normalizedPath;
        });
        
        // 如果精确匹配失败，尝试模糊匹配
        if (!doc) {
            doc = fuzzyMatchDocument(normalizedPath, allDocs);
        }
        
        return doc ? doc.path : null;
    }
    
    /**
     * 模糊匹配文档
     * @param {string} targetPath - 目标路径
     * @param {Array} allDocs - 所有文档列表
     * @returns {Object|null} - 匹配的文档对象，或 null
     */
    function fuzzyMatchDocument(targetPath, allDocs) {
        const normalizedTarget = targetPath.toLowerCase().replace(/\.md$/, '');
        const targetFileName = normalizedTarget.split('/').pop();
        
        // 尝试多种匹配策略
        for (const doc of allDocs) {
            const docPath = doc.path.replace(/\\/g, '/');
            const normalizedDocPath = docPath.toLowerCase().replace(/\.md$/, '').replace(/^docs\//, '');
            const docFileName = normalizedDocPath.split('/').pop();
            
            // 策略1: 文件名完全匹配
            if (docFileName === targetFileName) {
                return doc;
            }
            
            // 策略2: 路径完全匹配（忽略大小写）
            if (normalizedDocPath === normalizedTarget) {
                return doc;
            }
            
            // 策略3: 路径包含关系
            if (normalizedDocPath.includes(normalizedTarget) || normalizedTarget.includes(normalizedDocPath)) {
                return doc;
            }
            
            // 策略4: 移除目录后匹配文件名
            if (docPath.endsWith(`${targetPath}.md`)) {
                return doc;
            }
        }
        
        return null;
    }
    
    /**
     * 解析相对路径
     * @param {string} basePath - 基础路径
     * @param {string} relativePath - 相对路径
     * @returns {string|null} - 解析后的绝对路径，或 null（如果无效）
     */
    function resolveRelativePath(basePath, relativePath) {
        // 将基础路径分割为目录
        const baseParts = basePath.split('/');
        
        // 处理 ./ 开头的路径
        if (relativePath.startsWith('./')) {
            relativePath = relativePath.substring(2);
        }
        
        // 分割相对路径
        const relativeParts = relativePath.split('/');
        
        // 处理 ../ 开头的路径
        const resultParts = [...baseParts];
        resultParts.pop(); // 移除文件名，保留目录
        
        for (const part of relativeParts) {
            if (part === '..') {
                // 向上一级目录
                if (resultParts.length > 0) {
                    resultParts.pop();
                }
            } else if (part === '.') {
                // 当前目录，忽略
                continue;
            } else if (part) {
                // 正常路径部分
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

        // 保存到全局变量，供 showChapterToc 使用
        currentChapterToc = tocItems;

        // 返回修改后的 HTML（包含 id 属性）
        return tempDiv.innerHTML;
    }

    function wrapTables(htmlContent) {
        return htmlContent.replace(/<table([^>]*)>/gi, '<div class="table-wrapper"><table$1>').replace(/<\/table>/gi, '</table></div>');
    }

    function moveTocToSidebar() {
        // 已弃用：TOC 现在集成到左侧导航栏的章节目录中
        // 此函数保留以避免破坏现有代码
    }

    function addScrollSpy() {
        // 已弃用：滚动监听现在在 showChapterToc 中处理
        // 此函数保留以避免破坏现有代码
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
            const formattedDate = commitDate.toLocaleString('zh-CN', {
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
                                ${relativeTime} 更新了此文档
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

        // const editUrl = getEditUrl(docPath);
        // if (editUrl) {
        //     const editLink = document.createElement('a');
        //     editLink.href = editUrl;
        //     editLink.target = '_blank';
        //     editLink.style.display = 'inline-flex';
        //     editLink.style.alignItems = 'center';
        //     editLink.style.gap = '0.5rem';
        //     editLink.style.background = 'var(--primary)';
        //     editLink.style.color = 'white';
        //     editLink.style.padding = '0.5rem 1rem';
        //     editLink.style.borderRadius = 'var(--radius)';
        //     editLink.style.textDecoration = 'none';
        //     editLink.style.transition = 'var(--transition)';
        //     editLink.innerHTML = '<i class="fas fa-edit"></i> 编辑此页';
        //     editLink.style.fontSize = '0.9rem';

        //     editLink.addEventListener('mouseenter', function () {
        //         this.style.opacity = '0.9';
        //         this.style.transform = 'translateY(-2px)';
        //     });

        //     editLink.addEventListener('mouseleave', function () {
        //         this.style.opacity = '1';
        //         this.style.transform = 'translateY(0)';
        //     });

        //     navContainer.appendChild(editLink);
        // }

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
        const message = `文档链接提示：点击的链接 "${linkUrl || '未知文档'}" 暂未适配站内跳转，请使用左侧导航栏手动查找相关文档内容。`;
        showMessage(message, 'warning');
    }

    function showDocumentError(docsContent, error) {
        let errorMessage = error.message;
        let suggestion = '请检查网络连接或稍后再试';
        let showRetryButton = false;

        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            errorMessage = '网络连接失败';
            suggestion = '请检查您的网络连接后重试';
            showRetryButton = true;
        } else if (errorMessage.includes('API rate limit exceeded')) {
            errorMessage = 'GitHub API请求次数已达上限';
            suggestion = '请等待1小时后重试，或使用GitHub个人访问令牌提高限制';
        } else if (errorMessage.includes('HTTP')) {
            const statusMatch = errorMessage.match(/HTTP (\d+)/);
            if (statusMatch) {
                const statusCode = statusMatch[1];
                errorMessage = `服务器返回错误: HTTP ${statusCode}`;

                if (statusCode === '404') {
                    suggestion = '请求的文档不存在，可能是URL错误';
                } else if (statusCode === '403') {
                    suggestion = '访问被拒绝，可能是权限问题';
                } else if (statusCode === '500') {
                    suggestion = '服务器内部错误，请稍后再试';
                }
            }
        }

        let errorHTML = `
            <div class="error-message" style="text-align: center; padding: 3rem 0;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h3>无法加载文档</h3>
                <p>${errorMessage}</p>
                <p style="color: var(--secondary); margin-bottom: 1.5rem;">${suggestion}</p>
        `;

        if (showRetryButton) {
            errorHTML += `
                <button onclick="location.reload()" 
                    style="background: var(--primary); color: white; border: none; 
                        padding: 0.75rem 1.5rem; border-radius: 50px; 
                        cursor: pointer; transition: var(--transition);">
                    <i class="fas fa-sync-alt"></i> 重新加载
                </button>
            `;
        }

        errorHTML += `</div>`;
        docsContent.innerHTML = errorHTML;
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval}年前`;
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval}个月前`;
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval}天前`;
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval}小时前`;
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval}分钟前`;
        return `${Math.floor(seconds)}秒前`;
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
            
            <h4 style="margin-top: 1.5rem;">安装命令</h4>
            <pre style="background: var(--bg); padding: 1rem; border-radius: var(--radius);"><code>epsdk install ${pkg.package}</code></pre>
            
            ${pkg.type === 'cli' && pkg.command && pkg.command.length > 0 ? `
            <h4 style="margin-top: 1.5rem;">可用命令</h4>
            <ul>
                ${pkg.command.map(cmd => `<li><code>epsdk ${cmd}</code></li>`).join('')}
            </ul>
            ` : ''}
            
            ${pkg.tags.length > 0 ? `
            <h4 style="margin-top: 1.5rem;">标签</h4>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${pkg.tags.map(tag => `<span class="module-tag">${tag}</span>`).join('')}
            </div>
            ` : ''}
            
            ${pkg.repository ? `
            <h4 style="margin-top: 1.5rem;">仓库信息</h4>
            <p><a href="${pkg.repository}" target="_blank">查看源代码</a></p>
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
                <p>正在加载文档...</p>
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

            // 应用代码高亮
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
                    <h3>无法加载文档</h3>
                    <p>请访问 <a href="${pkg.repository}" target="_blank">模块仓库</a> 查看文档</p>
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
        // 特性卡片滚动动画
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

        // 步骤滚动动画
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
                
                // 显示复制成功提示
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                copyBtn.style.background = 'var(--accent)';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                showMessage('复制失败，请手动复制', 'error');
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

    ErisPulseApp.init();
});