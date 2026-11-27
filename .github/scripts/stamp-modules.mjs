#!/usr/bin/env node
/**
 * 模块缓存穿透：给 assets/js 下所有相对 import 追加统一版本参数。
 *
 * GitHub Pages 对静态资源返回 Cache-Control: max-age=14400，模块文件更新后
 * 浏览器在 4 小时内仍使用旧副本；各模块分别缓存时，新旧模块会以错误的
 * 导出名链接失败。版本参数取全部模块文件内容的聚合哈希：任一文件变化，
 * 全部 import 与入口 script 的参数同步变化，整张模块图一次性重新拉取。
 *
 * 用法：node .github/scripts/stamp-modules.mjs
 * 在 index.html 的入口 script 与全部相对 import 上写入 ?v=<hash>。
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const JS_DIR = join(ROOT, "assets", "js");
const ENTRY_HTML = join(ROOT, "index.html");

/** 入口 script 标签：assets/js/app.js 及其版本参数 */
const ENTRY_RE = /(<script\s+type="module"\s+src="assets\/js\/app\.js)(?:\?v=[a-f0-9]+)?(")/;
/** 静态 import / re-export 的相对说明符，以 .js 结尾 */
const SPECIFIER_RE = /((?:import|export)\s[^;]*?\sfrom\s*|import\s*\(\s*)(["'])(\.{1,2}\/[^"']+?\.js)(?:\?v=[a-f0-9]+)?\2/g;
/** 副作用导入：import "./x.js" */
const BARE_RE = /(import\s*)(["'])(\.{1,2}\/[^"']+?\.js)(?:\?v=[a-f0-9]+)?\2/g;
/** 已写入的版本参数：计算聚合哈希前剥离，使哈希只取决于源码本身 */
const STAMPED_RE = /(\.js)\?v=[a-f0-9]{10}\b/g;

/** 递归列出目录下全部 .js 文件 */
function listJsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name.endsWith(".js")) out.push(full);
    else if (!name.includes(".")) out.push(...listJsFiles(full));
  }
  return out.sort();
}

const files = listJsFiles(JS_DIR);
const hash = createHash("sha256");
for (const file of files) hash.update(readFileSync(file, "utf8").replace(STAMPED_RE, "$1"));
const version = hash.digest("hex").slice(0, 10);

const stamp = (specifier) => `${specifier}?v=${version}`;
let replaced = 0;

for (const file of files) {
  let source = readFileSync(file, "utf8");
  const next = source
    .replace(SPECIFIER_RE, (_m, head, quote, specifier) => `${head}${quote}${stamp(specifier)}${quote}`)
    .replace(BARE_RE, (_m, head, quote, specifier) => `${head}${quote}${stamp(specifier)}${quote}`);
  if (next !== source) {
    writeFileSync(file, next);
    replaced += 1;
  }
}

let html = readFileSync(ENTRY_HTML, "utf8");
if (!ENTRY_RE.test(html)) {
  throw new Error("index.html 中未找到入口 script：assets/js/app.js");
}
html = html.replace(ENTRY_RE, `$1?v=${version}$2`);
writeFileSync(ENTRY_HTML, html);

console.log(`模块版本参数：v=${version}（${files.length} 个文件，${replaced} 个含相对 import）`);
