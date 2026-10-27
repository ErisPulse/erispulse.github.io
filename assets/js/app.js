/**
 * 应用入口（原生 ES Module）
 *
 * 取代原先的 <script src="main.js" defer>。
 * 负责：等待 DOM → 加载视图片段 → 按原始顺序初始化各功能模块 → 隐藏加载动画。
 *
 * 初始化顺序与原 main.js 中 ErisPulseApp.init() 严格一致，以保证行为不变。
 */

import { I18n } from "./i18n.js";
import { loadUserSettings } from "./core/state.js";
import { loadViews } from "./core/views.js";
import * as settings from "./modules/settings.js";
import * as nav from "./modules/nav.js";
import * as market from "./modules/marketplace.js";
import * as docs from "./modules/docs.js";
import { renderFriendLinks, renderDependencies } from "./modules/about.js";
import * as home from "./modules/home.js";
import { initReveal } from "./modules/reveal.js";

/**
 * GitHub 风格 .md 深链归一化：
 *  - https://www.erisdev.com/?md=api-reference/xxx.md
 *    （Worker / 404.html 重定向落点，浏览器会自动保留原始 fragment）
 *  - https://www.erisdev.com/api-reference/xxx.md#章节
 *    （SPA 直接服务该路径时的兜底）
 * 统一转换为站内路由 #docs/<path>#<section>。
 */
(function normalizeDocDeepLink() {
  try {
    let mdPath = null;
    const params = new URLSearchParams(window.location.search);

    if (params.has("md")) {
      mdPath = (params.get("md") || "").replace(/^\/+/, "");
      params.delete("md");
    } else if (/\.md$/i.test(window.location.pathname)) {
      mdPath = window.location.pathname.replace(/^\/+/, "");
    }

    if (!mdPath) return;

    const query = params.toString();
    const frag = window.location.hash.replace(/^#+/, "");
    let target = "/#docs/" + mdPath;
    if (frag && !frag.startsWith("docs")) {
      target += "#" + frag;
    }
    history.replaceState(null, "", "/" + (query ? "?" + query : "") + target);
  } catch (e) {
    console.warn("文档深链归一化失败:", e);
  }
})();

/**
 * Logo 图片加载检测：加载完成后淡入，加载中显示文字占位
 */
(function setupLoaderLogo() {
  const img = document.querySelector(".loader-icon");
  if (!img) return;
  const reveal = () => img.classList.add("loaded");
  if (img.complete && img.naturalWidth > 0) reveal();
  else img.addEventListener("load", reveal, { once: true });
})();

/**
 * 等价于原 ErisPulseApp.init()
 * 注意：setupStorage() 与 loadUserSettings() 在原实现中功能完全重复，
 * 此处仅调用 loadUserSettings() 一次即可达到相同效果。
 */
function runInit() {
  I18n.init();
  loadUserSettings();
  settings.applyUserSettings();
  nav.registerServiceWorker();
  settings.setupThemeToggle();
  nav.setupHamburgerMenu();
  // 账户与社区模块先于视图切换初始化：
  nav.setupViewSwitching();
  settings.setupGlobalLangSwitcher();
  market.setupMarketplace();
  docs.setupDocumentation();
  market.setupModals();
  settings.setupSettings();
  renderFriendLinks();
  renderDependencies();
  home.setupHomeAnimations();
  home.initBannerCarousel();
  home.initInstallOverlay();
  home.initHeroStats();
  nav.setupOnlineOffline();
}

/**
 * 揭幕：整层水彩溶解 —— 轻微放大、虚化后淡出（CSS .page-loader.leaving）
 */
function hideLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  const reduceMotion =
    document.body.classList.contains("no-animations") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    loader.style.display = "none";
    return;
  }
  loader.classList.add("leaving");
  setTimeout(() => {
    loader.style.display = "none";
  }, 620);
}

/**
 * 启动流程：加载视图 → 初始化模块 → 隐藏加载动画
 */
async function bootstrap() {
  try {
    await loadViews();
    initReveal();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
    // 即使初始化失败也要隐藏加载层，避免卡在空白遮罩
    // 等待两帧确保 DOM 已绘制，再开始交棒揭幕
    requestAnimationFrame(() => requestAnimationFrame(hideLoader));
  }
}

/**
 * module script 默认 defer，执行时 DOM 已解析完成；
 * 但稳妥起见仍检查 readyState。
 */
function start() {
  bootstrap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
