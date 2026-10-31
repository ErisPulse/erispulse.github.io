[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [Русский](README.ru.md)

<div align="center">

<img src="https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/.github/assets/ErisPulseLogo.png" width="180" alt="erispulse.github.io" />

# erispulse.github.io

**The official ErisPulse website & documentation**

<p>
  <a href="https://github.com/ErisPulse/ErisPulse/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
  <img src="https://raw.githubusercontent.com/ErisPulse/.github/main/assets/badges/official.svg" alt="ErisPulse">
</p>

</div>

---

## Online

| Page | Link | Notes |
|------|------|-------|
| Website | [www.erisdev.com](https://www.erisdev.com) | Home |
| Docs | [docs.html](https://www.erisdev.com/docs.html) | Full developer documentation |
| Module market | [market.html](https://www.erisdev.com/market.html) | Discover and share modules |
| AI Builder | [builder.erisdev.com](https://builder.erisdev.com) | Build modules from natural language (separate site) |
| About | [about.html](https://www.erisdev.com/about.html) | Team & contributors |

## Run locally

```bash
git clone https://github.com/ErisPulse/erispulse.github.io.git
cd erispulse.github.io
python -m http.server 8000
# open http://localhost:8000
```

## Deployment

GitHub Pages is configured: pushing to `main` deploys automatically within minutes.

## Structure

```
erispulse.github.io/
├── assets/        # static assets (css / img / js)
├── docs/          # documentation content (Markdown)
├── views/         # view fragments (loaded dynamically by JS)
├── index.html     # home
├── docs.html      # docs center
├── market.html    # module market
├── about.html     # about
└── sw.js          # Service Worker (PWA)
```

Standalone pages like `docs.html` and `market.html` are SEO entry points for the SPA — they share the same JS/CSS and view fragments, each preloading a different initial view.

## Tech stack

Vanilla JavaScript (ES6+) · CSS3 · Marked.js · Prism.js · Font Awesome 6 · Chart.js · Mermaid

## Contributing

Bugs and ideas go to [Issues](https://github.com/ErisPulse/erispulse.github.io/issues); code contributions follow the standard Fork → branch → PR flow.

## Community

| Platform | Link |
|------|------|
| GitHub | [ErisPulse](https://github.com/ErisPulse) |
| Telegram | [t.me/ErisPulse](https://t.me/ErisPulse) |
| QQ group | [Join](https://qm.qq.com/q/TOwnCmypcy) |
| Yunhu | [Join](https://yhfx.jwznb.com/share?key=mr0vMbXhKJGt&ts=1770192749) |

## License

[MIT License](LICENSE)
