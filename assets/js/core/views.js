/**
 * 视图片段加载器
 *
 * 将原先内联在 index.html 中的 5 个视图容器 + 模态框拆分为独立的 HTML 片段，
 * 启动时并行抓取并注入到对应的占位符中，然后再执行各模块初始化。
 *
 * 说明：由于现有 JS 在初始化时会跨所有视图查询 DOM 元素，
 * 因此这里采用「启动时全部加载」（在 page-loader 遮罩下并行 fetch）的策略，
 * 而非真正的单视图懒加载。
 *
 * index.html 中通过占位符标记注入位置：
 *     <div data-fragment-slot="home"></div>
 * 加载完成后该占位符会被片段内容整体替换（保持 DOM 顺序）。
 */

const FRAGMENTS = [
  "home",
  "market",
  "docs",
  "builder",
  "settings",
  "about",
  "modals",
];

/**
 * 抓取单个片段
 * @param {string} name
 * @returns {Promise<string>}
 */
async function fetchFragment(name) {
  const url = `views/${name}.html`;
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load view fragment: ${url} (${res.status})`);
  }
  return res.text();
}

/**
 * 并行抓取所有视图片段并按顺序注入到对应占位符。
 * 注入完成后占位符会被替换为真实 DOM。
 *
 * @returns {Promise<void>}
 */
export async function loadViews() {
  const htmls = await Promise.all(FRAGMENTS.map(fetchFragment));

  FRAGMENTS.forEach((name, i) => {
    const slot = document.querySelector(`[data-fragment-slot="${name}"]`);
    if (slot) {
      slot.outerHTML = htmls[i];
    } else {
      // 兜底：未找到占位符时追加到 main 末尾
      const main = document.querySelector("main.main-content");
      if (main) main.insertAdjacentHTML("beforeend", htmls[i]);
    }
  });
}
