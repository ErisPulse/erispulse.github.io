








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




async function bootstrap() {
  try {
    await loadViews();
    initReveal();
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
