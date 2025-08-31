/**
 * ErisPulse 网站主 JavaScript 文件
 */

// 主应用对象
const ErisPulseApp = (function () {
    // ==================== 配置和常量 ====================
    const CONFIG = {
        SETTINGS_VERSION: '1.0',
        STORAGE_KEYS: {
            SETTINGS: 'erispulse-settings',
            THEME: 'theme'
        },
        DEFAULT_USER_SETTINGS: {
            version: '1.0',
            theme: 'auto',
            presetTheme: '', // 预设主题
            customColors: {},
            animations: true,
            compactLayout: false,
            showLineNumbers: false,
            stickyNav: true
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
        }
    };

    // ==================== 私有变量 ====================
    let currentTheme = 'light';
    let allModules = [];
    let allAdapters = [];
    let allCliExtensions = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let userSettings = {...CONFIG.DEFAULT_USER_SETTINGS};

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
    }

    function setupStorage() {
        try {
            const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                
                // 检查版本兼容性
                if (!parsedSettings.version || parsedSettings.version !== CONFIG.SETTINGS_VERSION) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                    userSettings = {...CONFIG.DEFAULT_USER_SETTINGS};
                    return;
                }
                
                userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS, ...parsedSettings };
            }
        } catch (e) {
            console.warn('Failed to load user settings:', e);
            userSettings = {...CONFIG.DEFAULT_USER_SETTINGS};
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
                
                // 检查版本兼容性
                if (!parsedSettings.version || parsedSettings.version !== CONFIG.SETTINGS_VERSION) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                    userSettings = {...CONFIG.DEFAULT_USER_SETTINGS};
                    return;
                }
                
                userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS, ...parsedSettings };
            }
        } catch (e) {
            console.warn('Failed to load user settings:', e);
            userSettings = {...CONFIG.DEFAULT_USER_SETTINGS};
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
        // 清除所有自定义变量
        clearAllCustomVariables();
        
        if (userSettings.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', userSettings.theme);
        }
        
        // 应用预设主题或自定义颜色
        if (userSettings.presetTheme && userSettings.presetTheme !== 'default') {
            applyPresetTheme(userSettings.presetTheme, false);
        } else if (userSettings.customColors && hasCustomColors()) {
            applyCustomColors();
        }
    }

    // 检查是否有自定义颜色
    function hasCustomColors() {
        const colors = userSettings.customColors;
        return colors && Object.values(colors).some(color => color && color !== '');
    }

    // 清除所有自定义CSS变量
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
        // 清除预设主题标记
        const root = document.documentElement;
        const colors = userSettings.customColors;
        
        if (!colors) return;
        
        // 应用自定义颜色
        Object.keys(colors).forEach(key => {
            if (colors[key]) {
                root.style.setProperty(key, colors[key]);
            }
        });
    }

    function applyPresetTheme(preset, save = true) {
        // 清除之前的自定义样式
        clearAllCustomVariables();
        
        if (preset !== 'default') {
            const theme = CONFIG.THEME_PRESETS[preset];
            if (theme) {
                // 应用预设主题的所有变量
                const root = document.documentElement;
                Object.keys(theme).forEach(key => {
                    root.style.setProperty(key, theme[key]);
                });
                
                // 如果需要保存设置
                if (save) {
                    userSettings.presetTheme = preset;
                    // 清除自定义颜色
                    userSettings.customColors = {};
                    saveUserSettings();
                    showMessage(`已应用 ${getPresetThemeName(preset)} 预设样式`, 'success');
                }
            }
        } else {
            // 应用默认主题时，清除所有自定义变量
            if (save) {
                userSettings.presetTheme = 'default';
                userSettings.customColors = {};
                saveUserSettings();
                showMessage('已恢复默认主题', 'success');
            }
        }
    }

    // 获取预设主题显示名称
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
        } else if (hash === 'about') {
            view = 'about';
        } else if (hash === 'settings') {
            view = 'settings';
        } else if (hash.startsWith('api-') || hash.startsWith('dev-') ||
            hash.startsWith('cli') || hash.startsWith('quick-start') ||
            hash.startsWith('adapter-standards') || hash.startsWith('use-core') ||
            hash.startsWith('platform-features') || hash.startsWith('changelog') ||
            hash.startsWith('ai-module')) {
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
                    document.querySelectorAll('pre code').forEach(block => {
                        block.classList.add('line-numbers');
                    });
                } else {
                    document.body.classList.remove('show-line-numbers');
                    document.querySelectorAll('pre code').forEach(block => {
                        block.classList.remove('line-numbers');
                    });
                }

                Prism.highlightAll();
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
        
        // 根据当前设置选择预设
        if (userSettings.presetTheme) {
            document.getElementById('preset-themes').value = userSettings.presetTheme;
        } else if (hasCustomColors()) {
            document.getElementById('preset-themes').value = 'default'; // 有自定义颜色时显示默认
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
        // 清除预设主题
        userSettings.presetTheme = '';
        
        // 收集颜色值
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
        
        // 保存到用户设置
        userSettings.customColors = colorSettings;
        
        // 应用颜色
        applyCustomColors();
        
        // 保存设置
        saveUserSettings();
        showMessage('颜色设置已应用', 'success');
        
        // 更新预设选择器
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
            const response = await fetch('https://erisdev.com/packages.json');
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
            loadContributors();
            loadDependencies();

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
            const response = await fetch('https://api.github.com/repos/ErisPulse/ErisPulse/contributors');
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
        const dependencies = [
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
        ];

        const container = document.getElementById('dependencies-container');
        container.innerHTML = '';

        dependencies.forEach(dep => {
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
    function setupDocumentation() {
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
                e.preventDefault();
                const docName = this.getAttribute('data-doc');

                document.querySelectorAll('.docs-nav-link').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');

                document.querySelectorAll('.docs-nav-item').forEach(item => {
                    item.classList.remove('active');
                });

                history.pushState(null, null, `#docs/${docName}`);

                loadDocument(docName);

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });

        const hash = window.location.hash.substring(1);
        if (hash === 'docs') {
            const firstDocLink = document.querySelector('.docs-nav-link[data-doc]');
            if (firstDocLink) {
                firstDocLink.click();
            }
        }
    }

    // 文档配置
    const docConfig = {
        baseUrl: 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/',
        githubBaseUrl: 'https://github.com/ErisPulse/ErisPulse/edit/main/',

        docs: {
            'quick-start': 'docs/quick-start.md',
            'ai-module': 'docs/ai/module-generation.md',
            'ai-readme': 'docs/ai/README.md',
            'cli': 'docs/core/cli.md',
            'core-concepts': 'docs/core/concepts.md',
            'core-modules': 'docs/core/modules.md',
            'core-adapters': 'docs/core/adapters.md',
            'core-event-system': 'docs/core/event-system.md',
            'core-best-practices': 'docs/core/best-practices.md',
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
            'api-init': 'docs/api/ErisPulse/__init__.md',
            'api-main': 'docs/api/ErisPulse/__main__.md',
            'api-adapter': 'docs/api/ErisPulse/Core/adapter.md',
            'api-config': 'docs/api/ErisPulse/Core/config.md',
            'api-env': 'docs/api/ErisPulse/Core/env.md',
            'api-erispulse_config': 'docs/api/ErisPulse/Core/erispulse_config.md',
            'api-exceptions': 'docs/api/ErisPulse/Core/exceptions.md',
            'api-logger': 'docs/api/ErisPulse/Core/logger.md',
            'api-module': 'docs/api/ErisPulse/Core/module.md',
            'api-module_registry': 'docs/api/ErisPulse/Core/module_registry.md',
            'api-router': 'docs/api/ErisPulse/Core/router.md',
            'api-storage': 'docs/api/ErisPulse/Core/storage.md',
            'api-event-base': 'docs/api/ErisPulse/Core/Event/base.md',
            'api-event-command': 'docs/api/ErisPulse/Core/Event/command.md',
            'api-event-exceptions': 'docs/api/ErisPulse/Core/Event/exceptions.md',
            'api-event-message': 'docs/api/ErisPulse/Core/Event/message.md',
            'api-event-meta': 'docs/api/ErisPulse/Core/Event/meta.md',
            'api-event-notice': 'docs/api/ErisPulse/Core/Event/notice.md',
            'api-event-request': 'docs/api/ErisPulse/Core/Event/request.md',
            'api-event-init': 'docs/api/ErisPulse/Core/Event/__init__.md'
        },

        groups: {
            'api-init': [
                'api-init', 'api-main'
            ],
            'api-adapter': [
                'api-adapter', 'api-config', 'api-env', 'api-erispulse_config',
                'api-exceptions', 'api-logger', 'api-module', 'api-module_registry',
                'api-router', 'api-storage'
            ],
            'api-event-base': [
                'api-event-base', 'api-event-command', 'api-event-exceptions',
                'api-event-message', 'api-event-meta', 'api-event-notice',
                'api-event-request', 'api-event-init'
            ]
        },

        titles: {
            'quick-start': '快速开始指南',
            'ai-module': 'AI模块生成',
            'ai-readme': 'AI文档总览',
            'cli': '命令行接口',
            'core-concepts': '核心概念',
            'core-modules': '核心模块',
            'core-adapters': '适配器系统',
            'core-event-system': '事件系统',
            'core-best-practices': '最佳实践',
            'dev-readme': '开发入门',
            'dev-module': '模块开发',
            'dev-adapter': '适配器开发',
            'dev-cli': 'CLI 开发',
            'adapter-standards': '标准规范总览',
            'event-conversion': '事件转换',
            'api-response': 'API 响应',
            'platform-features': '平台特性总览',
            'platform-yunhu': '云湖平台特性',
            'platform-telegram': 'Telegram平台特性',
            'platform-onebot11': 'OneBot11平台特性',
            'platform-email': '邮件平台特性',
            'api-init': 'ErisPulse 核心模块',
            'api-main': 'ErisPulse 主模块',
            'api-adapter': '适配器接口',
            'api-config': '配置管理',
            'api-env': '环境配置',
            'api-erispulse_config': '框架配置',
            'api-exceptions': '错误处理',
            'api-logger': '日志系统',
            'api-module': '模块管理',
            'api-module_registry': '模块注册表',
            'api-router': '路由系统',
            'api-storage': '存储系统',
            'api-event-base': '事件基类',
            'api-event-command': '命令事件',
            'api-event-exceptions': '事件异常',
            'api-event-message': '消息事件',
            'api-event-meta': '元事件',
            'api-event-notice': '通知事件',
            'api-event-request': '请求事件',
            'api-event-init': '事件初始化'
        },

        categories: {
            'getting-started': ['quick-start'],
            'ai': ['ai-module', 'ai-readme'],
            'core': ['cli', 'core-concepts', 'core-modules', 'core-adapters', 'core-event-system', 'core-best-practices'],
            'development': ['dev-readme', 'dev-module', 'dev-adapter', 'dev-cli'],
            'standards': ['adapter-standards', 'event-conversion', 'api-response'],
            'platform-features': ['platform-features', 'platform-yunhu', 'platform-telegram', 'platform-onebot11', 'platform-email'],
            'api': ['api-init', 'api-adapter', 'api-event-base']
        }
    };

    const docUrls = {};
    Object.keys(docConfig.docs).forEach(key => {
        docUrls[key] = docConfig.baseUrl + docConfig.docs[key];
    });

    function getEditUrl(docName) {
        if (docConfig.docs[docName]) {
            return docConfig.githubBaseUrl + docConfig.docs[docName];
        }
        return null;
    }

    function getNextDocument(currentDoc) {
        const docOrder = [];
        Object.values(docConfig.categories).forEach(category => {
            docOrder.push(...category);
        });

        const currentIndex = docOrder.indexOf(currentDoc);
        if (currentIndex >= 0 && currentIndex < docOrder.length - 1) {
            return docOrder[currentIndex + 1];
        }
        return null;
    }

    function getPrevDocument(currentDoc) {
        const docOrder = [];
        Object.values(docConfig.categories).forEach(category => {
            docOrder.push(...category);
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

        if (docConfig.groups[docName]) {
            await loadGroupDocument(docName);
            return;
        }

        const docPath = docConfig.docs[docName];
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

        let docUrl = docConfig.baseUrl + docPath;
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
                                <a href="${docConfig.baseUrl}docs/ai/AIDocs/ErisPulse-ModuleDev.md" 
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
                                <a href="${docConfig.baseUrl}docs/ai/AIDocs/ErisPulse-AdapterDev.md" 
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
                                <a href="${docConfig.baseUrl}docs/ai/AIDocs/ErisPulse-Full.md" 
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

    function moveTocToSidebar() {
        const toc = document.querySelector('.table-of-contents');
        const docsLayout = document.querySelector('.docs-layout');

        if (toc && docsLayout) {
            if (window.innerWidth > 1200) {
                const contentToc = document.querySelector('.docs-content .table-of-contents');
                if (contentToc) {
                    contentToc.remove();
                }

                toc.style.width = '250px';
                docsLayout.appendChild(toc);
            } else {
                if (toc.parentNode !== document.querySelector('.docs-content')) {
                    toc.remove();
                    document.querySelector('.docs-content').insertAdjacentElement('afterbegin', toc);
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

    async function loadGroupDocument(groupName) {
        const docsContent = document.getElementById('docs-content');
        const groupDocs = docConfig.groups[groupName];

        if (!groupDocs) {
            docsContent.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 3rem 0;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h3>文档组未找到</h3>
                    <p>请求的文档组 "${groupName}" 不存在</p>
                </div>
            `;
            return;
        }

        let groupContent = `<h1>${docConfig.titles[groupName] || groupName}</h1>`;

        groupContent += `<div style="background: var(--card-bg); border-radius: var(--radius); padding: 1rem; margin-bottom: 2rem; box-shadow: var(--shadow-sm); border: 1px solid var(--border);">
            <h3 style="margin-top: 0; color: var(--text);">文档目录</h3>
            <ul style="list-style: none; padding: 0;">`;

        for (const docId of groupDocs) {
            const title = docConfig.titles[docId] || docId;
            groupContent += `<li style="margin: 0.5rem 0; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                <a href="#${docId}" style="color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-link"></i> ${title}
                </a>
            </li>`;
        }

        groupContent += `</ul></div>`;

        for (const docId of groupDocs) {
            const docPath = docConfig.docs[docId];
            if (!docPath) continue;

            try {
                const docUrl = docConfig.baseUrl + docPath;
                const response = await fetch(docUrl);
                if (!response.ok) continue;

                const content = await response.text();
                const title = docConfig.titles[docId] || docId;

                groupContent += `
                    <div id="${docId}" style="padding-top: 1rem; margin-top: 1rem; border-top: 1px solid var(--border);">
                        <h2 style="color: var(--text); margin-top: 2rem;">${title}</h2>
                        ${marked.parse(content)}
                    </div>
                `;
            } catch (error) {
                console.error(`加载文档 ${docId} 失败:`, error);
                groupContent += `
                    <div id="${docId}" style="padding-top: 1rem; margin-top: 1rem; border-top: 1px solid var(--border);">
                        <h2 style="color: var(--text); margin-top: 2rem;">${docConfig.titles[docId] || docId}</h2>
                        <div class="error-message" style="padding: 1rem; background: rgba(var(--primary-rgb), 0.1); border-radius: var(--radius);">
                            <p>无法加载此文档内容</p>
                        </div>
                    </div>
                `;
            }
        }

        docsContent.innerHTML = groupContent;

        if (groupDocs.length > 0) {
            const firstDoc = groupDocs[0];
            const firstDocPath = docConfig.docs[firstDoc];
            if (firstDocPath) {
                try {
                    const apiBaseUrl = 'https://api.github.com/repos/ErisPulse/ErisPulse/commits?path=' + firstDocPath;
                    const commitResponse = await fetch(apiBaseUrl, {
                        headers: {
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (commitResponse.ok) {
                        const commitData = await commitResponse.json();
                        if (commitData && commitData.length > 0 && commitData[0].commit) {
                            addDocumentMetaInfo(docsContent, groupName, commitData[0]);
                        }
                    }
                } catch (error) {
                    console.warn('获取提交信息失败:', error);
                }
            }
        }

        setTimeout(() => {
            docsContent.querySelectorAll('pre code').forEach((block) => {
                if (!block.className || !block.className.startsWith('language-')) {
                    block.classList.add('language-python');
                }

                if (userSettings.showLineNumbers) {
                    block.classList.add('line-numbers');
                }

                Prism.highlightElement(block);
            });
        }, 0)

        Prism.highlightAll();
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

            const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/README.md`;
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