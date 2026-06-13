/**
 * 提交模块管理器
 * OAuth 登录（GitHub / Codeberg / 云湖）、模块提交 / 编辑 / 删除、我的模块列表。
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { showMessage } from '../core/notify.js';
import { state } from '../core/state.js';

export const SubmitModuleManager = (function () {
    const STORAGE_KEY = 'erispulse-oauth-auth';
    let authState = null;

    function init() {
        loadAuthState();
        setupOAuthCallback();
        setupSubmitButton();
        setupModalEvents();
        setupFormSubmission();
        setupTabs();
    }

    function loadAuthState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                authState = JSON.parse(saved);
                if (authState.expiresAt && Date.now() > authState.expiresAt) {
                    logout();
                }
            }
        } catch (e) {
            authState = null;
        }
    }

    function saveAuthState() {
        if (authState) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function setupOAuthCallback() {
        var url = new URL(window.location.href);
        var code = url.searchParams.get('code');
        var stateParam = url.searchParams.get('state');

        if (code && stateParam && stateParam.indexOf('erispulse-submit') === 0) {
            var provider = stateParam.split(':')[1] || 'github';

            url.searchParams.delete('code');
            url.searchParams.delete('state');
            url.hash = '#market';
            window.history.replaceState({}, '', url.toString());

            exchangeCodeForToken(code, provider);
        }
    }

    async function exchangeCodeForToken(code, provider) {
        try {
            var response = await fetch(CONFIG.API.oauthToken, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: provider, code: code })
            });

            var data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            authState = {
                accessToken: data.access_token,
                provider: provider,
                user: null,
                expiresAt: Date.now() + 3600000
            };

            await fetchUserInfo();
            saveAuthState();
            openSubmitModal();
        } catch (error) {
            console.error('OAuth failed:', error);
            showMessage(I18n.t('submit.loginFailed'), 'error');
        }
    }

    async function fetchUserInfo() {
        if (!authState || !authState.accessToken) return;

        var provider = authState.provider || 'github';
        var providerConfig = CONFIG.OAUTH_PROVIDERS[provider];
        if (!providerConfig) return;

        try {
            var response = await fetch(CONFIG.API.userInfo, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: provider, access_token: authState.accessToken })
            });

            if (response.ok) {
                var rawData = await response.json();
                authState.user = providerConfig.parseUser(rawData);
            }
        } catch (e) {
            console.error('Failed to fetch user info:', e);
        }
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
                startOAuthLogin(provider);
            });
        });

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                logout();
                showLoginState();
            });
        }
        if (anotherBtn) {
            anotherBtn.addEventListener('click', function () {
                showFormState();
                document.getElementById('submit-module-form').reset();
            });
        }
        if (retryBtn) {
            retryBtn.addEventListener('click', function () {
                showFormState();
            });
        }
    }

    function setupFormSubmission() {
        var form = document.getElementById('submit-module-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    }

    function startOAuthLogin(provider) {
        var providerConfig = CONFIG.OAUTH_PROVIDERS[provider];
        if (!providerConfig || !providerConfig.clientId) {
            showMessage(I18n.t('submit.oauthNotConfigured'), 'error');
            return;
        }

        var authUrl = new URL(providerConfig.authUrl);
        authUrl.searchParams.set('client_id', providerConfig.clientId);
        var redirectUri = providerConfig.redirectUri || (window.location.origin + '/');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', providerConfig.scope);
        authUrl.searchParams.set('state', 'erispulse-submit:' + provider);
        if (provider === 'yunhu' || provider === 'codeberg') {
            authUrl.searchParams.set('response_type', 'code');
        }
        window.location.href = authUrl.toString();
    }

    function openSubmitModal() {
        var modal = document.getElementById('submit-module-modal');
        if (!modal) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (authState && authState.accessToken && authState.user) {
            showFormState();
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

        if (authState && authState.user) {
            var avatarEl = document.getElementById('submit-user-avatar');
            avatarEl.src = authState.user.avatar_url || '';
            avatarEl.setAttribute('referrerpolicy', 'no-referrer');
            document.getElementById('submit-user-name').textContent = authState.user.name || authState.user.login;
            document.getElementById('submit-author').value = authState.user.name || authState.user.login;
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

    function logout() {
        authState = null;
        localStorage.removeItem(STORAGE_KEY);
    }

    async function handleSubmit(e) {
        e.preventDefault();

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
            tags: document.getElementById('submit-tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
            access_token: authState ? authState.accessToken : '',
            oauth_provider: authState ? authState.provider || '' : ''
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
                        access_token: authState.accessToken,
                        provider: authState.provider,
                        edit_data: {
                            package: formData.package,
                            description: formData.description,
                            author: formData.author,
                            repository: formData.repository,
                            min_sdk_version: formData.min_sdk_version,
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
        if (!authState || !authState.accessToken) return;
        var container = document.getElementById('my-modules-list');
        container.innerHTML = '<div class="my-modules-loading"><i class="fas fa-spinner fa-spin"></i> <span>' + I18n.t('manage.loading') + '</span></div>';

        try {
            var response = await fetch(CONFIG.API.myModules, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: authState.accessToken, provider: authState.provider })
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
        document.getElementById('submit-min-sdk').value = mod.min_sdk_version || '';
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
        if (!authState || !authState.accessToken) return;
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
                    access_token: authState.accessToken,
                    provider: authState.provider
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

    function isLoggedIn() {
        return !!(authState && authState.accessToken && authState.user);
    }

    return {
        init: init,
        openSubmitModal: openSubmitModal,
        isLoggedIn: isLoggedIn,
        getUserName: function () { return authState && authState.user ? authState.user.login : null; }
    };
})();
