/**
 * 关于页：贡献者列表 + 友情链接渲染
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';

export function renderFriendLinks() {
    const container = document.getElementById('friend-links-container');
    if (!container) return;

    if (CONFIG.FRIEND_LINKS.length === 0) {
        container.innerHTML = `<p class="no-friend-links">${I18n.t('common.noData')}</p>`;
        return;
    }

    const linksHtml = CONFIG.FRIEND_LINKS.map(link => `
        <a href="${link.url}" target="_blank" class="friend-link" rel="noopener noreferrer">
            ${link.icon && link.icon.endsWith('.svg') ? `<img src="${link.icon}" alt="${link.name}" class="friend-link-icon">` : `<i class="${link.icon || 'fas fa-link'}"></i>`}
            <div class="friend-link-info">
                <span class="friend-link-name">${link.name}</span>
                <span class="friend-link-desc">${link.description}</span>
            </div>
        </a>
    `).join('');

    container.innerHTML = linksHtml;
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
