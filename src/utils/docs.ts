/**
 * 文档处理工具集
 *
 * - marked 配置（与原 main.js 行为一致：标题加 id、表格包裹、代码默认 python）
 * - 路径与语言解析
 * - 从 mapping 构建侧边栏导航树
 * - 上一篇 / 下一篇
 */
import { marked } from "marked";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** 支持的语言；列表顺序即默认优先级 */
export const LANGS = ["zh-CN", "en", "zh-TW", "ja", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "zh-CN";

/** 读取某语言的 mapping 文件（构建期同步到 src/content/docs/_meta/{lang}/docs-mapping.json） */
function readMapping(lang: Lang): any {
  try {
    const file = resolve("src/content/docs/_meta", lang, "docs-mapping.json");
    const raw = readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { categories: {} };
  }
}

const mappingCache: Partial<Record<Lang, any>> = {};
export function getMapping(lang: Lang) {
  if (!mappingCache[lang]) {
    mappingCache[lang] = readMapping(lang);
  }
  return mappingCache[lang];
}

/**
 * 配置 marked：自定义 renderer 以保证与原站点一致的渲染行为。
 * 标题注入 id（用于页内锚点 + TOC + scrollspy）。
 */
let configured = false;
export function configureMarked() {
  if (configured) return;
  configured = true;
  const renderer = new marked.Renderer();
  renderer.heading = ({ text, depth }: any) => {
    const id = slugify(stripHtml(text));
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };
  marked.setOptions({ renderer } as any);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** 用 marked 渲染 markdown 为 HTML，并做后处理（表格包裹） */
export function renderMarkdown(md: string): string {
  configureMarked();
  let html = marked.parse(md, { async: false }) as string;
  html = wrapTables(html);
  return html;
}

function wrapTables(html: string): string {
  return html.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, "</table></div>");
}

/** 规范化语言代码：Astro glob loader 会把目录名转小写，这里映射回标准写法 */
const LANG_CANONICAL: Record<string, Lang> = {
  "zh-cn": "zh-CN",
  "zh_cn": "zh-CN",
  "zh-tw": "zh-TW",
  "zh_tw": "zh-TW",
  en: "en",
  ja: "ja",
  ru: "ru",
};

/** 从文档集合中提取「路径 → 各语言正文」映射（路径不含语言前缀与 .md） */
export function groupByPath(entries: any[]): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  for (const e of entries) {
    // id 形如 "zh-cn/getting-started/first-bot"（loader 会小写化目录名）
    const m = e.id.match(/^([^/]+)\/(.+)$/);
    if (!m) continue;
    const rawLang = m[1].toLowerCase();
    const lang = LANG_CANONICAL[rawLang];
    if (!lang) continue; // 非语言目录（如 _meta）跳过
    const docPath = m[2].replace(/\.md$/, "");
    if (!map.has(docPath)) map.set(docPath, {});
    map.get(docPath)![lang] = e.body ?? "";
  }
  return map;
}

/** mapping 扁平化后的文档节点（用于侧边栏 + 上下篇） */
export interface FlatDoc {
  path: string; // 不含 .md，不含语言前缀
  title: string;
  level: number;
  category: string;
}

export function flattenMapping(mapping: any): FlatDoc[] {
  const out: FlatDoc[] = [];
  const cats = mapping?.categories ?? {};
  for (const [catName, cat] of Object.entries(cats) as any) {
    const walk = (docs: any[]) => {
      if (!docs) return;
      for (const d of docs) {
        if (d.path) {
          out.push({
            path: d.path.replace(/\\/g, "/").replace(/^docs\//, "").replace(/\.md$/, ""),
            title: d.title ?? d.path,
            level: d.level ?? 1,
            category: catName,
          });
        }
      }
    };
    walk(cat.documents);
    if (cat.subgroups) {
      for (const sg of Object.values(cat.subgroups) as any[]) walk(sg.documents);
    }
  }
  return out;
}

/** 上一篇 / 下一篇 */
export function getNeighbors(flat: FlatDoc[], path: string) {
  const idx = flat.findIndex((d) => normalize(d.path) === normalize(path));
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}

export function normalize(p: string): string {
  return p.replace(/\\/g, "/").replace(/\.md$/, "").replace(/\/README$/, "");
}

/** 文档路由路径 */
export function docRoutePath(docPath: string): string {
  let p = normalize(docPath);
  if (p.endsWith("/README")) p = p.slice(0, -"/README".length) || "index";
  return "/docs/" + p;
}
