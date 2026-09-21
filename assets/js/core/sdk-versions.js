/**
 * SDK（ErisPulse）版本列表
 * 模块市场的「我的 SDK 版本」筛选与提交表单的「最低 SDK 版本」共用同一份数据：
 * 版本取自 PyPI 上该包的实时发布记录（不预设版本表），优先走 Worker 代理，
 * 代理不可用时直连 PyPI 的 JSON API（允许跨域）。
 */

import { CONFIG } from '../config.js';

// 缓存 10 分钟：足够"实时"，又不会每次打开页面都打接口
const CACHE_TTL = 10 * 60 * 1000;

// 宽松版本号：接受 PyPI 上可能出现的预发布写法（2.7.0.dev3 / 2.7.0-rc.1 / 2.7.0rc1 / 2.7.0）
const VERSION_RE = /^\d+(?:\.\d+)+(?:[-+._]?[0-9A-Za-z][0-9A-Za-z.\-]*)?$/;

let cached = null;    // { fetchedAt, versions }
let pending = null;   // 进行中的请求，避免并发重复拉取

/**
 * 已缓存的版本列表（降序）；尚未加载时返回空数组，调用方可据此先渲染回退选项
 * @returns {string[]}
 */
export function getCachedSdkVersions() {
    return cached ? cached.versions : [];
}

/**
 * 获取 PyPI 上的 SDK 版本列表（降序，最新在前）
 * @param {boolean} [force] 忽略缓存强制重新拉取
 * @returns {Promise<string[]>} 全部途径都失败时返回空数组，由调用方回退
 */
export async function fetchSdkVersions(force) {
    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.versions;
    }
    if (pending) return pending;

    pending = requestVersions()
        .then(versions => {
            if (versions.length > 0) {
                cached = { fetchedAt: Date.now(), versions };
            }
            return versions;
        })
        .catch(() => getCachedSdkVersions())
        .finally(() => { pending = null; });

    return pending;
}

async function requestVersions() {
    const viaWorker = await requestFromWorker();
    if (viaWorker.length > 0) return sortSdkVersions(viaWorker);

    return sortSdkVersions(await requestFromPyPI());
}

async function requestFromWorker() {
    try {
        const resp = await fetch(`${CONFIG.API.pypiVersions}?package=${encodeURIComponent(CONFIG.SDK_PACKAGE)}`);
        if (!resp.ok) return [];
        const data = await resp.json();
        return Array.isArray(data.versions) ? data.versions : [];
    } catch (e) {
        return [];
    }
}

async function requestFromPyPI() {
    try {
        const resp = await fetch(`https://pypi.org/pypi/${encodeURIComponent(CONFIG.SDK_PACKAGE)}/json`);
        if (!resp.ok) return [];
        const data = await resp.json();
        return Object.keys(data.releases || {});
    } catch (e) {
        return [];
    }
}

/**
 * 过滤非法版本号、去重并降序排列：同主体时正式版（2.7.0）排在预发布版（2.7.0.dev3）之前
 * @param {string[]} list 原始版本串
 * @returns {string[]}
 */
export function sortSdkVersions(list) {
    const seen = new Set();
    (list || []).forEach(item => {
        const value = String(item || '').trim();
        if (VERSION_RE.test(value)) seen.add(value);
    });

    return [...seen].sort((a, b) => {
        const byNumber = compareNumbers(parseNumbers(b), parseNumbers(a));
        if (byNumber !== 0) return byNumber;

        const prereleaseA = isPrerelease(a);
        const prereleaseB = isPrerelease(b);
        if (prereleaseA !== prereleaseB) return prereleaseA ? 1 : -1;

        return b.localeCompare(a);
    });
}

/** 取版本的数字主体作为比较键，`2.7.0-dev.3` 视为 [2, 7, 0] */
function parseNumbers(value) {
    const match = String(value).match(/^\d+(?:\.\d+)*/);
    return match ? match[0].split('.').map(Number) : [];
}

function compareNumbers(a, b) {
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
        const left = a[i] || 0;
        const right = b[i] || 0;
        if (left !== right) return left < right ? -1 : 1;
    }
    return 0;
}

function isPrerelease(value) {
    return /[a-zA-Z]/.test(value);
}
