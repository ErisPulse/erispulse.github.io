/**
 * AI 模块构建器
 *
 * 两阶段（规划 → 生成）流程：
 *  - 规划阶段：仅提供查阅工具（search_docs / read_document / list_documents），
 *    与用户讨论需求、查阅文档、形成方案，不写入任何文件。
 *  - 当用户发送「开始」等指令时，切换到生成阶段：更换系统提示词，注入写入工具
 *    （write_file / get_manifest / finalize），AI 据此生成完整模块源码。
 *
 * 核心组件：
 *  - tokenize / BM25Index     —— BM25 检索（移植自 Python 版 bm25.py）
 *  - chunkDocument            —— Markdown 分块
 *  - KnowledgeBase            —— 文档检索（DocsIndexManager + DocsContentCache）
 *  - chatOnce                 —— OpenAI 兼容 Chat Completions 调用（URL 原样使用）
 *  - PLAN_TOOLS / GENERATE_TOOLS / buildSystemPrompt —— 两阶段工具与提示词
 *  - executeTool / runGeneration —— 工具执行与多轮对话主循环
 *  - setupBuilder / autoLoadDocs —— UI 绑定与自动加载
 */

import { CONFIG } from "../config.js";
import { I18n } from "../i18n.js";
import { state, saveUserSettings } from "../core/state.js";
import { showMessage, escapeHtml } from "../core/notify.js";
import { DocsIndexManager } from "./docs-index.js";
import { DocsContentCache } from "./docs-cache.js";

/* ============================================================
 * 1. 配置访问辅助
 * ============================================================ */

function settings() {
  if (!state.userSettings.builder) {
    state.userSettings.builder = { ...CONFIG.DEFAULT_USER_SETTINGS.builder };
  }
  return state.userSettings.builder;
}

function persist() {
  // 关闭「记住密钥」时：清除持久化中的密钥，但内存中保留
  const b = state.userSettings.builder;
  if (!b.persistKey && b.api_key) {
    const mem = b.api_key;
    b.api_key = "";
    saveUserSettings();
    b.api_key = mem;
  } else {
    saveUserSettings();
  }
}

/* ============================================================
 * 2. BM25 检索（移植自 Python 版 bm25.py）
 * ============================================================ */

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
const WORD_RE = /[a-z0-9]+/g;

/**
 * 分词：英文单词 + 中文单字 + 中文双字组合
 */
function tokenize(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const tokens = [];

  let m;
  const wordRe = new RegExp(WORD_RE.source, "g");
  while ((m = wordRe.exec(lower)) !== null) {
    tokens.push(m[0]);
  }

  const cjkRe = new RegExp(CJK_RE.source, "g");
  let match;
  while ((match = cjkRe.exec(lower)) !== null) {
    const start = match.index;
    cjkRe.lastIndex = start + 1;
    let end = start;
    while (end < lower.length && CJK_RE.test(lower[end])) {
      end++;
    }
    const seg = lower.slice(start, end);
    for (const ch of seg) tokens.push(ch);
    for (let i = 0; i < seg.length - 1; i++) {
      tokens.push(seg.slice(i, i + 2));
    }
    cjkRe.lastIndex = end;
  }

  return tokens;
}

/**
 * Okapi BM25 索引
 */
class BM25Index {
  constructor(docs, k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.docs = docs;
    this.docLen = docs.map((d) => d.tokens.length);
    this.N = docs.length;
    this.avgdl =
      this.N === 0 ? 0 : this.docLen.reduce((s, n) => s + n, 0) / this.N;

    const df = {};
    this.tf = docs.map((d) => {
      const freq = {};
      for (const t of d.tokens) freq[t] = (freq[t] || 0) + 1;
      for (const t of Object.keys(freq)) df[t] = (df[t] || 0) + 1;
      return freq;
    });

    this.idf = {};
    for (const t of Object.keys(df)) {
      this.idf[t] = Math.log(1 + (this.N - df[t] + 0.5) / (df[t] + 0.5));
    }
  }

  search(query, topK = 5) {
    const qTokens = tokenize(query);
    if (qTokens.length === 0 || this.N === 0) return [];

    const scores = new Array(this.N).fill(0);
    const seenTerms = new Set(qTokens);

    for (const term of seenTerms) {
      const idf = this.idf[term];
      if (idf === undefined) continue;
      for (let i = 0; i < this.N; i++) {
        const f = this.tf[i][term];
        if (!f) continue;
        const dl = this.docLen[i] || 1;
        const denom =
          f + this.k1 * (1 - this.b + this.b * (dl / (this.avgdl || 1)));
        scores[i] += (idf * f * (this.k1 + 1)) / denom;
      }
    }

    const ranked = [];
    for (let i = 0; i < this.N; i++) {
      if (scores[i] > 0) ranked.push({ index: i, score: scores[i] });
    }
    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, topK);
  }
}

/* ============================================================
 * 3. 文档分块（按 Markdown 标题切分，每块最大 ~1000 字符）
 * ============================================================ */

function chunkDocument(docPath, title, content) {
  const chunks = [];
  const lines = String(content || "").split("\n");
  const MAX = 1000;

  let currentHeading = title || docPath;
  let buffer = [];

  const flush = () => {
    if (buffer.length === 0) return;
    let text = buffer.join("\n");
    while (text.length > MAX) {
      const slice = text.slice(0, MAX);
      chunks.push({
        docId: docPath,
        title: currentHeading,
        content: slice,
        tokens: tokenize(slice),
      });
      text = text.slice(MAX);
    }
    if (text.trim().length > 0) {
      chunks.push({
        docId: docPath,
        title: currentHeading,
        content: text,
        tokens: tokenize(text),
      });
    }
    buffer = [];
  };

  const headingRe = /^#{1,4}\s+/;
  for (const line of lines) {
    if (headingRe.test(line)) {
      flush();
      currentHeading = `${title || docPath} » ${line.replace(/^#+\s+/, "").trim()}`;
    }
    buffer.push(line);
  }
  flush();

  return chunks;
}

/* ============================================================
 * 4. 知识库（KnowledgeBase）
 * ============================================================ */

class KnowledgeBase {
  constructor() {
    this.chunks = [];
    this.bm25 = null;
    this.isReady = false;
    this.docList = [];
  }

  async build() {
    if (!DocsIndexManager.isLoaded()) {
      await DocsIndexManager.loadMapping();
    }

    const lang = I18n.getLang();
    const allDocs = DocsIndexManager.getAllDocuments();
    this.docList = allDocs.map((d) => ({ path: d.path, title: d.title }));

    const allChunks = [];
    for (const doc of allDocs) {
      let content = "";
      const cached = DocsContentCache.getRaw(lang, doc.path);
      if (cached && DocsContentCache.isFresh(cached)) {
        content = cached.content;
      } else {
        try {
          const url = CONFIG.DOCS.baseUrl + lang + "/" + doc.path;
          const res = await fetch(url);
          if (res.ok) {
            content = await res.text();
            DocsContentCache.set(lang, doc.path, content);
          }
        } catch (e) {
          if (cached) content = cached.content;
        }
      }
      if (!content) continue;
      const chunks = chunkDocument(doc.path, doc.title, content);
      for (const c of chunks) allChunks.push(c);
    }

    this.chunks = allChunks;
    this.bm25 = new BM25Index(allChunks);
    this.isReady = allChunks.length > 0;
    return this.isReady;
  }

  searchDocs(query, topK = 5) {
    if (!this.bm25) return [];
    const results = this.bm25.search(query, topK);
    return results.map((r) => {
      const c = this.chunks[r.index];
      const snippet =
        c.content.length > 300 ? c.content.slice(0, 300) + "..." : c.content;
      return {
        docPath: c.docId,
        title: c.title,
        snippet,
        score: r.score,
      };
    });
  }

  async readDocument(docPath) {
    const lang = I18n.getLang();
    const cached = DocsContentCache.getRaw(lang, docPath);
    if (cached && cached.content) return cached.content;
    try {
      const url = CONFIG.DOCS.baseUrl + lang + "/" + docPath;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        DocsContentCache.set(lang, docPath, text);
        return text;
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  docIndexText() {
    if (this.docList.length === 0) return "";
    return this.docList
      .map((d, i) => `${i + 1}. ${d.title} (path: ${d.path})`)
      .join("\n");
  }

  listDocuments() {
    return this.docList.slice();
  }

  clear() {
    this.chunks = [];
    this.bm25 = null;
    this.isReady = false;
    this.docList = [];
  }
}

const kb = new KnowledgeBase();
let docsLoading = false;

/* ============================================================
 * 5. LLM 客户端（OpenAI Chat Completions 兼容，自动识别端点）
 * ============================================================ */

/**
 * 自动规范化 API URL：只要不含 /chat/completions 就补上它。
 * - 已含 /chat/completions → 原样使用
 * - 其它（仅域名、/v1、自定义前缀等）→ 去掉尾斜杠后补 /chat/completions
 *   例：https://api.deepseek.com/  → https://api.deepseek.com/chat/completions
 *       https://api.openai.com/v1 → https://api.openai.com/v1/chat/completions
 */
function normalizeApiUrl(url) {
  let u = String(url || "")
    .trim()
    .replace(/\/$/, "");
  if (!u) return u;
  if (/\/chat\/completions$/i.test(u)) return u;
  return u + "/chat/completions";
}

async function chatOnce(messages, tools) {
  const b = settings();
  if (!b.api_url) throw new Error(I18n.t("builder.error.noApiUrl"));
  if (!b.model) throw new Error(I18n.t("builder.error.noModel"));

  // 自动识别端点：完整 URL / /v1 / 仅域名均可
  const url = normalizeApiUrl(b.api_url);
  const body = {
    model: b.model,
    messages: messages,
    stream: false,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const headers = { "Content-Type": "application/json" };
  if (b.api_key) headers["Authorization"] = "Bearer " + b.api_key;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(I18n.t("builder.error.network") + " (" + e.message + ")");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail =
        (errBody.error && errBody.error.message) || JSON.stringify(errBody);
    } catch (_) {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      I18n.t("builder.error.apiError") +
        " (HTTP " +
        res.status +
        "): " +
        detail,
    );
  }

  const data = await res.json();
  const choice = data.choices && data.choices[0];
  if (!choice) {
    throw new Error(I18n.t("builder.error.apiError") + ": empty choices");
  }
  const msg = choice.message || {};
  return {
    role: "assistant",
    content: msg.content || "",
    tool_calls: msg.tool_calls || undefined,
  };
}

/* ============================================================
 * 6. 两阶段：工具定义 + 系统提示词
 * ============================================================ */

function langName() {
  const map = {
    "zh-CN": "简体中文",
    en: "English",
    "zh-TW": "繁體中文",
    ja: "日本語",
    ru: "Русский",
  };
  return map[I18n.getLang()] || I18n.getLang();
}

function docIndexSection() {
  if (kb.isReady) {
    return "【可检索的官方文档索引】\n" + kb.docIndexText();
  }
  return "【文档检索】\n当前未加载文档知识库，工具调用 search_docs / read_document / list_documents 将返回空。请基于你已有的 ErisPulse 知识工作。";
}

const CODE_CONVENTIONS = `【代码规范】
- from ErisPulse import sdk 获取全局 SDK 实例
- from ErisPulse.Core.Bases import BaseModule 作为基类
- 命令使用 @command(["名称"], aliases=[], help="说明") 装饰器
- 事件使用 @message.on_message() / @message.on_private_message() 等
- 在 on_load 中注册命令/事件处理器；直接嵌套 async def（闭包，SDK 会正确绑定）
- 配置：config = sdk.config.getConfig("模块名")
- 存储：sdk.storage
- 日志：sdk.logger.get_child("模块名")
- Dashboard：try: sdk.Dashboard.register_view(...) except: pass
- 路由：sdk.router.register_http_route(...)
- 加载策略：from ErisPulse.loaders import ModuleLoadStrategy
- 回复：await event.reply("文本") 或 await event.reply("文本", method="Markdown")`;

/**
 * 规划阶段系统提示词：仅查阅，与用户讨论方案
 */
function buildPlanSystemPrompt() {
  return `你是「小eris」——ErisPulse 框架的官方看板娘，同时也是模块代码生成专家。

ErisPulse 是基于 Python 的高性能异步机器人开发框架。当前任务：根据用户描述的需求，查阅 ErisPulse 官方文档，与用户一起规划要生成的模块。

【当前阶段：规划】
你**没有写入文件的权限**。专注于理解需求和查阅文档，给出清晰的实现方案。

【你的工具】（仅查阅与提问）
- search_docs(query, top_k)：关键词检索官方文档（${langName()} 版本，本地 BM25）。一次可覆盖多个关键词，例如一次搜索"命令注册 事件监听 配置 存储"。
- read_document(doc_path)：读取某篇文档完整内容。
- list_documents()：列出所有文档标题与路径。
- ask_question(questions)：向用户提问。questions 是数组，每项含 question（问题）和 options（选项）。可一次问多个相关问题。系统会自动为每个问题追加「自定义答案」。澄清需求时优先用它，不要把多个问题堆在一段文字里。

【职责】
1. 收到用户需求后，调用 search_docs 检索相关 SDK API，确认正确用法。
2. 填写模块元信息时，如果用户没有特别说明，作者为 erisQvQ 邮箱为 erisQvQ@erisdev.com
3. 需要澄清时，用 ask_question 一次性提出相关问题（每个问题附带选项）。
4. 信息齐全后给出清晰的实现方案概述：要生成哪些文件、每个文件的职责。

${CODE_CONVENTIONS}

【严格要求】
- 不要编造不存在的 API；不确定时先 search_docs 确认。
- 每轮只输出 tool_call；如需说明用不超过 20 字的简短 Markdown。
- 禁止角色扮演文本，禁止 emoji。
- 规划完成、用户满意后，提示用户发送「开始」进入生成阶段。
- 用户界面当前语言为${langName()}，请**始终使用该语言**回复用户。
- 若用户使用其他语言发送消息，请以用户所用的语言为准。

${docIndexSection()}`;
}

/**
 * 生成阶段系统提示词：拥有写入工具，生成完整源码
 */
function buildGenerateSystemPrompt() {
  return `你是「小eris」——ErisPulse 框架的官方看板娘，同时也是模块代码生成专家。

【当前阶段：生成】
用户已确认「开始」。根据之前规划的需求与方案，生成一个完整可用的 ErisPulse 模块代码。

你可以调用以下工具来查阅 ErisPulse 官方文档（${langName()} 版本）：
- search_docs(query, top_k)：关键词检索官方文档（本地 BM25），返回最相关的片段。优先用它定位内容。
- read_document(doc_path)：读取某篇文档的完整内容。当你已从检索结果或索引中确定要看哪篇文档时使用。
- list_documents()：列出所有可用文档的标题与路径。
- write_file(path, content)：写入一个生成的模块文件。
- get_manifest()：查看当前已生成的文件清单。
- finalize()：标记生成完成。

【严格要求 - 必须遵守】
1. 收到用户需求后，第一轮必须立即调用 search_docs 检索相关 SDK API。一次 search_docs 可以覆盖多个关键词，例如一次搜索"命令注册 事件监听 配置 存储"，不要为每个关键词单独调用
2. 第二轮根据检索结果决定下一步：信息足够则开始 write_file，不够则 read_document 补充
3. 信息足够后立即生成所有必要文件：pyproject.toml、__init__.py、Core.py、config.py、README.md
4. 所有文件写完后用 finalize 标记完成
5. 每轮只输出 tool_call。如果某个步骤需要额外说明（如修正之前的文件、跳过某个功能等），可以用不超过20字的简短 Markdown 说明。简单检索/阅读/生成不需要说话
6. 绝对禁止输出角色扮演文本，不要输出 emoji

【文件要求】
- pyproject.toml：完整的项目配置，包含 [project.entry-points."erispulse.module"] 入口点
- __init__.py：导出 Main 类
- Core.py：继承 BaseModule，包含 __init__、get_load_strategy、on_load、on_unload
- config.py：配置加载，读取 [模块名] 配置段
- README.md：安装说明、配置说明、使用说明

${CODE_CONVENTIONS}

【严格禁止】
- 不要编造不存在的 API、参数或方法
- 不确定的 API 必须用 search_docs 先查文档确认
- 用户界面当前语言为${langName()}，请**始终使用该语言**回复用户。
- 若用户使用其他语言发送消息，请以用户所用的语言为准。

${docIndexSection()}`;
}

function buildSystemPrompt() {
  return phase === "generate"
    ? buildGenerateSystemPrompt()
    : buildPlanSystemPrompt();
}

// 工具 schema：按阶段分组
const READ_TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "search_docs",
      description: "基于 BM25 在 ErisPulse 官方文档中检索相关片段",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "检索关键词（可一次包含多个，用空格分隔）",
          },
          top_k: { type: "integer", description: "返回条目数，默认 5" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_document",
      description: "读取某篇文档的完整内容",
      parameters: {
        type: "object",
        properties: {
          doc_path: { type: "string", description: "文档 path" },
        },
        required: ["doc_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_documents",
      description: "列出所有可用的官方文档",
      parameters: { type: "object", properties: {} },
    },
  },
];

const WRITE_TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "write_file",
      description: "写入一个生成文件（覆盖已存在）",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "文件路径，如 Core.py / config.py",
          },
          content: { type: "string", description: "完整文件内容" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_manifest",
      description: "查看当前已生成的所有文件列表",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "finalize",
      description: "标记本次生成完成，所有文件已就绪",
      parameters: { type: "object", properties: {} },
    },
  },
];

const ASK_QUESTION_SCHEMA = {
  type: "function",
  function: {
    name: "ask_question",
    description:
      "向用户提问，可一次包含多个问题。每个问题附带若干选项，系统会自动为每个问题追加「自定义答案」。用户回答全部问题后统一提交。",
    parameters: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          description: "问题列表",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                description: "可选，问题标识，用于结果对照",
              },
              question: {
                type: "string",
                description: "问题内容",
              },
              options: {
                type: "array",
                items: { type: "string" },
                description: "选项列表（不要包含「自定义」，系统会自动追加）",
              },
            },
            required: ["question", "options"],
          },
        },
      },
      required: ["questions"],
    },
  },
};

const CONFIRM_START_SCHEMA = {
  type: "function",
  function: {
    name: "confirm_start",
    description:
      "当资料/方案准备完毕，向用户确认是否开始生成。用户确认后会自动切换到生成阶段。",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "可选，给用户的提示语",
        },
      },
    },
  },
};

const PLAN_TOOLS = READ_TOOL_SCHEMAS.concat([
  ASK_QUESTION_SCHEMA,
  CONFIRM_START_SCHEMA,
]);
const GENERATE_TOOLS = READ_TOOL_SCHEMAS.concat(WRITE_TOOL_SCHEMAS);

/* ============================================================
 * 7. 已生成文件状态 + 阶段状态
 * ============================================================ */

let generatedFiles = {};
let finalized = false;
let phase = "plan"; // 'plan' | 'generate'
let conversation = [];
let activeMessagesEl = null; // 当前对话区引用，供 switchPhase 插入系统提示
let docsHintShown = false;
let sendMode = "enter"; // 'enter' | 'ctrlEnter'

function resetGenerated() {
  generatedFiles = {};
  finalized = false;
}

function resetAll() {
  resetGenerated();
  conversation = [];
  phase = "plan";
  updatePhaseToggle();
  persistCurrentSession();
}

/* ============================================================
 * 8. 工具执行器
 * ============================================================ */

async function executeTool(name, args, ctx) {
  switch (name) {
    case "search_docs": {
      if (!kb.isReady) return "知识库未加载，无法检索。";
      const topK = Math.max(1, Math.min(20, args.top_k || 5));
      const results = kb.searchDocs(args.query || "", topK);
      if (results.length === 0) return "未找到匹配文档。";
      return results
        .map(
          (r, i) =>
            `### ${i + 1}. ${r.title}\n来源: ${r.docPath}\n相关度: ${r.score.toFixed(3)}\n\n${r.snippet}`,
        )
        .join("\n\n---\n\n");
    }
    case "read_document": {
      if (!kb.isReady) return "知识库未加载，无法读取文档。";
      const content = await kb.readDocument(args.doc_path);
      if (content === null) return "文档不存在或加载失败: " + args.doc_path;
      return content;
    }
    case "list_documents": {
      const list = kb.listDocuments();
      if (list.length === 0) return "文档索引为空。";
      return list
        .map((d, i) => `${i + 1}. ${d.title} (path: ${d.path})`)
        .join("\n");
    }
    case "write_file": {
      const path = String(args.path || "").trim();
      if (!path) return "错误：缺少 path";
      if (typeof args.content !== "string") return "错误：content 必须为字符串";
      generatedFiles[path] = args.content;
      return `已写入 ${path}（${args.content.length} 字符）`;
    }
    case "get_manifest": {
      const names = Object.keys(generatedFiles);
      if (names.length === 0) return "当前没有已生成文件。";
      return names
        .map((p) => `- ${p} (${generatedFiles[p].length} 字符)`)
        .join("\n");
    }
    case "finalize": {
      finalized = true;
      return "已标记完成。";
    }
    case "ask_question": {
      const qs = Array.isArray(args.questions) ? args.questions : [];
      if (qs.length === 0) return "（未提供问题）";
      const normalized = qs.map((q, i) => ({
        key: String((q && q.key) || (q && q.question) || "Q" + (i + 1)),
        question: String((q && q.question) || ""),
        options: Array.isArray(q && q.options)
          ? q.options.map((o) => String(o)).filter((o) => o.trim())
          : [],
      }));
      if (!ctx || typeof ctx.askQuestions !== "function") {
        return "（当前无法交互提问，请在回复中直接说明）";
      }
      const answers = await ctx.askQuestions(normalized);
      return (
        "用户回答：\n" +
        normalized
          .map((q) => "【" + q.key + "】 " + (answers[q.key] || "(未回答)"))
          .join("\n")
      );
    }
    case "confirm_start": {
      const msg =
        String(args.message || "").trim() || I18n.t("builder.confirmStartMsg");
      const ok = await showConfirmModal(msg);
      if (ok) {
        switchPhase("generate", true);
        return "用户已确认开始，已切换到生成阶段。";
      }
      return "用户选择暂不开始，请继续完善方案。";
    }
    default:
      return "未知工具: " + name;
  }
}

/* ============================================================
 * 9. 阶段切换检测 + 多轮对话主循环
 * ============================================================ */

function isStartCommand(text) {
  const t = String(text || "").trim();
  if (t.length > 80) return false;
  // 命令式触发词
  if (
    /^(开始|开始生成|开始吧|生成吧|start|begin|generate|go)[!！.。]*$/i.test(t)
  )
    return true;
  // 短消息中包含触发意图（如 "let us go", "开始吧", "请开始" 等）
  if (t.length <= 30 && /(开始|start|begin|go|generate|lets? go)/i.test(t))
    return true;
  return false;
}

/**
 * 执行一轮 AI 生成（根据当前 phase 选择工具与系统提示词）
 */
async function runGeneration(requirement, onProgress, ctx) {
  const tools = phase === "generate" ? GENERATE_TOOLS : PLAN_TOOLS;
  const sysMsg = { role: "system", content: buildSystemPrompt() };
  const userMsg = { role: "user", content: requirement };

  const messages = [sysMsg, ...conversation, userMsg];
  // 用户消息先入 conversation（保持时间顺序）
  conversation.push(userMsg);

  const MAX_ROUNDS = 30;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const assistantMsg = await chatOnce(messages, tools);

    if (assistantMsg.content) {
      onProgress({ type: "text", text: assistantMsg.content });
    }

    messages.push(assistantMsg);
    conversation.push(assistantMsg);

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      break;
    }

    for (const call of assistantMsg.tool_calls) {
      const fn = call.function && call.function.name;
      let args = {};
      try {
        args = call.function.arguments
          ? JSON.parse(call.function.arguments)
          : {};
      } catch (e) {
        args = {};
      }

      onProgress({ type: "tool", tool: fn, args });

      let result;
      try {
        result = await executeTool(fn, args, ctx);
      } catch (e) {
        result = "工具执行出错: " + e.message;
      }

      onProgress({ type: "tool_result", tool: fn, result });

      const toolMsg = {
        role: "tool",
        tool_call_id: call.id || "",
        name: fn,
        content: String(result),
      };
      messages.push(toolMsg);
      conversation.push(toolMsg);
    }

    if (finalized) break;
  }

  return { files: { ...generatedFiles }, finalized };
}

/* ============================================================
 * 10. ZIP 打包
 * ============================================================ */

let jszipLoaded = false;

async function ensureJSZip() {
  if (jszipLoaded && window.JSZip) return window.JSZip;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load JSZip"));
    document.head.appendChild(s);
  });
  jszipLoaded = !!window.JSZip;
  return window.JSZip;
}

function extractModuleName(content) {
  if (!content) return "ErisPulseModule";
  const m = content.match(/name\s*=\s*"([^"]+)"/);
  if (m && m[1]) return m[1].trim();
  return "ErisPulseModule";
}

async function downloadZip() {
  const names = Object.keys(generatedFiles);
  if (names.length === 0) {
    showMessage(I18n.t("builder.noFiles"), "warning");
    return;
  }
  const pyproject = generatedFiles["pyproject.toml"] || "";
  const moduleName = extractModuleName(pyproject);
  try {
    const JSZip = await ensureJSZip();
    const zip = new JSZip();
    const folder = zip.folder(moduleName);
    for (const [path, content] of Object.entries(generatedFiles)) {
      folder.file(path, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = moduleName + ".zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    showMessage(I18n.t("builder.error.zip") + ": " + e.message, "error");
  }
}

/* ============================================================
 * 11. UI 渲染辅助
 * ============================================================ */

function $(id) {
  return document.getElementById(id);
}

function renderMarkdown(text) {
  if (window.marked && typeof window.marked.parse === "function") {
    return window.marked.parse(text || "");
  }
  return escapeHtml(text || "");
}

function scrollToBottom(messagesEl) {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendMessage(messagesEl, role, text) {
  const wrap = document.createElement("div");
  wrap.className =
    "builder-msg " + (role === "user" ? "builder-msg-user" : "builder-msg-bot");

  // 仅机器人在气泡左侧显示头像；用户消息只有气泡
  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "builder-msg-avatar";
    avatar.innerHTML = '<img src="assets/img/eris.png" alt="" />';
    wrap.appendChild(avatar);
  }

  const content = document.createElement("div");
  content.className = "builder-msg-content";
  if (role === "user") {
    content.textContent = text;
  } else {
    content.innerHTML = renderMarkdown(text);
  }

  wrap.appendChild(content);
  messagesEl.appendChild(wrap);
  scrollToBottom(messagesEl);
  return content;
}

function appendSystemMessage(messagesEl, text) {
  const div = document.createElement("div");
  div.className = "builder-system-msg";
  div.textContent = text;
  messagesEl.appendChild(div);
  scrollToBottom(messagesEl);
}

/**
 * 渲染多问题表单卡片，返回 Promise<answers>，answers 为 {key: 回答}
 */
function renderQuestionForm(messagesEl, questions) {
  return new Promise((resolve) => {
    hideTyping(messagesEl);

    const card = document.createElement("div");
    card.className = "builder-question";

    const answers = {};
    let answeredCount = 0;

    const submitAll = document.createElement("button");
    submitAll.type = "button";
    submitAll.className = "btn btn-primary builder-question-submit-all";
    submitAll.textContent = I18n.t("builder.question.submitAll");
    submitAll.disabled = true;

    const updateSubmit = () => {
      submitAll.disabled = answeredCount < questions.length;
    };

    questions.forEach((q, idx) => {
      const block = document.createElement("div");
      block.className = "builder-question-block";

      const label = document.createElement("div");
      label.className = "builder-question-text";
      label.innerHTML = idx + 1 + ". " + renderMarkdown(q.question);
      block.appendChild(label);

      const optWrap = document.createElement("div");
      optWrap.className = "builder-question-options";

      const inputWrap = document.createElement("div");
      inputWrap.className = "builder-question-input-wrap";
      inputWrap.style.display = "none";
      const input = document.createElement("input");
      input.className = "builder-question-input";
      input.type = "text";
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "btn btn-primary builder-question-submit";
      ok.textContent = I18n.t("builder.question.ok");
      inputWrap.appendChild(input);
      inputWrap.appendChild(ok);

      const setAnswer = (val) => {
        if (!(q.key in answers)) answeredCount++;
        answers[q.key] = val;
        updateSubmit();
      };

      const clearSelected = () => {
        optWrap
          .querySelectorAll(".builder-question-opt")
          .forEach((b) => b.classList.remove("selected"));
      };

      q.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "builder-question-opt";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          clearSelected();
          btn.classList.add("selected");
          inputWrap.style.display = "none";
          setAnswer(opt);
        });
        optWrap.appendChild(btn);
      });

      // 自定义答案
      const customBtn = document.createElement("button");
      customBtn.type = "button";
      customBtn.className = "builder-question-opt builder-question-custom";
      customBtn.textContent = I18n.t("builder.question.custom");
      customBtn.addEventListener("click", () => {
        clearSelected();
        customBtn.classList.add("selected");
        inputWrap.style.display = "flex";
        input.focus();
      });
      optWrap.appendChild(customBtn);

      ok.addEventListener("click", () => {
        const val = input.value.trim();
        if (!val) {
          input.focus();
          return;
        }
        setAnswer(val);
        // 视觉反馈：自定义按钮显示已填写
        customBtn.textContent = val.slice(0, 16) + (val.length > 16 ? "…" : "");
        customBtn.style.fontStyle = "normal";
        input.disabled = true;
        ok.disabled = true;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ok.click();
        }
      });
      // 失焦时若有内容也自动保存
      input.addEventListener("blur", () => {
        const val = input.value.trim();
        if (val && !(q.key in answers)) {
          setAnswer(val);
          customBtn.textContent =
            val.slice(0, 16) + (val.length > 16 ? "…" : "");
          customBtn.style.fontStyle = "normal";
          input.disabled = true;
          ok.disabled = true;
        }
      });

      block.appendChild(optWrap);
      block.appendChild(inputWrap);
      card.appendChild(block);
    });

    submitAll.addEventListener("click", () => {
      card.querySelectorAll("button").forEach((b) => (b.disabled = true));
      card.querySelectorAll("input").forEach((i) => (i.disabled = true));
      resolve(answers);
    });

    card.appendChild(submitAll);
    messagesEl.appendChild(card);
    scrollToBottom(messagesEl);
  });
}

function showTyping(messagesEl) {
  let t = messagesEl.querySelector("#builder-typing-indicator");
  if (t) return;
  t = document.createElement("div");
  t.className = "builder-typing";
  t.id = "builder-typing-indicator";
  t.innerHTML = "<span></span><span></span><span></span>";
  messagesEl.appendChild(t);
  scrollToBottom(messagesEl);
}

function hideTyping(messagesEl) {
  const t = messagesEl.querySelector("#builder-typing-indicator");
  if (t) t.remove();
}

/**
 * 统一确认弹窗（替代浏览器 confirm）
 */
function showConfirmModal(msg) {
  return new Promise((resolve) => {
    const modal = $("builder-confirm-modal");
    const msgEl = $("builder-confirm-msg");
    const okBtn = $("builder-confirm-ok");
    const cancelBtn = $("builder-confirm-cancel");
    if (!modal) {
      resolve(false);
      return;
    }
    if (msgEl) msgEl.textContent = msg;
    modal.style.display = "flex";

    const close = (result) => {
      modal.style.display = "none";
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      modal.removeEventListener("click", onBackdrop);
      resolve(result);
    };
    const onOk = () => close(true);
    const onCancel = () => close(false);
    const onBackdrop = (e) => {
      if (e.target === modal) close(false);
    };

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    modal.addEventListener("click", onBackdrop);
  });
}

function appendProgress(messagesEl, kind, html) {
  const wrap = document.createElement("div");
  wrap.className = "builder-progress";
  const item = document.createElement("div");
  item.className = "builder-progress-item " + kind;
  item.innerHTML = html;
  wrap.appendChild(item);
  messagesEl.appendChild(wrap);
  scrollToBottom(messagesEl);
  return wrap;
}

function iconForTool(tool) {
  switch (tool) {
    case "search_docs":
      return '<i class="fas fa-magnifying-glass"></i>';
    case "read_document":
      return '<i class="fas fa-book-open"></i>';
    case "write_file":
      return '<i class="fas fa-file-pen"></i>';
    case "list_documents":
      return '<i class="fas fa-list"></i>';
    case "get_manifest":
      return '<i class="fas fa-folder-open"></i>';
    case "finalize":
      return '<i class="fas fa-check"></i>';
    case "ask_question":
      return '<i class="fas fa-circle-question"></i>';
    default:
      return '<i class="fas fa-wrench"></i>';
  }
}

function kindForTool(tool) {
  if (tool === "search_docs") return "search";
  if (tool === "read_document") return "read";
  if (tool === "write_file") return "write";
  if (tool === "finalize") return "done";
  return "read";
}

function toolLabel(tool) {
  return I18n.t("builder.tool." + tool) || tool;
}

/**
 * 根据工具类型生成简洁的参数摘要，避免把 write_file 的整份 content 输出出来
 */
function formatToolDetail(tool, args) {
  try {
    if (tool === "write_file")
      return args && args.path ? "path: " + args.path : "";
    if (tool === "read_document")
      return args && args.doc_path ? "doc: " + args.doc_path : "";
    if (tool === "search_docs")
      return args && args.query ? "q: " + args.query : "";
    if (tool === "ask_question") {
      const n = Array.isArray(args && args.questions)
        ? args.questions.length
        : 0;
      return n ? n + " 个问题" : "";
    }
  } catch (_) {}
  return "";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function updateFileList() {
  const list = $("builder-files-list");
  const countEl = $("builder-files-count");
  const dlBtn = $("builder-download");
  const viewAllBtn = $("builder-view-all");
  if (!list) return;
  const names = Object.keys(generatedFiles);
  list.innerHTML = "";
  if (countEl) countEl.textContent = String(names.length);
  if (names.length === 0) {
    const p = document.createElement("p");
    p.className = "builder-empty";
    p.textContent = I18n.t("builder.noFiles");
    list.appendChild(p);
    if (dlBtn) dlBtn.disabled = true;
    if (viewAllBtn) viewAllBtn.style.display = "none";
    return;
  }
  // 预览最多 3 个
  const preview = names.slice(0, 3);
  for (const n of preview) {
    const item = document.createElement("div");
    item.className = "builder-file-item";
    const size = formatSize((generatedFiles[n] || "").length);
    item.innerHTML =
      '<i class="fas fa-file-code"></i><span>' +
      escapeHtml(n) +
      '</span><span class="builder-file-size">' +
      size +
      "</span>";
    list.appendChild(item);
  }
  if (dlBtn) dlBtn.disabled = false;
  if (viewAllBtn) {
    if (names.length > 3) {
      viewAllBtn.style.display = "flex";
      const span = viewAllBtn.querySelector("span");
      if (span)
        span.textContent =
          I18n.t("builder.viewAll") + " (" + names.length + ")";
    } else {
      viewAllBtn.style.display = "none";
    }
  }
}

/* 文件查看模态窗 */
function openFilesModal() {
  const modal = $("builder-files-modal");
  if (!modal) return;
  modal.style.display = "flex";
  renderFilesModalList();
}

function closeFilesModal() {
  const modal = $("builder-files-modal");
  if (!modal) return;
  modal.style.display = "none";
}

function renderFilesModalList() {
  const body = $("builder-files-modal-body");
  const title = $("builder-files-modal-title");
  const back = $("builder-files-back");
  if (!body) return;
  if (title) title.textContent = I18n.t("builder.generatedFiles");
  if (back) back.style.display = "none";
  body.innerHTML = "";
  const names = Object.keys(generatedFiles);
  if (names.length === 0) {
    const p = document.createElement("p");
    p.className = "builder-empty";
    p.textContent = I18n.t("builder.noFiles");
    body.appendChild(p);
    return;
  }
  for (const n of names) {
    const item = document.createElement("div");
    item.className = "builder-modal-file-item";
    const size = formatSize((generatedFiles[n] || "").length);
    item.innerHTML =
      '<i class="fas fa-file-code"></i>' +
      '<span class="builder-file-name">' +
      escapeHtml(n) +
      "</span>" +
      '<span class="builder-file-size">' +
      size +
      "</span>";
    item.addEventListener("click", () => renderFileContent(n));
    body.appendChild(item);
  }
}

function renderFileContent(path) {
  const body = $("builder-files-modal-body");
  const title = $("builder-files-modal-title");
  const back = $("builder-files-back");
  if (!body) return;
  if (title) title.textContent = path;
  if (back) back.style.display = "inline-flex";
  const content = generatedFiles[path] || "";
  body.innerHTML =
    '<pre class="builder-code-view"><code>' +
    escapeHtml(content) +
    "</code></pre>";
  // 尝试语法高亮
  const code = body.querySelector("code");
  if (code && typeof Prism !== "undefined") {
    try {
      Prism.highlightElement(code);
    } catch (_) {}
  }
}

function bindFilesModal() {
  const viewAll = $("builder-view-all");
  const close = $("builder-files-close");
  const back = $("builder-files-back");
  const modal = $("builder-files-modal");
  if (viewAll) viewAll.addEventListener("click", openFilesModal);
  if (close) close.addEventListener("click", closeFilesModal);
  if (back) back.addEventListener("click", renderFilesModalList);
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeFilesModal();
    });
}

function updateDocsStatus() {
  const el = $("builder-docs-status");
  if (!el) return;
  el.classList.remove("ready", "empty");
  if (kb.isReady) {
    el.classList.add("ready");
    el.innerHTML =
      '<i class="fas fa-circle-check"></i> <span>' +
      I18n.t("builder.docsStatusReady") +
      " · " +
      kb.docList.length +
      " docs</span>";
  } else if (docsLoading) {
    el.innerHTML =
      '<i class="fas fa-circle-notch fa-spin"></i> <span>' +
      I18n.t("builder.docsStatusLoading") +
      "</span>";
  } else {
    el.classList.add("empty");
    el.innerHTML =
      '<i class="fas fa-circle-info"></i> <span>' +
      I18n.t("builder.docsStatusEmpty") +
      "</span>";
  }
}

function updatePhaseToggle() {
  const toggle = $("builder-phase-toggle");
  if (!toggle) return;
  toggle.querySelectorAll(".builder-phase-seg").forEach((seg) => {
    seg.classList.toggle("active", seg.getAttribute("data-phase") === phase);
  });
  updateInputPlaceholder();
}

/**
 * 切换阶段（可由用户点击胶囊或 AI 的 confirm_start 触发）
 */
function switchPhase(newPhase, announce) {
  if (newPhase !== "plan" && newPhase !== "generate") return;
  if (newPhase === phase) return;
  phase = newPhase;
  updatePhaseToggle();
  if (announce && activeMessagesEl) {
    appendSystemMessage(activeMessagesEl, I18n.t("builder.phaseSwitched"));
  }
  persistCurrentSession();
}

function updateInputPlaceholder() {
  const input = $("builder-input");
  if (!input) return;
  input.placeholder = I18n.t(
    phase === "generate"
      ? "builder.inputPlaceholderGenerate"
      : "builder.inputPlaceholderPlan",
  );
}

/* ============================================================
 * 12. UI 事件绑定（setupBuilder）
 * ============================================================ */

let sending = false;

function setSending(v) {
  sending = v;
  const btn = $("builder-send");
  if (btn) {
    btn.disabled = v;
    const span = btn.querySelector("span");
    if (span) span.textContent = I18n.t(v ? "builder.sending" : "builder.send");
  }
}

function bindConfigInputs() {
  const b = settings();

  const urlInput = $("builder-api-url");
  const keyInput = $("builder-api-key");
  const modelInput = $("builder-model");
  const persistChk = $("builder-persist-key");
  const toggleEye = $("builder-toggle-key");

  if (urlInput) {
    urlInput.value = b.api_url || "";
    urlInput.addEventListener("input", () => {
      b.api_url = urlInput.value;
      persist();
    });
  }
  if (keyInput) {
    keyInput.value = b.api_key || "";
    keyInput.addEventListener("input", () => {
      b.api_key = keyInput.value;
      persist();
    });
  }
  if (modelInput) {
    modelInput.value = b.model || "";
    modelInput.addEventListener("input", () => {
      b.model = modelInput.value;
      persist();
    });
  }
  if (persistChk) {
    persistChk.checked = !!b.persistKey;
    persistChk.addEventListener("change", () => {
      b.persistKey = persistChk.checked;
      persist();
    });
  }

  // API Key 显示/隐藏
  if (toggleEye && keyInput) {
    toggleEye.addEventListener("click", () => {
      if (keyInput.type === "password") {
        keyInput.type = "text";
        toggleEye.classList.remove("fa-eye");
        toggleEye.classList.add("fa-eye-slash");
      } else {
        keyInput.type = "password";
        toggleEye.classList.remove("fa-eye-slash");
        toggleEye.classList.add("fa-eye");
      }
    });
  }

  // 配置模态窗打开/关闭
  bindConfigModal();
}

function bindConfigModal() {
  const btn = $("builder-config-modal-btn");
  const modal = $("builder-config-modal");
  const close = $("builder-config-modal-close");
  if (!btn || !modal) return;
  btn.addEventListener("click", () => {
    modal.style.display = "flex";
  });
  if (close)
    close.addEventListener("click", () => {
      modal.style.display = "none";
    });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

function bindDocsButtons() {
  const loadBtn = $("builder-load-docs");
  if (loadBtn) {
    loadBtn.addEventListener("click", async () => {
      loadBtn.disabled = true;
      docsLoading = true;
      updateDocsStatus();
      try {
        const ok = await kb.build();
        if (ok) {
          showMessage(
            I18n.t("builder.docsLoaded", { n: kb.docList.length }),
            "success",
          );
        } else {
          showMessage(I18n.t("builder.docsStatusEmpty"), "warning");
        }
      } catch (e) {
        showMessage(
          I18n.t("builder.error.docsLoad") + ": " + e.message,
          "error",
        );
      } finally {
        docsLoading = false;
        loadBtn.disabled = false;
        updateDocsStatus();
      }
    });
  }
}

function bindSendModeDropdown() {
  const btn = $("builder-send-mode-btn");
  const menu = $("builder-send-mode-menu");
  if (!btn || !menu) return;

  // 从配置恢复
  const b = settings();
  if (b.sendMode === "ctrlEnter") sendMode = "ctrlEnter";
  else sendMode = "enter";
  updateSendModeUI();

  // tag 嵌在提交按钮内，点击/键盘必须阻止表单提交
  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle("open");
  };
  btn.addEventListener("click", toggle);
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      toggle(e);
    }
  });
  document.addEventListener("click", (e) => {
    if (
      !menu.contains(e.target) &&
      e.target !== btn &&
      !btn.contains(e.target)
    ) {
      menu.classList.remove("open");
    }
  });
  menu.querySelectorAll(".builder-send-mode-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      sendMode =
        opt.getAttribute("data-mode") === "ctrlEnter" ? "ctrlEnter" : "enter";
      b.sendMode = sendMode;
      persist();
      updateSendModeUI();
      menu.classList.remove("open");
    });
  });
}

function updateSendModeUI() {
  const btn = $("builder-send-mode-btn");
  const menu = $("builder-send-mode-menu");
  if (btn) {
    const lbl = btn.querySelector(".builder-send-mode-label");
    if (lbl)
      lbl.textContent =
        sendMode === "ctrlEnter"
          ? I18n.t("builder.sendMode.ctrlEnter")
          : I18n.t("builder.sendMode.enter");
  }
  if (menu) {
    menu.querySelectorAll(".builder-send-mode-opt").forEach((opt) => {
      opt.classList.toggle(
        "active",
        opt.getAttribute("data-mode") === sendMode,
      );
    });
  }
}

function bindSessionIO() {
  const exportBtn = $("builder-export-session");
  const exportMenu = $("builder-export-menu");
  const importBtn = $("builder-import-session");
  const importFile = $("builder-import-file");

  // 导出下拉
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle("open");
    });
    exportMenu.querySelectorAll(".builder-export-opt").forEach((opt) => {
      opt.addEventListener("click", () => {
        const scope = opt.getAttribute("data-scope");
        exportMenu.classList.remove("open");
        exportSessions(scope);
      });
    });
    // 点击外部关闭
    document.addEventListener("click", (e) => {
      if (!exportMenu.classList.contains("open")) return;
      if (exportBtn.contains(e.target) || exportMenu.contains(e.target)) return;
      exportMenu.classList.remove("open");
    });
  }

  // 导入文件选择
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => {
      importFile.value = "";
      importFile.click();
    });
    importFile.addEventListener("change", async () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      await importSessionsFromFile(file);
    });
  }
}

function bindMobileDrawer() {
  const menuBtn = $("builder-mobile-menu");
  const overlay = $("builder-mobile-overlay");
  const panel = document.querySelector(".builder-files-panel");
  if (!menuBtn || !overlay || !panel) return;

  const open = () => {
    panel.classList.add("show");
    overlay.classList.add("show");
  };
  const close = () => {
    panel.classList.remove("show");
    overlay.classList.remove("show");
  };

  menuBtn.addEventListener("click", () => {
    if (panel.classList.contains("show")) close();
    else open();
  });
  overlay.addEventListener("click", close);
}

function bindChatActions() {
  const form = $("builder-form");
  const input = $("builder-input");
  const clearBtn = $("builder-clear");

  const send = async () => {
    if (sending) return;
    const text = ((input && input.value) || "").trim();
    if (!text) return;

    const b = settings();
    if (!b.api_url || !b.model) {
      showMessage(I18n.t("builder.error.noConfig"), "error");
      return;
    }

    const messagesEl = $("builder-messages");
    activeMessagesEl = messagesEl;
    // 移除欢迎消息
    const welcome = $("builder-welcome");
    if (welcome) {
      const msgWrap = welcome.closest(".builder-msg");
      if (msgWrap) msgWrap.remove();
    }

    // 文档未就绪时提示一次
    if (!kb.isReady && !docsHintShown) {
      appendSystemMessage(messagesEl, I18n.t("builder.docsInitHint"));
      docsHintShown = true;
    }

    // 阶段切换检测：规划阶段 → 用户发送「开始」 → 进入生成阶段
    if (phase === "plan" && isStartCommand(text)) {
      switchPhase("generate", true);
    }

    // 自动命名会话（首次发送时用首条消息）
    if (
      activeSessionId &&
      sessions[activeSessionId] &&
      sessions[activeSessionId].title === I18n.t("builder.newSession")
    ) {
      sessions[activeSessionId].title =
        text.slice(0, 24) + (text.length > 24 ? "…" : "");
      renderSessionList();
    }

    appendMessage(messagesEl, "user", text);
    input.value = "";
    if (input.style) input.style.height = "";
    setSending(true);
    showTyping(messagesEl);

    try {
      const ctx = {
        askQuestions: (qs) => renderQuestionForm(messagesEl, qs),
      };
      await runGeneration(
        text,
        (event) => {
          hideTyping(messagesEl);
          if (event.type === "text") {
            if (event.text && event.text.trim()) {
              appendMessage(messagesEl, "bot", event.text);
            }
            showTyping(messagesEl);
          } else if (event.type === "tool") {
            if (event.tool === "ask_question") {
              // 问题表单由工具内部渲染，不重复显示进度行
            } else {
              const label = toolLabel(event.tool);
              const detail = escapeHtml(
                formatToolDetail(event.tool, event.args),
              );
              const isWrite = event.tool === "write_file";
              // 写入文件：添加实时动画标记
              let extraHtml = "";
              if (isWrite) {
                extraHtml =
                  '<span class="builder-progress-writing"><i class="fas fa-circle"></i> ' +
                  escapeHtml(I18n.t("builder.writing")) +
                  "</span>";
              }
              appendProgress(
                messagesEl,
                kindForTool(event.tool),
                iconForTool(event.tool) +
                  " " +
                  label +
                  (detail ? " <code>" + detail + "</code>" : "") +
                  extraHtml,
              );
              showTyping(messagesEl);
            }
          } else if (event.type === "tool_result") {
            if (event.tool === "ask_question") {
              // 用户已作答，显示打字指示等待下一轮
              showTyping(messagesEl);
            } else {
              const last = messagesEl.querySelector(
                ".builder-progress:last-child .builder-progress-item",
              );
              if (last) {
                if (event.tool === "write_file") {
                  // 写入完成：替换动画标记为完成状态 + 文件大小
                  const writingEl = last.querySelector(
                    ".builder-progress-writing",
                  );
                  if (writingEl) {
                    const sizeMatch = String(event.result || "").match(
                      /（(\d+) 字符）/,
                    );
                    const sizeText = sizeMatch ? sizeMatch[1] + " chars" : "";
                    writingEl.outerHTML =
                      '<span class="builder-progress-result">' +
                      "\u2713 " +
                      escapeHtml(
                        sizeText || String(event.result || "").slice(0, 60),
                      ) +
                      "</span>";
                  }
                  last.classList.add("done");
                } else {
                  const summary = String(event.result || "")
                    .slice(0, 80)
                    .replace(/\n/g, " ");
                  last.innerHTML +=
                    ' <span class="builder-progress-result">' +
                    escapeHtml(summary) +
                    "</span>";
                }
              }
            }
            if (event.tool === "write_file" || event.tool === "finalize") {
              updateFileList();
            }
          }
        },
        ctx,
      );
      hideTyping(messagesEl);
      if (finalized) {
        appendProgress(
          messagesEl,
          "done",
          '<i class="fas fa-check"></i> ' + I18n.t("builder.done"),
        );
      }
    } catch (e) {
      hideTyping(messagesEl);
      appendMessage(messagesEl, "bot", "**" + escapeHtml(e.message) + "**");
    } finally {
      hideTyping(messagesEl);
      setSending(false);
      updateFileList();
      persistCurrentSession();
      renderSessionList();
    }
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      send();
    });
  }
  if (input) {
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(140, input.scrollHeight) + "px";
    });
    // 根据 sendMode 决定发送/换行键位
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const isCtrl = e.ctrlKey || e.metaKey;
      if (sendMode === "ctrlEnter") {
        // Ctrl+Enter 发送，纯 Enter 换行
        if (isCtrl) {
          e.preventDefault();
          send();
        }
        // 否则放行，浏览器默认插入换行
      } else {
        // 默认：Enter 发送，Ctrl+Enter 换行
        if (isCtrl) {
          // 手动插入换行
          e.preventDefault();
          const s = input.selectionStart;
          const en = input.selectionEnd;
          input.value = input.value.slice(0, s) + "\n" + input.value.slice(en);
          input.selectionStart = input.selectionEnd = s + 1;
          input.dispatchEvent(new Event("input"));
        } else if (!e.shiftKey) {
          e.preventDefault();
          send();
        }
      }
    });
  }

  // 发送模式下拉
  bindSendModeDropdown();

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      const ok = await showConfirmModal(I18n.t("builder.error.clearConfirm"));
      if (!ok) return;
      const messagesEl = $("builder-messages");
      messagesEl.innerHTML = "";
      // 重新添加欢迎消息
      const welcomeMsg = document.createElement("div");
      welcomeMsg.className = "builder-msg builder-msg-bot";
      welcomeMsg.innerHTML =
        '<div class="builder-msg-avatar"><img src="assets/img/eris.png" alt="" /></div>' +
        '<div class="builder-msg-content" id="builder-welcome"></div>';
      messagesEl.appendChild(welcomeMsg);
      renderWelcome();
      resetAll();
      updateFileList();
    });
  }

  const dlBtn = $("builder-download");
  if (dlBtn) dlBtn.addEventListener("click", downloadZip);

  bindFilesModal();
}

/* ============================================================
 * 13. 自动加载文档缓存
 * ============================================================ */

async function autoLoadDocs() {
  try {
    if (kb.isReady) return;
    docsLoading = true;
    updateDocsStatus();
    await kb.build();
    docsLoading = false;
    updateDocsStatus();
  } catch (e) {
    docsLoading = false;
    console.warn("autoLoadDocs failed:", e);
    updateDocsStatus();
  }
}

/* ============================================================
 * 14. 欢迎消息渲染
 * ============================================================ */

function renderWelcome() {
  const el = $("builder-welcome");
  if (!el) return;
  el.innerHTML = renderMarkdown(I18n.t("builder.welcome"));
}

/* ============================================================
 * 15. 会话历史（本地持久化）
 * ============================================================ */

const SESSIONS_KEY = "erispulse-builder-sessions";
let sessions = {}; // id -> session
let activeSessionId = null;

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    sessions = data.sessions || {};
    activeSessionId = data.activeId || null;
  } catch (e) {
    sessions = {};
    activeSessionId = null;
  }
}

function saveSessions() {
  try {
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify({ sessions: sessions, activeId: activeSessionId }),
    );
  } catch (e) {
    console.warn("save sessions failed", e);
  }
}

function applySessionToMemory(s) {
  var raw = Array.isArray(s.conversation) ? s.conversation : [];
  // 迁移旧版会话（用户消息在末尾 → 用户消息在对应回复前方）
  var migrated = [];
  var buffer = [];
  for (var i = 0; i < raw.length; i++) {
    if (raw[i].role === "user") {
      migrated.push(raw[i]);
      migrated.push.apply(migrated, buffer);
      buffer = [];
    } else {
      buffer.push(raw[i]);
    }
  }
  migrated.push.apply(migrated, buffer);
  conversation = migrated;
  generatedFiles = { ...(s.generatedFiles || {}) };
  phase = s.phase === "generate" ? "generate" : "plan";
  finalized = !!s.finalized;
}

function persistCurrentSession() {
  if (!activeSessionId || !sessions[activeSessionId]) return;
  const s = sessions[activeSessionId];
  s.conversation = conversation;
  s.generatedFiles = { ...generatedFiles };
  s.phase = phase;
  s.finalized = finalized;
  s.updatedAt = Date.now();
  saveSessions();
}

/**
 * 导出会话为 JSON 文件
 * @param {"current"|"all"} scope
 */
function exportSessions(scope) {
  // 先同步当前会话到 sessions 对象
  persistCurrentSession();

  let out = {};
  if (scope === "current") {
    if (!activeSessionId || !sessions[activeSessionId]) {
      showMessage(I18n.t("builder.error.noActiveSession"), "warning");
      return;
    }
    out[activeSessionId] = sessions[activeSessionId];
  } else {
    out = { ...sessions };
  }

  const keys = Object.keys(out);
  if (keys.length === 0) {
    showMessage(I18n.t("builder.noSessions"), "warning");
    return;
  }

  const payload = {
    type: "erispulse-builder-sessions",
    version: 1,
    exportedAt: Date.now(),
    sessions: out,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date();
  const stamp =
    ts.getFullYear() +
    String(ts.getMonth() + 1).padStart(2, "0") +
    String(ts.getDate()).padStart(2, "0") +
    "-" +
    String(ts.getHours()).padStart(2, "0") +
    String(ts.getMinutes()).padStart(2, "0");
  a.download =
    (scope === "current" ? "erispulse-session" : "erispulse-sessions") +
    "-" +
    stamp +
    ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 从文件导入会话（合并不覆盖已有数据）
 * @param {File} file
 */
async function importSessionsFromFile(file) {
  if (!file) return;
  let text;
  try {
    text = await file.text();
  } catch (e) {
    showMessage(I18n.t("builder.error.importRead"), "error");
    return;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    showMessage(I18n.t("builder.error.importParse"), "error");
    return;
  }

  // 兼容两种结构：带信封 / 裸 sessions 对象 / 单个 session
  let incoming = {};
  if (data && data.type === "erispulse-builder-sessions" && data.sessions) {
    incoming = data.sessions;
  } else if (data && typeof data === "object" && data.conversation) {
    // 单个会话对象
    incoming = { [data.id || "imported"]: data };
  } else if (
    data &&
    typeof data === "object" &&
    data.sessions &&
    typeof data.sessions === "object"
  ) {
    incoming = data.sessions;
  } else {
    showMessage(I18n.t("builder.error.importFormat"), "error");
    return;
  }

  const now = Date.now();
  let added = 0;
  for (const [oldId, raw] of Object.entries(incoming)) {
    if (!raw || typeof raw !== "object") continue;
    const newId =
      "s_" + now + "_" + added + "_" + Math.random().toString(36).slice(2, 7);
    const s = {
      id: newId,
      title: raw.title || I18n.t("builder.newSession"),
      conversation: Array.isArray(raw.conversation) ? raw.conversation : [],
      generatedFiles: raw.generatedFiles || {},
      phase: raw.phase === "generate" ? "generate" : "plan",
      finalized: !!raw.finalized,
      createdAt: raw.createdAt || now,
      updatedAt: now,
    };
    sessions[newId] = s;
    added++;
  }

  if (added === 0) {
    showMessage(I18n.t("builder.error.importEmpty"), "warning");
    return;
  }

  // 切换到最近导入的会话
  saveSessions();
  renderSessionList();
  const lastImportedId = Object.keys(sessions)
    .filter((id) => sessions[id].updatedAt === now)
    .sort((a, b) => (sessions[a].createdAt || 0) - (sessions[b].createdAt || 0))
    .pop();
  if (lastImportedId) switchSession(lastImportedId);
  showMessage(I18n.t("builder.importSuccess", { n: added }), "success");
}

function newSession() {
  const id = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const s = {
    id: id,
    title: I18n.t("builder.newSession"),
    conversation: [],
    generatedFiles: {},
    phase: "plan",
    finalized: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions[id] = s;
  activeSessionId = id;
  applySessionToMemory(s);
  saveSessions();
  const messagesEl = $("builder-messages");
  renderHistory(messagesEl);
  updateFileList();
  updatePhaseToggle();
  renderSessionList();
}

function switchSession(id) {
  const s = sessions[id];
  if (!s) return;
  activeSessionId = id;
  applySessionToMemory(s);
  s.conversation = conversation; // 保留迁移结果
  saveSessions();
  const messagesEl = $("builder-messages");
  activeMessagesEl = messagesEl;
  renderHistory(messagesEl);
  updateFileList();
  updatePhaseToggle();
  renderSessionList();
}

function deleteSession(id) {
  delete sessions[id];
  if (activeSessionId === id) {
    const ids = Object.keys(sessions);
    if (ids.length) {
      switchSession(ids[0]);
    } else {
      newSession();
    }
  } else {
    saveSessions();
    renderSessionList();
  }
}

function renderSessionList() {
  const list = $("builder-sessions-list");
  if (!list) return;
  list.innerHTML = "";
  const ids = Object.keys(sessions).sort(
    (a, b) => (sessions[b].updatedAt || 0) - (sessions[a].updatedAt || 0),
  );
  if (ids.length === 0) {
    const p = document.createElement("p");
    p.className = "builder-empty";
    p.textContent = I18n.t("builder.noSessions");
    list.appendChild(p);
    return;
  }
  for (const id of ids) {
    const s = sessions[id];
    const item = document.createElement("div");
    item.className =
      "builder-session-item" + (id === activeSessionId ? " active" : "");
    item.dataset.id = id;
    const ic = document.createElement("i");
    ic.className = "fas fa-message";
    const title = document.createElement("span");
    title.className = "builder-session-title";
    title.textContent = s.title || I18n.t("builder.newSession");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "builder-session-del";
    del.innerHTML = '<i class="fas fa-times"></i>';
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await showConfirmModal(I18n.t("builder.deleteSessionConfirm"));
      if (ok) deleteSession(id);
    });
    item.addEventListener("click", () => switchSession(id));
    item.appendChild(ic);
    item.appendChild(title);
    item.appendChild(del);
    list.appendChild(item);
  }
}

/**
 * 根据当前会话历史重建对话区（切换会话 / 新建会话时调用）
 */
function renderHistory(messagesEl) {
  messagesEl.innerHTML = "";

  // 仅空会话时显示欢迎消息
  if (!conversation.length) {
    const welcomeMsg = document.createElement("div");
    welcomeMsg.className = "builder-msg builder-msg-bot";
    welcomeMsg.innerHTML =
      '<div class="builder-msg-avatar"><img src="assets/img/eris.png" alt="" /></div>' +
      '<div class="builder-msg-content" id="builder-welcome"></div>';
    messagesEl.appendChild(welcomeMsg);
    renderWelcome();
  }

  let progressMap = {}; // call_id → progress-item DOM
  for (const msg of conversation) {
    if (msg.role === "user") {
      appendMessage(messagesEl, "user", msg.content || "");
      progressMap = {};
    } else if (msg.role === "assistant") {
      if (msg.content && msg.content.trim()) {
        appendMessage(messagesEl, "bot", msg.content);
      }
      if (msg.tool_calls && msg.tool_calls.length) {
        for (const call of msg.tool_calls) {
          const fn = (call.function && call.function.name) || "";
          let args = {};
          try {
            args = call.function.arguments
              ? JSON.parse(call.function.arguments)
              : {};
          } catch (_) {
            args = {};
          }
          const detail = escapeHtml(formatToolDetail(fn, args));
          const wrap = appendProgress(
            messagesEl,
            kindForTool(fn),
            iconForTool(fn) +
              " " +
              toolLabel(fn) +
              (detail ? " <code>" + detail + "</code>" : ""),
          );
          progressMap[call.id || ""] = wrap.querySelector(
            ".builder-progress-item",
          );
        }
      }
    } else if (msg.role === "tool") {
      const target =
        progressMap[msg.tool_call_id || ""] || Object.values(progressMap)[0];
      if (target) {
        if (target.classList.contains("write")) {
          // 写入类工具：显示完成标记
          target.classList.add("done");
          const writingEl = target.querySelector(".builder-progress-writing");
          if (writingEl) {
            const sizeMatch = String(msg.content || "").match(/（(\d+) 字符）/);
            const sizeText = sizeMatch
              ? "\u2713 " + sizeMatch[1] + " chars"
              : "";
            writingEl.outerHTML =
              '<span class="builder-progress-result">' +
              escapeHtml(sizeText || String(msg.content || "").slice(0, 60)) +
              "</span>";
          }
        } else {
          const summary = String(msg.content || "")
            .slice(0, 80)
            .replace(/\n/g, " ");
          target.innerHTML +=
            ' <span class="builder-progress-result">' +
            escapeHtml(summary) +
            "</span>";
        }
      }
    }
  }
  if (finalized) {
    appendProgress(
      messagesEl,
      "done",
      '<i class="fas fa-check"></i> ' + I18n.t("builder.done"),
    );
  }
  scrollToBottom(messagesEl);
}

/* ============================================================
 * 16. 对外入口
 * ============================================================ */

export function setupBuilder() {
  loadSessions();
  bindConfigInputs();
  bindChatActions();
  bindMobileDrawer();
  bindSessionIO();
  renderWelcome();

  // 会话初始化
  const newBtn = $("builder-new-session");
  if (newBtn) {
    newBtn.addEventListener("click", () => {
      newSession();
      $("builder-input").focus();
    });
  }
  if (!activeSessionId || !sessions[activeSessionId]) {
    newSession();
  } else {
    switchSession(activeSessionId);
  }

  updateFileList();
  updatePhaseToggle();
  autoLoadDocs();
}

export {
  tokenize,
  BM25Index,
  chunkDocument,
  KnowledgeBase,
  normalizeApiUrl,
  PLAN_TOOLS,
  GENERATE_TOOLS,
};
