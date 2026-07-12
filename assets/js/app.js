








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




(function setupLoaderLogo() {
  const img = document.querySelector(".loader-icon");
  if (!img) return;
  const reveal = () => img.classList.add("loaded");
  if (img.complete && img.naturalWidth > 0) reveal();
  else img.addEventListener("load", reveal, { once: true });
})();






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

   
  const css = getComputedStyle(document.documentElement);
  const pRGB = css.getPropertyValue("--primary-rgb").trim();

   
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "reveal-tide");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

   
  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("fill", `rgba(${pRGB}, 0.10)`);
  svg.appendChild(path1);
  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("fill", `rgba(${pRGB}, 0.22)`);
  svg.appendChild(path2);

  document.body.appendChild(svg);
   
  loader.style.display = "none";

   
  const duration = 850;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const d1 = buildTidePath(eased);
     
    const d2 = buildTidePath(Math.min(1, eased * 1.05));
    path1.setAttribute("d", d1);
    path2.setAttribute("d", d2);
    if (t < 1) requestAnimationFrame(frame);
    else svg.remove();
  }
  requestAnimationFrame(frame);
}




async function bootstrap() {
  try {
    await loadViews();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
     
    if (HeroCanvas) HeroCanvas.init();
     
    requestAnimationFrame(() => requestAnimationFrame(hideLoader));
  }
}





function start() {
  bootstrap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
