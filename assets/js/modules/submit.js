/**
 * 提交模块管理器
 * 模块提交 / 编辑 / 删除、我的模块列表。
 * 登录态由 core/auth.js（AuthManager）统一管理，本模块只消费。
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { showMessage } from '../core/notify.js';
import { state } from '../core/state.js';
import { fetchSdkVersions, getCachedSdkVersions } from '../core/sdk-versions.js';
import { AuthManager } from '../core/auth.js';

export const SubmitModuleManager = (function () {
    let pendingMinSdk = null;    // 需要强制选中的最低 SDK 版本（编辑时置入，渲染后清空）

    function init() {
        setupSubmitButton();
        setupModalEvents();
        setupFormSubmission();
        setupTabs();
        applyDisabledProviders();
        // 导航栏账户菜单等入口请求打开本弹窗（detail.tab 指定初始页签）
        document.addEventListener('erispulse-open-submit-modal', function (e) {
            var detail = (e && e.detail) || {};
            openSubmitModal(detail.tab);
        });
    }

    /** 软屏蔽的 OAuth 提供方：隐藏登录入口并显示提示（如云湖授权服务端故障） */
    function applyDisabledProviders() {
        Object.keys(CONFIG.OAUTH_PROVIDERS).forEach(function (p) {
            if (!CONFIG.OAUTH_PROVIDERS[p].disabled) return;
            document.querySelectorAll('[data-provider="' + p + '"]').forEach(function (btn) {
                btn.style.display = 'none';
            });
            document.querySelectorAll('[data-provider-note="' + p + '"]').forEach(function (note) {
                note.style.display = '';
            });
        });
    }

    function setupSubmitButton() {
        var btn = document.getElementById('submit-module-btn');
        if (btn) {
            btn.addEventListener('click', openSubmitModal);
        }
    }

    function setupModalEvents() {
        var modal = document.getElementById('submit-module-modal');
        var closeBtn = document.getElementById('close-submit-modal');
        var logoutBtn = document.getElementById('github-logout-btn');
        var anotherBtn = document.getElementById('submit-another-btn');
        var retryBtn = document.getElementById('submit-retry-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
            });
        }

        document.querySelectorAll('[data-provider]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var provider = this.getAttribute('data-provider');
                // 提交弹窗发起的登录固定回跳 market，回调后自动重开弹窗（auth.js 处理）
                AuthManager.startOAuthLogin(provider, 'market');
            });
        });

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                AuthManager.logout();
                showLoginState();
            });
        }
        if (anotherBtn) {
            anotherBtn.addEventListener('click', function () {
                document.getElementById('submit-module-form').reset();
                pendingMinSdk = '';
                showFormState();
            });
        }
        if (retryBtn) {
            retryBtn.addEventListener('click', function () {
                showFormState();
            });
        }

        // 常用标签建议：点击追加到输入框（标签本身不限制输入内容）
        var suggestions = document.getElementById('submit-tag-suggestions');
        if (suggestions) {
            suggestions.addEventListener('click', function (e) {
                var chip = e.target.closest('[data-suggest-tag]');
                if (chip) appendSuggestedTag(chip.getAttribute('data-suggest-tag'));
            });
        }
    }

    function setupFormSubmission() {
        var form = document.getElementById('submit-module-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    /**
     * 分类下拉：后端只存编号，选项文字按当前语言渲染
     * （带 data-i18n，切换语言时由 applyTranslations 就地更新）
     */
    function renderCategoryOptions() {
        var select = document.getElementById('submit-category');
        if (!select) return;

        var current = select.value;
        var options = ['<option value="" disabled data-i18n="submit.categoryPlaceholder">' +
            escapeHtml(I18n.t('submit.categoryPlaceholder')) + '</option>'];

        CONFIG.MODULE_CATEGORIES.forEach(function (item) {
            var key = 'category.' + item.key;
            options.push('<option value="' + item.id + '" data-i18n="' + key + '">' +
                escapeHtml(I18n.t(key)) + '</option>');
        });

        select.innerHTML = options.join('');
        select.value = current || '';
    }

    /**
     * 最低 SDK 版本下拉：候选是 PyPI 上 SDK 的实时版本（不预设版本表）
     * 编辑既有模块时原值可能不在列表里（如带 >= 约束或已被撤下的版本），
     * 单独补一个选项保留，避免保存时静默改掉用户原来填的值
     */
    function renderMinSdkOptions() {
        var select = document.getElementById('submit-min-sdk');
        if (!select) return;

        var versions = getCachedSdkVersions();
        // 编辑时由 pendingMinSdk 指定目标值，其余情况沿用用户当前选择
        var desired = pendingMinSdk !== null ? pendingMinSdk : select.value;
        var options = ['<option value="" data-i18n="submit.minSdkVersionAny">' +
            escapeHtml(I18n.t('submit.minSdkVersionAny')) + '</option>'];

        versions.forEach(function (version) {
            options.push('<option value="' + escapeHtml(version) + '">' + escapeHtml(version) + '</option>');
        });

        if (desired && versions.indexOf(desired) === -1) {
            options.push('<option value="' + escapeHtml(desired) + '">' + escapeHtml(desired) + '</option>');
        }

        select.innerHTML = options.join('');
        select.value = desired || '';
        pendingMinSdk = null;
    }

    /**
     * 先用已缓存的版本渲染，取到 PyPI 实时版本后再补全选项
     */
    async function loadMinSdkOptions() {
        renderMinSdkOptions();
        await fetchSdkVersions();
        renderMinSdkOptions();
    }

    /**
     * 常用标签建议：取自索引里已有的标签，点击追加到输入框
     * 仅作建议，不限制用户自行填写任何标签（中英文均可）
     */
    function renderTagSuggestions() {
        var box = document.getElementById('submit-tag-suggestions');
        if (!box) return;

        var counter = new Map();
        (state.allModules || []).concat(state.allAdapters || []).forEach(function (pkg) {
            (pkg.tags || []).forEach(function (tag) {
                counter.set(tag, (counter.get(tag) || 0) + 1);
            });
        });

        var tags = Array.from(counter.entries())
            .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); })
            .slice(0, 12)
            .map(function (entry) { return entry[0]; });

        box.innerHTML = tags.length === 0 ? '' : '<span class="form-tag-suggestions-label">' +
            escapeHtml(I18n.t('submit.tagsCommon')) + '</span>' +
            tags.map(function (tag) {
                return '<button type="button" class="filter-tag" data-suggest-tag="' + escapeHtml(tag) + '">' +
                    escapeHtml(tag) + '</button>';
            }).join('');
    }

    function appendSuggestedTag(tag) {
        var input = document.getElementById('submit-tags');
        if (!input || !tag) return;

        var current = input.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (current.indexOf(tag) !== -1) return;

        current.push(tag);
        input.value = current.join(', ');
    }

    function openSubmitModal(initialTab) {
        var modal = document.getElementById('submit-module-modal');
        if (!modal) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (AuthManager.isLoggedIn()) {
            showFormState();
            // 从导航栏账户菜单等入口打开时可指定初始页签（如 my-modules）
            if (initialTab && initialTab !== 'submit') {
                var tabBtn = document.querySelector('.submit-tab[data-tab="' + initialTab + '"]');
                if (tabBtn) tabBtn.click();
            }
        } else {
            showLoginState();
        }
    }

    function closeModal() {
        var modal = document.getElementById('submit-module-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function showLoginState() {
        document.getElementById('submit-login-state').style.display = '';
        document.getElementById('submit-form-state').style.display = 'none';
        document.getElementById('submit-success-state').style.display = 'none';
        document.getElementById('submit-error-state').style.display = 'none';
    }

    function showFormState() {
        document.getElementById('submit-login-state').style.display = 'none';
        document.getElementById('submit-form-state').style.display = '';
        document.getElementById('submit-success-state').style.display = 'none';
        document.getElementById('submit-error-state').style.display = 'none';

        I18n.applyTranslations();
        renderCategoryOptions();
        renderTagSuggestions();
        // 最低 SDK 版本选项来自 PyPI 实时版本：先渲染已知值，取到后再补全
        loadMinSdkOptions();

        var auth = AuthManager.getAuthState();
        if (auth && auth.user) {
            var avatarEl = document.getElementById('submit-user-avatar');
            avatarEl.src = auth.user.avatar_url || '';
            avatarEl.setAttribute('referrerpolicy', 'no-referrer');
            document.getElementById('submit-user-name').textContent = auth.user.name || auth.user.login;
            document.getElementById('submit-author').value = auth.user.name || auth.user.login;
        }
    }

    function showSuccessState() {
        document.getElementById('submit-login-state').style.display = 'none';
        document.getElementById('submit-form-state').style.display = 'none';
        document.getElementById('submit-success-state').style.display = '';
        document.getElementById('submit-error-state').style.display = 'none';
    }

    function showErrorState(message) {
        document.getElementById('submit-login-state').style.display = 'none';
        document.getElementById('submit-form-state').style.display = 'none';
        document.getElementById('submit-success-state').style.display = 'none';
        document.getElementById('submit-error-state').style.display = '';
        document.getElementById('submit-error-message').textContent = message;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        var auth = AuthManager.getAuthState();
        var submitBtn = document.getElementById('submit-confirm-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>' + I18n.t('submit.validating') + '</span>';

        var formData = {
            type: document.getElementById('submit-type').value,
            name: document.getElementById('submit-name').value.trim(),
            package: document.getElementById('submit-package').value.trim(),
            description: document.getElementById('submit-description').value.trim(),
            author: document.getElementById('submit-author').value.trim(),
            repository: document.getElementById('submit-repository').value.trim(),
            min_sdk_version: document.getElementById('submit-min-sdk').value.trim(),
            // 分类：受控字段（编号）；未选择时由表单必填校验拦下
            category: Number(document.getElementById('submit-category').value) || 0,
            // 标签：自由文本，前端不做任何内容限制
            tags: document.getElementById('submit-tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
            access_token: auth ? auth.accessToken : '',
            oauth_provider: auth ? auth.provider || '' : ''
        };

        if (formData.description.length < 10) {
            showErrorState(I18n.t('submit.descTooShort'));
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + I18n.t('submit.submitBtn') + '</span>';
            return;
        }

        if (editingModule) {
            formData.name = editingModule.name;
        } else {
            var existingPkgs = state.allModules;
            var existingAdps = state.allAdapters;
            var allExisting = existingPkgs.concat(existingAdps);
            var duplicate = allExisting.find(function (p) {
                return p.name.toLowerCase() === formData.name.toLowerCase() ||
                    p.package.toLowerCase() === formData.package.toLowerCase();
            });
            if (duplicate) {
                showErrorState(I18n.t('submit.alreadyExists', { name: duplicate.name }));
                submitBtn.disabled = false;
                submitBtn.innerHTML = editingModule
                    ? '<i class="fas fa-save"></i> <span>' + I18n.t('manage.saveEdit') + '</span>'
                    : '<i class="fas fa-paper-plane"></i> <span>' + I18n.t('submit.submitBtn') + '</span>';
                return;
            }
        }

        try {
            var pypiCheckResp = await fetch(CONFIG.API.checkPyPI + '?package=' + encodeURIComponent(formData.package));
            var pypiData = await pypiCheckResp.json();
            if (!pypiData.exists) {
                showErrorState(I18n.t('submit.pypiNotFound', { package: formData.package }));
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + I18n.t('submit.submitBtn') + '</span>';
                return;
            }
        } catch (e) {
            console.warn('PyPI pre-check failed, proceeding anyway:', e);
        }

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>' + I18n.t('submit.submitting') + '</span>';

        try {
            var response;
            if (editingModule) {
                response = await fetch(CONFIG.API.manageModule, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'edit',
                        name: editingModule.name,
                        type: editingModule.type,
                        access_token: auth.accessToken,
                        provider: auth.provider,
                        edit_data: {
                            package: formData.package,
                            description: formData.description,
                            author: formData.author,
                            repository: formData.repository,
                            min_sdk_version: formData.min_sdk_version,
                            category: formData.category,
                            tags: formData.tags,
                        }
                    })
                });
            } else {
                response = await fetch(CONFIG.API.submitModule, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            var data = await response.json();

            if (!response.ok) {
                if (data.code === 'RATE_LIMITED') {
                    throw new Error(data.error);
                }
                throw new Error(data.error || data.message || I18n.t('submit.unknownError'));
            }

            showSuccessState();
        } catch (error) {
            console.error('Submit failed:', error);
            showErrorState(error.message);
        } finally {
            submitBtn.disabled = false;
            clearEditState();
        }
    }

    function setupTabs() {
        var tabs = document.querySelectorAll('.submit-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var target = tab.getAttribute('data-tab');
                document.querySelectorAll('.submit-tab-content').forEach(function (c) { c.style.display = 'none'; });
                var panel = document.getElementById('tab-' + target);
                if (panel) panel.style.display = '';
                if (target === 'my-modules') {
                    loadMyModules();
                } else if (target === 'submit') {
                    clearEditState();
                }
            });
        });
    }

    async function loadMyModules() {
        var auth = AuthManager.getAuthState();
        if (!auth || !auth.accessToken) return;
        var container = document.getElementById('my-modules-list');
        container.innerHTML = '<div class="my-modules-loading"><i class="fas fa-spinner fa-spin"></i> <span>' + I18n.t('manage.loading') + '</span></div>';

        try {
            var response = await fetch(CONFIG.API.myModules, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: auth.accessToken, provider: auth.provider })
            });
            var data = await response.json();
            if (data.error) throw new Error(data.error);

            if (!data.modules || data.modules.length === 0) {
                container.innerHTML = '<div class="my-modules-empty"><i class="fas fa-box-open"></i><p>' + I18n.t('manage.empty') + '</p><p class="my-modules-hint">' + I18n.t('manage.cacheHint') + '</p></div>';
                return;
            }

            container.innerHTML = '';
            data.modules.forEach(function (mod) {
                var item = document.createElement('div');
                item.className = 'my-module-item';
                var statusBadge = mod.verified
                    ? '<span class="my-module-badge badge-verified">' + I18n.t('manage.statusVerified') + '</span>'
                    : '<span class="my-module-badge badge-pending">' + I18n.t('manage.statusPending') + '</span>';

                var modJson = encodeURIComponent(JSON.stringify(mod));
                item.innerHTML = '<div class="my-module-info">' +
                    '<div class="my-module-name">' + mod.name + ' ' + statusBadge + '</div>' +
                    '<div class="my-module-desc">' + (mod.description || '') + '</div>' +
                    '<div class="my-module-meta">' + mod.type + ' · ' + (mod.package || '') + '</div>' +
                    '</div>' +
                    '<div class="my-module-actions">' +
                    '<button class="btn btn-outline btn-sm btn-edit" data-action="edit" data-mod="' + modJson + '">' + I18n.t('manage.edit') + '</button>' +
                    '<button class="btn btn-outline btn-sm btn-danger" data-action="delete" data-name="' + mod.name + '" data-type="' + mod.type + '">' + I18n.t('manage.delete') + '</button>' +
                    '</div>';
                container.appendChild(item);
            });

            container.querySelectorAll('[data-action]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var action = btn.getAttribute('data-action');
                    if (action === 'edit') {
                        var mod = JSON.parse(decodeURIComponent(btn.getAttribute('data-mod')));
                        startEditModule(mod);
                    } else {
                        handleManageAction(action, btn.getAttribute('data-name'), btn.getAttribute('data-type'));
                    }
                });
            });
        } catch (e) {
            container.innerHTML = '<div class="my-modules-error"><p>' + (e.message || I18n.t('manage.loadFailed')) + '</p></div>';
        }
    }

    var editingModule = null;

    function startEditModule(mod) {
        editingModule = mod;
        document.querySelectorAll('.submit-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelector('.submit-tab[data-tab="submit"]').classList.add('active');
        document.querySelectorAll('.submit-tab-content').forEach(function (c) { c.style.display = 'none'; });
        document.getElementById('tab-submit').style.display = '';

        document.getElementById('submit-type').value = mod.type;
        document.getElementById('submit-name').value = mod.name;
        document.getElementById('submit-name').readOnly = true;
        document.getElementById('submit-package').value = mod.package || '';
        document.getElementById('submit-description').value = mod.description || '';
        document.getElementById('submit-author').value = mod.author || '';
        document.getElementById('submit-repository').value = mod.repository || '';
        // 最低 SDK 版本：下拉选项来自 PyPI 实时版本，先记录待选中值再渲染
        pendingMinSdk = mod.min_sdk_version || '';
        loadMinSdkOptions();
        document.getElementById('submit-category').value = mod.category ? String(mod.category) : '';
        document.getElementById('submit-tags').value = (mod.tags || []).join(',');

        var submitBtn = document.getElementById('submit-confirm-btn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> <span>' + I18n.t('manage.saveEdit') + '</span>';
    }

    function clearEditState() {
        editingModule = null;
        var nameInput = document.getElementById('submit-name');
        if (nameInput) nameInput.readOnly = false;
        var submitBtn = document.getElementById('submit-confirm-btn');
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + I18n.t('submit.submitBtn') + '</span>';
    }

    async function handleManageAction(action, name, type) {
        var auth = AuthManager.getAuthState();
        if (!auth || !auth.accessToken) return;
        var confirmMsg = I18n.t('manage.confirm' + action.charAt(0).toUpperCase() + action.slice(1), { name: name });
        if (!confirm(confirmMsg)) return;

        try {
            var response = await fetch(CONFIG.API.manageModule, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    name: name,
                    type: type,
                    access_token: auth.accessToken,
                    provider: auth.provider
                })
            });
            var data = await response.json();
            if (data.error) throw new Error(data.error);

            showMessage(I18n.t('manage.success' + action.charAt(0).toUpperCase() + action.slice(1), { name: name }), 'success');
            loadMyModules();
        } catch (e) {
            showMessage(e.message || I18n.t('manage.failed'), 'error');
        }
    }

    return {
        init: init,
        openSubmitModal: openSubmitModal
    };
})();
