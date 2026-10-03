/**
 * 全局统一账户（OAuth 登录）
 *
 * 站内唯一的登录态管理模块：token 生命周期、OAuth 回调处理、登录/登出、
 * 登录态变化事件。登录入口不在导航栏——只在用户主动需要时出现：
 * 提交模块弹窗、社区发帖/回帖弹窗、设置页账户卡片。
 *
 * 消费方：
 *  - modules/submit.js    提交 / 管理 模块（GitHub / Codeberg / 云湖）
 *  - modules/community.js 社区发帖 / 回帖（仅 GitHub， Discussions 写权限）
 *  - modules/settings.js  设置页账户卡片
 *
 * 事件约定：
 *  - erispulse-auth-changed   登录态变化（登录成功 / 登出）后派发
 *  - erispulse-open-submit-modal 请求打开提交模块弹窗（detail.tab 可选 'my-modules'），
 *    由 submit.js 监听——auth.js 不反向依赖业务模块，避免循环引用
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { showMessage } from './notify.js';

export const AuthManager = (function () {
    const STORAGE_KEY = 'erispulse-oauth-auth';
    let authState = null;

    // ==================== 登录态存取 ====================

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

    function isLoggedIn() {
        return !!(authState && authState.accessToken && authState.user);
    }

    function getAuthState() {
        return authState;
    }

    function getUserName() {
        return authState && authState.user ? authState.user.login : null;
    }

    function logout() {
        authState = null;
        localStorage.removeItem(STORAGE_KEY);
        document.dispatchEvent(new CustomEvent('erispulse-auth-changed'));
    }

    // ==================== OAuth 流程 ====================

    /**
     * 当前所在的视图，用作 OAuth 回跳目标（state 第三段）。
     * 云湖的 redirect_uri 固定指向 #market（Worker/配置侧决定），不受此影响。
     */
    function currentReturnView() {
        var hash = window.location.hash.replace(/^#/, '');
        if (!hash) return 'market';
        var view = hash.split('/')[0];
        var known = ['home', 'market', 'docs', 'settings', 'about', 'community'];
        return known.indexOf(view) !== -1 ? view : 'market';
    }

    function startOAuthLogin(provider, returnView) {
        var providerConfig = CONFIG.OAUTH_PROVIDERS[provider];
        if (!providerConfig || !providerConfig.clientId) {
            showMessage(I18n.t('submit.oauthNotConfigured'), 'error');
            return;
        }
        // 软屏蔽：disabled 的 provider 不放行登录（入口已隐藏，此处兜底）
        if (providerConfig.disabled) {
            showMessage(I18n.t('account.yunhuDisabled'), 'error');
            return;
        }

        var authUrl = new URL(providerConfig.authUrl);
        authUrl.searchParams.set('client_id', providerConfig.clientId);
        var redirectUri = providerConfig.redirectUri || (window.location.origin + '/');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', providerConfig.scope);
        // state 第三段携带回跳视图，回调后据此恢复 hash
        var state = 'erispulse-submit:' + provider + ':' + (returnView || currentReturnView());
        // 云湖要求 state 长度 32-128（旧格式一直不达标导致登录报错）；
        // 补随机尾巴凑长——回调按 ':' 切片只取前三段，尾巴不影响解析，顺带强化 CSRF
        while (state.length < 32) state += ':0' + Math.random().toString(36).slice(2, 3);
        authUrl.searchParams.set('state', state);
        if (provider === 'yunhu' || provider === 'codeberg') {
            authUrl.searchParams.set('response_type', 'code');
        }
        window.location.href = authUrl.toString();
    }

    function setupOAuthCallback() {
        var url = new URL(window.location.href);
        var code = url.searchParams.get('code');
        var stateParam = url.searchParams.get('state');

        if (code && stateParam && stateParam.indexOf('erispulse-submit') === 0) {
            // state 格式：erispulse-submit:<provider>[:<回跳视图>]
            var parts = stateParam.split(':');
            var provider = parts[1] || 'github';
            var returnView = parts[2] || 'market';

            url.searchParams.delete('code');
            url.searchParams.delete('state');
            url.hash = '#' + returnView;
            window.history.replaceState({}, '', url.toString());

            exchangeCodeForToken(code, provider, returnView);
        }
    }

    async function exchangeCodeForToken(code, provider, returnView) {
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
                // 7 天：社区互动等场景需要跨会话保持登录，1 小时体验太差
                expiresAt: Date.now() + 7 * 24 * 3600 * 1000
            };

            await fetchUserInfo();
            saveAuthState();
            document.dispatchEvent(new CustomEvent('erispulse-auth-changed'));

            if (returnView === 'market') {
                // 提交模块入口发起的登录：回到提交弹窗（原有行为）
                document.dispatchEvent(new CustomEvent('erispulse-open-submit-modal'));
            } else {
                showMessage(I18n.t('submit.loginSuccess'), 'success');
            }
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

    // ==================== 初始化 ====================

    function init() {
        loadAuthState();
        setupOAuthCallback();
    }

    return {
        init: init,
        isLoggedIn: isLoggedIn,
        getAuthState: getAuthState,
        getUserName: getUserName,
        logout: logout,
        startOAuthLogin: startOAuthLogin,
    };
})();
