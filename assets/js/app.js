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
 * 波浪退潮揭幕：SVG 路径从右下角退向左上角，前沿带平滑波浪。
 * 使用 Catmull-Rom 三次贝塞尔确保曲线丝滑（绝非多边形）。
 */
function smoothWaveSegment(x1, y1, x2, y2) {
  const amp = 6, cycles = 2.5, N = 20;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.5) return ` L ${x2.toFixed(2)},${y2.toFixed(2)}`;
  const px = -dy / len, py = dx / len;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = Math.sin(t * Math.PI * 2 * cycles) * amp;
    pts.push([x1 + dx * t + px * w, y1 + dy * t + py * w]);
  }
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)}` +
         ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)}` +
         ` ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

function buildTidePath(progress) {
  // progress 0→1：覆盖区从满屏退向左上角
  const C = 200 * (1 - progress);
  if (C <= 0.5) return "M 0,0 Z";
  let d = "M 0,0";
  if (C >= 100) {
    d += ` L 100,0 L 100,${(C - 100).toFixed(2)}`;
    d += smoothWaveSegment(100, C - 100, C - 100, 100);
    d += " L 0,100";
  } else {
    d += ` L ${C.toFixed(2)},0`;
    d += smoothWaveSegment(C, 0, 0, C);
  }
  return d + " Z";
}

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

  // 读取品牌色，让波浪在不同主题下都清晰可见
  const css = getComputedStyle(document.documentElement);
  const pRGB = css.getPropertyValue("--primary-rgb").trim();

  // 创建全屏 SVG 波浪遮罩（品牌色，无论浅色/深色都可见）
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "reveal-tide");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  // 两层波浪退潮速度微差，营造纵深感
  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("fill", `rgba(${pRGB}, 0.10)`);
  svg.appendChild(path1);
  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("fill", `rgba(${pRGB}, 0.22)`);
  svg.appendChild(path2);

  document.body.appendChild(svg);
  // 隐藏 loader（被 SVG 波浪遮罩无缝覆盖，无视觉跳变）
  loader.style.display = "none";

  // 波浪退潮动画：覆盖区从右下退向左上
  const duration = 850;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const d1 = buildTidePath(eased);
    // 顶层稍快退潮，在波前留下一道底层淡色带，增加层次
    const d2 = buildTidePath(Math.min(1, eased * 1.05));
    path1.setAttribute("d", d1);
    path2.setAttribute("d", d2);
    if (t < 1) requestAnimationFrame(frame);
    else svg.remove();
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
