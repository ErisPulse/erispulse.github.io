








import { I18n } from "./i18n.js";
import { HeroCanvas } from "./hero-canvas.js";
import { loadUserSettings } from "./core/state.js";
import { loadViews } from "./core/views.js";
import * as settings from "./modules/settings.js";
import * as nav from "./modules/nav.js";
import * as market from "./modules/marketplace.js";
import * as docs from "./modules/docs.js";
import * as builder from "./modules/builder.js";
import { renderFriendLinks } from "./modules/about.js";
import * as home from "./modules/home.js";
import { SubmitModuleManager } from "./modules/submit.js";






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
  builder.setupBuilder();
  market.setupModals();
  settings.setupSettings();
  renderFriendLinks();
  home.setupHomeAnimations();
  home.initBannerCarousel();
  home.initInstallOverlay();
  nav.setupOnlineOffline();
  SubmitModuleManager.init();
}




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




async function bootstrap() {
  try {
    await loadViews();
    runInit();
  } catch (err) {
    console.error("Failed to bootstrap application:", err);
  } finally {
     
    if (HeroCanvas) HeroCanvas.init();
    hideLoader();
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
