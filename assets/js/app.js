/**
 * 应用入口（原生 ES Module）
 *
 * 取代原先的 <script src="main.js" defer>。
 * 负责：等待 DOM → 加载视图片段 → 按原始顺序初始化各功能模块 → 初始化 HeroCanvas → 隐藏加载动画。
 *
 * 初始化顺序与原 main.js 中 ErisPulseApp.init() 严格一致，以保证行为不变。
 */

import { I18n } from "./i18n.js";
import { HeroCanvas } from "./hero-canvas.js";
import { loadUserSettings } from "./core/state.js";
import { loadViews } from "./core/views.js";
import * as settings from "./modules/settings.js";
import * as nav from "./modules/nav.js";
import * as market from "./modules/marketplace.js";
import * as docs from "./modules/docs.js";
import { renderFriendLinks } from "./modules/about.js";
import * as home from "./modules/home.js";
import { SubmitModuleManager } from "./modules/submit.js";

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
  nav.setupViewSwitching();
  settings.setupGlobalLangSwitcher();
  market.setupMarketplace();
  docs.setupDocumentation();
  market.setupModals();
  settings.setupSettings();
  renderFriendLinks();
  home.setupHomeAnimations();
  home.initBannerCarousel();
  home.initInstallOverlay();
  nav.setupOnlineOffline();
  SubmitModuleManager.init();
}

/**
 * 隐藏 page-loader 加载动画（与原 DOMContentLoaded 中的逻辑一致）
 */
function hideLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add("hidden");
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }, 500);
}

/**
 * 启动流程：加载视图 → 初始化模块 → 初始化 HeroCanvas → 隐藏加载动画
 */
async function bootstrap() {
  try {
    await loadViews();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
    // 即使初始化失败也要隐藏加载层，避免卡在空白遮罩
    if (HeroCanvas) HeroCanvas.init();
    hideLoader();
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
