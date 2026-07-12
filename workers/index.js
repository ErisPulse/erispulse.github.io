addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const ALLOWED_ORIGIN = 'https://www.erisdev.com';
const SUBMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_SUBMISSIONS = 3;

// ── 输入校验常量 ──
const INJECTION_RE = /[\x00-\x1f"'\\`$&;|<>]/;                 // 阻止注入：控制字符、引号、反斜杠、反引号、dollar、管道等
const SAFE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;               // 安全标识符：字母/数字开头 + 字母/数字/下划线/点/短横
const REPO_URL_RE = /^https:\/\/(github\.com|codeberg\.org)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;  // 仓库 URL
const SEMVER_RE = /^\d+\.\d+\.\d+$/;                              // 语义化版本
const SDK_CONSTRAINT_RE = /^[><=!]+\s*\d+\.\d+\.\d+$/;          // SDK 版本约束（如 >=2.0.0）

function corsHeaders(methods = 'GET, POST, OPTIONS') {
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...corsHeaders(),
        ...extraHeaders,
    };
    return new Response(JSON.stringify(data), { status, headers });
}

async function getRateLimitKV() {
    try {
        if (typeof SUBMISSIONS_KV !== 'undefined') {
            return SUBMISSIONS_KV;
        }
    } catch (e) {}
    return null;
}

async function checkRateLimit(submittedBy) {
    if (!submittedBy) return { allowed: true, count: 0 };

    const kv = await getRateLimitKV();
    if (!kv) {
        const cache = caches.default;
        try {
            const cached = await cache.match(new Request(`rate-limit:${submittedBy}`));
            if (cached) {
                const data = await cached.json();
                const now = Date.now();
                data.submissions = data.submissions.filter(t => now - t < SUBMIT_COOLDOWN_MS);
                if (data.submissions.length >= MAX_DAILY_SUBMISSIONS) {
                    return { allowed: false, count: data.submissions.length };
                }
                return { allowed: true, count: data.submissions.length };
            }
        } catch (e) {}
        return { allowed: true, count: 0 };
    }

    const key = `submissions:${new Date().toISOString().split('T')[0]}:${submittedBy}`;
    try {
        const current = await kv.get(key);
        const count = current ? parseInt(current, 10) : 0;
        if (count >= MAX_DAILY_SUBMISSIONS) {
            return { allowed: false, count: count };
        }
        return { allowed: true, count: count };
    } catch (e) {
        return { allowed: true, count: 0 };
    }
}

async function recordSubmission(submittedBy) {
    if (!submittedBy) return;

    const kv = await getRateLimitKV();
    if (!kv) {
        try {
            const cache = caches.default;
            const cacheKey = new Request(`rate-limit:${submittedBy}`);
            let data = { submissions: [] };
            const cached = await cache.match(cacheKey);
            if (cached) {
                data = await cached.json();
            }
            const now = Date.now();
            data.submissions = data.submissions.filter(t => now - t < SUBMIT_COOLDOWN_MS);
            data.submissions.push(now);
            const response = new Response(JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Ttl': String(SUBMIT_COOLDOWN_MS / 1000),
                },
            });
            await cache.put(cacheKey, response);
        } catch (e) {}
        return;
    }

    const key = `submissions:${new Date().toISOString().split('T')[0]}:${submittedBy}`;
    try {
        const current = await kv.get(key);
        const count = current ? parseInt(current, 10) : 0;
        await kv.put(key, String(count + 1), { expirationTtl: 86400 });
    } catch (e) {}
}

async function checkPyPI(packageName) {
    try {
        const response = await fetch(`https://pypi.org/pypi/${packageName}/json`, {
            headers: { 'User-Agent': 'ErisPulse-Worker' },
            cf: { cacheEverything: true, cacheTtl: 3600 },
        });
        if (response.ok) {
            const data = await response.json();
            return { exists: true, version: data.info.version || '0.0.0' };
        }
        return { exists: false, version: null };
    } catch (e) {
        return { exists: false, version: null };
    }
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '/');

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (path === '/') {
        return Response.redirect('https://www.erisdev.com', 301);
    }

    if (path === '/api/oauth-token' && request.method === 'POST') {
        return handleOAuthToken(request);
    }

    if (path === '/api/userinfo' && request.method === 'POST') {
        return handleUserInfo(request);
    }

    if (path === '/api/check-pypi' && request.method === 'GET') {
        const pkg = url.searchParams.get('package');
        if (!pkg) {
            return jsonResponse({ error: 'Missing package parameter' }, 400);
        }
        const result = await checkPyPI(pkg);
        return jsonResponse(result);
    }

    if (path === '/api/submit-module' && request.method === 'POST') {
        return handleSubmitModule(request);
    }

    if (path === '/api/avatar' && request.method === 'GET') {
        const avatarUrl = url.searchParams.get('url');
        if (!avatarUrl) {
            return jsonResponse({ error: 'Missing url parameter' }, 400);
        }
        try {
            const avatarResponse = await fetch(avatarUrl, {
                headers: {
                    'User-Agent': 'ErisPulse-Worker',
                    'Referer': 'http://myapp.jwznb.com',
                }
            });
            const contentType = avatarResponse.headers.get('Content-Type') || 'image/png';
            const body = avatarResponse.body;
            return new Response(body, {
                status: avatarResponse.status,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                    ...corsHeaders(),
                },
            });
        } catch (e) {
            return jsonResponse({ error: 'Failed to fetch avatar' }, 500);
        }
    }

    if (path === '/api/my-modules' && request.method === 'POST') {
        return handleMyModules(request);
    }

    if (path === '/api/manage-module' && request.method === 'POST') {
        return handleManageModule(request);
    }

    let response;

    if (path === '/packages.json' || path === '/packages' || path === '/packages.json/') {
        response = await fetch('https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/2x/packages.json', {
            cf: { cacheEverything: true, cacheTtl: 14400 }
        });
    } else if (path === '/map.json' || path === '/map' || path === '/map.json/') {
        response = await fetch('https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/1x/map.json', {
            cf: { cacheEverything: true, cacheTtl: 14400 }
        });
    } else if (path.startsWith('/archived/modules/')) {
        const modulePath = path.replace('/archived/modules', '');
        response = await fetch(`https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/1x/archived/modules${modulePath}`, {
            cf: { cacheEverything: true, cacheTtl: 14400 }
        });
    } else if (path.startsWith('/purge-cache/')) {
        const password = path.split('/')[2];
        if (password === globalThis.PURGE_PASSWORD) {
            response = await purgeCache();
        } else {
            response = new Response(JSON.stringify({ error: 'Unauthorized', message: 'Invalid password' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
    } else {
        response = new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' }
        });
    }

    if (path.endsWith('.json') || path === '/packages' || path === '/map' || path.startsWith('/purge-cache/')) {
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Content-Type', 'application/json');
        response = new Response(response.body, { status: response.status, headers: newHeaders });
    }

    return response;
}

const OAUTH_PROVIDERS = {
    github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
        tokenMethod: 'POST',
        tokenContentType: 'application/json',
        tokenAccept: 'application/json',
        userInfoUrl: 'https://api.github.com/user',
        envClientId: 'GITHUB_CLIENT_ID',
        envClientSecret: 'GITHUB_CLIENT_SECRET',
    },
    codeberg: {
        tokenUrl: 'https://codeberg.org/login/oauth/access_token',
        tokenMethod: 'POST',
        tokenContentType: 'application/json',
        tokenAccept: 'application/json',
        userInfoUrl: 'https://codeberg.org/api/v1/user',
        envClientId: 'CODEBERG_CLIENT_ID',
        envClientSecret: 'CODEBERG_CLIENT_SECRET',
    },
    yunhu: {
        tokenUrl: 'https://oauth2.jwzhd.com/oauth/token',
        tokenMethod: 'POST',
        tokenContentType: 'application/x-www-form-urlencoded',
        tokenAccept: 'application/json',
        userInfoUrl: 'https://oauth2.jwzhd.com/api/userinfo',
        envClientId: 'YUNHU_CLIENT_ID',
        envClientSecret: 'YUNHU_CLIENT_SECRET',
        redirectUri: 'https://www.erisdev.com/#market',
    },
};

async function handleOAuthToken(request) {
    try {
        const { provider, code } = await request.json();
        if (!code) {
            return jsonResponse({ error: 'Missing code parameter' }, 400);
        }

        const providerKey = (provider || 'github').toLowerCase();
        const config = OAUTH_PROVIDERS[providerKey];
        if (!config) {
            return jsonResponse({ error: `Unknown OAuth provider: ${providerKey}` }, 400);
        }

        const clientId = typeof globalThis[config.envClientId] !== 'undefined' ? globalThis[config.envClientId] : '';
        const clientSecret = typeof globalThis[config.envClientSecret] !== 'undefined' ? globalThis[config.envClientSecret] : '';

        if (!clientId || !clientSecret) {
            return jsonResponse({ error: `${providerKey} OAuth not configured` }, 500);
        }

        let tokenBody;
        const redirectUri = config.redirectUri || 'https://www.erisdev.com/';
        if (config.tokenContentType === 'application/x-www-form-urlencoded') {
            tokenBody = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
            }).toString();
        } else {
            tokenBody = JSON.stringify({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri,
            });
        }

        const tokenResponse = await fetch(config.tokenUrl, {
            method: config.tokenMethod,
            headers: {
                'Content-Type': config.tokenContentType,
                'Accept': config.tokenAccept,
            },
            body: tokenBody,
        });

        let tokenData;
        const respText = await tokenResponse.text();
        try {
            tokenData = JSON.parse(respText);
        } catch (e) {
            tokenData = Object.fromEntries(new URLSearchParams(respText));
        }

        if (tokenData.error) {
            return jsonResponse({ error: tokenData.error_description || tokenData.error }, 400);
        }

        return jsonResponse({
            access_token: tokenData.access_token,
            provider: providerKey,
        });
    } catch (error) {
        return jsonResponse({ error: 'Token exchange failed', message: error.message }, 500);
    }
}

async function verifyUser(provider, accessToken) {
    const providerKey = (provider || '').toLowerCase();
    const config = OAUTH_PROVIDERS[providerKey];
    if (!config || !config.userInfoUrl || !accessToken) {
        return null;
    }

    const headers = { 'Accept': 'application/json', 'User-Agent': 'ErisPulse-Worker' };
    if (providerKey === 'yunhu') {
        headers['Authorization'] = 'Bearer ' + accessToken;
    } else {
        headers['Authorization'] = 'token ' + accessToken;
    }

    try {
        const resp = await fetch(config.userInfoUrl, { headers });
        if (!resp.ok) return null;
        const data = await resp.json();

        let uid, login, name, avatar_url;
        if (providerKey === 'github') {
            uid = 'github:' + data.id;
            login = data.login;
            name = data.name || data.login;
            avatar_url = data.avatar_url;
        } else if (providerKey === 'codeberg') {
            uid = 'codeberg:' + data.id;
            login = data.login;
            name = data.full_name || data.login;
            avatar_url = data.avatar_url;
        } else if (providerKey === 'yunhu') {
            uid = 'yunhu:' + data.user_id;
            login = data.nickname || String(data.user_id);
            name = data.nickname || String(data.user_id);
            avatar_url = data.avatar_url || '';
        } else {
            return null;
        }

        return { uid, login, name, avatar_url, provider: providerKey };
    } catch (e) {
        return null;
    }
}

async function handleUserInfo(request) {
    try {
        const { provider, access_token } = await request.json();
        if (!access_token || !provider) {
            return jsonResponse({ error: 'Missing provider or access_token' }, 400);
        }

        const providerKey = provider.toLowerCase();
        const config = OAUTH_PROVIDERS[providerKey];
        if (!config || !config.userInfoUrl) {
            return jsonResponse({ error: `Unknown provider: ${providerKey}` }, 400);
        }

        const headers = { 'Accept': 'application/json', 'User-Agent': 'ErisPulse-Worker' };
        if (providerKey === 'yunhu') {
            headers['Authorization'] = 'Bearer ' + access_token;
        } else {
            headers['Authorization'] = 'token ' + access_token;
        }

        const userInfoResponse = await fetch(config.userInfoUrl, { headers });
        if (!userInfoResponse.ok) {
            return jsonResponse({ error: 'Failed to fetch user info' }, userInfoResponse.status);
        }

        const data = await userInfoResponse.json();
        return jsonResponse(data);
    } catch (error) {
        return jsonResponse({ error: 'User info fetch failed', message: error.message }, 500);
    }
}

async function handleSubmitModule(request) {
    try {
        const submission = await request.json();

        const requiredFields = ['type', 'name', 'package', 'description', 'author', 'repository'];
        for (const field of requiredFields) {
            if (!submission[field]) {
                return jsonResponse({ error: `Missing required field: ${field}` }, 400);
            }
        }

        const verifiedUser = await verifyUser(submission.oauth_provider, submission.access_token);
        if (!verifiedUser) {
            return jsonResponse({ error: 'Authentication required', code: 'AUTH_FAILED' }, 401);
        }

        const validTypes = ['module', 'adapter'];
        if (!validTypes.includes(submission.type)) {
            return jsonResponse({ error: `Invalid type: ${submission.type}` }, 400);
        }

        // ── 字段内容消毒 ──

        const name = submission.name.trim();
        if (!SAFE_NAME_RE.test(name) || name.length > 100) {
            return jsonResponse({ error: 'Invalid module name. Use only letters, numbers, hyphens, underscores, and dots.' }, 400);
        }

        const pkg = submission.package.trim();
        if (!SAFE_NAME_RE.test(pkg) || pkg.length > 200) {
            return jsonResponse({ error: 'Invalid package name. Use only letters, numbers, hyphens, underscores, and dots.' }, 400);
        }

        const description = submission.description.trim();
        if (description.length < 10 || description.length > 1000) {
            return jsonResponse({ error: 'Description must be between 10 and 1000 characters.' }, 400);
        }
        if (INJECTION_RE.test(description)) {
            return jsonResponse({ error: 'Description contains invalid characters.' }, 400);
        }

        const author = submission.author.trim();
        if (author.length > 100 || INJECTION_RE.test(author)) {
            return jsonResponse({ error: 'Author name contains invalid characters or is too long.' }, 400);
        }

        const tags = (submission.tags || [])
            .map(t => String(t).trim())
            .filter(Boolean);
        if (tags.length > 20) {
            return jsonResponse({ error: 'Too many tags. Maximum is 20.' }, 400);
        }
        for (const tag of tags) {
            if (!SAFE_NAME_RE.test(tag) || tag.length > 50) {
                return jsonResponse({ error: `Invalid tag: "${tag}". Use only letters, numbers, hyphens, underscores, and dots.` }, 400);
            }
        }

        const versionRaw = submission.version || '';
        if (versionRaw && !SEMVER_RE.test(versionRaw)) {
            return jsonResponse({ error: 'Invalid version format. Expected semver (e.g. 1.0.0).' }, 400);
        }

        const minSdk = submission.min_sdk_version || '';
        if (minSdk && !SDK_CONSTRAINT_RE.test(minSdk)) {
            return jsonResponse({ error: 'Invalid min_sdk_version format. Expected constraint like >=2.0.0.' }, 400);
        }

        if (!REPO_URL_RE.test(submission.repository)) {
            return jsonResponse({ error: 'Invalid repository URL. Only GitHub and Codeberg URLs are allowed.' }, 400);
        }

        const pypiResult = await checkPyPI(submission.package);
        if (!pypiResult.exists) {
            return jsonResponse({
                error: `Package '${submission.package}' not found on PyPI. Please publish your package to PyPI before submitting.`,
                code: 'PYPI_NOT_FOUND'
            }, 400);
        }

        const rateLimitResult = await checkRateLimit(verifiedUser.uid);
        if (!rateLimitResult.allowed) {
            return jsonResponse({
                error: `Rate limit exceeded. You have already submitted ${rateLimitResult.count} modules today. Maximum is ${MAX_DAILY_SUBMISSIONS} per day.`,
                code: 'RATE_LIMITED'
            }, 429);
        }

        const token = typeof GITHUB_ACTIONS_TOKEN !== 'undefined' ? GITHUB_ACTIONS_TOKEN : '';
        if (!token) {
            return jsonResponse({ error: 'GitHub Actions token not configured' }, 500);
        }

        const dispatchResponse = await fetch('https://api.github.com/repos/ErisPulse/ErisPulse-ModuleRepo/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'ErisPulse-Worker',
            },
            body: JSON.stringify({
                event_type: 'submit_module',
                client_payload: {
                    type: submission.type,
                    name: name,
                    package: pkg,
                    version: pypiResult.version || versionRaw || '0.0.0',
                    description: description,
                    author: author,
                    repository: submission.repository,
                    min_sdk_version: minSdk,
                    tags: JSON.stringify(tags),
                    submitter: JSON.stringify({ name: verifiedUser.name, uid: verifiedUser.uid, provider: verifiedUser.provider }),
                },
            }),
        });

        if (!dispatchResponse.ok) {
            const errorBody = await dispatchResponse.text();
            return jsonResponse({ error: 'Failed to trigger workflow', details: errorBody }, 502);
        }

        await recordSubmission(verifiedUser.uid);

        return jsonResponse({ success: true, message: 'Module submission received and processing' });
    } catch (error) {
        return jsonResponse({ error: 'Submission processing failed', message: error.message }, 500);
    }
}

async function handleMyModules(request) {
    try {
        const { access_token, provider } = await request.json();
        const verifiedUser = await verifyUser(provider, access_token);
        if (!verifiedUser) {
            return jsonResponse({ error: 'Authentication required' }, 401);
        }

        const pkgResponse = await fetch('https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/2x/packages.json', {
            cf: { cacheEverything: true, cacheTtl: 300 }
        });
        if (!pkgResponse.ok) {
            return jsonResponse({ error: 'Failed to fetch packages.json' }, 500);
        }

        const packages = await pkgResponse.json();
        const results = [];

        for (const cat of ['modules', 'adapters']) {
            const items = packages[cat] || {};
            for (const [name, info] of Object.entries(items)) {
                if (info.submitted_by_uid === verifiedUser.uid) {
                    results.push({
                        name,
                        type: cat === 'modules' ? 'module' : 'adapter',
                        package: info.package,
                        description: info.description,
                        author: info.author,
                        repository: info.repository || '',
                        verified: info.verified || false,
                        official: info.official || false,
                        min_sdk_version: info.min_sdk_version || '',
                        tags: info.tags || [],
                    });
                }
            }
        }

        return jsonResponse({ modules: results });
    } catch (error) {
        return jsonResponse({ error: 'Failed to fetch my modules', message: error.message }, 500);
    }
}

async function handleManageModule(request) {
    try {
        const body_data = await request.json();
        const { action, name, type, access_token, provider } = body_data;
        if (!action || !name || !type) {
            return jsonResponse({ error: 'Missing required parameters' }, 400);
        }

        const verifiedUser = await verifyUser(provider, access_token);
        if (!verifiedUser) {
            return jsonResponse({ error: 'Authentication required' }, 401);
        }

        const validActions = ['delete', 'edit'];
        if (!validActions.includes(action)) {
            return jsonResponse({ error: `Invalid action: ${action}` }, 400);
        }

        const token = typeof GITHUB_ACTIONS_TOKEN !== 'undefined' ? GITHUB_ACTIONS_TOKEN : '';
        if (!token) {
            return jsonResponse({ error: 'GitHub Actions token not configured' }, 500);
        }

        let payload;
        if (action === 'edit') {
            const editData = body_data.edit_data || {};

            // ── 编辑字段消毒 ──

            const editPkg = (editData.package || '').trim();
            if (editPkg && (!SAFE_NAME_RE.test(editPkg) || editPkg.length > 200)) {
                return jsonResponse({ error: 'Invalid package name in edit data.' }, 400);
            }

            const editDesc = (editData.description || '').trim();
            if (editDesc && (editDesc.length > 1000 || INJECTION_RE.test(editDesc))) {
                return jsonResponse({ error: 'Description contains invalid characters.' }, 400);
            }

            const editAuthor = (editData.author || '').trim();
            if (editAuthor && (editAuthor.length > 100 || INJECTION_RE.test(editAuthor))) {
                return jsonResponse({ error: 'Author name contains invalid characters or is too long.' }, 400);
            }

            const editTags = (editData.tags || [])
                .map(t => String(t).trim())
                .filter(Boolean);
            if (editTags.length > 20) {
                return jsonResponse({ error: 'Too many tags. Maximum is 20.' }, 400);
            }
            for (const tag of editTags) {
                if (!SAFE_NAME_RE.test(tag) || tag.length > 50) {
                    return jsonResponse({ error: `Invalid tag: "${tag}".` }, 400);
                }
            }

            const editVersion = editData.version || '';
            if (editVersion && !SEMVER_RE.test(editVersion)) {
                return jsonResponse({ error: 'Invalid version format. Expected semver (e.g. 1.0.0).' }, 400);
            }

            const editMinSdk = editData.min_sdk_version || '';
            if (editMinSdk && !SDK_CONSTRAINT_RE.test(editMinSdk)) {
                return jsonResponse({ error: 'Invalid min_sdk_version format.' }, 400);
            }

            if (editData.repository && !REPO_URL_RE.test(editData.repository)) {
                return jsonResponse({ error: 'Invalid repository URL in edit data.' }, 400);
            }

            const pypiResult = await checkPyPI(editPkg || '');
            payload = {
                event_type: 'manage_module',
                client_payload: {
                    action: 'edit',
                    name: name,
                    type: type,
                    uid: verifiedUser.uid,
                    edit_data: JSON.stringify({
                        package: editPkg,
                        description: editDesc,
                        author: editAuthor,
                        repository: editData.repository || '',
                        min_sdk_version: editMinSdk,
                        tags: JSON.stringify(editTags),
                        version: pypiResult.exists ? pypiResult.version : (editVersion || '0.0.0'),
                        submitter: JSON.stringify({ name: verifiedUser.name, uid: verifiedUser.uid, provider: verifiedUser.provider }),
                    }),
                },
            };
        } else {
            payload = {
                event_type: 'manage_module',
                client_payload: { action, name, type, uid: verifiedUser.uid },
            };
        }

        const dispatchResponse = await fetch('https://api.github.com/repos/ErisPulse/ErisPulse-ModuleRepo/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'ErisPulse-Worker',
            },
            body: JSON.stringify(payload),
        });

        if (!dispatchResponse.ok) {
            const errorBody = await dispatchResponse.text();
            return jsonResponse({ error: 'Failed to trigger workflow', details: errorBody }, 502);
        }

        return jsonResponse({ success: true, message: `Module ${action} request received` });
    } catch (error) {
        return jsonResponse({ error: 'Manage module failed', message: error.message }, 500);
    }
}

async function purgeCache() {
    try {
        const cache = caches.default;
        await cache.delete(new Request('https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/2x/packages.json'));
        await cache.delete(new Request('https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/1x/map.json'));
        return new Response(JSON.stringify({ success: true, message: 'Cache purged successfully' }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}
