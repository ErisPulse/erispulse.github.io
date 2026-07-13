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
 * 气泡条带揭幕（海绵宝宝风格）：
 * 一条气泡带从底部扫向顶部，带下方的页面逐步揭示。
 * 气泡带有可见轮廓 + 高光，收束后消失。
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

  const W = window.innerWidth;
  const H = window.innerHeight;

  const canvas = document.createElement("canvas");
  canvas.className = "reveal-bubble";
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  const css = getComputedStyle(document.documentElement);
  const bgRGB = css.getPropertyValue("--bg-rgb").trim();
  const pRGB = css.getPropertyValue("--primary-rgb").trim();

  loader.style.display = "none";

  // 气泡条带配置
  const bandH = 120;
  const softEdge = 45;
  const bubbles = [];
  for (let i = 0; i < 70; i++) {
    bubbles.push({
      x: Math.random() * W,
      yOff: (Math.random() - 0.5) * bandH,
      r: 2 + Math.random() * 16,
      wobble: Math.random() * Math.PI * 2,
      wSpeed: 0.001 + Math.random() * 0.002,
      alpha: 0.5 + Math.random() * 0.5,
    });
  }

  const duration = 750;
  const startT = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - startT) / duration);
    // easeInOutCubic
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // 条带中心从底部扫向顶部
    const sweepY = H + bandH - eased * (H + bandH * 2);

    // 收束：最后 30% 气泡向中心汇聚、缩小
    const converge = Math.max(0, (t - 0.7) / 0.3);

    ctx.clearRect(0, 0, W, H);

    // 实心填充（条带上方覆盖页面）
    const opaqueEnd = sweepY - softEdge;
    if (opaqueEnd > 0) {
      ctx.fillStyle = `rgb(${bgRGB})`;
      ctx.fillRect(0, 0, W, Math.min(H, opaqueEnd));
    }

    // 软边缘渐变（条带下沿）
    if (sweepY > -softEdge && opaqueEnd < H) {
      const gTop = Math.max(0, sweepY - softEdge);
      const gBot = Math.min(H, sweepY + softEdge);
      if (gBot > gTop) {
        const grad = ctx.createLinearGradient(0, sweepY - softEdge, 0, sweepY + softEdge);
        grad.addColorStop(0, `rgba(${bgRGB}, 1)`);
        grad.addColorStop(1, `rgba(${bgRGB}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, gTop, W, gBot - gTop);
      }
    }

    // 气泡（沿条带分布，可见轮廓 + 高光）
    for (const b of bubbles) {
      const yOff = b.yOff * (1 - converge * 0.7);
      const r = b.r * (1 - converge * 0.5);
      if (r < 2) continue;
      const bx = b.x + Math.sin(now * b.wSpeed + b.wobble) * 6;
      const by = sweepY + yOff + Math.cos(now * b.wSpeed + b.wobble) * 4;
      if (by + r < 0 || by - r > H) continue;

      // 填充（极淡肥皂膜）
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * b.alpha})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();

      // 轮廓（细线）
      ctx.strokeStyle = `rgba(${pRGB}, ${0.12 * b.alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 高光（仅较大气泡泡）
      if (r > 4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * b.alpha})`;
        ctx.beginPath();
        ctx.arc(bx - r * 0.3, by - r * 0.3, Math.max(1, r * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
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
    // 等待两帧确保 DOM 已绘制，再开始波浪退潮
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
