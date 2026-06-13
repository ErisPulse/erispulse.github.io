/**
 * 通用 UI / 工具函数
 * 提示消息、HTML 转义、相对时间等，被几乎所有功能模块使用。
 */

import { I18n } from '../i18n.js';

/**
 * 显示一条短暂的浮动提示消息
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
export function showMessage(message, type) {
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

/**
 * 显示带有操作按钮的 Toast 通知（比 showMessage 存在时间更长，带可点击操作）
 */
export function showActionToast(message, actionText, actionCallback, duration) {
    var existing = document.querySelector('.message');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'message message-warning action-toast';

    var textSpan = document.createElement('span');
    textSpan.textContent = message;

    var actionBtn = document.createElement('button');
    actionBtn.textContent = actionText;
    Object.assign(actionBtn.style, {
        marginLeft: '12px',
        padding: '4px 12px',
        border: 'none',
        borderRadius: 'var(--radius)',
        background: 'rgba(255,255,255,0.25)',
        color: 'white',
        cursor: 'pointer',
        fontWeight: '600',
        whiteSpace: 'nowrap'
    });

    toast.appendChild(textSpan);
    toast.appendChild(actionBtn);

    Object.assign(toast.style, {
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
        background: '#f59e0b',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '90vw'
    });

    document.body.appendChild(toast);

    actionBtn.addEventListener('click', function () {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
        if (actionCallback) actionCallback();
    });

    setTimeout(function () {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    setTimeout(function () {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
    }, duration || 8000);
}

/**
 * HTML 转义
 */
export function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[c];
    });
}

/**
 * 相对时间（x 分钟前 / x 小时前 ...）
 */
export function timeAgo(date) {
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
