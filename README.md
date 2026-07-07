# ErisPulse 官网

[![GitHub license](https://img.shields.io/github/license/ErisPulse/erispulse.github.io?color=blue)](https://github.com/ErisPulse/erispulse.github.io/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/ErisPulse/erispulse.github.io?style=social)](https://github.com/ErisPulse/erispulse.github.io)
[![GitHub forks](https://img.shields.io/github/forks/ErisPulse/erispulse.github.io?style=social)](https://github.com/ErisPulse/erispulse.github.io/network/members)

ErisPulse 高性能异步机器人开发框架官方网站

## 在线访问

| 页面 | 链接 | 说明 |
|------|------|------|
| 官方网站 | [www.erisdev.com](https://www.erisdev.com) | 首页 |
| 文档中心 | [docs.html](https://www.erisdev.com/docs.html) | 完整的开发文档 |
| 模块市场 | [market.html](https://www.erisdev.com/market.html) | 发现和分享模块 |
| 模块构建器 | [builder.erisdev.com](https://builder.erisdev.com) | 可视化创建模块（独立站点） |
| 关于我们 | [about.html](https://www.erisdev.com/about.html) | 团队和贡献者 |

## 快速开始

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/ErisPulse/erispulse.github.io.git
cd erispulse.github.io

# 2. 启动本地服务器
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000

# 3. 访问网站
# 打开浏览器访问 http://localhost:8000
```

### GitHub Pages 部署

本仓库已配置为 GitHub Pages，每次推送到 `main` 分支会自动部署：

```bash
git add .
git commit -m "更新网站内容"
git push origin main
```

部署完成后，网站将在几分钟后自动更新。

## 项目结构

```
erispulse.github.io/
├── assets/                # 静态资源
│   ├── css/               # 样式文件
│   ├── img/               # 图片资源
│   └── js/                # JavaScript 文件
│       ├── app.js         # 应用入口
│       ├── config.js      # 配置文件
│       ├── core/          # 核心模块
│       └── modules/       # 功能模块
├── docs/                  # 文档内容（Markdown）
├── views/                 # 视图片段（由 JS 动态加载）
├── index.html             # 首页
├── docs.html              # 文档中心（SEO 占位符）
├── market.html            # 模块市场（SEO 占位符）
├── builder.html           # 模块构建器（重定向至 builder.erisdev.com）
├── about.html             # 关于我们（SEO 占位符）
├── settings.html          # 设置页面（SEO 占位符）
├── legacy_mods.html       # 旧版模块页面
├── manifest.json          # PWA 清单文件
├── sw.js                  # Service Worker
├── sitemap.xml            # 网站地图
├── robots.txt             # 爬虫配置
├── CNAME                  # 自定义域名配置
├── favicon.ico            # 网站图标
├── SEO_OPTIMIZATION.md    # SEO 优化说明
└── README.md              # 本文件
```

## 技术栈

- **核心**: 原生 JavaScript (ES6+)
- **样式**: CSS3
- **文档渲染**: Marked.js
- **代码高亮**: Prism.js
- **图标**: Font Awesome 6
- **数据可视化**: Chart.js
- **图表**: Mermaid
- **PWA**: Service Worker

## 架构说明

本网站采用单页应用 (SPA) 架构，使用多个独立的 HTML 文件作为 SEO 占位符：

```
独立 HTML 文件（SEO 占位符）
  index.html  docs.html  market.html  about.html
        │            │            │            │
        └────────────┼────────────┼────────────┘
                     │
          共享的 JS 和 CSS
          • app.js (入口)
          • nav.js (路由)
          • core/* (核心模块)
          • modules/* (功能)
          • assets/css/*.css
                     │
          动态加载视图片段
          • views/home.html
          • views/docs.html
          • views/market.html
          • ...
```

**SEO 占位符说明**: `docs.html`、`market.html` 等文件是 SEO 占位符，本质上都是 SPA 的入口。它们共享相同的 JS、CSS 和视图片段，只是预设了不同的初始视图，用于让搜索引擎独立索引每个页面。


## 贡献指南

我们欢迎任何形式的贡献！

### 报告问题

如果您发现了网站上的问题或有改进建议，请访问 [Issues 页面](https://github.com/ErisPulse/erispulse.github.io/issues) 创建新的 Issue。

### 提交代码

1. Fork 本仓库
2. 创建您的功能分支 `git checkout -b feature/您的功能名称`
3. 提交您的更改 `git commit -m '添加某种功能'`
4. 推送到分支 `git push origin feature/您的功能名称`
5. 创建 Pull Request

## 社区

| 平台 | 链接 | 说明 |
|------|------|------|
| GitHub | [ErisPulse](https://github.com/ErisPulse) | 主仓库和组织 |
| Telegram | [t.me/ErisPulse](https://t.me/ErisPulse) | 官方群组 |
| QQ 群 | [点击加入](https://qm.qq.com/q/TOwnCmypcy) | 中文社区 |
| 云湖 | [加入群聊](https://yhfx.jwznb.com/share?key=mr0vMbXhKJGt&ts=1770192749) | 中文社区 |

## 致谢

感谢以下开源项目和资源：

- [Font Awesome](https://fontawesome.com/) - 图标库
- [Marked.js](https://marked.js.org/) - Markdown 解析器
- [Prism.js](https://prismjs.com/) - 代码高亮
- [Chart.js](https://www.chartjs.org/) - 数据可视化
- [Mermaid](https://mermaid-js.github.io/) - 图表绘制

## 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

Made with love by ErisPulse Team

[官网](https://www.erisdev.com) • [文档](https://www.erisdev.com/docs.html) • [GitHub](https://github.com/ErisPulse)
