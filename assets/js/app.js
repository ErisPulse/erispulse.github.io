








import { I18n } from "./i18n.js";
import { loadUserSettings } from "./core/state.js";
import { loadViews } from "./core/views.js";
import * as settings from "./modules/settings.js";
import * as nav from "./modules/nav.js";
import * as market from "./modules/marketplace.js";
import * as docs from "./modules/docs.js";
import { renderFriendLinks, renderDependencies } from "./modules/about.js";
import * as home from "./modules/home.js";
import { SubmitModuleManager } from "./modules/submit.js";
import { CommunityManager } from "./modules/community.js";
import { AuthManager } from "./core/auth.js";









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
   
   
  AuthManager.init();
  SubmitModuleManager.init();
  CommunityManager.init();
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
  home.initCommunityTeaser();
  nav.setupOnlineOffline();
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
     
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

     
    const sweepY = H + bandH - eased * (H + bandH * 2);

     
    const converge = Math.max(0, (t - 0.7) / 0.3);

    ctx.clearRect(0, 0, W, H);

     
    const opaqueEnd = sweepY - softEdge;
    if (opaqueEnd > 0) {
      ctx.fillStyle = `rgb(${bgRGB})`;
      ctx.fillRect(0, 0, W, Math.min(H, opaqueEnd));
    }

     
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

     
    for (const b of bubbles) {
      const yOff = b.yOff * (1 - converge * 0.7);
      const r = b.r * (1 - converge * 0.5);
      if (r < 2) continue;
      const bx = b.x + Math.sin(now * b.wSpeed + b.wobble) * 6;
      const by = sweepY + yOff + Math.cos(now * b.wSpeed + b.wobble) * 4;
      if (by + r < 0 || by - r > H) continue;

       
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * b.alpha})`;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();

       
      ctx.strokeStyle = `rgba(${pRGB}, ${0.12 * b.alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

       
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




async function bootstrap() {
  try {
    await loadViews();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
     
     
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
