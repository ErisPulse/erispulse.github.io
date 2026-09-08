/**
 * 关于页：贡献者列表 + 友情链接 + 依赖致谢渲染
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildLinkCard(item, extraClass = '') {
    const icon = item.icon && item.icon.endsWith('.svg')
        ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.name)}" class="friend-link-icon" loading="lazy">`
        : `<i class="${escapeHtml(item.icon || 'fas fa-link')}" aria-hidden="true"></i>`;
    const version = item.version
        ? `<span class="dep-badge">${escapeHtml(item.version)}</span>`
        : '';

    return `
        <a href="${escapeHtml(item.url)}" target="_blank" class="friend-link ${extraClass}" rel="noopener noreferrer" title="${escapeHtml(item.name)}">
            ${icon}
            <div class="friend-link-info">
                <span class="friend-link-name">${escapeHtml(item.name)}${version}</span>
                <span class="friend-link-desc">${escapeHtml(item.description)}</span>
            </div>
        </a>
    `;
}

export function renderFriendLinks() {
    const container = document.getElementById('friend-links-container');
    if (!container) return;

    if (CONFIG.FRIEND_LINKS.length === 0) {
        container.innerHTML = `<p class="no-friend-links">${I18n.t('common.noData')}</p>`;
        return;
    }

    container.innerHTML = CONFIG.FRIEND_LINKS.map(link => buildLinkCard(link)).join('');
}

export function renderDependencies() {
    const container = document.getElementById('dependencies-container');
    if (!container) return;

    if (CONFIG.DEPENDENCIES.length === 0) {
        container.innerHTML = `<p class="no-friend-links">${I18n.t('common.noData')}</p>`;
        return;
    }

    container.innerHTML = CONFIG.DEPENDENCIES.map(dep => buildLinkCard(dep, 'dep-link')).join('');
}

export async function loadContributors() {
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
                <img src="${contributor.avatar_url}" alt="${contributor.login}" class="contributor-avatar" referrerpolicy="no-referrer">
                <span class="contributor-name">${contributor.login}</span>
            `;
            contributorElement.onclick = () => window.open(contributor.html_url, '_blank');
            container.appendChild(contributorElement);
        });
    } catch (error) {
        console.error('加载贡献者数据失败:', error);
    }
}
