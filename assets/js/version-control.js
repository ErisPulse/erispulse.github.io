/**
 * 版本控制和缓存管理
 *
 * 用于防止浏览器缓存旧版本的 JavaScript 和 CSS 导致的问题。
 * 当检测到版本更新时，会提示用户刷新页面。
 */

// 当前应用版本
const APP_VERSION = "1.0.0";
const CACHE_VERSION_KEY = "erispulse_cache_version";
const CACHE_CLEAR_KEY = "erispulse_clear_cache";

/**
 * 检查版本是否需要更新
 */
export function checkVersion() {
  const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);

  // 如果缓存版本不存在或与新版本不同，需要清除缓存
  if (cachedVersion !== APP_VERSION) {
    console.log(`版本更新: ${cachedVersion} -> ${APP_VERSION}`);

    // 清除 localStorage 中的缓存数据
    clearCache();

    // 更新缓存版本
    localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION);

    // 检查是否需要提示用户刷新
    if (cachedVersion) {
      showVersionUpdateNotice();
    }
  }
}

/**
 * 清除所有缓存
 */
export function clearCache() {
  try {
    // 清除 Service Worker 缓存
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log("Service Worker 已注销");
          });
        });
      });
    }

    // 清除 localStorage 中的缓存相关数据（保留用户设置）
    const userSettings = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("theme_") || key.startsWith("lang_"))) {
        userSettings[key] = localStorage.getItem(key);
      }
    }

    // 清除所有 localStorage
    localStorage.clear();

    // 恢复用户设置
    Object.entries(userSettings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    // 清除 sessionStorage
    sessionStorage.clear();

    console.log("缓存已清除");
  } catch (error) {
    console.error("清除缓存失败:", error);
  }
}

/**
 * 强制刷新页面（不使用缓存）
 */
export function forceRefresh() {
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now());
  window.location.href = url.toString();
}

/**
 * 显示版本更新提示
 */
function showVersionUpdateNotice() {
  // 检查是否已经显示过更新提示
  if (sessionStorage.getItem(CACHE_CLEAR_KEY)) {
    return;
  }

  // 创建提示元素
  const notice = document.createElement("div");
  notice.id = "version-update-notice";
  notice.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  notice.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="font-size: 24px;">🔄</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">版本已更新</div>
        <div style="opacity: 0.9; font-size: 12px;">检测到新版本，建议刷新页面以获取最新功能</div>
      </div>
    </div>
    <div style="margin-top: 12px; display: flex; gap: 8px;">
      <button id="refresh-btn" style="
        flex: 1;
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
        transition: transform 0.2s;
      ">立即刷新</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
      ">稍后</button>
    </div>
  `;

  // 添加样式
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    #version-update-notice button:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);

  // 添加到页面
  document.body.appendChild(notice);

  // 绑定事件
  document.getElementById("refresh-btn").addEventListener("click", () => {
    sessionStorage.setItem(CACHE_CLEAR_KEY, "true");
    forceRefresh();
  });

  document.getElementById("dismiss-btn").addEventListener("click", () => {
    sessionStorage.setItem(CACHE_CLEAR_KEY, "true");
    notice.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      notice.remove();
    }, 300);
  });

  // 10秒后自动消失
  setTimeout(() => {
    if (notice.parentNode) {
      notice.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        if (notice.parentNode) {
          notice.remove();
        }
      }, 300);
    }
  }, 10000);
}

/**
 * 监听 Service Worker 更新
 */
export function setupServiceWorkerUpdate() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service Worker 已更新");
      // 显示刷新提示
      showVersionUpdateNotice();
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "UPDATE_AVAILABLE") {
        console.log("新版本可用");
        showVersionUpdateNotice();
      }
    });
  }
}

/**
 * 手动触发版本检查和更新
 */
export function manualUpdateCheck() {
  console.log("手动检查更新...");
  // 暂时更新版本号以触发更新逻辑
  const currentVersion = localStorage.getItem(CACHE_VERSION_KEY);
  if (currentVersion) {
    localStorage.removeItem(CACHE_VERSION_KEY);
  }
  checkVersion();
  forceRefresh();
}

// 暴露全局函数（用于控制台调试）
if (typeof window !== "undefined") {
  window.ErisPulseVersionControl = {
    checkVersion,
    clearCache,
    forceRefresh,
    manualUpdateCheck,
    APP_VERSION,
  };
}

// 页面加载时自动检查版本
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkVersion);
} else {
  checkVersion();
}
