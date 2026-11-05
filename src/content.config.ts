import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * 文档内容集合
 *
 * 文件结构（由 scripts/fetch-docs.mjs 从 ErisPulse 仓库同步）：
 *   src/content/docs/{lang}/{path}.md
 *   src/content/docs/_meta/{lang}/docs-mapping.json
 *
 * 每篇文档的 id 形如 "zh-CN/getting-started/first-bot"（语言前缀 + 路径）。
 * 单路径 i18n：路由只按路径（去掉语言前缀）生成一个页面，
 * 其余语言在构建期渲染为 HTML 后内嵌到页面，由客户端切换。
 */
const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    // glob loader 自动注入 id / body，这里不强制额外 frontmatter
  }),
});

export const collections = { docs };
