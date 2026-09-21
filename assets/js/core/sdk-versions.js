






import { CONFIG } from '../config.js';

 
const CACHE_TTL = 10 * 60 * 1000;

 
const VERSION_RE = /^\d+(?:\.\d+)+(?:[-+._]?[0-9A-Za-z][0-9A-Za-z.\-]*)?$/;

let cached = null;     
let pending = null;    





export function getCachedSdkVersions() {
    return cached ? cached.versions : [];
}






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
