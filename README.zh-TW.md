[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [Русский](README.ru.md)

<div align="center">

<img src="https://raw.githubusercontent.com/ErisPulse/ErisPulse/main/.github/assets/ErisPulseLogo.png" width="180" alt="erispulse.github.io" />

# erispulse.github.io

**ErisPulse 官方網站與文件**

<p>
  <a href="https://github.com/ErisPulse/ErisPulse/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
  <img src="https://raw.githubusercontent.com/ErisPulse/.github/main/assets/badges/official.svg" alt="ErisPulse">
</p>

</div>

---

## 在线访问

| 页面 | 链接 | 说明 |
|------|------|------|
| 官方网站 | [www.erisdev.com](https://www.erisdev.com) | 首页 |
| 文档中心 | [docs.html](https://www.erisdev.com/docs.html) | 完整的开发文档 |
| 模块市场 | [market.html](https://www.erisdev.com/market.html) | 发现和分享模块 |
| AI Builder 模块构建器 | [builder.erisdev.com](https://builder.erisdev.com) | 自然语言生成可用模块（独立站点） |
| 关于我们 | [about.html](https://www.erisdev.com/about.html) | 团队和贡献者 |

## 本地运行

```bash
git clone https://github.com/ErisPulse/erispulse.github.io.git
cd erispulse.github.io
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## 部署

仓库已配置 GitHub Pages，推送到 `main` 分支自动部署，几分钟后生效。

## 项目结构

```
erispulse.github.io/
├── assets/        # 静态资源（css / img / js）
├── docs/          # 文档内容（Markdown）
├── views/         # 视图片段（由 JS 动态加载）
├── index.html     # 首页
├── docs.html      # 文档中心
├── market.html    # 模块市场
├── about.html     # 关于我们
└── sw.js          # Service Worker（PWA）
```

`docs.html`、`market.html` 等独立 HTML 是 SPA 的 SEO 入口，共享相同的 JS/CSS 与视图片段，仅预设不同的初始视图。

## 技术栈

原生 JavaScript (ES6+) · CSS3 · Marked.js · Prism.js · Font Awesome 6 · Chart.js · Mermaid

## 贡献

发现问题或改进建议请到 [Issues](https://github.com/ErisPulse/erispulse.github.io/issues) 提交；代码贡献走标准 Fork → 分支 → PR 流程。

## 社区

| 平台 | 链接 |
|------|------|
| GitHub | [ErisPulse](https://github.com/ErisPulse) |
| Telegram | [t.me/ErisPulse](https://t.me/ErisPulse) |
| QQ 群 | [点击加入](https://qm.qq.com/q/TOwnCmypcy) |
| 云湖 | [加入群聊](https://yhfx.jwznb.com/share?key=mr0vMbXhKJGt&ts=1770192749) |

## 许可证

[MIT License](LICENSE)
