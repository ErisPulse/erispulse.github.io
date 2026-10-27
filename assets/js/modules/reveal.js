










const REVEAL_SELECTORS = [
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
     
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${(i % 4) * 0.06}s`);
    io.observe(el);
  });
}
