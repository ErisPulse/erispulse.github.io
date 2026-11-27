/**
 * 应用入口（原生 ES Module）
 */

import { I18n } from "./i18n.js?v=f6b8770ba2";
import { loadUserSettings } from "./core/state.js?v=f6b8770ba2";
import { loadViews } from "./core/views.js?v=f6b8770ba2";
import * as settings from "./modules/settings.js?v=f6b8770ba2";
import * as nav from "./modules/nav.js?v=f6b8770ba2";
import * as market from "./modules/marketplace.js?v=f6b8770ba2";
import * as docs from "./modules/docs.js?v=f6b8770ba2";
import { renderFriendLinks, renderDependencies } from "./modules/about.js?v=f6b8770ba2";
import * as home from "./modules/home.js?v=f6b8770ba2";
import { initLineField } from "./modules/linefield.js?v=f6b8770ba2";
import { initReveal } from "./modules/reveal.js?v=f6b8770ba2";

/** 加载页最长停留时间（ms）：启动链路卡住时的强制揭幕兜底 */
const LOADER_MAX_WAIT_MS = 10000;

/**
 * GitHub 风格 .md 深链归一化：统一转换为站内路由 #docs/<path>#<section>
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

function runInit() {
  I18n.init();
  loadUserSettings();
  settings.applyUserSettings();
  nav.registerServiceWorker();
  settings.setupThemeToggle();
  nav.setupHamburgerMenu();
  // 账户与社区模块先于视图切换初始化
  nav.setupViewSwitching();
  settings.setupGlobalLangSwitcher();
  // 以下模块彼此独立：单个失败只影响自身功能，留痕后继续初始化其余模块
  const modules = [
    ["marketplace", market.setupMarketplace],
    ["docs", docs.setupDocumentation],
    ["modals", market.setupModals],
    ["settings", settings.setupSettings],
    ["friendLinks", renderFriendLinks],
    ["dependencies", renderDependencies],
    ["homeAnimations", home.setupHomeAnimations],
    ["bannerCarousel", home.initBannerCarousel],
    ["installOverlay", home.initInstallOverlay],
    ["heroStats", home.initHeroStats],
    ["lineField", initLineField],
    ["onlineOffline", nav.setupOnlineOffline],
  ];
  for (const [name, init] of modules) {
    try {
      init();
    } catch (err) {
      console.error(`[bootstrap] 模块 ${name} 初始化失败:`, err);
    }
  }
}

/**
 * 揭幕：纯淡出（CSS .page-loader.leaving，0.45s）
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
  }, 480);
}

/**
 * 启动流程：加载视图 → 初始化模块 → 隐藏加载动画
 */
async function bootstrap() {
  // 兜底揭幕：无论启动链路在何处卡住，加载页最长停留 LOADER_MAX_WAIT_MS
  const watchdog = setTimeout(() => {
    console.error("[bootstrap] 启动超时，强制揭幕");
    hideLoader();
  }, LOADER_MAX_WAIT_MS);
  try {
    await loadViews();
    initReveal();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
    clearTimeout(watchdog);
    // 即使初始化失败也要隐藏加载层
    // 等待两帧再揭幕
    requestAnimationFrame(() => requestAnimationFrame(hideLoader));
  }
}

/**
 * module script 默认 defer，执行时 DOM 已解析完成
 */
function start() {
  bootstrap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
