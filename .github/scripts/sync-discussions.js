/**
 * Discussions 快照拉取脚本（GitHub Actions 定时任务用）
 *
 * 拉取 ErisPulse/ErisPulse 仓库的 Discussions 列表，裁剪字段后写入
 * assets/data/discussions.json。字段结构与 Worker /api/discussions 的
 * 响应保持一致，前端把两个来源当作同构数据处理。
 *
 * 用法：GITHUB_TOKEN=xxx node sync-discussions.js
 */
const fs = require('fs');

const REPO = 'ErisPulse/ErisPulse';
const OUTPUT = 'assets/data/discussions.json';
const PER_PAGE = 50;
const MAX_PAGES = 5; // 上限 250 条，超出部分列表页不展示（社区页有 GitHub 跳转兜底）

function ghHeaders() {
    return {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'erispulse-site-sync',
    };
}

function trimUser(u) {
    return u ? { login: u.login, avatar_url: u.avatar_url, html_url: u.html_url } : null;
}

function trimCategory(c) {
    return c
        ? { id: c.id, name: c.name, slug: c.slug, emoji: c.emoji, description: c.description }
        : null;
}

function trimDiscussion(d) {
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

async function main() {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN is not set');
    }

    const all = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `https://api.github.com/repos/${REPO}/discussions?per_page=${PER_PAGE}&page=${page}`;
        const resp = await fetch(url, { headers: ghHeaders() });
        if (!resp.ok) {
            throw new Error(`GitHub API ${resp.status}: ${await resp.text()}`);
        }
        const list = await resp.json();
        all.push(...list);
        if (list.length < PER_PAGE) break;
    }

    // 确定性时间戳：取最新一条讨论的 updated_at（而非运行时刻）。
    // 否则每次运行必然产生 diff，workflow 的「无变动不提交」守卫永远拦不住。
    // 前端仅用它做数据新鲜度判断，语义上「数据截至最新讨论更新时间」更准确。
    const newestUpdate = all.reduce(
        (acc, d) => (d && d.updated_at && d.updated_at > acc ? d.updated_at : acc),
        ''
    );

    const out = {
        discussions: all.map(trimDiscussion),
        page: 1,
        per_page: PER_PAGE,
        last_page: 1,
        generated_at: newestUpdate || new Date().toISOString(),
        source: 'actions-sync',
    };

    fs.mkdirSync('assets/data', { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`Wrote ${out.discussions.length} discussions to ${OUTPUT}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
