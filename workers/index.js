// ES Module Worker 入口：dashboard 部署时全部变量/绑定经 env 传入，
// 合并进 globalThis 使既有 globalThis.X 引用零改动继续工作

export default {
    async fetch(request, env) {
        try {
            if (env && typeof env === 'object') {
                for (const key of Object.keys(env)) {
                    try { if (globalThis[key] === undefined) globalThis[key] = env[key]; } catch (e) { /* 只读属性跳过 */ }
                }
            }
            return await handleRequest(request);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Worker error', message: e && e.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    },
};

const ALLOWED_ORIGIN = 'https://www.erisdev.com';
const SUBMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_SUBMISSIONS = 3;

// ── 输入校验常量 ──
const INJECTION_RE = /[\x00-\x1f<>`\\]/;                         // 阻止注入/HTML：控制字符、尖括号、反引号、反斜杠（描述/作者允许 | & 引号等正常文本）
const SAFE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;               // 安全标识符：字母/数字开头 + 字母/数字/下划线/点/短横（模块/包名）
// 标签：自由文本（不限词表），这里只挡结构性非法输入 ——
// Unicode 字母（含中文）/数字开头，可含字母/数字/下划线/点/短横/空格，单个 ≤50 字符
const TAG_RE = /^[\p{L}\p{N}][\p{L}\p{N}_.\- ]{0,49}$/u;
const TAG_MAX_COUNT = 20;                                          // 标签数量上限（卡片折叠展示，索引也不该被单条目塞满）
const REPO_URL_RE = /^https:\/\/(github\.com|codeberg\.org)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;  // 仓库 URL
// ErisPulse 版本规则：x.x.x（正式版）或 x.x.x-dev.N / -alpha.N（开发/预发布版）
const VERSION_RE = /^\d+\.\d+\.\d+(?:-(?:[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*))?$/;
// 最低 SDK 版本：可选约束符（>=、<=、==、!=、>、<）+ 合法版本（含开发版）
// 预发布段既可能是 `-dev.3`（仓库内写法），也可能是 PyPI 规范化后的 `.dev3`
// （提交表单直接选 PyPI 上的版本），两种都接受
const SDK_CONSTRAINT_RE = /^(?:[><=!]{1,2})?\s*\d+\.\d+\.\d+(?:[-+._]?[0-9A-Za-z][0-9A-Za-z.\-]*)?$/;

// ── 校验辅助函数 ──
// 标签是自由文本：不校验词表，只挡结构性非法输入与数量
function validateTags(tags) {
    if (tags.length > TAG_MAX_COUNT) {
        return `Too many tags. Maximum is ${TAG_MAX_COUNT}.`;
    }
    for (const tag of tags) {
        if (!TAG_RE.test(tag)) {
            return `Invalid tag: "${tag}". Tags start with a letter or number and may contain letters (incl. Chinese), numbers, spaces, hyphens, underscores, and dots (max 50 chars).`;
        }
    }
    return null;
}

// 界面语言：BCP-47 风格代码（zh / zh-TW / pt-BR），小写归一，最多 12 个
const LANG_CODE_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;
const I18N_MAX = 12;

function validateI18n(langs) {
    if (langs === undefined || langs === null || langs === '') return [];
    if (typeof langs === 'string') {
        try { langs = JSON.parse(langs); } catch (e) {
            return { error: 'Invalid i18n payload.' };
        }
    }
    if (!Array.isArray(langs)) {
        return { error: 'Invalid i18n payload.' };
    }
    const out = [];
    for (const lang of langs) {
        if (typeof lang !== 'string') continue;
        const code = lang.trim().replace(/\s+/g, '-');
        if (!code) continue;
        if (!LANG_CODE_RE.test(code)) {
            return { error: `Invalid language code: "${lang}". Expected BCP-47 style like zh, zh-TW or pt-BR.` };
        }
        const lowered = code.toLowerCase();
        if (!out.includes(lowered)) out.push(lowered);
    }
    if (out.length > I18N_MAX) {
        return { error: `Too many languages. Maximum is ${I18N_MAX}.` };
    }
    return out;
}

function validateVersion(version) {
    if (version && !VERSION_RE.test(version)) {
        return 'Invalid version format. Expected x.x.x (release) or x.x.x-dev.N / -alpha.N (pre-release).';
    }
    return null;
}

function validateMinSdk(minSdk) {
    if (minSdk && !SDK_CONSTRAINT_RE.test(minSdk)) {
        return 'Invalid min_sdk_version format. Expected a version like 2.7.0 or 2.7.0-dev.3, optionally with a constraint like >=2.7.0.';
    }
    return null;
}

// 模块分类：受控字段（编号），与自由标签相反 —— 编号是前后端契约，
// 前端按当前语言渲染展示名（i18n 的 category.<key>），增删分类需同步
// packages_lib.py 的 CATEGORY_TAXONOMY 与 assets/js/config.js 的 MODULE_CATEGORIES
const CATEGORY_IDS = [1, 2, 3, 4, 5, 6, 7];

function validateCategory(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || !CATEGORY_IDS.includes(id)) {
        return `Invalid category: "${value}". Expected one of ${CATEGORY_IDS.join(', ')}.`;
    }
    return null;
}

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

// PyPI 上实际发布的版本串可能带预发布段（如 2.7.0.dev3 / 2.7.0-rc.1 / 2.7.0rc1），
// 这里比 VERSION_RE 宽松，只挡住明显不是版本号的键
const PYPI_VERSION_RE = /^\d+(?:\.\d+)+(?:[-+._]?[0-9A-Za-z][0-9A-Za-z.\-]*)?$/;

// 版本列表：市场筛选与提交表单要的是「PyPI 上现在有哪些 SDK 版本」，
// 直接读 releases，不落 KV —— 边缘缓存 10 分钟足够"实时"，也扛得住刷
async function fetchPypiVersions(packageName) {
    try {
        const response = await fetch(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`, {
            headers: { 'User-Agent': 'ErisPulse-Worker' },
            cf: { cacheEverything: true, cacheTtl: 600 },
        });
        if (!response.ok) {
            return { exists: false, package: packageName, latest: null, versions: [] };
        }
        const data = await response.json();
        const info = data.info || {};
        return {
            exists: true,
            package: info.name || packageName,
            latest: info.version || null,
            versions: Object.keys(data.releases || {}).filter(v => PYPI_VERSION_RE.test(v)),
        };
    } catch (e) {
        return { exists: false, package: packageName, latest: null, versions: [] };
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

    if (path === '/api/pypi-versions' && request.method === 'GET') {
        const pkg = url.searchParams.get('package');
        if (!pkg || !SAFE_NAME_RE.test(pkg)) {
            return jsonResponse({ error: 'Missing or invalid package parameter' }, 400);
        }
        const result = await fetchPypiVersions(pkg);
        return jsonResponse(result, 200, { 'Cache-Control': 'public, max-age=600' });
    }

    if (path === '/api/submit-module' && request.method === 'POST') {
        return handleSubmitModule(request);
    }

    if (path === '/api/avatar' && request.method === 'GET') {
        const avatarUrl = url.searchParams.get('url');
        if (!avatarUrl) {
            return jsonResponse({ error: 'Missing url parameter' }, 400);
        }
        // 域名白名单：仅代理已知头像源（开放代理会被滥用于 SSRF）
        const AVATAR_HOST_RE = /^https:\/\/([a-z0-9-]+\.)*(githubusercontent\.com|github\.com|codeberg\.org|jwznb\.com|jwzhd\.com|gravatar\.com|erisdev\.com)\//i;
        if (!AVATAR_HOST_RE.test(avatarUrl)) {
            return jsonResponse({ error: 'Avatar host not allowed' }, 403);
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

    // ── 社区（GitHub Discussions，旧镜像）──
    if (path === '/api/stats' && request.method === 'GET') {
        return handleSiteStats();
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
    } else if (/\.(md|markdown)$/i.test(path)) {
        // GitHub 风格文档深链（如 /api-reference/event-system.md#章节）→ 文档静态页
        // （SEO 静态化产物，由 build-docs 工作流生成）；浏览器会保留 fragment。
        // 旧式 /?md= 链接仍由前端 app.js 归一化为 #docs/... 兜底。
        response = Response.redirect(ALLOWED_ORIGIN + '/docs/' + path.replace(/^\/+/, '').replace(/\.(md|markdown)$/i, '') + '.html', 302);
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

        const requiredFields = ['type', 'name', 'package', 'description', 'author', 'repository', 'category'];
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
        const tagError = validateTags(tags);
        if (tagError) {
            return jsonResponse({ error: tagError }, 400);
        }

        const versionRaw = submission.version || '';
        const versionError = validateVersion(versionRaw);
        if (versionError) {
            return jsonResponse({ error: versionError }, 400);
        }

        const minSdk = submission.min_sdk_version || '';
        const minSdkError = validateMinSdk(minSdk);
        if (minSdkError) {
            return jsonResponse({ error: minSdkError }, 400);
        }

        // 分类：受控字段（编号），必填 —— 标签自由，但分类必须落在词表内，
        // 否则前端无法渲染本地化名称
        const categoryError = validateCategory(submission.category);
        if (categoryError) {
            return jsonResponse({ error: categoryError }, 400);
        }
        const category = Number(submission.category);

        const i18nResult = validateI18n(submission.i18n);
        if (i18nResult.error) {
            return jsonResponse({ error: i18nResult.error }, 400);
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
                    tags: JSON.stringify(tags),
                    submitter: JSON.stringify({ name: verifiedUser.name, uid: verifiedUser.uid, provider: verifiedUser.provider }),
                    // GitHub dispatch 限制 client_payload 最多 10 个属性：
                    // 结构化字段（min_sdk_version/category/i18n）统一打包进 data
                    // （JSON 字符串），ModuleRepo 的 handle_submission.py 负责解包还原
                    data: JSON.stringify({
                        min_sdk_version: minSdk,
                        category: category,
                        i18n: i18nResult,
                    }),
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
                        category: info.category || 0,
                        tags: info.tags || [],
                        i18n: info.i18n || [],
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
            const tagError = validateTags(editTags);
            if (tagError) {
                return jsonResponse({ error: tagError }, 400);
            }

            // 界面语言：undefined = 不改动；提供则校验（非法代码直接拒绝）
            let editI18n;
            if (editData.i18n !== undefined && editData.i18n !== null && editData.i18n !== '') {
                const i18nResult = validateI18n(editData.i18n);
                if (i18nResult.error) {
                    return jsonResponse({ error: i18nResult.error }, 400);
                }
                editI18n = i18nResult;
            }

            const editVersion = editData.version || '';
            const versionError = validateVersion(editVersion);
            if (versionError) {
                return jsonResponse({ error: versionError }, 400);
            }

            const editMinSdk = editData.min_sdk_version || '';
            const minSdkError = validateMinSdk(editMinSdk);
            if (minSdkError) {
                return jsonResponse({ error: minSdkError }, 400);
            }

            // 分类：可选（缺省表示不改动），一旦提供必须是词表内的编号
            let editCategory = null;
            if (editData.category !== undefined && editData.category !== null && editData.category !== '') {
                const categoryError = validateCategory(editData.category);
                if (categoryError) {
                    return jsonResponse({ error: categoryError }, 400);
                }
                editCategory = Number(editData.category);
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
                        // 标签未提交时不写进 edit_data：仓库侧据此判定「不改动」，
                        // 避免旧版前端因缺字段而把已有标签清空
                        ...(editData.tags === undefined ? {} : { tags: JSON.stringify(editTags) }),
                        ...(editI18n === undefined ? {} : { i18n: JSON.stringify(editI18n) }),
                        category: editCategory,
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

// ════════════════ 社区（GitHub Discussions）════════════════
// 数据源：ErisPulse/ErisPulse 仓库的 Discussions。
// 读接口匿名 + 边缘缓存（各端点 TTL 内最多打一次 GitHub，远低于匿名 60 次/时限额）；
// 写接口（发讨论/回帖）服务端 verifyUser 后用用户自己的 token 转发，不落盘、不缓存。

const DISCUSSIONS_REPO = 'ErisPulse/ErisPulse';
const GH_API = 'https://api.github.com';

// 社区发帖限流：按 uid 的每日配额（与模块提交的 checkRateLimit 分开，互不挤占）

function ghApiHeaders(accessToken) {
    const h = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ErisPulse-Worker',
    };
    if (accessToken) h['Authorization'] = 'token ' + accessToken;
    return h;
}

/** GitHub GraphQL 请求（写操作与分类读取必须走 GraphQL——组织讨论的 REST 写接口 404） */
async function ghGraphQL(query, variables, accessToken) {
    const token = accessToken || (typeof GITHUB_ACTIONS_TOKEN !== 'undefined' ? GITHUB_ACTIONS_TOKEN : '');
    const resp = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'User-Agent': 'ErisPulse-Worker',
        },
        body: JSON.stringify({ query: query, variables: variables }),
    });
    const json = await resp.json();
    if (json.errors && json.errors.length) {
        throw new Error(json.errors.map(function (e) { return e.message; }).join('; '));
    }
    return json.data;
}

/* 官方 6 分类兜底（GraphQL 不可用时， boards 仍能渲染全部分类） */
const FALLBACK_CATEGORIES = [
    { name: 'Announcements', slug: 'announcements', emoji: ':mega:' },
    { name: 'General', slug: 'general', emoji: ':speech_balloon:' },
    { name: 'Ideas', slug: 'ideas', emoji: ':bulb:' },
    { name: 'Polls', slug: 'polls', emoji: ':ballot_box:' },
    { name: 'Q&A', slug: 'q-a', emoji: ':pray:' },
    { name: 'Show and tell', slug: 'show-and-tell', emoji: ':raised_hands:' },
];

function trimUser(u) {
    if (!u) return null;
    return { login: u.login, avatar_url: u.avatar_url, html_url: u.html_url };
}

function trimCategory(c) {
    if (!c) return null;
    return { id: c.id, name: c.name, slug: c.slug, emoji: c.emoji, description: c.description };
}

function trimDiscussion(d) {
    if (!d || typeof d !== 'object') return null;
    return {
        number: d.number,
        title: d.title,
        excerpt: typeof d.body === 'string' ? d.body.slice(0, 280) : '',
        author: trimUser(d.user),
        category: trimCategory(d.category),
        comments: d.comments,
        created_at: d.created_at,
        updated_at: d.updated_at,
        html_url: d.html_url,
        state: d.state,
        locked: d.locked,
    };
}

function trimComment(c, depth) {
    if (!c || typeof c !== 'object') return null;
    const t = {
        id: c.id,
        body: typeof c.body === 'string' ? c.body.slice(0, 20000) : '',
        author: trimUser(c.user),
        created_at: c.created_at,
        updated_at: c.updated_at,
        html_url: c.html_url,
        replies: [],
    };
    if (!depth && Array.isArray(c.replies)) {
        t.replies = c.replies.map(function (r) { return trimComment(r, 1); }).filter(Boolean);
    }
    return t;
}

// Link 头解析：per_page=1 时 rel="last" 的页码即集合总数
function parseLastPage(linkHeader) {
    const m = (linkHeader || '').match(/[?&]page=(\d+)>;\s*rel="last"/);
    return m ? parseInt(m[1], 10) : null;
}

// 前端错误码约定：
//   AUTH_FAILED      → token 失效，前端引导重新登录
//   PERMISSION_DENIED → token 有效但无 Discussions 写权限（GitHub App 未加权限/需重新授权）
//   GITHUB_ONLY      → 只有 GitHub 账号能发帖
//   RATE_LIMITED     → 触发每日配额
// 首页 Hero 数据条：stars / 贡献者数 / 最新版本 / 讨论总数，一次取齐，边缘缓存 1 小时
async function handleSiteStats() {
    try {
        const headers = ghApiHeaders();
        const cfOpts = { cacheEverything: true, cacheTtl: 3600 };
        const results = await Promise.all([
            fetch(`${GH_API}/repos/${DISCUSSIONS_REPO}`, { headers: headers, cf: cfOpts }),
            fetch(`${GH_API}/repos/${DISCUSSIONS_REPO}/contributors?per_page=1`, { headers: headers, cf: cfOpts }),
            fetch(`${GH_API}/repos/${DISCUSSIONS_REPO}/releases/latest`, { headers: headers, cf: cfOpts }),
        ]);
        const repoResp = results[0];
        const contribResp = results[1];
        const releaseResp = results[2];
        const discResp = results[3];

        const stats = { stars: null, contributors: null, latest_release: null, discussions: null };

        if (repoResp.ok) {
            const repo = await repoResp.json();
            stats.stars = repo.stargazers_count;
            stats.forks = repo.forks_count;
        }
        if (contribResp.ok) {
            stats.contributors = parseLastPage(contribResp.headers.get('Link'));
            if (!stats.contributors) {
                const arr = await contribResp.json();
                stats.contributors = Array.isArray(arr) ? arr.length : null;
            }
        }
        if (releaseResp.ok) {
            const release = await releaseResp.json();
            stats.latest_release = release.tag_name || null;
        }
        return jsonResponse({ stats: stats, generated_at: new Date().toISOString() }, 200, { 'Cache-Control': 'public, max-age=600' });
    } catch (error) {
        return jsonResponse({ error: 'Stats fetch failed', message: error.message }, 500);
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
