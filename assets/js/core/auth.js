

















import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';
import { showMessage } from './notify.js';

export const AuthManager = (function () {
    const STORAGE_KEY = 'erispulse-oauth-auth';
    let authState = null;

     

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

        var authUrl = new URL(providerConfig.authUrl);
        authUrl.searchParams.set('client_id', providerConfig.clientId);
        var redirectUri = providerConfig.redirectUri || (window.location.origin + '/');
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', providerConfig.scope);
         
        var state = 'erispulse-submit:' + provider + ':' + (returnView || currentReturnView());
         
         
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
                 
                expiresAt: Date.now() + 7 * 24 * 3600 * 1000
            };

            await fetchUserInfo();
            saveAuthState();
            document.dispatchEvent(new CustomEvent('erispulse-auth-changed'));

            if (returnView === 'market') {
                 
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
