/**
 * 滚动入场动画（IntersectionObserver）
 *
 * 给配置选择器命中的元素加 .reveal 基础类，进入视口后追加 .reveal-in
 * 触发上浮淡入。命中过的元素不再重复处理（unobserve）。
 *
 * 尊重两类降级：
 *  - html.no-animations（设置页手动关闭动画）→ 完全不启用
 *  - prefers-reduced-motion → CSS 侧直接呈现终态（见 main.css）
 */

const REVEAL_SELECTORS = [
  "#home-community-grid > *",
  ".community-boards > *",
];

export function initReveal() {
  if (document.documentElement.classList.contains("no-animations")) return;
  if (!("IntersectionObserver" in window)) return;

  const targets = REVEAL_SELECTORS.flatMap((sel) =>
    Array.from(document.querySelectorAll(sel))
  );
  if (!targets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  targets.forEach((el, i) => {
    // 同屏内的前几个元素给少量阶梯延迟，避免一排卡片同时起跳
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${(i % 4) * 0.06}s`);
    io.observe(el);
  });
}
