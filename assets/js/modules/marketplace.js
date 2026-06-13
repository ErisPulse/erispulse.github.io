/**
 * 模块市场：分类/搜索/渲染卡片、市场模态框（安装/文档）
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { state } from '../core/state.js';
import { showMessage } from '../core/notify.js';

// 仅市场模块使用的本地状态
let activeCategory = 'all';
let searchQuery = '';

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

    const searchInput = document.getElementById('module-search');
    if (!searchInput) return;
    var _searchTimer = null;
    searchInput.addEventListener('input', function () {
        searchQuery = this.value.trim();
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(renderModules, 300);
    });
}

export async function loadModuleData() {
    try {
        const response = await fetch(CONFIG.API.packages);
        if (!response.ok) throw new Error('模块API请求失败');
        const data = await response.json();

        state.allModules = Object.entries(data.modules || {}).map(([name, info]) => ({
            name,
            package: info.package,
            version: info.version,
            author: info.author,
            description: info.description,
            repository: info.repository,
            official: info.official || false,
            verified: info.verified !== false,
            submitted_by: info.submitted_by || '',
            tags: info.tags || [],
            type: 'module'
        }));

        state.allAdapters = Object.entries(data.adapters || {}).map(([name, info]) => ({
            name,
            package: info.package,
            version: info.version,
            author: info.author || 'Unknown',
            description: info.description,
            repository: info.repository,
            official: info.official || false,
            verified: info.verified !== false,
            submitted_by: info.submitted_by || '',
            tags: info.tags || [],
            type: 'adapter'
        }));

        updateStats();
        renderModules();

    } catch (error) {
        console.error('加载模块数据失败:', error);
        showError(I18n.t('market.loadFailed'));
    }
}

export function updateStats() {
    const totalCount = state.allModules.length + state.allAdapters.length;
    document.getElementById('total-all-modules').textContent = totalCount;
    document.getElementById('total-modules').textContent = state.allModules.length;
    document.getElementById('adapter-count').textContent = state.allAdapters.length;
    document.getElementById('contributors-count').textContent = '--';
}

export function renderModules() {
    const modulesGrid = document.getElementById('modules-grid');
    if (!modulesGrid) return;
    modulesGrid.innerHTML = '';

    let packagesToShow = [];

    if (activeCategory === 'all') {
        packagesToShow = [...state.allModules, ...state.allAdapters];
    } else if (activeCategory === 'modules') {
        packagesToShow = state.allModules;
    } else if (activeCategory === 'adapters') {
        packagesToShow = state.allAdapters;
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

        card.innerHTML = `
            <div class="module-header">
                <div class="module-icon">
                    ${getIconByType(pkg.type)}
                </div>
                <div>
                    <h3 class="module-name">${pkg.name}</h3>
                    <div style="display:flex;gap:0.4rem;align-items:center;">
                        <div class="module-version">v${pkg.version}</div>
                        ${pkg.official ? '<span class="module-badge badge-official"><i class="fas fa-check-circle"></i> Official</span>' : ''}
                        ${!pkg.verified ? '<span class="module-badge badge-unverified"><i class="fas fa-exclamation-triangle"></i> <span data-i18n="market.unverified">未验证</span></span>' : ''}
                    </div>
                </div>
            </div>
            <p class="module-desc">${pkg.description}</p>
            ${pkg.tags.length > 0 ? `
            <div class="module-tags">
                ${pkg.tags.map(tag => `<span class="module-tag">${tag}</span>`).join('')}
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
        'adapter': '<i class="fas fa-plug"></i>'
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
    const pkg = [...state.allModules, ...state.allAdapters].find(m => m.package === packageName);
    if (!pkg) return;

    const modal = document.getElementById('module-modal');
    const modalContent = document.getElementById('module-modal-content');

    modalContent.innerHTML = `
        <h3>${pkg.name} v${pkg.version}</h3>
        <p>${pkg.description}</p>

        <h4 style="margin-top: 1.5rem;">${I18n.t('market.installCmd')}</h4>
        <pre style="background: var(--bg); padding: 1rem; border-radius: var(--radius);"><code>epsdk install ${pkg.package}</code></pre>

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

export function showDocsModal(packageName, repoUrl) {
    const pkg = [...state.allModules, ...state.allAdapters].find(m => m.package === packageName);
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
