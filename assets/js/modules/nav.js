/**
 * 导航与路由：汉堡菜单、基于 hash 的视图切换、Service Worker 注册、在线/离线感知
 */

import { I18n } from "../i18n.js";
import { state } from "../core/state.js";
import { showMessage } from "../core/notify.js";
import * as docs from "./docs.js";
import * as market from "./marketplace.js";
import { loadContributors } from "./about.js";

let _hashProgrammatic = false;

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("/sw.js")
        .then(function (registration) {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        })
        .catch(function (err) {
          console.log("ServiceWorker registration failed: ", err);
        });
    });
  }
}

// ==================== 在线/离线感知 ====================
export function setupOnlineOffline() {
  window.addEventListener("online", function () {
    console.log("网络已恢复");
    showMessage(I18n.t("common.onlineRestored"), "success");
    docs.updateDocsCacheStatus();
    // 网络恢复后重新检查文档版本
    state.versionNotified = false;
    setTimeout(docs.runBackgroundVersionCheck, 1500);
  });
  window.addEventListener("offline", function () {
    console.log("网络已断开，切换到离线缓存模式");
    showMessage(I18n.t("common.offlineMode"), "error");
    docs.updateDocsCacheStatus();
  });
}

// ==================== UI交互 ====================
export function setupHamburgerMenu() {
  const hamburger = document.getElementById("hamburger");
  const navContainer = document.getElementById("nav-container");
  if (!hamburger || !navContainer) return;

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburger.classList.toggle("active");
    navContainer.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!navContainer.contains(e.target) && e.target !== hamburger) {
      hamburger.classList.remove("active");
      navContainer.classList.remove("active");
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        hamburger.classList.remove("active");
        navContainer.classList.remove("active");
      }
    });
  });
}

export function setupViewSwitching() {
  const viewLinks = document.querySelectorAll("[data-view]");

  // 为所有 [data-view] 链接设置正确的 hash href，
  // 这样右键「在新标签页中打开」/ 中键点击也能跳转到对应视图，
  // 而不是因为 href="#" 而跳回首页。
  viewLinks.forEach((link) => {
    const view = link.getAttribute("data-view");
    if (view === "home") {
      link.setAttribute("href", window.location.pathname);
    } else if (view) {
      link.setAttribute("href", "#" + view);
    }
  });

  window.addEventListener("hashchange", switchViewByHash);

  viewLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // 允许中键 / Ctrl / Cmd / Shift 点击交给浏览器原生「在新标签页打开」
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      const view = this.getAttribute("data-view");
      updateView(view, true); // 用户点击，需要更新 hash
    });
  });

  // 优先使用预设的初始视图（从 window.__INITIAL_VIEW__ 读取）
  if (window.__INITIAL_VIEW__) {
    updateView(window.__INITIAL_VIEW__, false); // 初始视图，不更新 hash
  } else {
    switchViewByHash();
  }
}

function switchViewByHash() {
  if (_hashProgrammatic) return;

  // 如果有预设的初始视图，优先使用
  if (window.__INITIAL_VIEW__) {
    const view = window.__INITIAL_VIEW__;
    window.__INITIAL_VIEW__ = null; // 清除预设值，避免重复使用
    updateView(view);
    return;
  }

  const hash = window.location.hash.substring(1);
  let view = "home";

  if (hash.startsWith("docs")) {
    view = "docs";
    const docMatch = hash.match(/docs\/(.+)/);
    if (docMatch && docMatch[1]) {
      setTimeout(() => {
        docs.navigateToDocument(docMatch[1]);
      }, 500);
    }
  } else if (hash === "builder" || hash.startsWith("builder/")) {
    view = "builder";
  } else if (hash.startsWith("market")) {
    view = "market";
    const categoryMatch = hash.match(/market\/(.+)/);
    if (categoryMatch && categoryMatch[1]) {
      setTimeout(() => {
        const categoryBtn = document.querySelector(
          `.category-btn[data-category="${categoryMatch[1]}"]`,
        );
        if (categoryBtn) {
          categoryBtn.click();
        }
      }, 500);
    }
  } else if (
    hash === "changelog" ||
    hash.startsWith("dev-") ||
    hash.startsWith("quick-start") ||
    hash.startsWith("adapter-standards") ||
    hash.startsWith("use-core") ||
    hash.startsWith("platform-features") ||
    hash.startsWith("ai-module")
  ) {
    view = "docs";
    const docPath = hash === "changelog" ? "changelog" : hash;
    setTimeout(() => {
      docs.navigateToDocument(docPath);
    }, 500);
  } else if (hash === "about") {
    view = "about";
  } else if (hash === "settings") {
    view = "settings";
  }

  updateView(view);
}

export function updateView(view, updateHash = false) {
  document
    .querySelectorAll("[data-view]")
    .forEach((link) => link.classList.remove("active"));
  if (document.querySelector(`[data-view="${view}"]`)) {
    document.querySelector(`[data-view="${view}"]`).classList.add("active");
  }

  document.querySelectorAll(".view-container").forEach((container) => {
    container.classList.remove("active");
  });
  var targetView = document.getElementById(`${view}-view`);
  if (targetView) targetView.classList.add("active");

  // 只在用户点击导航时更新 hash，避免 SEO 页面二次跳转
  if (updateHash) {
    _hashProgrammatic = true;
    var currentHash = window.location.hash.substring(1);
    if (view === "home") {
      if (currentHash !== "") {
        history.pushState(null, null, window.location.pathname);
      }
    } else if (view === "docs" && currentHash.startsWith("docs/")) {
      // keep docs sub-path hash intact
    } else if (currentHash !== view && !currentHash.startsWith(view + "/")) {
      window.location.hash = view;
    }
    setTimeout(function () {
      _hashProgrammatic = false;
    }, 50);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (view === "market") {
    market.loadModuleData();
  }

  if (view === "docs") {
    docs.loadDocsLibs();
    docs.loadDocsIndexes();
  }

  if (view === "about") {
    loadContributors();
  }

  if (view === "settings") {
    docs.updateDocsCacheStatus();
    docs.checkDocsVersionUpdate();
  }

  // 构建器为全屏视图，隐藏页脚以铺满界面
  const footer = document.querySelector("footer");
  if (footer) {
    if (view === "builder") {
      footer.style.display = "none";
    } else {
      footer.style.display = "";
    }
  }
}
