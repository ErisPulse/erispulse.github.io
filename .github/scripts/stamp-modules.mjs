#!/usr/bin/env node
/**
 * 静态资源缓存穿透：给 assets/js 下的相对 import 与 index.html 的入口引用
 * 追加版本参数。
 *
 * GitHub Pages 对静态资源返回 Cache-Control: max-age=14400，文件更新后浏览器
 * 在 4 小时内仍使用旧副本；各模块分别缓存时，新旧模块会以错误的导出名链接
 * 失败。版本参数取同类文件内容的聚合哈希（剥离已写入的参数后计算）：任一
 * 文件变化，该类全部引用的参数同步变化，整张模块图或样式表集合一次性重新拉取。
 * 脚本与样式表各自独立哈希，修改样式不会使模块缓存失效。
 *
 * 用法：node .github/scripts/stamp-modules.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const JS_DIR = join(ROOT, "assets", "js");
const CSS_DIR = join(ROOT, "assets", "css");
const ENTRY_HTML = join(ROOT, "index.html");
/** 版本参数的十六进制长度 */
const VERSION_LENGTH = 10;

/** 入口 script 标签：assets/js/app.js 及其版本参数 */
const ENTRY_RE = /(<script\s+type="module"\s+src="assets\/js\/app\.js)(?:\?v=[a-f0-9]+)?(")/;
/** 静态 import / re-export 的相对说明符，以 .js 结尾 */
const SPECIFIER_RE = /((?:import|export)\s[^;]*?\sfrom\s*|import\s*\(\s*)(["'])(\.{1,2}\/[^"']+?\.js)(?:\?v=[a-f0-9]+)?\2/g;
/** 副作用导入：import "./x.js" */
const BARE_RE = /(import\s*)(["'])(\.{1,2}\/[^"']+?\.js)(?:\?v=[a-f0-9]+)?\2/g;
/** index.html 引用的本地样式表：assets/css/<name>.css 及其版本参数 */
const STYLESHEET_RE = /(<link\s+rel="stylesheet"\s+href=")(assets\/css\/[^"?]+\.css)(?:\?v=[a-f0-9]+)?(")/g;
/** 已写入的版本参数：计算聚合哈希前剥离，使哈希只取决于源码本身 */
const STAMPED_RE = /(\.(?:js|css))\?v=[a-f0-9]+?\b/g;

/** 递归列出目录下指定后缀的全部文件 */
function listFiles(dir, extension) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name.endsWith(extension)) out.push(full);
    else if (!name.includes(".")) out.push(...listFiles(full, extension));
  }
  return out.sort();
}

/** 内容聚合哈希的前 VERSION_LENGTH 位 */
function aggregateVersion(files) {
  const hash = createHash("sha256");
  for (const file of files) hash.update(readFileSync(file, "utf8").replace(STAMPED_RE, "$1"));
  return hash.digest("hex").slice(0, VERSION_LENGTH);
}

// ── 模块脚本 ──
const jsFiles = listFiles(JS_DIR, ".js");
const jsVersion = aggregateVersion(jsFiles);
const stamp = (specifier) => `${specifier}?v=${jsVersion}`;
let replaced = 0;

for (const file of jsFiles) {
  const source = readFileSync(file, "utf8");
  const next = source
    .replace(SPECIFIER_RE, (_m, head, quote, specifier) => `${head}${quote}${stamp(specifier)}${quote}`)
    .replace(BARE_RE, (_m, head, quote, specifier) => `${head}${quote}${stamp(specifier)}${quote}`);
  if (next !== source) {
    writeFileSync(file, next);
    replaced += 1;
  }
}

// ── 样式表与入口引用 ──
const cssFiles = listFiles(CSS_DIR, ".css");
const cssVersion = aggregateVersion(cssFiles);

let html = readFileSync(ENTRY_HTML, "utf8");
if (!ENTRY_RE.test(html)) {
  throw new Error("index.html 中未找到入口 script：assets/js/app.js");
}
html = html.replace(ENTRY_RE, `$1?v=${jsVersion}$2`);
let stylesheetCount = 0;
html = html.replace(STYLESHEET_RE, (_m, head, href, tail) => {
  stylesheetCount += 1;
  return `${head}${href}?v=${cssVersion}${tail}`;
});
writeFileSync(ENTRY_HTML, html);

console.log(
  `模块版本参数：v=${jsVersion}（${jsFiles.length} 个文件，${replaced} 个含相对 import）；` +
    `样式表版本参数：v=${cssVersion}（${cssFiles.length} 个文件，入口引用 ${stylesheetCount} 处）`
);
