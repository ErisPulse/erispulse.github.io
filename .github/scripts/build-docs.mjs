#!/usr/bin/env node
/**
 * SEO 静态化构建脚本（由 build-docs.yml 在 CI 中运行，产物经 erispulse[bot] 提交）
 *
 * 产物：
 *   1. docs/<path>.html        zh-CN 文档静态页（主语言，无语言前缀）
 *      docs/<lang>/<path>.html 其余语言文档静态页
 *      —— 主索引 81×5 + auto_api 130×5，单篇拉取失败自动跳过
 *   2. 入口页爬虫预填充：把 views/*.html 片段经 DOM 操作嵌入
 *      index/market/community/about 的空 slot（SPA 启动时 loadViews() 会整体
 *      替换 slot，互不冲突），并补全运行时数据（市场卡片/统计/社区卡/贡献者）
 *      —— 全程 DOM 操作，不碰正则切 HTML；可重复运行（幂等）
 *   3. sitemap.xml 重建（入口页 + 全部文档页）
 *
 * 数据源（构建时请求 ErisPulse，方案 B：单一真相源在 SDK 仓库）：
 *   - 文档索引/正文：ErisPulse/ErisPulse Develop/v2（gh-proxy 主源，raw+token 回退）
 *   - 模块：erisdev.com/packages.json（raw 回退）
 *   - 讨论/贡献者：GitHub API（token 可选）
 *   - 首页数据条：erisdev.com/api/stats
 *
 * 环境变量：
 *   GITHUB_TOKEN  GitHub API / raw 提额（Actions 内置，可选）
 *   LIMIT=N       只构建每语言前 N 篇（本地试跑用）
 */

import fs from 'node:fs';
import path from 'node:path';
import { DOMParser } from 'linkedom';
import { marked } from 'marked';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index.js';
import { enhanceGitHubMarkdown } from '../../assets/js/core/gh-markdown.js';

// ── 常量 ──
const ROOT = process.cwd();
const SITE = 'https://www.erisdev.com';
// 数据 API 走根域名（Cloudflare Worker），站点页面在 www（GitHub Pages）
const API_BASE = 'https://erisdev.com';
const UPSTREAM = 'ErisPulse/ErisPulse';
const BRANCH = 'Develop/v2';
const LANGS = ['zh-CN', 'en', 'zh-TW', 'ja', 'ru'];
const MAIN_LANG = 'zh-CN';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const LIMIT = parseInt(process.env.LIMIT || '', 10) || 0;
const CONCURRENCY = 6;

// GitHub REST 的 category.emoji 是 :short_code: 文本，转原生 emoji（与前端 community.js 对齐）
const CATEGORY_EMOJI = {
    mega: '📣', speech_balloon: '💬', bulb: '💡',
    ballot_box_with_check: '🗳️', ballot_box: '🗳️',
    question_answer: '🙏', raised_hands: '🙌', pray: '🙏',
};
function categoryEmoji(c) {
    if (!c || !c.emoji) return '';
    return CATEGORY_EMOJI[String(c.emoji).replace(/^:+|:+$/g, '')] || '';
}

loadLanguages(['python', 'toml', 'bash', 'json', 'javascript', 'yaml', 'ini', 'markdown']);

// linkedom 提供 DOMParser，gh-markdown.js 直接复用
globalThis.DOMParser = DOMParser;

// ── 基础工具 ──

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

async function fetchText(url, token) {
    const headers = { 'User-Agent': 'erispulse-site-build' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(url + ' → ' + resp.status);
    return resp.text();
}

/** 拉上游仓库文件：gh-proxy 与 raw（token 提额）互为回退 */
async function fetchUpstream(repoPath) {
    const targets = GITHUB_TOKEN
        ? [`https://raw.githubusercontent.com/${UPSTREAM}/${BRANCH}/${repoPath}`,
           `https://cdn.gh-proxy.org/https://raw.githubusercontent.com/${UPSTREAM}/${BRANCH}/${repoPath}`]
        : [`https://cdn.gh-proxy.org/https://raw.githubusercontent.com/${UPSTREAM}/${BRANCH}/${repoPath}`,
           `https://raw.githubusercontent.com/${UPSTREAM}/${BRANCH}/${repoPath}`];
    let lastErr;
    for (const url of targets) {
        try {
            return await fetchText(url);
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr;
}

async function pool(items, worker, size = CONCURRENCY) {
    const results = new Array(items.length);
    let cursor = 0;
    await Promise.all(Array.from({ length: size }, async () => {
        while (cursor < items.length) {
            const idx = cursor++;
            try {
                results[idx] = await worker(items[idx], idx);
            } catch (e) {
                results[idx] = { __error: e };
            }
        }
    }));
    return results;
}

// ── DOM 辅助（预填充全程 DOM 操作，杜绝正则切 HTML；可重复运行） ──

/** 解析 HTML 片段（views 片段无 html/body 包装也适用），返回包装元素。
 *  两个坑：views/home.html 带 BOM 要先剥；linkedom 对裸片段会把内容挂在
 *  documentElement 下而非 body（body 恒为空），所以包一层 div 再取。 */
function parseFragment(html) {
    const clean = html.replace(/^\uFEFF/, '').trim();
    const doc = new DOMParser().parseFromString('<div id="__ep_frag">' + clean + '</div>', 'text/html');
    return doc.querySelector('#__ep_frag');
}

/** 解析完整入口页，返回 { doc, bom } */
function parsePage(file) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    const bom = src.startsWith('\uFEFF') ? '\uFEFF' : '';
    const doc = new DOMParser().parseFromString(bom ? src.slice(1) : src, 'text/html');
    return { doc, bom };
}

/** 序列化完整文档（保留 BOM 与 doctype） */
function serializePage(doc, bom) {
    return bom + '<!doctype html>\n' + doc.documentElement.outerHTML + '\n';
}

// ── docs.js 渲染逻辑复刻（保持锚点与运行时一致） ──

/** GitHub 风格标题 slug：小写、去非字母数字、空白转 -，Unicode 保留 */
function githubSlug(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
        .replace(/\s+/g, '-');
}

function renderMarkdown(md) {
    let html = marked.parse(md);
    html = enhanceGitHubMarkdown(html);

    const doc = new DOMParser().parseFromString('<div id="__root">' + html + '</div>', 'text/html');
    const root = doc.querySelector('#__root');
    const used = new Set();
    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((header, index) => {
        const baseSlug = githubSlug(header.textContent) || 'section-' + index;
        let id = baseSlug;
        let counter = 2;
        while (used.has(id)) id = baseSlug + '-' + (counter++);
        used.add(id);
        header.id = id;
    });

    html = root.innerHTML
        .replace(/<table([^>]*)>/gi, '<div class="table-wrapper"><table$1>')
        .replace(/<\/table>/gi, '</table></div>');
    return html;
}

/** 代码块构建时 Prism 高亮（静态页无 JS） */
function highlightCode(html) {
    const doc = new DOMParser().parseFromString('<div id="__root">' + html + '</div>', 'text/html');
    doc.querySelectorAll('pre code[class*="language-"]').forEach((block) => {
        const m = /language-([\w-]+)/.exec(block.className);
        const lang = m && m[1];
        if (!lang || !Prism.languages[lang]) return;
        try {
            block.innerHTML = Prism.highlight(block.textContent || '', Prism.languages[lang], lang);
        } catch (e) { /* 高亮失败保持原文 */ }
    });
    return doc.querySelector('#__root').innerHTML;
}

function staticDocUrl(lang, docPath) {
    const prefix = lang === MAIN_LANG ? '/docs/' : '/docs/' + lang + '/';
    return prefix + docPath.replace(/\.md$/, '') + '.html';
}

/** 文档内相对 .md 链接 → 静态页 URL（外链/#锚点 不动） */
function rewriteDocLinks(html, lang, docPath) {
    const doc = new DOMParser().parseFromString('<div id="__root">' + html + '</div>', 'text/html');
    const baseDir = docPath.split('/').slice(0, -1);
    doc.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        if (!href || /^(https?:|#|mailto:)/i.test(href)) return;
        const [rel, hash] = href.split(/#|%23/);
        const parts = rel.replace(/^\.\//, '').split('/');
        const stack = [...baseDir];
        for (const part of parts) {
            if (part === '..') stack.pop();
            else if (part && part !== '.') stack.push(part);
        }
        const target = stack.join('/').replace(/\.md$/, '');
        if (!target) return;
        a.setAttribute('href', staticDocUrl(lang, target) + (hash ? '#' + hash : ''));
    });
    return doc.querySelector('#__root').innerHTML;
}

function extractDescription(html) {
    const doc = new DOMParser().parseFromString('<div id="__root">' + html + '</div>', 'text/html');
    for (const p of doc.querySelectorAll('p')) {
        const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length > 30) return text.length > 157 ? text.slice(0, 157) + '...' : text;
    }
    return '';
}

// ── 文档清单 ──

function collectDocs(mapping, categoryName) {
    const out = [];
    for (const [catName, cat] of Object.entries(mapping.categories || {})) {
        for (const doc of cat.documents || []) {
            out.push({ path: doc.path, title: doc.title, category: categoryName || catName, group: '' });
        }
        for (const group of Object.values(cat.subgroups || {})) {
            for (const doc of group.documents || []) {
                out.push({ path: doc.path, title: doc.title, category: categoryName || catName, group: group.name || '' });
            }
        }
    }
    return out;
}

async function loadDocInventory() {
    const inventory = {};
    for (const lang of LANGS) {
        const seen = new Set();
        const list = [];
        const mainMapping = JSON.parse(await fetchUpstream(`docs/_meta/${lang}/docs-mapping.json`));
        for (const item of collectDocs(mainMapping)) {
            if (!seen.has(item.path)) { seen.add(item.path); list.push(item); }
        }
        try {
            const autoMapping = JSON.parse(await fetchUpstream('docs/_meta/zh-CN/docs-auto-api-mapping.json'));
            for (const item of collectDocs(autoMapping, 'API')) {
                if (!seen.has(item.path)) { seen.add(item.path); list.push(item); }
            }
        } catch (e) {
            console.warn(`  [${lang}] auto_api 索引拉取失败，跳过 API 文档:`, e.message);
        }
        inventory[lang] = LIMIT ? list.slice(0, LIMIT) : list;
    }
    return inventory;
}

// ── 文档静态页模板 ──

function langLinks(lang, docPath) {
    const labels = { 'zh-CN': '简体中文', en: 'English', 'zh-TW': '繁體中文', ja: '日本語', ru: 'Русский' };
    const alts = [];
    const links = [];
    LANGS.forEach((l) => {
        const url = SITE + staticDocUrl(l, docPath);
        alts.push(`<link rel="alternate" hreflang="${l}" href="${url}" />`);
        links.push(`<a class="doc-lang-link${l === lang ? ' current' : ''}" href="${url}">${labels[l]}</a>`);
    });
    return { alts: alts.join('\n    '), links: links.join('\n') };
}

function docPageHtml({ lang, docPath, title, category, group, html, description, prev, next }) {
    const url = SITE + staticDocUrl(lang, docPath);
    const interactive = SITE + '/#docs/' + docPath;
    const crumbCategory = escapeHtml(category);
    const crumbGroup = group ? ' <span class="doc-crumb-sep">/</span> ' + escapeHtml(group) : '';

    const nav = `
    <nav class="doc-static-nav">
        <a class="doc-nav-brand" href="/"><strong>ErisPulse</strong></a>
        <div class="doc-nav-links">
            <a href="/">首页</a>
            <a href="/docs.html">文档中心</a>
            <a href="/market.html">模块市场</a>
            <a href="/community.html">社区</a>
            <a href="https://github.com/${UPSTREAM}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
    </nav>`;

    const breadcrumbs = `
    <nav class="doc-breadcrumbs" aria-label="Breadcrumb">
        <a href="/docs.html">${lang === MAIN_LANG ? '文档' : 'Docs'}</a>
        <span class="doc-crumb-sep">/</span> ${crumbCategory}${crumbGroup}
        <span class="doc-crumb-sep">/</span> <span>${escapeHtml(title)}</span>
    </nav>`;

    const pager = (prev || next) ? `
    <nav class="doc-pager">
        ${prev ? `<a class="doc-pager-prev" href="${staticDocUrl(lang, prev.path)}"><small>${lang === MAIN_LANG ? '上一篇' : 'Previous'}</small><br>${escapeHtml(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="doc-pager-next" href="${staticDocUrl(lang, next.path)}"><small>${lang === MAIN_LANG ? '下一篇' : 'Next'}</small><br>${escapeHtml(next.title)}</a>` : '<span></span>'}
    </nav>` : '';

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: title,
        description: description,
        url: url,
        inLanguage: lang,
        isPartOf: { '@type': 'WebSite', name: 'ErisPulse 文档中心', url: SITE + '/docs.html' },
    });

    return `<!doctype html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} - ErisPulse 文档中心</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${url}" />
    ${langLinks(lang, docPath).alts}
    <meta property="og:title" content="${escapeHtml(title)} - ErisPulse 文档中心" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${jsonLd}</script>
    <link rel="stylesheet" href="/assets/css/main.css" />
    <link rel="stylesheet" href="/assets/css/markdown.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />
    <style>
        .doc-static-nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem 1.5rem;border-bottom:1px solid var(--border);background:var(--card-bg)}
        .doc-nav-brand{color:var(--text);text-decoration:none;font-size:1.05rem}
        .doc-nav-links{display:flex;gap:1.2rem;flex-wrap:wrap}
        .doc-nav-links a{color:var(--text-secondary);text-decoration:none;font-size:.9rem}
        .doc-nav-links a:hover{color:var(--primary)}
        .doc-page{max-width:900px;margin:0 auto;padding:2rem 1.5rem 4rem}
        .doc-breadcrumbs{font-size:.82rem;color:var(--text-secondary);margin-bottom:1.6rem}
        .doc-breadcrumbs a{color:var(--primary);text-decoration:none}
        .doc-crumb-sep{margin:0 .4rem;opacity:.6}
        .doc-langs{display:flex;gap:.8rem;flex-wrap:wrap;margin:0 0 1.4rem;font-size:.82rem}
        .doc-lang-link{color:var(--text-secondary);text-decoration:none}
        .doc-lang-link.current{color:var(--primary);font-weight:600}
        .doc-interactive{margin:0 0 1.8rem;padding:.7rem 1rem;border:1px solid var(--border);border-radius:10px;background:var(--card-bg);font-size:.85rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:space-between;gap:.8rem;flex-wrap:wrap}
        .doc-interactive a{color:var(--primary);font-weight:600;text-decoration:none}
        .doc-pager{display:flex;justify-content:space-between;gap:1rem;margin-top:2.5rem}
        .doc-pager a{flex:1;padding:.8rem 1rem;border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text);font-size:.88rem;background:var(--card-bg)}
        .doc-pager a small{color:var(--text-secondary)}
        .doc-pager-next{text-align:right}
        @media (max-width:640px){.doc-nav-links a:nth-child(n+4){display:none}}
    </style>
</head>
<body>
    ${nav}
    <main class="doc-page">
        ${breadcrumbs}
        <div class="doc-langs">${langLinks(lang, docPath).links}</div>
        <div class="doc-interactive">
            <span>本文为静态镜像，内容以交互版为准</span>
            <a href="${interactive}">在交互式文档中心打开 →</a>
        </div>
        <article class="markdown-content" id="docs-content">
            ${html}
        </article>
        ${pager}
    </main>
    <footer style="text-align:center;padding:2rem 1rem;border-top:1px solid var(--border);color:var(--text-secondary);font-size:.85rem">
        © 2026 ErisPulse Project · <a href="https://github.com/${UPSTREAM}" target="_blank" rel="noopener noreferrer">GitHub</a>
    </footer>
</body>
</html>`;
}

// ── 文档全量静态化 ──

async function buildDocs() {
    const inventory = await loadDocInventory();
    const built = [];
    let skipped = 0;

    for (const lang of LANGS) {
        const list = inventory[lang];
        console.log(`[${lang}] 文档清单 ${list.length} 篇`);

        await pool(list, async (item, idx) => {
            try {
                const md = await fetchUpstream(`docs/${lang}/${item.path}`);
                let html = renderMarkdown(md);
                html = rewriteDocLinks(html, lang, item.path);
                html = highlightCode(html);

                const description = extractDescription(html) ||
                    (item.title || '').replace(/[`*]/g, '');
                const prev = idx > 0 ? list[idx - 1] : null;
                const next = idx < list.length - 1 ? list[idx + 1] : null;

                const out = path.join(ROOT, 'docs', lang === MAIN_LANG ? '' : lang,
                    item.path.replace(/\.md$/, '') + '.html');
                fs.mkdirSync(path.dirname(out), { recursive: true });
                fs.writeFileSync(out, docPageHtml({
                    lang,
                    docPath: item.path,
                    title: (item.title || '').replace(/[`*]/g, ''),
                    category: item.category,
                    group: item.group,
                    html,
                    description,
                    prev,
                    next,
                }));
                built.push(`${lang}/${item.path}`);
            } catch (e) {
                skipped++;
                console.warn(`  [${lang}] ${item.path} 失败:`, e.message);
            }
        });
    }

    console.log(`文档静态化完成：${built.length} 篇，跳过 ${skipped} 篇`);
    return built;
}

// ── 入口页预填充（DOM 操作，幂等：每次先清空 slot 再填） ──

function timeAgoCn(iso) {
    if (!iso) return '';
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + ' 分钟前';
    const h = Math.floor(min / 60);
    if (h < 24) return h + ' 小时前';
    const d = Math.floor(h / 24);
    if (d < 30) return d + ' 天前';
    return new Date(iso).toLocaleDateString('zh-CN');
}

/** 把 views 片段做 DOM 修改后填入入口页 slot */
function prefillSlot(pageFile, slotName, viewFile, mutate) {
    const { doc, bom } = parsePage(pageFile);
    const slot = doc.querySelector(`[data-fragment-slot="${slotName}"]`);
    if (!slot) throw new Error(`${pageFile} 缺少 slot: ${slotName}`);

    const viewDoc = parseFragment(fs.readFileSync(path.join(ROOT, 'views', viewFile), 'utf-8'));
    if (mutate) mutate(viewDoc);

    // innerHTML 赋值替换全部子节点（幂等），不做跨文档节点搬运
    slot.innerHTML = viewDoc.innerHTML;

    fs.writeFileSync(path.join(ROOT, pageFile), serializePage(doc, bom));
    console.log('OK 预填充', pageFile, `(slot: ${slotName})`);
}

async function prefillEntryPages() {
    let stats = {};
    try { stats = (await fetchText(API_BASE + '/api/stats').then(JSON.parse)).stats || {}; } catch (e) { console.warn('stats 拉取失败:', e.message); }

    let discussions = [];
    try {
        const list = JSON.parse(await fetchText('https://api.github.com/repos/' + UPSTREAM + '/discussions?per_page=8', GITHUB_TOKEN));
        discussions = (Array.isArray(list) ? list : []).map((d) => ({
            number: d.number,
            title: d.title,
            author: d.user ? { login: d.user.login } : null,
            category: d.category ? { name: d.category.name, emoji: d.category.emoji } : null,
            comments: d.comments,
            created_at: d.created_at,
            html_url: d.html_url,
        }));
    } catch (e) { console.warn('discussions 拉取失败:', e.message); }

    let packages = null;
    for (const url of [API_BASE + '/packages.json', 'https://raw.githubusercontent.com/ErisPulse/ErisPulse-ModuleRepo/2x/packages.json']) {
        try { packages = JSON.parse(await fetchText(url)); break; }
        catch (e) { console.warn('packages 拉取失败:', url, e.message); }
    }

    let contributors = [];
    try {
        contributors = JSON.parse(await fetchText('https://api.github.com/repos/' + UPSTREAM + '/contributors?per_page=12', GITHUB_TOKEN));
    } catch (e) { console.warn('contributors 拉取失败:', e.message); }

    // ── index：hero 数据条 + 社区速览 ──
    prefillSlot('index.html', 'home', 'home.html', (view) => {
        // 预填充是给爬虫/首屏的静态内容：根节点不能带 active（SPA 未接管时占屏）。
        // SPA 注入的 views/home.html 片段自带 active，运行时行为不受影响。
        const root = view.querySelector('#home-view');
        if (root) root.classList.remove('active');

        const map = {
            'stat-stars': stats.stars,
            'stat-contributors': stats.contributors,
            'stat-release': stats.latest_release,
            'stat-discussions': stats.discussions,
        };
        for (const [id, value] of Object.entries(map)) {
            const el = view.querySelector('#' + id);
            if (el) el.textContent = value == null ? '--' : String(value);
        }

        if (discussions.length) {
            const grid = view.querySelector('#home-community-grid');
            if (grid) {
                grid.innerHTML = discussions.slice(0, 3).map((d) => {
                    const c = d.category || {};
                    const emoji = categoryEmoji(c);
                    const meta = [d.author && d.author.login, timeAgoCn(d.created_at)].filter(Boolean).join(' · ');
                    return `<a class="home-community-card" href="${escapeHtml(d.html_url || '#community')}">
                        <div class="home-community-card-top">
                            ${c.name ? `<span class="home-community-chip">${escapeHtml((emoji || '') + ' ' + c.name).trim()}</span>` : ''}
                            <span class="home-community-card-comments"><i class="far fa-comment"></i> ${typeof d.comments === 'number' ? d.comments : 0}</span>
                        </div>
                        <span class="home-community-card-title">${escapeHtml(d.title || '')}</span>
                        <span class="home-community-card-meta">${escapeHtml(meta)}</span>
                    </a>`;
                }).join('\n');
            }
        }
    });

    // ── market：统计数字 + 模块卡片 ──
    if (packages) {
        prefillSlot('market.html', 'market', 'market.html', (view) => {
            const items = [];
            for (const [name, info] of Object.entries(packages.modules || {})) {
                if (info.hidden) continue;
                items.push({ ...info, name, type: 'module' });
            }
            for (const [name, info] of Object.entries(packages.adapters || {})) {
                if (info.hidden) continue;
                items.push({ ...info, name, type: 'adapter' });
            }
            items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

            const setStat = (id, v) => {
                const el = view.querySelector('#' + id);
                if (el) el.textContent = String(v);
            };
            setStat('total-all-modules', items.length);
            setStat('total-modules', items.filter((i) => i.type === 'module').length);
            setStat('adapter-count', items.filter((i) => i.type === 'adapter').length);

            const catMap = packages.categories || {};
            const catName = (id) => {
                const key = catMap[String(id)] || '';
                return ({ tool: '工具', fun: '娱乐', admin: '管理', notify: '通知', ai: 'AI', platform: '平台对接', analytics: '数据分析' })[key] || '';
            };
            const grid = view.querySelector('#modules-grid');
            if (grid) {
                grid.innerHTML = items.map((p) => `
                    <div class="module-card${p.featured ? ' is-featured' : ''}">
                        <div class="module-header">
                            <div class="module-icon"><i class="fas ${p.type === 'adapter' ? 'fa-plug' : 'fa-puzzle-piece'}"></i></div>
                            <div>
                                <h3 class="module-name">${escapeHtml(p.name)}</h3>
                                <div class="module-meta-row">
                                    <div class="module-version">v${escapeHtml(p.version || '')}</div>
                                    ${p.category ? `<span class="module-badge badge-category"><i class="fas fa-layer-group"></i> ${escapeHtml(catName(p.category))}</span>` : ''}
                                    ${p.official ? '<span class="module-badge badge-official"><i class="fas fa-check-circle"></i> 官方</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <p class="module-desc">${escapeHtml(p.description || '')}</p>
                        <div class="module-footer">
                            <div class="module-footer-info"><div class="module-author">${escapeHtml(p.author || '')}</div></div>
                        </div>
                    </div>`).join('\n');
            }
        });
    }

    // ── community：版块格子 + 讨论卡片 ──
    if (discussions.length) {
        prefillSlot('community.html', 'community', 'community.html', (view) => {
            const boards = view.querySelector('#community-boards');
            if (boards) {
                const seen = {};
                const cats = [];
                discussions.forEach((d) => {
                    const name = d.category && d.category.name;
                    if (name && !seen[name]) { seen[name] = true; cats.push({ c: d.category, count: 0 }); }
                });
                discussions.forEach((d) => {
                    const entry = cats.find((x) => x.c.name === (d.category && d.category.name));
                    if (entry) entry.count++;
                });
                boards.innerHTML = `<button class="community-board active"><span class="community-board-emoji">🏠</span><span class="community-board-name">全部</span><span class="community-board-count">${discussions.length}</span></button>\n` +
                    cats.map(({ c, count }) => `<button class="community-board"><span class="community-board-emoji">${escapeHtml(categoryEmoji(c))}</span><span class="community-board-name">${escapeHtml(c.name)}</span><span class="community-board-count">${count}</span></button>`).join('\n');
            }
            const list = view.querySelector('#community-list');
            if (list) {
                list.innerHTML = discussions.slice(0, 8).map((d) => {
                    const emoji = categoryEmoji(d.category);
                    return `
                    <article class="discussion-card">
                        <div class="discussion-card-top">
                            ${d.category ? `<span class="discussion-cat-chip">${escapeHtml(((emoji || '') + ' ' + (d.category.name || '')).trim())}</span>` : ''}
                            <span class="discussion-card-comments"><i class="far fa-comment"></i> ${d.comments || 0}</span>
                        </div>
                        <h3 class="discussion-card-title">${escapeHtml(d.title || '')}</h3>
                        <div class="discussion-card-meta">
                            <span class="discussion-author">${escapeHtml(d.author ? d.author.login : '')}</span>
                            <span class="discussion-dot">·</span>
                            <span class="discussion-time">${escapeHtml(timeAgoCn(d.created_at))}</span>
                        </div>
                    </article>`;
                }).join('\n');
            }
        });
    }

    // ── about：贡献者头像 ──
    prefillSlot('about.html', 'about', 'about.html', (view) => {
        const count = view.querySelector('#contributors-count');
        if (count) count.textContent = String(contributors.length);
        const grid = view.querySelector('#contributors-container');
        if (grid) {
            grid.innerHTML = contributors.slice(0, 12).map((c) => `
                <a class="contributor" href="${escapeHtml(c.html_url)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(c.avatar_url)}" alt="${escapeHtml(c.login)}" loading="lazy" referrerpolicy="no-referrer" />
                </a>`).join('\n');
        }
    });
}

// ── sitemap ──

function buildSitemap(builtPaths) {
    const today = new Date().toISOString().slice(0, 10);
    const entries = [];
    const entryPages = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/docs.html', priority: '0.9', changefreq: 'weekly' },
        { loc: '/market.html', priority: '0.8', changefreq: 'weekly' },
        { loc: '/community.html', priority: '0.7', changefreq: 'daily' },
        { loc: '/about.html', priority: '0.6', changefreq: 'monthly' },
    ];
    for (const p of entryPages) {
        entries.push(`  <url>
    <loc>${SITE}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
    }
    for (const p of builtPaths) {
        const [lang, ...rest] = p.split('/');
        const rel = rest.join('/').replace(/\.md$/, '') + '.html';
        const loc = lang === MAIN_LANG ? SITE + '/docs/' + rel : SITE + '/docs/' + lang + '/' + rel;
        entries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
    fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
    console.log('sitemap.xml 重建完成，共', entries.length, '条');
}

// ── 主流程 ──

async function main() {
    console.log('== ErisPulse 官网 SEO 静态化构建 ==');
    const built = await buildDocs();
    buildSitemap(built);
    await prefillEntryPages();
    console.log('== 完成 ==');
}

main().catch((e) => {
    console.error('构建失败:', e);
    process.exit(1);
});
