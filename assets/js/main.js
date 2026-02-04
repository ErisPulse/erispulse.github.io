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
            name: "aiohttp",
            url: "https://github.com/aio-libs/aiohttp",
            description: "异步HTTP客户端/服务器框架，用于处理网络请求"
        },
        {
            name: "fastapi",
            url: "https://github.com/tiangolo/fastapi",
            description: "现代、快速（高性能）的Web框架，用于构建API"
        },
        {
            name: "pydantic",
            url: "https://github.com/pydantic/pydantic",
            description: "数据验证和设置管理，基于Python类型提示"
        },
        {
            name: "rich",
            url: "https://github.com/Textualize/rich",
            description: "在终端中提供丰富的文本和美观的格式化输出"
        },
        {
            name: "colorama",
            url: "https://github.com/tartley/colorama",
            description: "简化在Windows上的彩色终端文本输出"
        },
        {
            name: "keyboard",
            url: "https://github.com/boppreh/keyboard",
            description: "处理键盘事件的跨平台库"
        },
        {
            name: "watchdog",
            url: "https://github.com/gorakhargosh/watchdog",
            description: "监控文件系统事件的库，用于热重载功能"
        },
        {
            name: "toml",
            url: "https://github.com/uiri/toml",
            description: "解析和生成TOML格式配置文件"
        },
        {
            name: "hypercorn",
            url: "https://github.com/pgjones/hypercorn",
            description: "基于ASGI的HTTP服务器，用于运行FastAPI应用"
        },
        {
            name: "python-multipart",
            url: "https://github.com/andrew-d/python-multipart",
            description: "解析multipart/form-data格式数据"
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
        baseUrl: 'https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Pre-Release/v2/',
        githubBaseUrl: 'https://github.com/ErisPulse/ErisPulse/edit/Develop/v2',

        // 文档分类和导航结构
        categories: {
            'getting-started': {
                title: '快速开始',
                icon: 'fa-rocket',
                docs: [
                    { id: 'quick-start', title: '快速开始指南', icon: 'fa-rocket' }
                ]
            },
            'ai': {
                title: 'AI相关',
                icon: 'fa-brain',
                docs: [
                    { id: 'ai-module', title: 'AI模块生成', icon: 'fa-brain' },
                    { id: 'ai-readme', title: 'AI文档总览', icon: 'fa-book' }
                ]
            },
            'core': {
                title: '核心功能',
                icon: 'fa-cogs',
                docs: [
                    { id: 'cli', title: '命令行接口', icon: 'fa-terminal' },
                    { id: 'core-concepts', title: '核心概念', icon: 'fa-cogs' },
                    { id: 'core-modules', title: '核心模块', icon: 'fa-th' },
                    { id: 'core-adapters', title: '适配器系统', icon: 'fa-plug' },
                    { id: 'core-event-system', title: '事件系统', icon: 'fa-calendar' },
                    { id: 'core-lifecycle', title: '生命周期', icon: 'fa-clock' },
                    { id: 'core-self-config', title: '配置解析', icon: 'fa-cog' },
                    { id: 'core-lazy-loading', title: '懒加载机制', icon: 'fa-hourglass-half' },
                    { id: 'core-best-practices', title: '最佳实践', icon: 'fa-check-circle' },
                    { id: 'core-router', title: '路由系统', icon: 'fa-route' }
                ]
            },
            'development': {
                title: '开发指南',
                icon: 'fa-code',
                docs: [
                    { id: 'dev-readme', title: '开发入门', icon: 'fa-book' },
                    { id: 'dev-module', title: '模块开发', icon: 'fa-cube' },
                    { id: 'dev-adapter', title: '适配器开发', icon: 'fa-plug' },
                    { id: 'dev-cli', title: 'CLI 开发', icon: 'fa-terminal' }
                ]
            },
            'standards': {
                title: '标准规范',
                icon: 'fa-file-alt',
                docs: [
                    { id: 'adapter-standards', title: '标准规范总览', icon: 'fa-file-alt' },
                    { id: 'event-conversion', title: '事件转换', icon: 'fa-random' },
                    { id: 'api-response', title: 'API 响应', icon: 'fa-exchange-alt' }
                ]
            },
            'styleguide': {
                title: '风格指南',
                icon: 'fa-code',
                docs: [
                    { id: 'styleguide', title: '代码风格指南', icon: 'fa-code' },
                    { id: 'docstring-spec', title: '文档字符串规范', icon: 'fa-file-code' }
                ]
            },
            'platform-features': {
                title: '平台特性',
                icon: 'fa-list',
                docs: [
                    { id: 'platform-features', title: '平台特性总览', icon: 'fa-list' },
                    { id: 'platform-yunhu', title: '云湖平台特性', icon: 'fa-cloud' },
                    { id: 'platform-telegram', title: 'Telegram平台特性', icon: 'fab fa-telegram' },
                    { id: 'platform-onebot11', title: 'OneBot11平台特性', icon: 'fa-robot' },
                    { id: 'platform-email', title: '邮件平台特性', icon: 'fa-envelope' },
                    { id: 'platform-maintain-notes', title: '维护说明', icon: 'fa-tools' }
                ]
            }
        },

        // 文档路径映射
        paths: {
            'quick-start': 'docs/quick-start.md',
            'ai-module': 'docs/ai/module-generation.md',
            'ai-readme': 'docs/ai/README.md',
            'cli': 'docs/core/cli.md',
            'core-concepts': 'docs/core/concepts.md',
            'core-modules': 'docs/core/modules.md',
            'core-adapters': 'docs/core/adapters.md',
            'core-event-system': 'docs/core/event-system.md',
            'core-lifecycle': 'docs/core/lifecycle.md',
            'core-best-practices': 'docs/core/best-practices.md',
            'core-self-config': 'docs/core/self-config.md',
            'core-lazy-loading': 'docs/core/lazy-loading.md',
            'core-router': 'docs/core/router.md',
            'dev-readme': 'docs/development/README.md',
            'dev-module': 'docs/development/module.md',
            'dev-adapter': 'docs/development/adapter.md',
            'dev-cli': 'docs/development/cli.md',
            'adapter-standards': 'docs/standards/README.md',
            'event-conversion': 'docs/standards/event-conversion.md',
            'api-response': 'docs/standards/api-response.md',
            'platform-features': 'docs/platform-features/README.md',
            'platform-yunhu': 'docs/platform-features/yunhu.md',
            'platform-telegram': 'docs/platform-features/telegram.md',
            'platform-onebot11': 'docs/platform-features/onebot11.md',
            'platform-email': 'docs/platform-features/email.md',
            'platform-maintain-notes': 'docs/platform-features/maintain-notes.md',
            'styleguide': 'docs/styleguide/README.md',
            'docstring-spec': 'docs/styleguide/docstring_spec.md'
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
        packages: 'https://erisdev.com/packages.json',
        changelog: 'https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/CHANGELOG.md',
        ciRuns: 'https://api.github.com/repos/ErisPulse/ErisPulse/actions/runs?per_page=20'
    },

    // 服务状态监控
    SERVICES: {
        install: {
            name: '安装服务',
            domain: 'get.erisdev.com',
            url: 'https://get.erisdev.com/install.sh',
            icon: 'fa-download'
        },
        packages: {
            name: '包源服务',
            domain: 'erisdev.com',
            url: 'https://erisdev.com/packages',
            icon: 'fa-box'
        },
        ci: {
            name: 'CI/CD',
            domain: 'GitHub Actions',
            url: '',
            icon: 'fab fa-github'
        }
    }
};

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
    let filters = {
        version: 'all',
        change: 'all',
        time: 'all'
    };
    let changelogData = [];

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
        setupChangelog();
        setupDocumentation();
        setupModals();
        setupSettings();
        renderFriendLinks();
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
                    const docLink = document.querySelector(`.docs-nav-link[data-doc="${docMatch[1]}"]`);
                    if (docLink) {
                        docLink.click();
                    }
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
        } else if (hash === 'changelog') {
            view = 'changelog';
        } else if (hash === 'about') {
            view = 'about';
        } else if (hash === 'settings') {
            view = 'settings';
        } else if (hash.startsWith('dev-') ||
            hash.startsWith('cli') || hash.startsWith('quick-start') ||
            hash.startsWith('adapter-standards') || hash.startsWith('use-core') ||
            hash.startsWith('platform-features') || hash.startsWith('ai-module')) {
            view = 'docs';
            setTimeout(() => {
                const docLink = document.querySelector(`.docs-nav-link[data-doc="${hash}"]`);
                if (docLink) {
                    docLink.click();
                }
            }, 500);
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

        if (view === 'changelog') {
            loadChangelogData();
            checkServiceStatus();
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

    // ==================== 更新日志模块 ====================
    function setupChangelog() {
        const searchInput = document.getElementById('changelog-search');
        const clearSearchBtn = document.getElementById('clear-search');

        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim();
            clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
            renderChangelog();
        });

        clearSearchBtn.addEventListener('click', function () {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            renderChangelog();
        });

        const toggleFiltersBtn = document.getElementById('toggle-filters');
        const filtersContent = document.getElementById('filters-content');

        toggleFiltersBtn.addEventListener('click', function () {
            filtersContent.classList.toggle('expanded');
            toggleFiltersBtn.classList.toggle('active');
        });

        document.querySelectorAll('.version-filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const filterType = this.dataset.type;
                const filterValue = this.dataset.filter;

                document.querySelectorAll(`.version-filter-btn[data-type="${filterType}"]`).forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');

                filters[filterType] = filterValue;
                renderChangelog();
            });
        });

        document.getElementById('reset-filters')?.addEventListener('click', function () {
            filters = {
                version: 'all',
                change: 'all',
                time: 'all'
            };

            document.querySelectorAll('.version-filter-btn').forEach(btn => {
                if (btn.dataset.filter === 'all') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            renderChangelog();
        });

        document.querySelectorAll('.service-status-item').forEach(item => {
            const header = item.querySelector('.service-status-header');
            header.addEventListener('click', function () {
                item.classList.toggle('expanded');
            });
        });

        window.addEventListener('hashchange', checkChangelogView);
        checkChangelogView();
    }

    function checkChangelogView() {
        const hash = window.location.hash.substring(1);
        if (hash.startsWith('changelog')) {
            loadChangelogData();
            checkServiceStatus();
        }
    }

    async function checkServiceStatus() {
        checkService(CONFIG.SERVICES.install.url, 'install');
        checkService(CONFIG.SERVICES.packages.url, 'packages');
        checkCIStatus();
    }

    async function checkService(url, serviceName) {
        const indicator = document.getElementById(`status-${serviceName}`);
        const statusText = document.getElementById(`status-text-${serviceName}`);
        const detailResponse = document.getElementById(`detail-response-${serviceName}`);
        const detailStatus = document.getElementById(`detail-status-${serviceName}`);

        if (!indicator || !statusText) return;

        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors'
            });
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            indicator.className = 'status-indicator online';
            indicator.innerHTML = '<i class="fas fa-circle"></i>';

            if (responseTime < 200) {
                statusText.textContent = '正常';
            } else if (responseTime < 500) {
                statusText.textContent = '稍慢';
            } else {
                statusText.textContent = '较慢';
            }

            if (detailResponse) {
                detailResponse.textContent = `${responseTime}ms`;
            }
            if (detailStatus) {
                detailStatus.textContent = '在线';
                detailStatus.style.color = '#10b981';
            }
        } catch (error) {
            indicator.className = 'status-indicator offline';
            indicator.innerHTML = '<i class="fas fa-circle"></i>';

            statusText.textContent = '离线';

            if (detailResponse) {
                detailResponse.textContent = '--';
            }
            if (detailStatus) {
                detailStatus.textContent = '离线';
                detailStatus.style.color = '#ef4444';
            }
        }
    }

    async function checkCIStatus() {
        const indicator = document.getElementById('status-ci');
        const statusText = document.getElementById('status-text-ci');
        const detailWorkflowCount = document.getElementById('detail-workflow-count');
        const detailLastRun = document.getElementById('detail-last-run');
        const detailStatus = document.getElementById('detail-status-ci');

        if (!indicator || !statusText) return;

        try {
            const response = await fetch(CONFIG.API.ciRuns);
            if (response.ok) {
                const data = await response.json();
                const runs = data.workflow_runs || [];

                if (runs.length > 0) {
                    const successCount = runs.filter(run => run.conclusion === 'success').length;
                    const totalCount = runs.length;
                    const successRate = (successCount / totalCount * 100).toFixed(1);

                    const lastRun = runs[0];
                    const lastRunTime = new Date(lastRun.created_at);
                    const timeDiff = Date.now() - lastRunTime.getTime();
                    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
                    const minutesAgo = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                    let timeAgoText;
                    if (hoursAgo > 24) {
                        timeAgoText = `${Math.floor(hoursAgo / 24)} 天前`;
                    } else if (hoursAgo > 0) {
                        timeAgoText = `${hoursAgo} 小时前`;
                    } else {
                        timeAgoText = `${minutesAgo} 分钟前`;
                    }

                    if (successRate >= 90) {
                        indicator.className = 'status-indicator online';
                        indicator.innerHTML = '<i class="fas fa-circle"></i>';
                        statusText.textContent = '正常';

                        if (detailStatus) {
                            detailStatus.textContent = '正常运行';
                            detailStatus.style.color = '#10b981';
                        }
                    } else if (successRate >= 70) {
                        indicator.className = 'status-indicator unknown';
                        indicator.innerHTML = '<i class="fas fa-circle"></i>';
                        statusText.textContent = '波动';

                        if (detailStatus) {
                            detailStatus.textContent = `成功率 ${successRate}%`;
                            detailStatus.style.color = '#f59e0b';
                        }
                    } else {
                        indicator.className = 'status-indicator offline';
                        indicator.innerHTML = '<i class="fas fa-circle"></i>';
                        statusText.textContent = '异常';

                        if (detailStatus) {
                            detailStatus.textContent = `成功率 ${successRate}%`;
                            detailStatus.style.color = '#ef4444';
                        }
                    }

                    if (detailWorkflowCount) {
                        detailWorkflowCount.textContent = totalCount;
                    }
                    if (detailLastRun) {
                        detailLastRun.textContent = timeAgoText;
                    }
                } else {
                    indicator.className = 'status-indicator unknown';
                    indicator.innerHTML = '<i class="fas fa-circle"></i>';
                    statusText.textContent = '无数据';

                    if (detailStatus) {
                        detailStatus.textContent = '无运行记录';
                        detailStatus.style.color = '#f59e0b';
                    }
                }
            } else {
                throw new Error('API 请求失败');
            }
        } catch (error) {
            console.error('CI状态检查失败:', error);
            indicator.className = 'status-indicator unknown';
            indicator.innerHTML = '<i class="fas fa-circle"></i>';
            statusText.textContent = '未知';

            if (detailStatus) {
                detailStatus.textContent = '状态未知';
                detailStatus.style.color = '#f59e0b';
            }
        }
    }

    async function loadChangelogData() {
        const changelogList = document.getElementById('changelog-list');

        try {
            const response = await fetch(CONFIG.API.changelog);
            if (!response.ok) throw new Error('获取更新日志失败');

            const markdown = await response.text();
            changelogData = parseChangelog(markdown);
            renderChangelog();
        } catch (error) {
            console.error('加载更新日志失败:', error);
            changelogList.innerHTML = `
                <div class="changelog-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>加载失败</h3>
                    <p>无法加载更新日志，请稍后再试</p>
                    <button id="retry-load-changelog" style="margin-top: 1rem; padding: 0.6rem 1.2rem; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;

            document.getElementById('retry-load-changelog')?.addEventListener('click', loadChangelogData);
        }
    }

    function parseChangelog(markdown) {
        const versions = [];
        let currentVersion = null;
        let shouldSkipSection = false;
        let inCodeBlock = false;

        const lines = markdown.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }

            if (inCodeBlock) {
                continue;
            }

            const versionMatch = line.match(/^##\s+\[([^\]]+)\]\s*-\s*(\d{4}\/\d{2}\/\d{2})/);
            if (versionMatch) {
                if (currentVersion) {
                    versions.push(currentVersion);
                }

                currentVersion = {
                    version: versionMatch[1],
                    date: versionMatch[2],
                    sections: [],
                    type: getVersionType(versionMatch[1])
                };
                shouldSkipSection = false;

                continue;
            }

            const ruleMatch = line.match(/^##\s+(规则|示例)/);
            if (ruleMatch) {
                shouldSkipSection = true;
                continue;
            }

            if (shouldSkipSection) {
                continue;
            }

            if (line.trim().startsWith('>')) {
                if (currentVersion) {
                    currentVersion.note = line.replace(/^>\s*/, '');
                }
                continue;
            }

            const sectionMatch = line.match(/^###\s+(新增|变更|修复|移除|废弃|文档)/);
            if (sectionMatch && currentVersion) {
                currentVersion.sections.push({
                    type: sectionMatch[1],
                    items: []
                });
                continue;
            }

            if (!currentVersion || currentVersion.sections.length === 0) {
                continue;
            }

            const currentSection = currentVersion.sections[currentVersion.sections.length - 1];

            const contributorMatch = line.match(/^\s*-\s*@(\w+)/);
            if (contributorMatch) {
                currentSection.items.push({
                    type: 'contributor',
                    username: contributorMatch[1]
                });
                continue;
            }

            const itemMatch = line.match(/^\s*-\s+(.+)$/);
            if (itemMatch) {
                currentSection.items.push({
                    type: 'text',
                    content: itemMatch[1]
                });
                continue;
            }

            const nestedMatch = line.match(/^\s{4,}-\s+(.+)$/);
            if (nestedMatch && currentSection.items.length > 0) {
                const lastItem = currentSection.items[currentSection.items.length - 1];
                if (!lastItem.subitems) {
                    lastItem.subitems = [];
                }
                lastItem.subitems.push(nestedMatch[1]);
            }
        }

        if (currentVersion) {
            versions.push(currentVersion);
        }

        return versions;
    }

    function getVersionType(version) {
        if (version.includes('dev') || version.includes('pre')) {
            return 'dev';
        }
        return 'stable';
    }

    function renderChangelog() {
        const changelogList = document.getElementById('changelog-list');

        let filteredVersions = changelogData.map(version => {
            if (filters.version !== 'all' && version.type !== filters.version) {
                return null;
            }

            if (filters.time !== 'all') {
                const versionDate = new Date(version.date.replace(/\//g, '-'));
                const now = new Date();
                const timeDiff = now - versionDate;
                const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

                const timeFilters = {
                    '7d': 7,
                    '30d': 30,
                    '90d': 90,
                    '1y': 365
                };

                if (daysDiff > timeFilters[filters.time]) {
                    return null;
                }
            }

            let filteredSections = version.sections;
            let versionMatchesSearch = false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const versionText = `${version.version} ${version.date} ${version.note || ''}`.toLowerCase();
                versionMatchesSearch = versionText.includes(query);

                if (versionMatchesSearch) {
                    return {
                        ...version,
                        sections: version.sections
                    };
                }

                filteredSections = version.sections.map(section => {
                    const sectionMatches = section.type.toLowerCase().includes(query);
                    const filteredItems = section.items.filter(item => {
                        const itemText = (item.content || item.username || '').toLowerCase();
                        const subitemText = item.subitems ? item.subitems.join(' ').toLowerCase() : '';
                        return itemText.includes(query) || subitemText.includes(query);
                    });

                    if (sectionMatches || filteredItems.length > 0) {
                        return {
                            ...section,
                            items: sectionMatches ? section.items : filteredItems
                        };
                    }
                    return null;
                }).filter(Boolean);

                if (filteredSections.length === 0 && !versionMatchesSearch) {
                    return null;
                }
            }

            if (filters.change !== 'all') {
                const changeTypeMap = {
                    'added': '新增',
                    'changed': '变更',
                    'fixed': '修复'
                };

                filteredSections = filteredSections.filter(section => {
                    return section.type === changeTypeMap[filters.change];
                });

                if (filteredSections.length === 0) {
                    return null;
                }
            }

            return {
                ...version,
                sections: filteredSections
            };
        }).filter(Boolean);

        if (filteredVersions.length === 0) {
            changelogList.innerHTML = `
                <div class="changelog-empty">
                    <i class="fas fa-box-open"></i>
                    <h3>暂无结果</h3>
                    <p>${searchQuery ? '没有找到匹配的更新日志' : '没有找到符合条件的更新日志'}</p>
                </div>
            `;
            return;
        }

        changelogList.innerHTML = filteredVersions.map((version, index) => {
            const versionBadge = getVersionBadge(version.version);
            const sectionsHtml = version.sections.map(section => renderSection(section)).join('');
            const noteHtml = version.note ? `<div class="changelog-dev-note"><i class="fas fa-info-circle"></i> ${version.note}</div>` : '';

            return `
                <div class="changelog-card ${version.type === 'dev' ? 'version-dev' : ''}" style="animation-delay: ${index * 0.1}s">
                    <div class="changelog-header-info">
                        <div class="changelog-version">
                            ${version.version}
                            ${versionBadge}
                        </div>
                        <div class="changelog-date">${version.date}</div>
                    </div>
                    ${noteHtml}
                    <div class="changelog-sections">
                        ${sectionsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    function getVersionBadge(version) {
        if (version.includes('dev')) {
            return '<span class="version-badge dev">开发版本</span>';
        } else if (version.includes('alpha')) {
            return '<span class="version-badge alpha">Alpha</span>';
        } else if (version.includes('beta')) {
            return '<span class="version-badge beta">Beta</span>';
        } else if (version.includes('pre')) {
            return '<span class="version-badge alpha">预览版</span>';
        } else {
            return '<span class="version-badge stable">正式版</span>';
        }
    }

    function renderSection(section) {
        const sectionIcons = {
            '新增': 'fa-plus-circle',
            '变更': 'fa-sync-alt',
            '修复': 'fa-wrench',
            '文档': 'fa-book'
        };

        const sectionClass = {
            '新增': 'added',
            '变更': 'changed',
            '修复': 'fixed',
            '文档': 'added'
        };

        const icon = sectionIcons[section.type] || 'fa-circle';
        const className = sectionClass[section.type] || '';

        const itemsHtml = section.items.map(item => {
            if (item.type === 'contributor') {
                return `
                    <li class="changelog-item">
                        <div class="changelog-item-contributor">
                            <i class="fas fa-user"></i>
                            By <a href="https://github.com/${item.username}" target="_blank">@${item.username}</a>
                        </div>
                        ${item.subitems ? item.subitems.map(sub => `<div class="changelog-subitem">${sub}</div>`).join('') : ''}
                    </li>
                `;
            } else {
                return `
                    <li class="changelog-item">
                        <span class="changelog-item-text">${item.content}</span>
                        ${item.subitems ? item.subitems.map(sub => `<div class="changelog-subitem">${sub}</div>`).join('') : ''}
                    </li>
                `;
            }
        }).join('');

        return `
            <div class="changelog-section">
                <div class="changelog-section-header">
                    <h3 class="changelog-section-title ${className}">
                        <i class="fas ${icon}"></i>
                        ${section.type}
                    </h3>
                </div>
                <ul class="changelog-content">
                    ${itemsHtml}
                </ul>
            </div>
        `;
    }

    // ==================== 文档模块 ====================
    function setupDocumentation() {
        renderDocsNavigation();
        
        document.querySelectorAll('.docs-nav-category').forEach(category => {
            category.addEventListener('click', function (e) {
                e.stopPropagation();
                const parentItem = this.closest('.docs-nav-item');
                const isActive = parentItem.classList.contains('active');

                document.querySelectorAll('.docs-nav-item').forEach(item => {
                    item.classList.remove('active');
                });

                if (!isActive) {
                    parentItem.classList.add('active');
                }
            });
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.docs-nav-item')) {
                document.querySelectorAll('.docs-nav-item').forEach(item => {
                    item.classList.remove('active');
                });
            }
        });

        document.querySelectorAll('.docs-nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                const docName = this.getAttribute('data-doc');
                if (docName) {
                    e.preventDefault();
                    navigateToDocument(docName);
                }
            });
        });

        setupDocumentationSearch();
        setupBreadcrumbNavigation();
        setupDocumentActions();
        setupDocumentationResponsive();

        const hash = window.location.hash.substring(1);
        if (hash === 'docs') {
            const firstDocLink = document.querySelector('.docs-nav-link[data-doc]');
            if (firstDocLink) {
                firstDocLink.click();
            }
        }
    }

    function renderDocsNavigation() {
        const navContainer = document.querySelector('.docs-nav-container');
        if (!navContainer) return;

        let navHtml = '';

        for (const [categoryId, category] of Object.entries(CONFIG.DOCS.categories)) {
            navHtml += `
                <div class="docs-nav-item">
                    <div class="docs-nav-category" data-category="${categoryId}">
                        <span>${category.title}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="docs-dropdown">
                        ${category.docs.map(doc => `
                            <a href="#docs/${doc.id}" class="docs-nav-link" data-doc="${doc.id}">
                                <i class="fas ${doc.icon}"></i>
                                ${doc.title}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        navHtml += `
            <div class="docs-nav-item">
                <a href="https://github.com/ErisPulse/ErisPulse/tree/Pre-Release/v2/docs/api" target="_blank" class="docs-nav-link" style="justify-content: flex-start;">
                    <i class="fab fa-github"></i>
                    <span>API 文档</span>
                </a>
            </div>
        `;

        navContainer.innerHTML = navHtml;
    }

    function navigateToDocument(docName) {
        document.querySelectorAll('.docs-nav-link').forEach(item => {
            item.classList.remove('active');
        });

        const activeLink = document.querySelector(`.docs-nav-link[data-doc="${docName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');

            const parentItem = activeLink.closest('.docs-nav-item');
            if (parentItem) {
                document.querySelectorAll('.docs-nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                parentItem.classList.add('active');
            }
        }

        history.pushState(null, null, `#docs/${docName}`);
        loadDocument(docName);
        updateBreadcrumb(docName);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function setupDocumentationSearch() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '搜索文档...';
        searchInput.className = 'docs-search-input';

        const searchContainer = document.createElement('div');
        searchContainer.className = 'docs-search-container';
        searchContainer.innerHTML = '<i class="fas fa-search"></i>';
        searchContainer.appendChild(searchInput);

        const sidebarHeader = document.querySelector('.docs-sidebar-header');
        if (sidebarHeader) {
            sidebarHeader.appendChild(searchContainer);
        }

        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value.trim().toLowerCase();
                if (query.length > 0) {
                    searchDocuments(query);
                } else {
                    clearSearchResults();
                }
            }, 300);
        });
    }

    function searchDocuments(query) {
        const results = [];

        for (const [categoryId, category] of Object.entries(CONFIG.DOCS.categories)) {
            category.docs.forEach(doc => {
                const title = doc.title.toLowerCase();
                if (title.includes(query)) {
                    results.push({
                        name: doc.id,
                        title: doc.title,
                        category: category.title,
                        categoryId: categoryId
                    });
                }
            });
        }

        displaySearchResults(results);
    }

    function displaySearchResults(results) {
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
                        <div class="search-result-item" data-doc="${result.name}">
                            <div class="result-title">${result.title}</div>
                            <div class="result-category">${result.category}</div>
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
                const docName = this.getAttribute('data-doc');
                navigateToDocument(docName);
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
                if (e.target.tagName === 'A' && e.target.getAttribute('href') === '#docs') {
                    e.preventDefault();
                    updateBreadcrumb('home');
                }
            });
        }
    }

    function updateBreadcrumb(docName) {
        const breadcrumb = document.querySelector('.docs-breadcrumb');
        if (!breadcrumb) return;

        let category = 'other';
        let categoryName = '其他';

        for (const [catId, cat] of Object.entries(CONFIG.DOCS.categories)) {
            if (cat.docs.some(doc => doc.id === docName)) {
                category = catId;
                categoryName = cat.title;
                break;
            }
        }

        const docTitle = getDocTitle(docName);

        if (docName === 'home' || !docName) {
            breadcrumb.innerHTML = `<span class="current">文档中心</span>`;
            return;
        }

        breadcrumb.innerHTML = `
            <a href="#docs" class="breadcrumb-link">
                <i class="fas fa-home breadcrumb-icon"></i>
                <span>文档中心</span>
            </a>
            <span class="separator">/</span>
            <a href="#docs" class="breadcrumb-link breadcrumb-category">
                <span>${categoryName}</span>
            </a>
            <span class="separator">/</span>
            <span class="current">${docTitle}</span>
        `;
    }

    function getDocTitle(docName) {
        for (const category of Object.values(CONFIG.DOCS.categories)) {
            const doc = category.docs.find(d => d.id === docName);
            if (doc) {
                return doc.title;
            }
        }
        return docName;
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
        const title = getDocTitle(currentDoc);

        if (navigator.share) {
            navigator.share({
                title: title,
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
            moveTocToSidebar();
        }

        window.addEventListener('resize', handleResize);
        handleResize();
    }

    function getEditUrl(docName) {
        if (CONFIG.DOCS.paths[docName]) {
            return CONFIG.DOCS.githubBaseUrl + CONFIG.DOCS.paths[docName];
        }
        return null;
    }

    function getNextDocument(currentDoc) {
        const docOrder = [];
        Object.values(CONFIG.DOCS.categories).forEach(category => {
            category.docs.forEach(doc => {
                docOrder.push(doc.id);
            });
        });

        const currentIndex = docOrder.indexOf(currentDoc);
        if (currentIndex >= 0 && currentIndex < docOrder.length - 1) {
            return docOrder[currentIndex + 1];
        }
        return null;
    }

    function getPrevDocument(currentDoc) {
        const docOrder = [];
        Object.values(CONFIG.DOCS.categories).forEach(category => {
            category.docs.forEach(doc => {
                docOrder.push(doc.id);
            });
        });

        const currentIndex = docOrder.indexOf(currentDoc);
        if (currentIndex > 0) {
            return docOrder[currentIndex - 1];
        }
        return null;
    }

    async function loadDocument(docName) {
        const docsContent = document.getElementById('docs-content');
        docsContent.innerHTML = `
            <div class="loading-spinner" style="text-align: center; padding: 3rem 0;">
                <div style="width: 50px; height: 50px; border: 5px solid rgba(var(--primary-rgb), 0.2); border-top: 5px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p>正在加载文档...</p>
            </div>
        `;

        clearToc();

        const docPath = CONFIG.DOCS.paths[docName];
        if (!docPath) {
            docsContent.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 3rem 0;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h3>文档未找到</h3>
                    <p>请求的文档 "${docName}" 不存在</p>
                </div>
            `;
            return;
        }

        let docUrl = CONFIG.DOCS.baseUrl + docPath;
        let docContent = '';
        let commitInfo = null;

        try {
            const docResponse = await fetch(docUrl);
            if (!docResponse.ok) {
                throw new Error(`文档加载失败: HTTP ${docResponse.status}`);
            }
            docContent = await docResponse.text();
            let htmlContent = marked.parse(docContent);

            htmlContent = addTableOfContents(htmlContent);
            htmlContent = wrapTables(htmlContent);

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

            if (docName === 'ai-module') {
                const aiReferenceLinks = `
                <div class="ai-reference-section">
                    <div class="ai-reference-header">
                        <h3><i class="fas fa-brain"></i> AI开发参考物料</h3>
                        <p>下载ErisPulse开发参考文档，用于投喂给AI以更快生成您想要的模块或通过AI的介绍了解项目</p>
                    </div>

                    <div class="ai-reference-grid">
                        <div class="ai-reference-card">
                            <div class="ai-card-header">
                                <h4><i class="fas fa-cube"></i> 模块开发</h4>
                            </div>
                            <div class="ai-card-body">
                                <p>用于指导AI生成自定义功能模块的参考文档</p>
                                <a href="${CONFIG.DOCS.baseUrl}docs/ai/AIDocs/ErisPulse-ModuleDev.md" 
                                    download="ErisPulse-ModuleDev.md"
                                    class="ai-download-btn">
                                    <i class="fas fa-download"></i> 下载
                                </a>
                            </div>
                        </div>
                    
                        <div class="ai-reference-card">
                            <div class="ai-card-header">
                                <h4><i class="fas fa-plug"></i> 适配器开发</h4>
                            </div>
                            <div class="ai-card-body">
                                <p>用于指导AI开发平台适配器的参考文档</p>
                                <a href="${CONFIG.DOCS.baseUrl}docs/ai/AIDocs/ErisPulse-AdapterDev.md" 
                                    download="ErisPulse-AdapterDev.md"
                                    class="ai-download-btn">
                                    <i class="fas fa-download"></i> 下载
                                </a>
                            </div>
                        </div>
                        
                        <div class="ai-reference-card">
                            <div class="ai-card-header">
                                <h4><i class="fas fa-archive"></i> 文档合集</h4>
                            </div>
                            <div class="ai-card-body">
                                <p>完整的ErisPulse开发参考文档集合</p>
                                <a href="${CONFIG.DOCS.baseUrl}docs/ai/AIDocs/ErisPulse-Full.md" 
                                    download="ErisPulse-Full.md"
                                    class="ai-download-btn">
                                    <i class="fas fa-download"></i> 下载
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                docsContent.innerHTML = aiReferenceLinks + htmlContent;
            } else {
                docsContent.innerHTML = htmlContent;
            }

            addDocumentMetaInfo(docsContent, docName, commitInfo);

        } catch (error) {
            console.error('加载文档失败:', error);
            showDocumentError(docsContent, error);
        }

        setTimeout(() => {
            moveTocToSidebar();

            document.querySelectorAll('.toc-link').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const targetId = this.getAttribute('data-target');
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });

                        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
                        this.classList.add('active');

                        history.pushState(null, null, `#${targetId}`);
                    }
                });
            });

            document.querySelectorAll('#docs-content a').forEach(link => {
                link.addEventListener('click', function (e) {
                    const href = this.getAttribute('href');

                    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                        return;
                    }

                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const targetElement = document.getElementById(href.substring(1));
                        if (targetElement) {
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                        return;
                    }

                    if (href && !href.includes('://')) {
                        e.preventDefault();

                        const currentDoc = window.location.hash.split('/')[1];
                        const currentDocPath = CONFIG.DOCS.paths[currentDoc] || '';
                        const targetDocId = getDocIdFromPath(href, currentDocPath);

                        if (targetDocId) {
                            navigateToDocument(targetDocId);
                        } else {
                            showDocumentLinkWarning(href);
                        }
                    }
                });
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

            addScrollSpy();
        }, 100);
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

        if (tocItems.length > 0) {
            let tocHtml = `
            <div class="table-of-contents">
                <h3>目录</h3>
                <ul>
            `;

            tocItems.forEach(item => {
                const indent = (item.level - 1) * 20;
                tocHtml += `
                    <li style="margin-left: ${indent}px;">
                        <a href="#${item.id}" class="toc-link" data-target="${item.id}">${item.text}</a>
                    </li>
                `;
            });

            tocHtml += `
                </ul>
            </div>
            `;

            tempDiv.insertAdjacentHTML('afterbegin', tocHtml);
        }

        return tempDiv.innerHTML;
    }

    function wrapTables(htmlContent) {
        return htmlContent.replace(/<table([^>]*)>/gi, '<div class="table-wrapper"><table$1>').replace(/<\/table>/gi, '</table></div>');
    }

    function moveTocToSidebar() {
        const toc = document.querySelector('.table-of-contents');
        const docsLayout = document.querySelector('.docs-layout');

        if (toc && docsLayout) {
            if (window.innerWidth > 1200) {
                const contentToc = document.querySelector('.docs-content .table-of-contents');
                if (contentToc) {
                    contentToc.remove();
                }

                const rightSidebar = document.querySelector('.docs-layout > .table-of-contents');
                if (!rightSidebar) {
                    toc.style.width = '250px';
                    toc.style.position = 'sticky';
                    toc.style.top = '100px';
                    toc.style.maxHeight = 'calc(100vh - 120px)';
                    toc.style.overflowY = 'auto';
                    docsLayout.appendChild(toc);
                }
            } else {
                const rightSidebar = document.querySelector('.docs-layout > .table-of-contents');
                if (rightSidebar) {
                    rightSidebar.remove();
                }

                if (toc.parentNode !== document.querySelector('.docs-content')) {
                    toc.remove();

                    const docsContent = document.querySelector('.docs-content');
                    const markdownContent = docsContent.querySelector('.markdown-content');
                    if (markdownContent) {
                        markdownContent.insertAdjacentElement('afterbegin', toc);
                    } else {
                        docsContent.insertAdjacentElement('afterbegin', toc);
                    }
                }
            }
        }
    }

    function addScrollSpy() {
        const headers = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6');
        const tocLinks = document.querySelectorAll('.toc-link');

        if (headers.length === 0 || tocLinks.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    tocLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-target') === id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-20% 0% -80% 0%'
        });

        headers.forEach(header => observer.observe(header));
    }

    function resolvePath(relativePath, basePath) {
        let cleanPath = relativePath.replace(/^\.?\//, '');

        if (relativePath.startsWith('/')) {
            return cleanPath;
        }

        if (!basePath) {
            return cleanPath;
        }

        const baseParts = basePath.split('/');
        const relativeParts = cleanPath.split('/');

        baseParts.pop();

        relativeParts.forEach(part => {
            if (part === '..') {
                baseParts.pop();
            } else if (part !== '.' && part !== '') {
                baseParts.push(part);
            }
        });

        return baseParts.join('/');
    }

    function getDocIdFromPath(filePath, currentDocPath) {
        let normalizedPath = filePath.replace(/\.md$/, '');

        if (normalizedPath.startsWith('docs/')) {
            normalizedPath = normalizedPath.substring(5);
        }

        for (const [docId, docPath] of Object.entries(CONFIG.DOCS.paths)) {
            const normalizedDocPath = docPath.replace(/\.md$/, '').replace(/^docs\//, '');
            if (normalizedDocPath === normalizedPath) {
                return docId;
            }
        }

        if (currentDocPath) {
            const absolutePath = resolvePath(filePath, currentDocPath);
            const normalizedAbsolutePath = absolutePath.replace(/\.md$/, '').replace(/^docs\//, '');

            for (const [docId, docPath] of Object.entries(CONFIG.DOCS.paths)) {
                const normalizedDocPath = docPath.replace(/\.md$/, '').replace(/^docs\//, '');
                if (normalizedDocPath === normalizedAbsolutePath) {
                    return docId;
                }
            }
        }

        return null;
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

    function addDocumentMetaInfo(docsContent, docName, commitInfo) {
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

        const editUrl = getEditUrl(docName);
        const prevDoc = getPrevDocument(docName);
        const nextDoc = getNextDocument(docName);

        if (editUrl) {
            const editLink = document.createElement('a');
            editLink.href = editUrl;
            editLink.target = '_blank';
            editLink.style.display = 'inline-flex';
            editLink.style.alignItems = 'center';
            editLink.style.gap = '0.5rem';
            editLink.style.background = 'var(--primary)';
            editLink.style.color = 'white';
            editLink.style.padding = '0.5rem 1rem';
            editLink.style.borderRadius = 'var(--radius)';
            editLink.style.textDecoration = 'none';
            editLink.style.transition = 'var(--transition)';
            editLink.innerHTML = '<i class="fas fa-edit"></i> 编辑此页';
            editLink.style.fontSize = '0.9rem';

            editLink.addEventListener('mouseenter', function () {
                this.style.opacity = '0.9';
                this.style.transform = 'translateY(-2px)';
            });

            editLink.addEventListener('mouseleave', function () {
                this.style.opacity = '1';
                this.style.transform = 'translateY(0)';
            });

            navContainer.appendChild(editLink);
        }

        const navLinksContainer = document.createElement('div');
        navLinksContainer.style.display = 'flex';
        navLinksContainer.style.gap = '0.5rem';

        if (prevDoc) {
            const prevLink = document.createElement('a');
            prevLink.href = '#docs/' + prevDoc;
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
            prevLink.innerHTML = '<i class="fas fa-arrow-left"></i> 上一章';
            prevLink.style.fontSize = '0.9rem';

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
                const prevDocLink = document.querySelector(`.docs-nav-link[data-doc="${prevDoc}"]`);
                if (prevDocLink) {
                    prevDocLink.click();
                }
            });

            navLinksContainer.appendChild(prevLink);
        }

        if (nextDoc) {
            const nextLink = document.createElement('a');
            nextLink.href = '#docs/' + nextDoc;
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
            nextLink.innerHTML = '下一章 <i class="fas fa-arrow-right"></i>';
            nextLink.style.fontSize = '0.9rem';

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
                const nextDocLink = document.querySelector(`.docs-nav-link[data-doc="${nextDoc}"]`);
                if (nextDocLink) {
                    nextDocLink.click();
                }
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
        }
        else if (errorMessage.includes('API rate limit exceeded')) {
            errorMessage = 'GitHub API请求次数已达上限';
            suggestion = '请等待1小时后重试，或使用GitHub个人访问令牌提高限制';
        }
        else if (errorMessage.includes('HTTP')) {
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

    // ==================== 公共API ====================
    return {
        init: init,
        loadDocument: loadDocument,
        showInstallModal: showInstallModal,
        showDocsModal: showDocsModal,
        clearToc: clearToc,
        moveTocToSidebar: moveTocToSidebar
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
