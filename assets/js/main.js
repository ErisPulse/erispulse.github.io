// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 隐藏加载动画
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        loader.classList.add('hidden');
        
        // 动画完成后移除元素
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 500);

    // 主题切换
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
    
    // 应用初始主题
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // 主题切换按钮事件
    themeToggle.addEventListener('click', () => {
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            currentTheme = 'dark';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            currentTheme = 'light';
        }
        localStorage.setItem('theme', currentTheme);
    });

// 视图切换逻辑
const viewLinks = document.querySelectorAll('[data-view]');
const viewContainers = document.querySelectorAll('.view-container');

// 根据哈希值切换视图
function switchViewByHash() {
    const hash = window.location.hash.substring(1);
    let view = 'home';
    
    if (hash.startsWith('docs')) {
        view = 'docs';
        // 如果有指定文档，加载对应文档
        const docMatch = hash.match(/docs\/(.+)/);
        if (docMatch && docMatch[1]) {
            setTimeout(() => {
                const docLink = document.querySelector(`.docs-nav-link[data-doc="${docMatch[1]}"]`);
                if (docLink) {
                    docLink.click();
                }
            }, 500);
        } else {
            // 如果没有指定具体文档，加载默认文档
            setTimeout(() => {
                const defaultDocLink = document.querySelector('.docs-nav-link[data-doc="quick-start"]');
                if (defaultDocLink) {
                    defaultDocLink.click();
                } else {
                    // 如果没有找到 quick-start 文档链接，加载第一个文档链接
                    const firstDocLink = document.querySelector('.docs-nav-link[data-doc]');
                    if (firstDocLink) {
                        firstDocLink.click();
                    }
                }
            }, 500);
        }
    } else if (hash.startsWith('market')) {
        view = 'market';
        // 如果有指定模块分类，筛选对应模块
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
    }
    
    // 更新导航栏活动状态
    viewLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // 切换视图
    viewContainers.forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');
    
    // 滚动到顶部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 监听哈希变化
window.addEventListener('hashchange', switchViewByHash);

viewLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const view = this.getAttribute('data-view');
        
        // 更新URL哈希
        if (view === 'home') {
            window.location.hash = '';
        } else {
            window.location.hash = view;
        }
        
        // 更新导航栏活动状态
        viewLinks.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        
        // 切换视图
        viewContainers.forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');
        
        // 滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// 页面加载时根据哈希值切换视图
switchViewByHash();

    // 模块市场功能
    let allModules = [];
    let allAdapters = [];
    let allCliExtensions = [];
    let activeCategory = 'all';
    let searchQuery = '';
    loadModuleData();
    
    // 加载模块数据
    async function loadModuleData() {
        try {
            const response = await fetch('https://erisdev.com/packages.json');
            if (!response.ok) throw new Error('模块API请求失败');
            const data = await response.json();
            
            // 处理模块数据
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
            
            // 处理适配器
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
            
            // 处理CLI扩展
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
            
            // 更新统计数据
            updateStats();
            
            // 渲染模块
            renderModules();
            
            // 加载贡献者数据
            loadContributors();
            
        } catch (error) {
            console.error('加载模块数据失败:', error);
            showError('加载模块失败，请稍后再试');
        }
    }
    
    // 加载贡献者数据
    async function loadContributors() {
        try {
            const response = await fetch('https://api.github.com/repos/ErisPulse/ErisPulse/contributors');
            if (!response.ok) throw new Error('贡献者API请求失败');
            const contributors = await response.json();
            
            // 更新贡献者数量
            document.getElementById('contributors-count').textContent = contributors.length;
            
            // 渲染贡献者头像
            const container = document.getElementById('contributors-container');
            container.innerHTML = '';
            
            contributors.slice(0, 12).forEach(contributor => {
                const contributorElement = document.createElement('div');
                contributorElement.className = 'contributor';
                contributorElement.innerHTML = `
                    <img src="${contributor.avatar_url}&s=80" alt="${contributor.login}" class="contributor-avatar">
                    <span class="contributor-name">${contributor.login}</span>
                `;
                contributorElement.onclick = () => window.open(contributor.html_url, '_blank');
                container.appendChild(contributorElement);
            });
        } catch (error) {
            console.error('加载贡献者数据失败:', error);
        }
    }
    
    // 更新统计数据
    function updateStats() {
        document.getElementById('total-modules').textContent = allModules.length;
        document.getElementById('adapter-count').textContent = allAdapters.length;
        document.getElementById('cli-count').textContent = allCliExtensions.length;
        document.getElementById('contributors-count').textContent = '--';
    }
    
    // 渲染模块
    function renderModules() {
        const modulesGrid = document.getElementById('modules-grid');
        modulesGrid.innerHTML = '';
        
        let packagesToShow = [];
        
        // 根据分类筛选
        if (activeCategory === 'all') {
            packagesToShow = [...allModules, ...allAdapters, ...allCliExtensions];
        } else if (activeCategory === 'modules') {
            packagesToShow = allModules;
        } else if (activeCategory === 'adapters') {
            packagesToShow = allAdapters;
        } else if (activeCategory === 'cli') {
            packagesToShow = allCliExtensions;
        }
        
        // 应用搜索过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            packagesToShow = packagesToShow.filter(pkg => 
                pkg.name.toLowerCase().includes(query) || 
                pkg.description.toLowerCase().includes(query)
            );
        }
        
        // 如果没有模块显示空状态
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
        
        // 渲染模块卡片
        packagesToShow.forEach((pkg, index) => {
            const card = document.createElement('div');
            card.className = 'module-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            // 处理CLI扩展的特殊显示
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
        
        // 添加事件监听器
        document.querySelectorAll('[data-action="install"]').forEach(btn => {
            btn.addEventListener('click', () => showInstallModal(btn.dataset.package));
        });
        
        document.querySelectorAll('[data-action="docs"]').forEach(btn => {
            btn.addEventListener('click', () => showDocsModal(btn.dataset.package, btn.dataset.repo));
        });
    }
    
    // 根据类型获取图标
    function getIconByType(type) {
        const icons = {
            'module': '<i class="fas fa-puzzle-piece"></i>',
            'adapter': '<i class="fas fa-plug"></i>',
            'cli': '<i class="fas fa-terminal"></i>'
        };
        return icons[type] || '<i class="fas fa-box"></i>';
    }
    
    // 显示安装模态框
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
        
        // 从GitHub获取README内容
        fetchReadmeContent(repoUrl).then(markdown => {
            // 使用marked.js将Markdown转换为HTML
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
            // 解析GitHub仓库URL
            const repoPath = repoUrl.replace('https://github.com/', '');
            const [owner, repo] = repoPath.split('/');
            
            // 首先获取仓库信息以确定默认分支
            const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            const repoData = await repoInfo.json();
            const defaultBranch = repoData.default_branch;
            
            // 使用GitHub Raw内容API获取README.md
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
    
    // 显示错误信息
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
    
    // 分类按钮事件
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeCategory = this.dataset.category;
            
            // 更新URL哈希
            if (activeCategory === 'all') {
                history.pushState(null, null, '#market');
            } else {
                history.pushState(null, null, `#market/${activeCategory}`);
            }
            
            renderModules();
        });
    });
    
    // 搜索功能
    const searchInput = document.getElementById('module-search');
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.trim();
        renderModules();
    });
    
    // 关闭模态框
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('module-modal').classList.remove('active');
    });
    
    // 点击模态框外部关闭
    document.getElementById('module-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
    
    // 如果当前是模块市场视图，加载模块数据
    if (document.getElementById('market-view').classList.contains('active')) {
        loadModuleData();
    }
    
// 文档视图功能
initDocsView();
});

// 初始化文档视图
function initDocsView() {
    // 初始化分类容器状态为收起
    const categories = ['getting-started', 'development', 'adapter-standards', 'references', 'api-docs'];
    categories.forEach(category => {
        const container = document.getElementById(`${category}-container`);
        const caret = document.getElementById(`${category}-caret`);
        if (container && caret) {
            container.style.display = 'none';
            caret.classList.remove('fa-chevron-up');
            caret.classList.add('fa-chevron-down');
        }
    });
    
    // 设置文档链接点击事件
    document.querySelectorAll('.docs-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const docName = this.getAttribute('data-doc');
            
            // 更新活动状态
            document.querySelectorAll('.docs-nav-link').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // 更新URL哈希
            history.pushState(null, null, `#docs/${docName}`);
            
            // 加载文档
            loadDocument(docName);
            
            // 滚动到页面顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
    
// 只有在文档视图且没有指定具体文档时才加载默认文档
const hash = window.location.hash.substring(1);
if (hash === 'docs') {
    // 用户访问了文档页面但没有指定具体文档，加载默认文档
    const firstDocLink = document.querySelector('.docs-nav-link[data-doc]');
    if (firstDocLink) {
        firstDocLink.click();
    }
}
}

// 切换文档分类显示
function toggleDocsCategory(categoryId) {
    const container = document.getElementById(`${categoryId}-container`);
    const caret = document.getElementById(`${categoryId}-caret`);
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        caret.classList.remove('fa-chevron-down');
        caret.classList.add('fa-chevron-up');
    } else {
        container.style.display = 'none';
        caret.classList.remove('fa-chevron-up');
        caret.classList.add('fa-chevron-down');
    }
}

// 文档URL映射
const docUrls = {
    "quick-start": 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/quick-start.md',
    'cli': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/CLI.md',
    'ai-module': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AIModuleGeneration.md',
    'changelog': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/CHANGELOG.md',
    'use-core': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/UseCore.md',
    'platform-features': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/PlatformFeatures.md',
    
    // Adapter Standards
    'adapter-standards': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AdapterStandards/README.md',
    'api-response': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AdapterStandards/APIResponse.md',
    'event-conversion': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AdapterStandards/EventConversion.md',
    
    // API Docs
    'api-init': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/__init__.md',
    'api-main': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/__main__.md',
    'api-adapter': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/adapter.md',
    'api-env': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/env.md',
    'api-mods': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/mods.md',
    'api-raiserr': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/raiserr.md',
    'api-server': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/server.md',
    'api-util': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/util.md',
    'api-logger': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/api/ErisPulse/Core/logger.md',
    
    // Development
    'dev-adapter': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/Development/Adapter.md',
    'dev-module': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/Development/Module.md',
    'dev-readme': 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/Development/README.md',
    'dev-cli'   : 'https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/Development/CLI.md',
};

// 获取文档在GitHub上的编辑URL
function getEditUrl(docName) {
    // 根据文档名称映射到GitHub上的文件路径
    const docPathMap = {
        "quick-start": "docs/quick-start.md",
        "cli": "docs/CLI.md",
        "ai-module": "docs/AIModuleGeneration.md",
        "changelog": "docs/CHANGELOG.md",
        "use-core": "docs/UseCore.md",
        "platform-features": "docs/PlatformFeatures.md",
        "adapter-standards": "docs/AdapterStandards/README.md",
        "api-response": "docs/AdapterStandards/APIResponse.md",
        "event-conversion": "docs/AdapterStandards/EventConversion.md",
        "api-init": "docs/api/ErisPulse/__init__.md",
        "api-main": "docs/api/ErisPulse/__main__.md",
        "api-adapter": "docs/api/ErisPulse/Core/adapter.md",
        "api-env": "docs/api/ErisPulse/Core/env.md",
        "api-mods": "docs/api/ErisPulse/Core/mods.md",
        "api-raiserr": "docs/api/ErisPulse/Core/raiserr.md",
        "api-server": "docs/api/ErisPulse/Core/server.md",
        "api-util": "docs/api/ErisPulse/Core/util.md",
        "api-logger": "docs/api/ErisPulse/Core/logger.md",
        "dev-adapter": "docs/Development/Adapter.md",
        "dev-module": "docs/Development/Module.md",
        "dev-readme": "docs/Development/README.md",
        "dev-cli": "docs/Development/CLI.md"
    };
    
    const filePath = docPathMap[docName];
    if (filePath) {
        return `https://github.com/ErisPulse/ErisPulse/edit/main/${filePath}`;
    }
    return null;
}

// 获取下一个文档
function getNextDocument(currentDoc) {
    const docOrder = [
        "quick-start", "cli", "ai-module", "changelog", "use-core", "platform-features",
        "adapter-standards", "api-response", "event-conversion",
        "api-init", "api-main", "api-adapter", "api-env", "api-mods", "api-raiserr", "api-server", "api-util", "api-logger",
        "dev-readme", "dev-adapter", "dev-module", "dev-cli"
    ];
    
    const currentIndex = docOrder.indexOf(currentDoc);
    if (currentIndex >= 0 && currentIndex < docOrder.length - 1) {
        return docOrder[currentIndex + 1];
    }
    return null;
}

// 获取上一个文档
function getPrevDocument(currentDoc) {
    const docOrder = [
        "quick-start", "cli", "ai-module", "changelog", "use-core", "platform-features",
        "adapter-standards", "api-response", "event-conversion",
        "api-init", "api-main", "api-adapter", "api-env", "api-mods", "api-raiserr", "api-server", "api-util", "api-logger",
        "dev-readme", "dev-adapter", "dev-module", "dev-cli"
    ];
    
    const currentIndex = docOrder.indexOf(currentDoc);
    if (currentIndex > 0) {
        return docOrder[currentIndex - 1];
    }
    return null;
}

// 加载文档内容
async function loadDocument(docName) {
    const docsContent = document.getElementById('docs-content');
    docsContent.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 3rem 0;">
            <div style="width: 50px; height: 50px; border: 5px solid rgba(74, 107, 223, 0.2); border-top: 5px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
            <p>正在加载文档...</p>
        </div>
    `;

    let docUrl = docUrls[docName];
    let docContent = '';
    let commitInfo = null;
    
    try {
        // 获取文档内容
        const docResponse = await fetch(docUrl);
        if (!docResponse.ok) {
            throw new Error(`文档加载失败: HTTP ${docResponse.status}`);
        }
        docContent = await docResponse.text();
        
        // 获取文档的提交信息
        try {
            const apiBaseUrl = 'https://api.github.com/repos/ErisPulse/ErisPulse/commits?path=';
            const docPathMap = {
                "quick-start": "docs/quick-start.md",
                "cli": "docs/CLI.md",
                "ai-module": "docs/AIModuleGeneration.md",
                "changelog": "docs/CHANGELOG.md",
                "use-core": "docs/UseCore.md",
                "platform-features": "docs/PlatformFeatures.md",
                "adapter-standards": "docs/AdapterStandards/README.md",
                "api-response": "docs/AdapterStandards/APIResponse.md",
                "event-conversion": "docs/AdapterStandards/EventConversion.md",
                "api-init": "docs/api/ErisPulse/__init__.md",
                "api-main": "docs/api/ErisPulse/__main__.md",
                "api-adapter": "docs/api/ErisPulse/Core/adapter.md",
                "api-env": "docs/api/ErisPulse/Core/env.md",
                "api-mods": "docs/api/ErisPulse/Core/mods.md",
                "api-raiserr": "docs/api/ErisPulse/Core/raiserr.md",
                "api-server": "docs/api/ErisPulse/Core/server.md",
                "api-util": "docs/api/ErisPulse/Core/util.md",
                "api-logger": "docs/api/ErisPulse/Core/logger.md",
                "dev-adapter": "docs/Development/Adapter.md",
                "dev-module": "docs/Development/Module.md",
                "dev-readme": "docs/Development/README.md",
                "dev-cli": "docs/Development/CLI.md"
            };
            
            const filePath = docPathMap[docName];
            if (filePath) {
                const commitResponse = await fetch(apiBaseUrl + filePath, {
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
            }
        } catch (commitError) {
            console.warn('获取提交信息失败:', commitError);
        }
        
        // 解析时间的函数
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
        
        // 如果是AI模块文档，添加下载参考物料的链接
        if (docName === 'ai-module') {
            const aiReferenceLinks = `
            <div style="margin-bottom: 2rem;">
                <div style="padding: 1rem; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #0369a1;">AI开发参考物料</h3>
                    <p style="margin-bottom: 1rem;">下载ErisPulse开发参考文档，用于投喂给AI以更快生成您想要的模块或通过AI的介绍了解项目</p>

                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">

                        <div style="padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <h4 style="margin-bottom: 0.5rem; font-size: 1rem; color: #0f172a;">模块开发</h4>
                            <a href="https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AIDocs/ErisPulse-ModuleDev.md" 
                                download="ErisPulse-ModuleDev.md"
                                style="display: inline-flex; align-items: center; gap: 0.5rem; background: #0ea5e9; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; font-weight: 500; transition: all 0.2s ease;">
                                <i class="fas fa-download"></i> 下载
                            </a>
                        </div>
                    
                        <div style="padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <h4 style="margin-bottom: 0.5rem; font-size: 1rem; color: #0f172a;">适配器开发</h4>
                            <a href="https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AIDocs/ErisPulse-AdapterDev.md" 
                                download="ErisPulse-AdapterDev.md"
                                style="display: inline-flex; align-items: center; gap: 0.5rem; background: #0ea5e9; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; font-weight: 500; transition: all 0.2s ease;">
                                <i class="fas fa-download"></i> 下载
                            </a>
                        </div>
                        
                        <div style="padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <h4 style="margin-bottom: 0.5rem; font-size: 1rem; color: #0f172a;">ErisPulse核心开发</h4>
                            <a href="https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AIDocs/ErisPulse-Core.md" 
                                download="ErisPulse-Core.md"
                                style="display: inline-flex; align-items: center; gap: 0.5rem; background: #0ea5e9; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; font-weight: 500; transition: all 0.2s ease;">
                                <i class="fas fa-download"></i> 下载
                            </a>
                        </div>
                        
                        <div style="padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <h4 style="margin-bottom: 0.5rem; font-size: 1rem; color: #0f172a;">文档合集</h4>
                            <a href="https://gh.xmly.dev/https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/docs/AIDocs/ErisPulse-Full.md" 
                                download="ErisPulse-Full.md"
                                style="display: inline-flex; align-items: center; gap: 0.5rem; background: #0ea5e9; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; font-weight: 500; transition: all 0.2s ease;">
                                <i class="fas fa-download"></i> 下载
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            `;
            docsContent.innerHTML = aiReferenceLinks + marked.parse(docContent);
        } else {
            docsContent.innerHTML = marked.parse(docContent);
        }
        
        // 添加文档元信息
        const metaContainer = document.createElement('div');
        metaContainer.style.marginTop = '2rem';
        metaContainer.style.paddingTop = '1.5rem';
        metaContainer.style.borderTop = '1px solid var(--border)';
        
        // 添加贡献者信息
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
                    <img src="${commitInfo.author.avatar_url}&s=40" 
                            style="width: 40px; height: 40px; border-radius: 50%;"
                            alt="${commitInfo.commit.author.name}">
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
        
        // 添加编辑和导航链接
        const navContainer = document.createElement('div');
        navContainer.style.display = 'flex';
        navContainer.style.justifyContent = 'space-between';
        navContainer.style.flexWrap = 'wrap';
        navContainer.style.gap = '1rem';
        navContainer.style.marginTop = '1rem';
        
        // 获取编辑URL
        const editUrl = getEditUrl(docName);
        const prevDoc = getPrevDocument(docName);
        const nextDoc = getNextDocument(docName);
        
        // 编辑链接
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
            
            editLink.addEventListener('mouseenter', function() {
                this.style.opacity = '0.9';
                this.style.transform = 'translateY(-2px)';
            });
            
            editLink.addEventListener('mouseleave', function() {
                this.style.opacity = '1';
                this.style.transform = 'translateY(0)';
            });
            
            navContainer.appendChild(editLink);
        }
        
        // 上下章导航
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
            
            prevLink.addEventListener('mouseenter', function() {
                this.style.borderColor = 'var(--primary)';
                this.style.transform = 'translateY(-2px)';
            });
            
            prevLink.addEventListener('mouseleave', function() {
                this.style.borderColor = 'var(--border)';
                this.style.transform = 'translateY(0)';
            });
            
            // 添加点击事件
            prevLink.addEventListener('click', function(e) {
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
            
            nextLink.addEventListener('mouseenter', function() {
                this.style.borderColor = 'var(--primary)';
                this.style.transform = 'translateY(-2px)';
            });
            
            nextLink.addEventListener('mouseleave', function() {
                this.style.borderColor = 'var(--border)';
                this.style.transform = 'translateY(0)';
            });
            
            // 添加点击事件
            nextLink.addEventListener('click', function(e) {
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
        
    } catch (error) {
        console.error('加载文档失败:', error);
        
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
}
