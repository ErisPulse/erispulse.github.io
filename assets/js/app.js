/**
 * 应用入口（原生 ES Module）
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
import { initLineField } from "./modules/linefield.js";
import { initReveal } from "./modules/reveal.js";

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
  initLineField();
  nav.setupOnlineOffline();
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
  try {
    await loadViews();
    initReveal();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
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
