














const FRAGMENTS = [
  "home",
  "market",
  "docs",
  "settings",
  "about",
  "modals",
];






async function fetchFragment(name) {
  const url = `views/${name}.html`;
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load view fragment: ${url} (${res.status})`);
  }
  return res.text();
}







export async function loadViews() {
  const htmls = await Promise.all(FRAGMENTS.map(fetchFragment));

  FRAGMENTS.forEach((name, i) => {
    const slot = document.querySelector(`[data-fragment-slot="${name}"]`);
    if (slot) {
      slot.outerHTML = htmls[i];
    } else {
       
      const main = document.querySelector("main.main-content");
      if (main) main.insertAdjacentHTML("beforeend", htmls[i]);
    }
  });
}
