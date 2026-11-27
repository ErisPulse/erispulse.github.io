/**
 * 视图片段加载器
 *
 * index.html 中通过占位符标记注入位置：
 *     <div data-fragment-slot="home"></div>
 * 加载完成后该占位符会被片段内容整体替换（保持 DOM 顺序）。
 */

const FRAGMENTS = [
  "home",
  "market",
  "docs",
  "settings",
  "about",
  "modals",
];

/** 单个片段请求超时（ms） */
const FRAGMENT_TIMEOUT_MS = 8000;
/** 超时或失败后的重试次数 */
const FRAGMENT_RETRIES = 1;

/**
 * 带超时的 fetch：超时后中止请求并抛错
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { cache: "no-cache", signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/**
 * 抓取单个片段；超时或非 2xx 时重试，重试耗尽后抛出最后一次错误
 * @param {string} name
 * @returns {Promise<string>}
 */
async function fetchFragment(name) {
  const url = `views/${name}.html`;
  let lastErr;
  for (let attempt = 0; attempt <= FRAGMENT_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, FRAGMENT_TIMEOUT_MS);
      if (!res.ok) {
        throw new Error(`Failed to load view fragment: ${url} (${res.status})`);
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * 并行抓取所有视图片段并按顺序注入到对应占位符。
 * 单个片段失败不阻断其余片段注入；全部失败时抛出错误。
 * 注入完成后占位符会被替换为真实 DOM。
 *
 * @returns {Promise<void>}
 */
export async function loadViews() {
  const results = await Promise.allSettled(FRAGMENTS.map(fetchFragment));

  const failed = [];
  results.forEach((result, i) => {
    const name = FRAGMENTS[i];
    if (result.status === "rejected") {
      failed.push(name);
      console.error(`[views] 片段 ${name} 加载失败:`, result.reason);
      return;
    }
    const slot = document.querySelector(`[data-fragment-slot="${name}"]`);
    if (slot) {
      slot.outerHTML = result.value;
    } else {
      // 兜底：未找到占位符时追加到 main 末尾
      const main = document.querySelector("main.main-content");
      if (main) main.insertAdjacentHTML("beforeend", result.value);
    }
  });

  if (failed.length === FRAGMENTS.length) {
    throw new Error("All view fragments failed to load");
  }
}
