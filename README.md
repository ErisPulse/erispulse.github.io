# ErisPulse-Site

这是 ErisPulse 框架的官网仓库，托管于 GitHub Pages

## 在线访问

- ErisPulse 主仓库: https://github.com/ErisPulse/ErisPulse
- 官方网站: https://www.erisdev.com
- 文档中心: https://www.erisdev.com/#docs

## 快速开始

### 本地运行

1. 克隆仓库

```bash
git clone https://github.com/ErisPulse/erispulse.github.io.git
cd erispulse.github.io
```

2. 启动本地服务器

由于这是静态网站，您可以使用任何本地服务器：

```bash
# 使用 Python 内置服务器
python -m http.server 8000

# 或使用 Node.js http-server
npx http-server -p 8000

# 或者使用vscode的live server等拓展
```

3. 访问网站

打开浏览器访问 `http://localhost:8000`

### GitHub Pages 部署

本仓库已配置为 GitHub Pages 仓库，每次推送到 `main` 分支会自动部署：

```bash
git add .
git commit -m "更新网站内容"
git push origin main
```

部署完成后，网站将在几分钟后自动更新。

## 项目结构

```
ErisPulse-Site/
├── assets/                # 静态资源
│   ├── css/               # 样式文件
│   ├── img/               # 图片资源
│   └── js/                # JavaScript 文件
├── docs/                  # 文档内容
├── index.html             # 主页面
├── legacy_mods.html       # 旧版模块页面
├── manifest.json          # PWA 清单文件
├── sw.js                  # Service Worker 注册脚本
├── sitemap.xml            # 网站地图
├── robots.txt             # 爬虫配置
├── favicon.ico            # 网站图标
├── CNAME                  # 自定义域名配置
└── README.md              # 本文件
```

## 贡献指南

我们欢迎任何形式的贡献！以下是一些参与方式：

### 报告问题

如果您发现了网站上的问题或有改进建议，请访问 [Issues 页面](https://github.com/ErisPulse/erispulse.github.io/issues) 创建新的 Issue。

### 提交代码

1. Fork 本仓库
2. 创建您的功能分支 `git checkout -b feature/您的功能名称`
3. 提交您的更改 `git commit -m '添加某种功能'`
4. 推送到分支 `git push origin feature/您的功能名称`
5. 创建 Pull Request

## 社区

- QQ 群: https://qm.qq.com/q/TOwnCmypcy
- GitHub: https://github.com/ErisPulse
- Telegram: https://t.me/ErisPulse

### 头像版权声明

网站使用的 Logo 和头像版权归原作者所有：
- 作者：げのげ
- PID：96369911
- UID：63887595

## 致谢

感谢以下开源项目和资源：
- Font Awesome 
- Marked.js
- Prism.js
- Chart.js
- Mermaid
