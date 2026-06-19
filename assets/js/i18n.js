/**
 * ErisPulse i18n 国际化模块
 * 支持语言：zh-CN（简体中文）、en（English）、zh-TW（繁體中文）
 */

export const I18n = (function () {
  const STORAGE_KEY = "erispulse-lang";

  /**
   * 根据浏览器语言偏好检测默认语言
   * zh-CN → 简体中文，其它zh开头 → 繁體中文，其余 → English
   */
  function detectBrowserLang() {
    const lang = (
      navigator.language ||
      navigator.userLanguage ||
      "en"
    ).toLowerCase();
    if (lang === "zh-cn" || lang === "zh") return "zh-CN";
    if (lang.startsWith("zh")) return "zh-TW";
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("ru")) return "ru";
    return "en";
  }

  let currentLang = localStorage.getItem(STORAGE_KEY) || detectBrowserLang();

  // ==================== 翻译字典 ====================
  const messages = {
    "zh-CN": {
      // 导航栏
      "nav.home": "首页",
      "nav.market": "模块市场",
      "nav.docs": "文档中心",
      "nav.builder": "构建器",
      "nav.settings": "设置",
      "nav.about": "我们",

      // 首页 Hero
      "hero.subtitle": "事件驱动 · 多平台 · 一个框架搞定一切",
      "hero.start": "开始使用",
      "hero.docs": "文档中心",
      "hero.browse": "模块市场",

      // 首页特性区
      "features.title": "核心特性",
      "features.eventdriven.code":
        '@message.on_message()\nasync def handler(event):\n    text = event.get_text()\n    await event.reply(f"收到: {text}")',
      "features.eventdriven.title": "事件驱动架构",
      "features.eventdriven.desc":
        "所有交互通过事件传递，从平台接收到模块处理形成完整的异步事件流",
      "features.ob12.title": "OneBot12 标准兼容",
      "features.ob12.desc":
        "统一的事件格式标准，确保不同平台间的代码一致性与可移植性",
      "features.ob12.code":
        '@command("hello")\nasync def hello_handler(event):\n    platform = event.get_platform()\n    # 同一份代码，多平台运行\n    await event.reply("Hello!")',
      "features.aicoding.title": "AI 辅助开发",
      "features.aicoding.desc":
        "提供完整的开发文档与规范，让 AI 直接生成可用模块，支持 Vibe Coding 工作流",
      "features.aicoding.code":
        '# 将 ErisPulse 物料投喂给 AI\n# 即可直接生成可用模块\n\nclass AIModule(BaseModule):\n    async def on_load(self):\n        self.logger.info("AI 生成就绪")',
      "features.senddsl.title": "SendDSL 链式发送",
      "features.senddsl.desc":
        "Send.To().At().Reply().Text() 风格的链式消息发送接口，简洁而表达力强",
      "features.modular.title": "模块化与懒加载",
      "features.modular.desc":
        "模块以独立 PyPI 包分发，支持懒加载、热更新、依赖拓扑排序与优先级控制",
      "features.modular.code":
        '# pip install ErisPulse-MyModule\n# or: epsdk install MyModule\n\nclass Main(BaseModule):\n    @staticmethod\n    def get_load_strategy():\n        return ModuleLoadStrategy(\n            lazy_load=True,   # 首次访问时才初始化\n            priority=10        # 数值越大越先加载\n        )\n\n    async def on_load(self, event):\n        self.logger.info("模块已就绪")',
      "features.middleware.title": "事件中间件",
      "features.middleware.desc":
        "可组合的中间件管道，在事件分发前进行过滤、转换、日志记录等处理",
      "features.interactive.title": "交互式对话",
      "features.interactive.desc":
        "内置确认、选择菜单、表单收集、多轮对话等交互原语，轻松构建复杂交互流程",
      "features.parallel.title": "并行事件处理",
      "features.parallel.desc":
        "同优先级处理器并行执行，不同优先级串行调度，Copy-On-Write 零开销，支持中断控制",
      "features.parallel.code":
        "@message.on_message(priority=10)\nasync def spam_filter(event):\n    if is_spam(event.get_text()):\n        event.mark_processed()  # 中断后续\n\n# 同优先级 → 并行执行，零拷贝\n@message.on_message(priority=0)\nasync def handler_a(event):\n    event['result_a'] = await process_a()\n\n@message.on_message(priority=0)\nasync def handler_b(event):\n    event['result_b'] = await process_b()",
      "features.dashboard.title": "仪表盘",
      "features.dashboard.desc":
        "实时监控适配器状态、模块加载进度与 Bot 在线情况，全局运行状态一目了然",
      "features.hooks.title": "生命周期钩子",
      "features.hooks.desc":
        "在框架运行的每个关键阶段插入自定义逻辑：模块加载、适配器启停、Bot 上下线，全程可监听可响应",
      "features.hooks.code":
        '@sdk.lifecycle.on("module.load")\nasync def on_loaded(data):\n    sdk.logger.info(f"模块加载: {data}")\n\n@sdk.lifecycle.on("adapter.bot.online")\nasync def on_bot_online(data):\n    await notify_admin(f"Bot 上线: {data[\'bot_id\']}")\n\n@sdk.lifecycle.on("adapter.stop")\nasync def on_stop(data):\n    sdk.logger.warning("适配器即将停止")',
      "features.multiplatform.title": "多平台适配",
      "features.multiplatform.desc":
        "一套代码同时对接云湖、Telegram、OneBot11/12、邮件等平台，适配器自动处理协议差异",
      "features.multiplatform.code":
        '@command("hello")\nasync def hello(event):\n    # 云湖 · Telegram · QQ · 邮件...\n    # 同一份代码，所有平台运行\n    platform = event.get_platform()\n    await event.reply(f"Hello from {platform}!")',

      // 模块市场
      "market.title": "模块市场",
      "market.submit": "提交模块",
      "market.search": "搜索模块...",
      "market.total": "总模块数",
      "market.modules": "功能模块",
      "market.adapters": "平台适配器",
      "market.all": "全部模块",
      "market.install": "安装",
      "market.docs": "文档",
      "market.empty": "未找到匹配的模块",
      "market.empty.hint": "尝试不同的搜索关键词或查看所有模块",
      "market.loadFailed": "加载模块失败，请稍后再试",
      "market.reload": "重新加载",
      "market.installCmd": "安装命令",
      "market.unverified": "未验证",

      // 提交模块
      "submit.title": "提交模块",
      "submit.loginTitle": "选择登录方式",
      "submit.loginDesc": "登录后即可提交您的模块到 ErisPulse 生态系统",
      "submit.loginYunhu": "云湖",
      "submit.loginBtn": "GitHub 登录",
      "submit.logout": "退出登录",
      "submit.type": "提交类型",
      "submit.typeModule": "模块 (Module)",
      "submit.typeAdapter": "适配器 (Adapter)",
      "submit.name": "模块名称",
      "submit.nameHint": "英文、数字、下划线、连字符",
      "submit.package": "PyPI 包名",
      "submit.packageHint": "包必须已发布到 PyPI",
      "submit.description": "描述",
      "submit.descriptionPlaceholder": "简要描述模块功能...",
      "submit.author": "作者",
      "submit.repository": "仓库地址",
      "submit.minSdkVersion": "最低 SDK 版本",
      "submit.tags": "标签",
      "submit.tagsPlaceholder": "用逗号分隔，如：工具,AI,解析",
      "submit.submitBtn": "提交",
      "submit.validating": "验证中...",
      "submit.submitting": "提交中...",
      "submit.descTooShort": "描述太短，至少需要 10 个字符",
      "submit.pypiNotFound":
        "包 '{package}' 在 PyPI 上未找到，请先将您的包发布到 PyPI。",
      "submit.alreadyExists": "模块 '{name}' 已存在，请勿重复提交。",
      "submit.successTitle": "提交成功!",
      "submit.successDesc":
        "提交成功！模块已上架模块商店（需要时间刷新缓存以生效），后续管理员会进行验证。",
      "submit.submitAnother": "继续提交",
      "submit.errorTitle": "提交失败",
      "submit.retryBtn": "重试",
      "submit.loginFailed": "登录失败，请重试",
      "submit.loginFailedAll": "登录失败，请重试",
      "submit.oauthNotConfigured": "GitHub 登录暂未配置，请联系管理员",
      "submit.unknownError": "未知错误",

      // 提交模块 - 标签页
      "submit.tabSubmit": "提交模块",
      "submit.tabMyModules": "我的模块",

      // 模块管理
      "manage.loading": "加载中...",
      "manage.empty": "还没有提交过任何模块",
      "manage.cacheHint": "刚提交的模块可能需要几分钟才会显示",
      "manage.loadFailed": "加载失败，请重试",
      "manage.statusVerified": "已验证",
      "manage.statusPending": "待验证",
      "manage.delete": "删除",
      "manage.edit": "编辑",
      "manage.saveEdit": "保存修改",
      "manage.confirmDelete": "确定要删除模块 {name} 吗？此操作不可撤销！",
      "manage.successDelete": "模块已删除",
      "manage.failed": "操作失败，请重试",

      // 文档中心
      "docs.title": "文档中心",
      "docs.welcome": "欢迎使用 ErisPulse",
      "docs.welcome.desc":
        "ErisPulse 是一个开源的 Python 库，目标是提供一个简单、易于使用的框架，用于构建异步、非阻塞的机器人程序。",
      "docs.welcome.hint":
        "点击文档导航中的链接，开始探索 ErisPulse 的功能和用法吧。",
      "docs.edit": "编辑此页",
      "docs.share": "分享",
      "docs.loading": "正在加载文档...",
      "docs.loadFailed": "无法加载文档",
      "docs.loadIndexFailed": "无法加载文档索引",
      "docs.searchTrigger": "搜索文档...",
      "docs.searchPlaceholder": "搜索文档...",
      "docs.searchHint": "按 <kbd>ESC</kbd> 关闭 · <kbd>↑↓</kbd> 导航结果",
      "docs.searchEmpty": "输入关键词开始搜索",
      "docs.noResults": "未找到相关文档",
      "docs.searchResults": "搜索结果",
      "docs.searchIndexLoading": "搜索索引加载中...",
      "docs.backToCategories": "返回分类",
      "docs.backToDocs": "返回文档",
      "docs.toc": "目录",
      "docs.linkCopied": "链接已复制到剪贴板",
      "docs.linkWarning":
        '文档链接提示：点击的链接 "{link}" 暂未适配站内跳转，请使用左侧导航栏手动查找相关文档内容。',
      "docs.docLoaded": "文档已加载",
      "docs.keywordLocated": '已定位到 "{keyword}"',
      "docs.keywordNotFound": "未找到指定内容",
      "docs.prev": "上一篇",
      "docs.next": "下一篇",
      "docs.updatedAgo": "{time} 更新了此文档",
      "docs.noDoc": "请求的文档不存在，可能是URL错误",
      "docs.forbidden": "访问被拒绝，可能是权限问题",
      "docs.serverError": "服务器内部错误，请稍后再试",
      "docs.networkError": "网络连接失败",
      "docs.networkHint": "请检查您的网络连接后重试",
      "docs.rateLimit": "GitHub API请求次数已达上限",
      "docs.rateLimitHint":
        "请等待1小时后重试，或使用GitHub个人访问令牌提高限制",
      "docs.retryHint": "请检查网络连接或稍后再试",
      "docs.loadingModuleDoc": "正在加载文档...",

      // 设置页
      "settings.title": "个性化设置",
      "settings.subtitle": "自定义您的 ErisPulse 体验",
      "settings.animations": "动画效果",
      "settings.animationsToggle": "启用动画效果",
      "settings.animationsDesc": "控制页面过渡动画和交互效果",
      "settings.content": "内容偏好",
      "settings.compact": "紧凑布局",
      "settings.compactDesc": "减少页面间距，显示更多内容",
      "settings.lineNumbers": "显示代码行号",
      "settings.lineNumbersDesc": "在代码块中显示行号",
      "settings.nav": "导航设置",
      "settings.stickyNav": "固定导航栏",
      "settings.stickyNavDesc": "滚动时保持导航栏可见",
      "settings.reset": "重置设置",
      "settings.resetBtn": "重置所有设置",
      "settings.resetDesc": "将所有设置恢复为默认值",
      "settings.resetConfirm":
        "确定要重置所有设置吗？这将恢复所有选项为默认值。",

      // 文档离线缓存
      "settings.docsCache": "文档离线缓存",
      "settings.manageDocsCache": "管理缓存",
      "settings.docsCacheManageTitle": "文档缓存管理",
      "settings.docsCacheManageDesc":
        "查看并清理各语言已缓存的文档内容；“下载当前语言全部文档”会把当前语言加入或更新到完整离线缓存。",
      "settings.offlineFirst": "离线优先模式",
      "settings.offlineFirstDesc":
        "开启后优先使用本地缓存的文档，仅在无缓存时联网获取；断网时自动使用缓存且不会清理",
      "settings.offlineFirstOn": "已启用：优先使用本地缓存，减少联网请求",
      "settings.offlineFirstOff": "已关闭：每次访问都会联网获取最新文档",
      "settings.downloadAll": "下载当前语言全部文档",
      "settings.clearDocsCache": "清除当前语言缓存",
      "settings.clearAllDocsCache": "清除全部缓存",
      "settings.docsCacheClearAllConfirm":
        "确定要清除所有语言的全部文档缓存吗？",
      "settings.docsCacheAllCleared": "全部文档缓存已清除",
      "settings.docsCacheLangCleared": "{lang} 文档缓存已清除",
      "settings.docsCacheClearLang": "清除",
      "settings.docsCacheDownloadLang": "下载/更新",
      "settings.docsCacheCurrentLang": "当前语言",
      "settings.docsCacheNoVersion": "未记录版本",
      "settings.docsCacheNeedIndex": "文档索引尚未加载，请稍后再试",
      "settings.docsCacheOfflineDownload": "当前处于离线状态，无法下载",
      "settings.docsCacheProgress": "下载中... {done}/{total}",
      "settings.docsCacheDownloaded":
        "已下载 {success} 篇文档，{failed} 篇失败",
      "settings.docsCacheCleared": "文档缓存已清除",
      "settings.docsCacheVersion": "（v{version}）",
      "settings.docsCacheLocalized":
        "当前语言已完整本地化{version}，共 {count} 篇",
      "settings.docsCachePartial": "已缓存 {count} 篇文档",
      "settings.docsCacheEmpty": "尚未缓存任何文档",
      "settings.docsCacheFetchingVersion": "正在获取版本信息...",
      "settings.docsCacheUpdateAvailable":
        "文档版本已更新：{old} → {new}，建议重新下载",
      "settings.docsCacheUpdateToast":
        "文档有更新（{old} → {new}），建议重新下载离线缓存",
      "settings.docsCacheGoUpdate": "去更新",

      // 关于页
      "about.contributors": "我们的贡献者",
      "about.contributorsDesc": "感谢这些优秀的开发者为项目做出的贡献",
      "about.friendLinks": "友情链接",
      "about.friendLinksDesc": "推荐一些优秀的技术和开发资源",
      "about.copyright": "版权声明",
      "about.copyrightText":
        "ErisPulse 使用 MIT 开源协议，允许自由分发和修改。",

      // 页脚
      "footer.home": "项目主页",
      "footer.docs": "使用文档",
      "footer.contribute": "贡献与开发",
      "footer.issue": "报告Issue",
      "footer.pr": "提交PR",
      "footer.discussions": "讨论区",
      "footer.social": "社交平台",
      "footer.copyright": "开源许可证：MIT",

      // 模态框
      "modal.moduleDetail": "模块详情",
      "modal.tags": "标签",
      "modal.repoInfo": "仓库信息",
      "modal.viewSource": "查看源代码",
      "modal.loadDocFailed": "无法加载文档",

      // 通用
      "common.loading": "加载中...",
      "common.noData": "暂无数据",
      "common.langSwitched": "已切换到{name}",
      "common.langSwitchFailed": "切换语言失败，请重试",
      "common.onlineRestored": "网络已恢复",
      "common.offlineMode": "已进入离线模式，将使用本地缓存",
      "common.copyFailed": "复制失败，请手动复制",

      // AI 物料横幅
      "banner.text": "知道吗？ErisPulse 支持完整的 Vibe Coding 工作流",
      "banner.link": "了解详情",
      "banner.slides": [
        {
          icon: "fa-wand-magic-sparkles",
          text: "知道吗？ErisPulse 支持完整的 Vibe Coding 工作流，让 AI 直接生成可用模块",
          link: "#docs/ai-support/README.md",
        },
        {
          icon: "fa-exchange-alt",
          text: "基于 OneBot12 标准的统一事件格式，一份代码在所有平台运行",
          link: "#docs/getting-started/basic-concepts.md",
        },
        {
          icon: "fa-puzzle-piece",
          text: "模块通过 PyPI 独立分发，支持懒加载、热重载和完整生命周期管理",
          link: "#docs/developer-guide/modules/getting-started.md",
        },
        {
          icon: "fa-comments",
          text: "内置确认对话、选择菜单、表单收集和多轮对话等丰富交互原语",
          link: "#docs/getting-started/event-handling.md",
        },
        {
          icon: "fa-globe",
          text: "同时对接云湖、Telegram、OneBot11/12、邮件等平台，适配器自动处理差异",
          link: "#docs/platform-guide/README.md",
        },
      ],

      // 时间格式
      "time.yearsAgo": "{n}年前",
      "time.monthsAgo": "{n}个月前",
      "time.daysAgo": "{n}天前",
      "time.hoursAgo": "{n}小时前",
      "time.minutesAgo": "{n}分钟前",
      "time.secondsAgo": "{n}秒前",

      // 安装
      "install.btn": "立即安装",
      "install.title": "一键安装",
      "install.desc": "自动检测环境，引导选择最适合的安装方式",
      "install.hint": "支持 Docker、Python、uv 等多种安装方式",
      "install.copied": "已复制!",
      "install.winCmd":
        "irm https://get.erisdev.com/install.ps1 -OutFile install.ps1; powershell -ExecutionPolicy Bypass -File install.ps1",
      "install.unixCmd":
        "curl -fsSL https://get.erisdev.com/install.sh -o install.sh && chmod +x install.sh && ./install.sh",

      // AI 模块构建器
      "builder.config": "模型配置",
      "builder.apiUrl": "API 地址",
      "builder.apiUrlPlaceholder": "https://api.openai.com/v1",
      "builder.apiKey": "API Key",
      "builder.apiKeyPlaceholder": "sk-...",
      "builder.model": "模型",
      "builder.modelPlaceholder": "gpt-4o",
      "builder.persistKey": "记住密钥（仅本机）",
      "builder.showKey": "显示/隐藏密钥",
      "builder.docsSource": "文档缓存",
      "builder.docsStatusReady": "已就绪",
      "builder.docsStatusEmpty": "未加载",
      "builder.docsStatusLoading": "加载中…",
      "builder.loadDocs": "加载/刷新文档",
      "builder.docsHint":
        "加载官方文档后，AI 可通过检索工具查阅 SDK 用法，生成更准确的代码。建议先在文档中心本地化缓存。",
      "builder.docsLoaded": "已加载 {n} 篇文档",
      "builder.generatedFiles": "已生成文件",
      "builder.noFiles": "尚未生成文件",
      "builder.viewAll": "查看全部",
      "builder.downloadZip": "下载 ZIP",
      "builder.sessions": "会话",
      "builder.newSession": "新会话",
      "builder.noSessions": "暂无会话",
      "builder.exportSessions": "导出会话",
      "builder.exportCurrent": "导出当前会话",
      "builder.exportAll": "导出全部会话",
      "builder.importSessions": "导入会话",
      "builder.importSuccess": "已导入 {n} 个会话",
      "builder.error.noActiveSession": "没有可导出的当前会话",
      "builder.error.importRead": "无法读取文件",
      "builder.error.importParse": "文件不是有效的 JSON",
      "builder.error.importFormat": "文件格式不正确",
      "builder.error.importEmpty": "文件中未找到可导入的会话",
      "builder.deleteSessionConfirm":
        "确定删除该会话？会话内的对话与生成文件将一并清除。",
      "builder.title": "AI 模块构建器",
      "builder.subtitle":
        "描述需求，AI 查阅文档后生成完整 ErisPulse 模块代码并打包下载",
      "builder.clear": "清空",
      "builder.menu": "菜单",
      "builder.inputPlaceholder": "描述你想构建的 ErisPulse 模块 / 适配器...",
      "builder.inputPlaceholderPlan": "描述需求或回答问题…",
      "builder.inputPlaceholderGenerate": "补充说明…",
      "builder.send": "发送",
      "builder.sending": "生成中...",
      "builder.writing": "正在写入…",
      "builder.question.custom": "自定义答案...",
      "builder.question.ok": "确定",
      "builder.question.submitAll": "提交全部回答",
      "builder.confirmCancel": "取消",
      "builder.confirmOk": "确定",
      "builder.tool.ask_question": "提问",
      "builder.tool.confirm_start": "确认开始",
      "builder.confirmStartMsg": "资料准备完毕，是否开始生成？",
      "builder.docsInitHint":
        "正在初始化文档清单，这个阶段可能较长，请耐心等待…",
      "builder.settingsTitle": "AI 模块构建器",
      "builder.settingsDesc":
        "配置构建器使用的 OpenAI 兼容 API（地址可填域名，会自动补 /chat/completions）。前往「构建器」页面开始对话。",
      "builder.settingsPrivacy":
        "所有数据（配置、会话、生成文件）保存在浏览器本地，不上传任何服务器。本站开源：github.com/ErisPulse/erispulse.github.io",
      "builder.settingsConfigBtn": "配置模型",
      "builder.sendMode.enter": "Enter",
      "builder.sendMode.ctrlEnter": "Ctrl+Enter",
      "builder.sendModeTitle": "切换发送键位",
      "builder.phase.plan": "规划阶段",
      "builder.phase.generate": "生成阶段",
      "builder.phaseSwitched": "已进入生成阶段，AI 现在可以写入文件",
      "builder.welcome":
        "### AI 模块构建器\n\n我是**小eris**，ErisPulse 官方的 AI 模块构建助手。\n\n我会分两步帮你构建模块：\n\n1. **规划阶段**——告诉我你想构建什么，我会查阅官方文档并与你讨论方案\n2. **生成阶段**——方案确定后，发送「**开始**」进入生成阶段，我会生成完整源码\n\n请在「**设置**」中配置 API 地址与模型。",
      "builder.done": "生成完成，可点击「下载 ZIP」获取模块包",
      "builder.error.noApiUrl": "请先填写 API 地址",
      "builder.error.noModel": "请先填写模型名称",
      "builder.error.noConfig":
        "请先在「设置 → AI 模块构建器」中配置 API 地址与模型",
      "builder.error.network": "网络请求失败",
      "builder.error.apiError": "API 调用失败",
      "builder.error.docsLoad": "文档加载失败",
      "builder.error.zip": "打包失败",
      "builder.error.clearConfirm": "确定要清空所有对话与已生成文件吗？",
      "builder.tool.search_docs": "检索文档",
      "builder.tool.read_document": "读取文档",
      "builder.tool.list_documents": "列出文档",
      "builder.tool.write_file": "写入文件",
      "builder.tool.get_manifest": "查看文件清单",
      "builder.tool.finalize": "完成生成",
    },

    en: {
      // 导航栏
      "nav.home": "Home",
      "nav.market": "Market",
      "nav.docs": "Docs",
      "nav.builder": "Builder",
      "nav.settings": "Settings",
      "nav.about": "About",

      // 首页 Hero
      "hero.subtitle": "Event-Driven · Multi-Platform · One Framework.",
      "hero.start": "Get Started",
      "hero.docs": "Docs",
      "hero.browse": "Market",

      // 首页特性区
      "features.title": "Core Features",
      "features.eventdriven.code":
        '@message.on_message()\nasync def handler(event):\n    text = event.get_text()\n    await event.reply(f"Received: {text}")',
      "features.eventdriven.title": "Event-Driven Architecture",
      "features.eventdriven.desc":
        "All interactions flow through events, forming a complete async pipeline from platform to module",
      "features.ob12.title": "OneBot12 Compatible",
      "features.ob12.desc":
        "Unified event format standard ensuring code consistency and portability across platforms",
      "features.ob12.code":
        '@command("hello")\nasync def hello_handler(event):\n    platform = event.get_platform()\n    # Same code, runs on every platform\n    await event.reply("Hello!")',
      "features.aicoding.title": "AI-Assisted Development",
      "features.aicoding.desc":
        "Comprehensive docs and specs let AI generate ready-to-use modules, supporting Vibe Coding workflows",
      "features.aicoding.code":
        '# Feed ErisPulse docs to AI\n# It generates ready-to-use modules\n\nclass AIModule(BaseModule):\n    async def on_load(self):\n        self.logger.info("AI module ready")',
      "features.senddsl.title": "SendDSL Chain API",
      "features.senddsl.desc":
        "Send.To().At().Reply().Text() chain-call messaging interface, concise yet expressive",
      "features.modular.title": "Modular & Lazy Loading",
      "features.modular.desc":
        "Modules distributed as independent PyPI packages with lazy loading, hot updates, dependency topological sort, and priority control",
      "features.modular.code":
        '# pip install ErisPulse-MyModule\n# or: epsdk install MyModule\n\nclass Main(BaseModule):\n    @staticmethod\n    def get_load_strategy():\n        return ModuleLoadStrategy(\n            lazy_load=True,   # Init on first access\n            priority=10        # Higher = loads first\n        )\n\n    async def on_load(self, event):\n        self.logger.info("Module ready")',
      "features.middleware.title": "Event Middleware",
      "features.middleware.desc":
        "Composable middleware pipeline for filtering, transforming, and logging before event dispatch",
      "features.interactive.title": "Interactive Conversations",
      "features.interactive.desc":
        "Built-in primitives like confirm, choice menus, form collection, and multi-turn dialogues for complex workflows",
      "features.parallel.title": "Parallel Event Processing",
      "features.parallel.desc":
        "Same-priority handlers run in parallel, different priorities run serially, Copy-On-Write zero overhead, with interrupt support",
      "features.parallel.code":
        "@message.on_message(priority=10)\nasync def spam_filter(event):\n    if is_spam(event.get_text()):\n        event.mark_processed()  # Interrupt lower priority\n\n# Same priority → parallel, zero-copy\n@message.on_message(priority=0)\nasync def handler_a(event):\n    event['result_a'] = await process_a()\n\n@message.on_message(priority=0)\nasync def handler_b(event):\n    event['result_b'] = await process_b()",
      "features.dashboard.title": "Dashboard",
      "features.dashboard.desc":
        "Real-time monitoring of adapter status, module loading progress, and bot online state — global visibility at a glance",
      "features.hooks.title": "Lifecycle Hooks",
      "features.hooks.desc":
        "Inject custom logic at every key stage of framework execution: module loading, adapter start/stop, bot online/offline — fully observable and responsive",
      "features.hooks.code":
        '@sdk.lifecycle.on("module.load")\nasync def on_loaded(data):\n    sdk.logger.info(f"Module loaded: {data}")\n\n@sdk.lifecycle.on("adapter.bot.online")\nasync def on_bot_online(data):\n    await notify_admin(f"Bot online: {data[\'bot_id\']}")\n\n@sdk.lifecycle.on("adapter.stop")\nasync def on_stop(data):\n    sdk.logger.warning("Adapter stopping")',
      "features.multiplatform.title": "Multi-Platform",
      "features.multiplatform.desc":
        "One codebase for Yunhu, Telegram, OneBot11/12, Email and more — adapters handle protocol differences automatically",
      "features.multiplatform.code":
        '@command("hello")\nasync def hello(event):\n    # Yunhu · Telegram · QQ · Email...\n    # One codebase, all platforms\n    platform = event.get_platform()\n    await event.reply(f"Hello from {platform}!")',

      // 模块市场
      "market.title": "Module Market",
      "market.submit": "Submit Module",
      "market.search": "Search modules...",
      "market.total": "Total Modules",
      "market.modules": "Modules",
      "market.adapters": "Adapters",
      "market.all": "All Modules",
      "market.install": "Install",
      "market.docs": "Docs",
      "market.empty": "No matching modules found",
      "market.empty.hint": "Try different keywords or browse all modules",
      "market.loadFailed": "Failed to load modules, please try again later",
      "market.reload": "Reload",
      "market.installCmd": "Install Command",
      "market.unverified": "Unverified",

      // 提交模块
      "submit.title": "Submit Module",
      "submit.loginTitle": "Choose a login method",
      "submit.loginDesc":
        "Sign in to submit your module to the ErisPulse ecosystem",
      "submit.loginYunhu": "Yunhu",
      "submit.loginBtn": "Sign in with GitHub",
      "submit.logout": "Sign Out",
      "submit.type": "Submission Type",
      "submit.typeModule": "Module",
      "submit.typeAdapter": "Adapter",
      "submit.name": "Module Name",
      "submit.nameHint": "Letters, numbers, underscores, hyphens",
      "submit.package": "PyPI Package Name",
      "submit.packageHint": "Package must be published on PyPI",
      "submit.description": "Description",
      "submit.descriptionPlaceholder": "Briefly describe the module...",
      "submit.author": "Author",
      "submit.repository": "Repository URL",
      "submit.minSdkVersion": "Min SDK Version",
      "submit.tags": "Tags",
      "submit.tagsPlaceholder": "Comma separated, e.g. tool,AI,parser",
      "submit.submitBtn": "Submit",
      "submit.validating": "Validating...",
      "submit.submitting": "Submitting...",
      "submit.descTooShort": "Description is too short (minimum 10 characters)",
      "submit.pypiNotFound":
        "Package '{package}' not found on PyPI. Please publish your package to PyPI first.",
      "submit.alreadyExists":
        "Module '{name}' already exists. Duplicate submissions are not allowed.",
      "submit.successTitle": "Submitted!",
      "submit.successDesc":
        "Submitted! Your module is now listed in the market (cache refresh may take a moment). An admin will verify it later.",
      "submit.submitAnother": "Submit Another",
      "submit.errorTitle": "Submission Failed",
      "submit.retryBtn": "Retry",
      "submit.loginFailed": "Login failed, please try again",
      "submit.oauthNotConfigured":
        "GitHub login is not configured, please contact admin",
      "submit.unknownError": "Unknown error",

      "submit.tabSubmit": "Submit",
      "submit.tabMyModules": "My Modules",

      "manage.loading": "Loading...",
      "manage.empty": "No modules submitted yet",
      "manage.cacheHint":
        "Newly submitted modules may take a few minutes to appear",
      "manage.loadFailed": "Failed to load, please retry",
      "manage.statusVerified": "Verified",
      "manage.statusPending": "Pending",
      "manage.delete": "Delete",
      "manage.edit": "Edit",
      "manage.saveEdit": "Save Changes",
      "manage.confirmDelete":
        "Are you sure you want to delete module {name}? This cannot be undone!",
      "manage.successDelete": "Module deleted",
      "manage.failed": "Operation failed, please retry",

      // 文档中心
      "docs.title": "Documentation",
      "docs.welcome": "Welcome to ErisPulse",
      "docs.welcome.desc":
        "ErisPulse is an open-source Python library that provides a simple and easy-to-use framework for building async, non-blocking bot programs.",
      "docs.welcome.hint":
        "Click on the links in the doc navigation to explore ErisPulse features and usage.",
      "docs.edit": "Edit this page",
      "docs.share": "Share",
      "docs.loading": "Loading document...",
      "docs.loadFailed": "Unable to load document",
      "docs.loadIndexFailed": "Unable to load document index",
      "docs.searchTrigger": "Search docs...",
      "docs.searchPlaceholder": "Search docs...",
      "docs.searchHint":
        "Press <kbd>ESC</kbd> to close · <kbd>↑↓</kbd> to navigate",
      "docs.searchEmpty": "Enter keywords to start searching",
      "docs.noResults": "No related documents found",
      "docs.searchResults": "Search Results",
      "docs.searchIndexLoading": "Loading search index...",
      "docs.backToCategories": "Back to Categories",
      "docs.backToDocs": "Back to Docs",
      "docs.toc": "Table of Contents",
      "docs.linkCopied": "Link copied to clipboard",
      "docs.linkWarning":
        'Link hint: The clicked link "{link}" is not yet adapted for in-site navigation. Please use the sidebar to find related content.',
      "docs.docLoaded": "Document loaded",
      "docs.keywordLocated": 'Located "{keyword}"',
      "docs.keywordNotFound": "Content not found",
      "docs.prev": "Previous",
      "docs.next": "Next",
      "docs.updatedAgo": "Updated {time}",
      "docs.noDoc": "The requested document does not exist",
      "docs.forbidden": "Access denied",
      "docs.serverError": "Internal server error, please try again later",
      "docs.networkError": "Network connection failed",
      "docs.networkHint": "Please check your network connection and try again",
      "docs.rateLimit": "GitHub API rate limit exceeded",
      "docs.rateLimitHint":
        "Please wait 1 hour or use a GitHub personal access token",
      "docs.retryHint":
        "Please check your network connection or try again later",
      "docs.loadingModuleDoc": "Loading documentation...",

      // 设置页
      "settings.title": "Personalization",
      "settings.subtitle": "Customize your ErisPulse experience",
      "settings.animations": "Animations",
      "settings.animationsToggle": "Enable Animations",
      "settings.animationsDesc":
        "Control page transition animations and interaction effects",
      "settings.content": "Content Preferences",
      "settings.compact": "Compact Layout",
      "settings.compactDesc": "Reduce spacing to show more content",
      "settings.lineNumbers": "Show Line Numbers",
      "settings.lineNumbersDesc": "Display line numbers in code blocks",
      "settings.nav": "Navigation",
      "settings.stickyNav": "Sticky Navigation",
      "settings.stickyNavDesc": "Keep navigation bar visible while scrolling",
      "settings.reset": "Reset Settings",
      "settings.resetBtn": "Reset All Settings",
      "settings.resetDesc": "Restore all settings to default values",
      "settings.resetConfirm":
        "Are you sure you want to reset all settings? This will restore all options to defaults.",

      // Docs offline cache
      "settings.docsCache": "Docs Offline Cache",
      "settings.manageDocsCache": "Manage cache",
      "settings.docsCacheManageTitle": "Docs cache management",
      "settings.docsCacheManageDesc":
        "View and clear cached docs for each language. “Download all docs for current language” adds or updates the current language as a complete offline cache.",
      "settings.offlineFirst": "Offline-first mode",
      "settings.offlineFirstDesc":
        "When enabled, cached docs are used first and the network is only used when there is no cache. When offline, the cache is used and never cleared.",
      "settings.offlineFirstOn":
        "Enabled: local cache is preferred, reducing network requests",
      "settings.offlineFirstOff":
        "Disabled: the latest docs are fetched from the network on every visit",
      "settings.downloadAll": "Download all docs for current language",
      "settings.clearDocsCache": "Clear current language cache",
      "settings.clearAllDocsCache": "Clear all cache",
      "settings.docsCacheClearAllConfirm":
        "Clear cached docs for all languages?",
      "settings.docsCacheAllCleared": "All docs cache cleared",
      "settings.docsCacheLangCleared": "{lang} docs cache cleared",
      "settings.docsCacheClearLang": "Clear",
      "settings.docsCacheDownloadLang": "Download/update",
      "settings.docsCacheCurrentLang": "Current language",
      "settings.docsCacheNoVersion": "No version recorded",
      "settings.docsCacheNeedIndex":
        "The docs index has not loaded yet, please try again later",
      "settings.docsCacheOfflineDownload": "You are offline, cannot download",
      "settings.docsCacheProgress": "Downloading... {done}/{total}",
      "settings.docsCacheDownloaded":
        "Downloaded {success} docs, {failed} failed",
      "settings.docsCacheCleared": "Docs cache cleared",
      "settings.docsCacheVersion": " (v{version})",
      "settings.docsCacheLocalized":
        "This language is fully localized{version}, {count} docs",
      "settings.docsCachePartial": "{count} docs cached",
      "settings.docsCacheEmpty": "No docs cached yet",
      "settings.docsCacheFetchingVersion": "Fetching version info...",
      "settings.docsCacheUpdateAvailable":
        "Docs updated: {old} → {new}. Re-download recommended.",
      "settings.docsCacheUpdateToast":
        "Docs updated ({old} → {new}). Re-download recommended.",
      "settings.docsCacheGoUpdate": "Update",

      // 关于页
      "about.contributors": "Our Contributors",
      "about.contributorsDesc":
        "Thanks to these excellent developers for their contributions",
      "about.friendLinks": "Friend Links",
      "about.friendLinksDesc": "Recommended tech and development resources",
      "about.copyright": "Copyright",
      "about.copyrightText":
        "ErisPulse is licensed under MIT, allowing free distribution and modification.",

      // 页脚
      "footer.home": "Project Home",
      "footer.docs": "Documentation",
      "footer.contribute": "Contribute & Develop",
      "footer.issue": "Report Issue",
      "footer.pr": "Submit PR",
      "footer.discussions": "Discussions",
      "footer.social": "Social",
      "footer.copyright": "License: MIT",

      // 模态框
      "modal.moduleDetail": "Module Details",
      "modal.tags": "Tags",
      "modal.repoInfo": "Repository",
      "modal.viewSource": "View Source",
      "modal.loadDocFailed": "Unable to load documentation",

      // 通用
      "common.loading": "Loading...",
      "common.noData": "No data",
      "common.langSwitched": "Switched to {name}",
      "common.langSwitchFailed": "Failed to switch language, please retry",
      "common.onlineRestored": "Network restored",
      "common.offlineMode": "Offline mode: using local cache",
      "common.copyFailed": "Copy failed, please copy manually",

      // AI Material Banner
      "banner.text":
        "Did you know? ErisPulse supports a complete Vibe Coding workflow",
      "banner.link": "Learn More",
      "banner.slides": [
        {
          icon: "fa-wand-magic-sparkles",
          text: "ErisPulse supports a complete Vibe Coding workflow — let AI generate production-ready modules",
          link: "#docs/ai-support/README.md",
        },
        {
          icon: "fa-exchange-alt",
          text: "Unified OneBot12 event format — one codebase runs on every platform",
          link: "#docs/getting-started/basic-concepts.md",
        },
        {
          icon: "fa-puzzle-piece",
          text: "Modules distributed via PyPI with lazy loading, hot reload, and full lifecycle management",
          link: "#docs/developer-guide/modules/getting-started.md",
        },
        {
          icon: "fa-comments",
          text: "Built-in confirm, choice menus, form collection, and multi-turn conversation primitives",
          link: "#docs/getting-started/event-handling.md",
        },
        {
          icon: "fa-globe",
          text: "Connect to Yunhu, Telegram, OneBot11/12, Email and more — adapters handle protocol differences",
          link: "#docs/platform-guide/README.md",
        },
      ],

      // 时间格式
      "time.yearsAgo": "{n}y ago",
      "time.monthsAgo": "{n}mo ago",
      "time.daysAgo": "{n}d ago",
      "time.hoursAgo": "{n}h ago",
      "time.minutesAgo": "{n}m ago",
      "time.secondsAgo": "{n}s ago",

      // Install
      "install.btn": "Install Now",
      "install.title": "Quick Install",
      "install.desc":
        "Auto-detect your environment and guide you to the best install method",
      "install.hint": "Supports Docker, Python, uv and more",
      "install.copied": "Copied!",
      "install.winCmd":
        "irm https://get.erisdev.com/install.ps1 -OutFile install.ps1; powershell -ExecutionPolicy Bypass -File install.ps1",
      "install.unixCmd":
        "curl -fsSL https://get.erisdev.com/install.sh -o install.sh && chmod +x install.sh && ./install.sh",

      // AI Module Builder
      "builder.config": "Model Config",
      "builder.apiUrl": "API URL",
      "builder.apiUrlPlaceholder": "https://api.openai.com/v1",
      "builder.apiKey": "API Key",
      "builder.apiKeyPlaceholder": "sk-...",
      "builder.model": "Model",
      "builder.modelPlaceholder": "gpt-4o",
      "builder.persistKey": "Remember key (local only)",
      "builder.showKey": "Show/hide key",
      "builder.docsSource": "Docs Cache",
      "builder.docsStatusReady": "Ready",
      "builder.docsStatusEmpty": "Not loaded",
      "builder.docsStatusLoading": "Loading…",
      "builder.loadDocs": "Load/refresh docs",
      "builder.docsHint":
        "After loading official docs, the AI can look up SDK usage via retrieval tools to generate more accurate code. It is recommended to localize the cache in the Docs center first.",
      "builder.docsLoaded": "Loaded {n} docs",
      "builder.generatedFiles": "Generated Files",
      "builder.noFiles": "No generated files yet",
      "builder.viewAll": "View all",
      "builder.downloadZip": "Download ZIP",
      "builder.sessions": "Sessions",
      "builder.newSession": "New session",
      "builder.noSessions": "No sessions yet",
      "builder.exportSessions": "Export sessions",
      "builder.exportCurrent": "Export current session",
      "builder.exportAll": "Export all sessions",
      "builder.importSessions": "Import sessions",
      "builder.importSuccess": "Imported {n} sessions",
      "builder.error.noActiveSession": "No active session to export",
      "builder.error.importRead": "Unable to read the file",
      "builder.error.importParse": "The file is not valid JSON",
      "builder.error.importFormat": "Invalid file format",
      "builder.error.importEmpty": "No importable sessions found in the file",
      "builder.deleteSessionConfirm":
        "Delete this session? Its conversation and generated files will be removed.",
      "builder.title": "AI Module Builder",
      "builder.subtitle":
        "Describe your needs; the AI looks up docs, then generates a complete ErisPulse module and packages it for download",
      "builder.clear": "Clear",
      "builder.menu": "Menu",
      "builder.inputPlaceholder":
        "Describe the ErisPulse module / adapter you want to build...",
      "builder.inputPlaceholderPlan":
        "Describe your needs or answer questions…",
      "builder.inputPlaceholderGenerate": "Add details…",
      "builder.send": "Send",
      "builder.sending": "Generating...",
      "builder.writing": "Writing…",
      "builder.question.custom": "Custom answer...",
      "builder.question.ok": "OK",
      "builder.question.submitAll": "Submit all answers",
      "builder.confirmCancel": "Cancel",
      "builder.confirmOk": "OK",
      "builder.tool.ask_question": "Ask",
      "builder.tool.confirm_start": "Confirm start",
      "builder.confirmStartMsg": "Materials are ready. Start generating?",
      "builder.docsInitHint":
        "Initializing document index — this may take a while, please wait…",
      "builder.settingsTitle": "AI Module Builder",
      "builder.settingsDesc":
        "Configure the OpenAI-compatible API used by the builder (a bare domain is fine; /chat/completions is appended automatically). Go to the “Builder” page to start.",
      "builder.settingsPrivacy":
        "All data (config, sessions, generated files) is stored locally in your browser and never uploaded. Open source: github.com/ErisPulse/erispulse.github.io",
      "builder.settingsConfigBtn": "Configure model",
      "builder.sendMode.enter": "Enter",
      "builder.sendMode.ctrlEnter": "Ctrl+Enter",
      "builder.sendModeTitle": "Switch send shortcut",
      "builder.phase.plan": "Planning",
      "builder.phase.generate": "Generating",
      "builder.phaseSwitched":
        "Switched to generation phase; the AI can now write files",
      "builder.welcome":
        "### AI Module Builder\n\nI'm **Xiao-eris**, the official ErisPulse AI module builder assistant.\n\nI'll help you build a module in two steps:\n\n1. **Planning**—tell me what you want to build; I'll consult the docs and discuss a plan with you\n2. **Generation**—once the plan is settled, send “**start**” to enter the generation phase and I'll produce the full source\n\nConfigure the API URL and model in “**Settings**”.",
      "builder.done": "Done. Click 「Download ZIP」 to get the module package",
      "builder.error.noApiUrl": "Please fill in the API URL first",
      "builder.error.noModel": "Please fill in the model name first",
      "builder.error.noConfig":
        "Please configure the API URL and model under “Settings → AI Module Builder” first",
      "builder.error.network": "Network request failed",
      "builder.error.apiError": "API call failed",
      "builder.error.docsLoad": "Failed to load docs",
      "builder.error.zip": "Packaging failed",
      "builder.error.clearConfirm":
        "Clear all conversation and generated files?",
      "builder.tool.search_docs": "Search docs",
      "builder.tool.read_document": "Read document",
      "builder.tool.list_documents": "List documents",
      "builder.tool.write_file": "Write file",
      "builder.tool.get_manifest": "View manifest",
      "builder.tool.finalize": "Finalize",
    },

    "zh-TW": {
      // 导航栏
      "nav.home": "首頁",
      "nav.market": "模組市場",
      "nav.docs": "文檔中心",
      "nav.settings": "設定",
      "nav.about": "關於",
      "nav.builder": "構建器",
      "builder.welcome":
        "### AI 模組構建器\n\n我是**小eris**，ErisPulse 官方的 AI 模組構建助手。\n\n我會分兩步幫你構建模組：\n\n1. **規劃階段**——告訴我你想構建什麼，我會查閱官方文檔並與你討論方案\n2. **生成階段**——方案確定後，發送「**開始**」進入生成階段，我會生成完整原始碼\n\n請在「**設定**」中配置 API 位址與模型。",
      "builder.done": "生成完畢，可點擊「下載 ZIP」取得模組套件",
      "builder.phase.plan": "規劃",
      "builder.phase.generate": "生成",
      "builder.phaseSwitched": "已進入生成階段，AI 現在可以寫入檔案",
      "builder.send": "發送",
      "builder.sending": "生成中…",
      "builder.writing": "正在寫入…",
      "builder.clear": "清空",
      "builder.menu": "選單",
      "builder.downloadZip": "下載 ZIP",
      "builder.noFiles": "尚無生成檔案",
      "builder.generatedFiles": "已生成檔案",
      "builder.viewAll": "檢視全部",
      "builder.sessions": "會話",
      "builder.newSession": "新會話",
      "builder.noSessions": "暫無會話",
      "builder.exportSessions": "匯出會話",
      "builder.exportCurrent": "匯出目前會話",
      "builder.exportAll": "匯出全部會話",
      "builder.importSessions": "匯入會話",
      "builder.importSuccess": "已匯入 {n} 個會話",
      "builder.error.noActiveSession": "沒有可匯出的目前會話",
      "builder.error.importRead": "無法讀取檔案",
      "builder.error.importParse": "檔案不是有效的 JSON",
      "builder.error.importFormat": "檔案格式不正確",
      "builder.error.importEmpty": "檔案中未找到可匯入的會話",
      "builder.deleteSessionConfirm":
        "確定要刪除該會話？對話與生成檔案將一併清除。",
      "builder.inputPlaceholderPlan": "描述需求或回答問題…",
      "builder.inputPlaceholderGenerate": "補充說明…",
      "builder.sendMode.enter": "Enter",
      "builder.sendMode.ctrlEnter": "Ctrl+Enter",
      "builder.sendModeTitle": "切換發送鍵位",
      "builder.question.custom": "自訂答案…",
      "builder.question.ok": "確定",
      "builder.question.submitAll": "提交全部回答",
      "builder.confirmCancel": "取消",
      "builder.confirmOk": "確定",
      "builder.confirmStartMsg": "資料準備完畢，是否開始生成？",
      "builder.docsInitHint": "正在初始化文檔清單，此階段可能較長，請耐心等候…",
      "builder.settingsTitle": "AI 模組構建器",
      "builder.settingsDesc":
        "配置構建器使用的 OpenAI 相容 API。前往「構建器」頁面開始對話。",
      "builder.settingsPrivacy":
        "所有資料（配置、會話、生成檔案）保存在瀏覽器本機，不上傳任何伺服器。開源：github.com/ErisPulse/erispulse.github.io",
      "builder.settingsConfigBtn": "配置模型",
      "builder.tool.search_docs": "檢索文檔",
      "builder.tool.read_document": "讀取文檔",
      "builder.tool.list_documents": "列出文檔",
      "builder.tool.write_file": "寫入檔案",
      "builder.tool.get_manifest": "檢視檔案清單",
      "builder.tool.finalize": "完成生成",
      "builder.tool.ask_question": "提問",
      "builder.tool.confirm_start": "確認開始",
      "builder.error.noApiUrl": "請先填寫 API 位址",
      "builder.error.noModel": "請先填寫模型名稱",
      "builder.error.noConfig":
        "請先在「設定 → AI 模組構建器」中配置 API 位址與模型",
      "builder.error.network": "網路請求失敗",
      "builder.error.apiError": "API 呼叫失敗",
      "builder.error.docsLoad": "文檔載入失敗",
      "builder.error.zip": "打包失敗",
      "builder.error.clearConfirm": "確定要清空所有對話與已生成檔案？",

      // 首页 Hero
      "hero.subtitle": "事件驅動 · 多平台 · 一個框架搞定一切",
      "hero.start": "開始使用",
      "hero.docs": "文檔中心",
      "hero.browse": "模組市場",

      // 首页特性区
      "features.title": "核心特性",
      "features.eventdriven.code":
        '@message.on_message()\nasync def handler(event):\n    text = event.get_text()\n    await event.reply(f"收到: {text}")',
      "features.eventdriven.title": "事件驅動架構",
      "features.eventdriven.desc":
        "所有互動透過事件傳遞，從平台接收到模組處理形成完整的非同步事件流",
      "features.ob12.title": "OneBot12 標準相容",
      "features.ob12.desc":
        "統一的事件格式標準，確保不同平台間的程式碼一致性和可移植性",
      "features.ob12.code":
        '@command("hello")\nasync def hello_handler(event):\n    platform = event.get_platform()\n    # 同一份程式碼，多平台執行\n    await event.reply("Hello!")',
      "features.aicoding.title": "AI 輔助開發",
      "features.aicoding.desc":
        "提供完整的開發文件與規範，讓 AI 直接生成可用模組，支援 Vibe Coding 工作流",
      "features.aicoding.code":
        '# 將 ErisPulse 物料投餵給 AI\n# 即可直接生成可用模組\n\nclass AIModule(BaseModule):\n    async def on_load(self):\n        self.logger.info("AI 生成就緒")',
      "features.senddsl.title": "SendDSL 鏈式發送",
      "features.senddsl.desc":
        "Send.To().At().Reply().Text() 風格的鏈式訊息發送介面，簡潔而表達力強",
      "features.modular.title": "模組化與懶載入",
      "features.modular.desc":
        "模組以獨立 PyPI 套件分發，支援懶載入、熱更新、依賴拓撲排序與優先級控制",
      "features.modular.code":
        '# pip install ErisPulse-MyModule\n# or: epsdk install MyModule\n\nclass Main(BaseModule):\n    @staticmethod\n    def get_load_strategy():\n        return ModuleLoadStrategy(\n            lazy_load=True,   # 首次存取時才初始化\n            priority=10        # 數值越大越先載入\n        )\n\n    async def on_load(self, event):\n        self.logger.info("模組已就緒")',
      "features.middleware.title": "事件中介層",
      "features.middleware.desc":
        "可組合的中介層管道，在事件分發前進行過濾、轉換、日誌記錄等處理",
      "features.interactive.title": "互動式對話",
      "features.interactive.desc":
        "內建確認、選擇選單、表單收集、多輪對話等互動原語，輕鬆建構複雜互動流程",
      "features.parallel.title": "並行事件處理",
      "features.parallel.desc":
        "同優先級處理器並行執行，不同優先級串行排程，Copy-On-Write 零開銷，支援中斷控制",
      "features.parallel.code":
        "@message.on_message(priority=10)\nasync def spam_filter(event):\n    if is_spam(event.get_text()):\n        event.mark_processed()  # 中斷後續\n\n# 同優先級 → 並行執行，零拷貝\n@message.on_message(priority=0)\nasync def handler_a(event):\n    event['result_a'] = await process_a()\n\n@message.on_message(priority=0)\nasync def handler_b(event):\n    event['result_b'] = await process_b()",
      "features.dashboard.title": "儀表盤",
      "features.dashboard.desc":
        "即時監控適配器狀態、模組載入進度與 Bot 上線情況，全域執行狀態一目瞭然",
      "features.hooks.title": "生命週期鉤子",
      "features.hooks.desc":
        "在框架執行的每個關鍵階段插入自訂邏輯：模組載入、適配器啟停、Bot 上下線，全程可監聽可回應",
      "features.hooks.code":
        '@sdk.lifecycle.on("module.load")\nasync def on_loaded(data):\n    sdk.logger.info(f"模組載入: {data}")\n\n@sdk.lifecycle.on("adapter.bot.online")\nasync def on_bot_online(data):\n    await notify_admin(f"Bot 上線: {data[\'bot_id\']}")\n\n@sdk.lifecycle.on("adapter.stop")\nasync def on_stop(data):\n    sdk.logger.warning("適配器即將停止")',
      "features.multiplatform.title": "多平台適配",
      "features.multiplatform.desc":
        "一套程式碼同時對接雲湖、Telegram、OneBot11/12、郵件等平台，適配器自動處理協議差異",
      "features.multiplatform.code":
        '@command("hello")\nasync def hello(event):\n    # 雲湖 · Telegram · QQ · 郵件...\n    # 同一份程式碼，所有平台執行\n    platform = event.get_platform()\n    await event.reply(f"Hello from {platform}!")',

      // 模块市场
      "market.title": "模組市場",
      "market.submit": "提交模組",
      "market.search": "搜尋模組...",
      "market.total": "總模組數",
      "market.modules": "功能模組",
      "market.adapters": "平台適配器",
      "market.all": "全部模組",
      "market.install": "安裝",
      "market.docs": "文檔",
      "market.empty": "未找到符合的模組",
      "market.empty.hint": "嘗試不同的搜尋關鍵字或檢視所有模組",
      "market.loadFailed": "載入模組失敗，請稍後再試",
      "market.reload": "重新載入",
      "market.installCmd": "安裝命令",
      "market.unverified": "未驗證",

      // 提交模組
      "submit.title": "提交模組",
      "submit.loginTitle": "選擇登入方式",
      "submit.loginDesc": "登入後即可提交您的模組到 ErisPulse 生態系統",
      "submit.loginYunhu": "雲湖",
      "submit.loginBtn": "GitHub 登入",
      "submit.logout": "登出",
      "submit.type": "提交類型",
      "submit.typeModule": "模組 (Module)",
      "submit.typeAdapter": "適配器 (Adapter)",
      "submit.name": "模組名稱",
      "submit.nameHint": "英文、數字、底線、連字號",
      "submit.package": "PyPI 套件名稱",
      "submit.packageHint": "套件必須已發佈到 PyPI",
      "submit.description": "描述",
      "submit.descriptionPlaceholder": "簡要描述模組功能...",
      "submit.author": "作者",
      "submit.repository": "倉庫位址",
      "submit.minSdkVersion": "最低 SDK 版本",
      "submit.tags": "標籤",
      "submit.tagsPlaceholder": "用逗號分隔，如：工具,AI,解析",
      "submit.submitBtn": "提交",
      "submit.validating": "驗證中...",
      "submit.submitting": "提交中...",
      "submit.descTooShort": "描述太短，至少需要 10 個字元",
      "submit.pypiNotFound":
        "套件 '{package}' 在 PyPI 上未找到，請先將您的套件發佈到 PyPI。",
      "submit.alreadyExists": "模組 '{name}' 已存在，請勿重複提交。",
      "submit.successTitle": "提交成功!",
      "submit.successDesc":
        "提交成功！模組已上架模組商店（需要時間重新整理快取以生效），後續管理員會進行驗證。",
      "submit.submitAnother": "繼續提交",
      "submit.errorTitle": "提交失敗",
      "submit.retryBtn": "重試",
      "submit.loginFailed": "登入失敗，請重試",
      "submit.oauthNotConfigured": "GitHub 登入暫未配置，請聯絡管理員",
      "submit.unknownError": "未知錯誤",

      "submit.tabSubmit": "提交模組",
      "submit.tabMyModules": "我的模組",

      "manage.loading": "載入中...",
      "manage.empty": "還沒有提交過任何模組",
      "manage.cacheHint": "剛提交的模組可能需要幾分鐘才會顯示",
      "manage.loadFailed": "載入失敗，請重試",
      "manage.statusVerified": "已驗證",
      "manage.statusPending": "待驗證",
      "manage.delete": "刪除",
      "manage.edit": "編輯",
      "manage.saveEdit": "儲存修改",
      "manage.confirmDelete": "確定要刪除模組 {name} 嗎？此操作不可撤銷！",
      "manage.successDelete": "模組已刪除",
      "manage.failed": "操作失敗，請重試",

      // 文档中心
      "docs.title": "文檔中心",
      "docs.welcome": "歡迎使用 ErisPulse",
      "docs.welcome.desc":
        "ErisPulse 是一個開源的 Python 函式庫，目標是提供一個簡單、易於使用的框架，用於建構非同步、非阻塞的機器人程式。",
      "docs.welcome.hint":
        "點擊文檔導航中的連結，開始探索 ErisPulse 的功能和用法吧。",
      "docs.edit": "編輯此頁",
      "docs.share": "分享",
      "docs.loading": "正在載入文檔...",
      "docs.loadFailed": "無法載入文檔",
      "docs.loadIndexFailed": "無法載入文檔索引",
      "docs.searchTrigger": "搜尋文檔...",
      "docs.searchPlaceholder": "搜尋文檔...",
      "docs.searchHint": "按 <kbd>ESC</kbd> 關閉 · <kbd>↑↓</kbd> 導覽結果",
      "docs.searchEmpty": "輸入關鍵字開始搜尋",
      "docs.noResults": "未找到相關文檔",
      "docs.searchResults": "搜尋結果",
      "docs.searchIndexLoading": "搜尋索引載入中...",
      "docs.backToCategories": "返回分類",
      "docs.backToDocs": "返回文檔",
      "docs.toc": "目錄",
      "docs.linkCopied": "連結已複製到剪貼簿",
      "docs.linkWarning":
        '文檔連結提示：點擊的連結 "{link}" 暫未適配站內跳轉，請使用左側導航欄手動查找相關文檔內容。',
      "docs.docLoaded": "文檔已載入",
      "docs.keywordLocated": '已定位到 "{keyword}"',
      "docs.keywordNotFound": "未找到指定內容",
      "docs.prev": "上一篇",
      "docs.next": "下一篇",
      "docs.updatedAgo": "{time} 更新了此文檔",
      "docs.noDoc": "請求的文檔不存在，可能是URL錯誤",
      "docs.forbidden": "存取被拒絕，可能是權限問題",
      "docs.serverError": "伺服器內部錯誤，請稍後再試",
      "docs.networkError": "網路連線失敗",
      "docs.networkHint": "請檢查您的網路連線後重試",
      "docs.rateLimit": "GitHub API請求次數已達上限",
      "docs.rateLimitHint":
        "請等待1小時後重試，或使用GitHub個人存取令牌提高限制",
      "docs.retryHint": "請檢查網路連線或稍後再試",
      "docs.loadingModuleDoc": "正在載入文檔...",

      // 设置页
      "settings.title": "個人化設定",
      "settings.subtitle": "自訂您的 ErisPulse 體驗",
      "settings.animations": "動畫效果",
      "settings.animationsToggle": "啟用動畫效果",
      "settings.animationsDesc": "控制頁面過渡動畫和互動效果",
      "settings.content": "內容偏好",
      "settings.compact": "緊湊佈局",
      "settings.compactDesc": "減少頁面間距，顯示更多內容",
      "settings.lineNumbers": "顯示程式碼行號",
      "settings.lineNumbersDesc": "在程式碼區塊中顯示行號",
      "settings.nav": "導覽設定",
      "settings.stickyNav": "固定導覽列",
      "settings.stickyNavDesc": "捲動時保持導覽列可見",
      "settings.reset": "重置設定",
      "settings.resetBtn": "重置所有設定",
      "settings.resetDesc": "將所有設定恢復為預設值",
      "settings.resetConfirm":
        "確定要重置所有設定嗎？這將恢復所有選項為預設值。",

      // 文檔離線快取
      "settings.docsCache": "文檔離線快取",
      "settings.manageDocsCache": "管理快取",
      "settings.docsCacheManageTitle": "文檔快取管理",
      "settings.docsCacheManageDesc":
        "查看並清理各語言已快取的文檔內容；「下載目前語言全部文檔」會把目前語言加入或更新到完整離線快取。",
      "settings.offlineFirst": "離線優先模式",
      "settings.offlineFirstDesc":
        "開啟後優先使用本地快取的文檔，僅在無快取時聯網取得；斷網時自動使用快取且不會清理",
      "settings.offlineFirstOn": "已啟用：優先使用本地快取，減少聯網請求",
      "settings.offlineFirstOff": "已關閉：每次訪問都會聯網取得最新文檔",
      "settings.downloadAll": "下載目前語言全部文檔",
      "settings.clearDocsCache": "清除文檔快取",
      "settings.docsCacheNeedIndex": "文檔索引尚未載入，請稍後再試",
      "settings.docsCacheOfflineDownload": "目前處於離線狀態，無法下載",
      "settings.docsCacheProgress": "下載中... {done}/{total}",
      "settings.docsCacheDownloaded":
        "已下載 {success} 篇文檔，{failed} 篇失敗",
      "settings.docsCacheCleared": "文檔快取已清除",
      "settings.docsCacheVersion": "（v{version}）",
      "settings.docsCacheLocalized":
        "目前語言已完整本地化{version}，共 {count} 篇",
      "settings.docsCachePartial": "已快取 {count} 篇文檔",
      "settings.docsCacheEmpty": "尚未快取任何文檔",
      "settings.docsCacheFetchingVersion": "正在取得版本資訊...",
      "settings.docsCacheUpdateAvailable":
        "文檔版本已更新：{old} → {new}，建議重新下載",
      "settings.docsCacheUpdateToast":
        "文檔有更新（{old} → {new}），建議重新下載離線快取",
      "settings.docsCacheGoUpdate": "去更新",
      "settings.docsCacheLangCleared": "{lang} 文檔快取已清除",
      "settings.docsCacheClearLang": "清除",
      "settings.docsCacheDownloadLang": "下載/更新",
      "settings.docsCacheCurrentLang": "目前語言",
      "settings.docsCacheNoVersion": "未記錄版本",

      // 关于页
      "about.contributors": "我們的貢獻者",
      "about.contributorsDesc": "感謝這些優秀的開發者為專案做出的貢獻",
      "about.friendLinks": "友情連結",
      "about.friendLinksDesc": "推薦一些優秀的技術和開發資源",
      "about.copyright": "版權聲明",
      "about.copyrightText":
        "ErisPulse 使用 MIT 開源協議，允許自由分發和修改。",

      // 页脚
      "footer.home": "專案主頁",
      "footer.docs": "使用文檔",
      "footer.contribute": "貢獻與開發",
      "footer.issue": "回報 Issue",
      "footer.pr": "提交 PR",
      "footer.discussions": "討論區",
      "footer.social": "社交平台",
      "footer.copyright": "開源授權：MIT",

      // 模态框
      "modal.moduleDetail": "模組詳情",
      "modal.tags": "標籤",
      "modal.repoInfo": "倉庫資訊",
      "modal.viewSource": "檢視原始碼",
      "modal.loadDocFailed": "無法載入文檔",

      // 通用
      "common.loading": "載入中...",
      "common.noData": "暫無資料",
      "common.langSwitched": "已切換到{name}",
      "common.langSwitchFailed": "切換語言失敗，請重試",
      "common.onlineRestored": "網路已恢復",
      "common.offlineMode": "已進入離線模式，將使用本地快取",
      "common.copyFailed": "複製失敗，請手動複製",

      // AI 物料橫幅
      "banner.text": "你知道嗎？ErisPulse 支援完整的 Vibe Coding 工作流",
      "banner.link": "瞭解詳情",
      "banner.slides": [
        {
          icon: "fa-wand-magic-sparkles",
          text: "ErisPulse 支援完整的 Vibe Coding 工作流，讓 AI 直接生成可用模組",
          link: "#docs/ai-support/README.md",
        },
        {
          icon: "fa-exchange-alt",
          text: "基於 OneBot12 標準的統一事件格式，一份程式碼在所有平台執行",
          link: "#docs/getting-started/basic-concepts.md",
        },
        {
          icon: "fa-puzzle-piece",
          text: "模組透過 PyPI 獨立分發，支援懶載入、熱重載和完整生命週期管理",
          link: "#docs/developer-guide/modules/getting-started.md",
        },
        {
          icon: "fa-comments",
          text: "內建確認對話、選擇選單、表單收集和多輪對話等豐富互動原語",
          link: "#docs/getting-started/event-handling.md",
        },
        {
          icon: "fa-globe",
          text: "同時對接雲湖、Telegram、OneBot11/12、郵件等平台，適配器自動處理差異",
          link: "#docs/platform-guide/README.md",
        },
      ],

      // 时间格式
      "time.yearsAgo": "{n}年前",
      "time.monthsAgo": "{n}個月前",
      "time.daysAgo": "{n}天前",
      "time.hoursAgo": "{n}小時前",
      "time.minutesAgo": "{n}分鐘前",
      "time.secondsAgo": "{n}秒前",

      // 安裝
      "install.btn": "立即安裝",
      "install.title": "一鍵安裝",
      "install.desc": "自動偵測環境，引導選擇最適合的安裝方式",
      "install.hint": "支援 Docker、Python、uv 等多種安裝方式",
      "install.copied": "已複製!",
      "install.winCmd":
        "irm https://get.erisdev.com/install.ps1 -OutFile install.ps1; powershell -ExecutionPolicy Bypass -File install.ps1",
      "install.unixCmd":
        "curl -fsSL https://get.erisdev.com/install.sh -o install.sh && chmod +x install.sh && ./install.sh",
    },

    ja: {
      "nav.home": "ホーム",
      "nav.market": "マーケット",
      "nav.docs": "ドキュメント",
      "nav.settings": "設定",
      "nav.about": "私たちについて",
      "nav.builder": "ビルダー",
      "builder.welcome":
        "### AI モジュールビルダー\n\n**小eris**です。ErisPulse 公式の AI モジュール構築アシスタントです。\n\n2 ステップでモジュールを構築します：\n\n1. **プランニング**——作りたいものを教えてください。公式ドキュメントを参照し、プランをご提案します\n2. **生成**——プランが決まったら「**開始**」と送信してください。生成フェーズに切り替わり、完全なソースコードを生成します\n\n「**設定**」で API アドレスとモデルを設定してください。",
      "builder.done":
        "生成完了。「ZIP をダウンロード」でモジュールパッケージを取得できます",
      "builder.phase.plan": "プラン",
      "builder.phase.generate": "生成",
      "builder.phaseSwitched":
        "生成フェーズに切り替わりました。AI がファイルを書き込めるようになりました",
      "builder.send": "送信",
      "builder.sending": "生成中…",
      "builder.writing": "書き込み中…",
      "builder.clear": "クリア",
      "builder.menu": "メニュー",
      "builder.downloadZip": "ZIP ダウンロード",
      "builder.noFiles": "生成ファイルなし",
      "builder.generatedFiles": "生成ファイル",
      "builder.viewAll": "すべて表示",
      "builder.sessions": "セッション",
      "builder.newSession": "新規セッション",
      "builder.noSessions": "セッションなし",
      "builder.exportSessions": "セッションをエクスポート",
      "builder.exportCurrent": "現在のセッションをエクスポート",
      "builder.exportAll": "すべてのセッションをエクスポート",
      "builder.importSessions": "セッションをインポート",
      "builder.importSuccess": "{n} 件のセッションをインポートしました",
      "builder.error.noActiveSession":
        "エクスポート対象のセッションがありません",
      "builder.error.importRead": "ファイルを読み込めません",
      "builder.error.importParse": "ファイルは有効な JSON ではありません",
      "builder.error.importFormat": "ファイル形式が正しくありません",
      "builder.error.importEmpty": "インポート可能なセッションが見つかりません",
      "builder.deleteSessionConfirm":
        "このセッションを削除しますか？会話と生成ファイルは消去されます。",
      "builder.inputPlaceholderPlan": "要件を説明するか質問に答えてください…",
      "builder.inputPlaceholderGenerate": "補足説明…",
      "builder.sendMode.enter": "Enter",
      "builder.sendMode.ctrlEnter": "Ctrl+Enter",
      "builder.sendModeTitle": "送信キー切替",
      "builder.question.custom": "自由入力…",
      "builder.question.ok": "OK",
      "builder.question.submitAll": "すべて回答を送信",
      "builder.confirmCancel": "キャンセル",
      "builder.confirmOk": "OK",
      "builder.confirmStartMsg": "資料が整いました。生成を開始しますか？",
      "builder.docsInitHint":
        "ドキュメントインデックスを初期化中です。時間がかかる場合があります…",
      "builder.settingsTitle": "AI モジュールビルダー",
      "builder.settingsDesc":
        "ビルダーが使用する OpenAI 互換 API を設定します。「ビルダー」ページで会話を開始してください。",
      "builder.settingsPrivacy":
        "すべてのデータ（設定、セッション、生成ファイル）はブラウザに保存され、サーバーには送信されません。オープンソース：github.com/ErisPulse/erispulse.github.io",
      "builder.settingsConfigBtn": "モデルを設定",
      "builder.tool.search_docs": "ドキュメント検索",
      "builder.tool.read_document": "ドキュメント読込",
      "builder.tool.list_documents": "ドキュメント一覧",
      "builder.tool.write_file": "ファイル書込",
      "builder.tool.get_manifest": "ファイル一覧",
      "builder.tool.finalize": "生成完了",
      "builder.tool.ask_question": "質問",
      "builder.tool.confirm_start": "開始確認",
      "builder.error.noApiUrl": "API アドレスを入力してください",
      "builder.error.noModel": "モデル名を入力してください",
      "builder.error.noConfig":
        "「設定 → AI モジュールビルダー」で API アドレスとモデルを設定してください",
      "builder.error.network": "ネットワークエラー",
      "builder.error.apiError": "API エラー",
      "builder.error.docsLoad": "ドキュメント読込失敗",
      "builder.error.zip": "ZIP 作成失敗",
      "builder.error.clearConfirm":
        "すべての会話と生成ファイルを消去しますか？",

      "hero.subtitle":
        "イベント駆動 · マルチプラットフォーム · これ一つで完璧に",
      "hero.start": "始めましょう",
      "hero.docs": "ドキュメント",
      "hero.browse": "マーケット",

      "features.title": "コア機能",
      "features.eventdriven.code":
        '@message.on_message()\nasync def handler(event):\n    text = event.get_text()\n    await event.reply(f"受信: {text}")',
      "features.eventdriven.title": "イベント駆動アーキテクチャ",
      "features.eventdriven.desc":
        "すべてのインタラクションはイベントを通じて処理され、プラットフォームからモジュールまで完全な非同期イベントパイプラインを形成します",
      "features.ob12.title": "OneBot12 準拠",
      "features.ob12.desc":
        "統一されたイベントフォーマット標準により、プラットフォーム間でのコードの一貫性と移植性を保証します",
      "features.ob12.code":
        '@command("hello")\nasync def hello_handler(event):\n    platform = event.get_platform()\n    # 同じコードで全プラットフォームで実行\n    await event.reply("Hello!")',
      "features.aicoding.title": "AI 支援開発",
      "features.aicoding.desc":
        "完全な開発ドキュメントと仕様を提供し、AI がすぐに使えるモジュールを直接生成できる Vibe Coding ワークフローをサポートします",
      "features.aicoding.code":
        '# ErisPulse のドキュメントを AI に読み込ませる\n# すぐに使えるモジュールを生成\n\nclass AIModule(BaseModule):\n    async def on_load(self):\n        self.logger.info("AI モジュール準備完了")',
      "features.senddsl.title": "SendDSL チェーン API",
      "features.senddsl.desc":
        "Send.To().At().Reply().Text() スタイルのチェーンメッセージ送信インターフェース、簡潔で表現力豊か",
      "features.modular.title": "モジュラー & 遅延読み込み",
      "features.modular.desc":
        "モジュールは独立 PyPI パッケージとして配布され、遅延読み込み、ホットアップデート、依存関係トポロジカルソート、優先度制御をサポート",
      "features.modular.code":
        '# pip install ErisPulse-MyModule\n# or: epsdk install MyModule\n\nclass Main(BaseModule):\n    @staticmethod\n    def get_load_strategy():\n        return ModuleLoadStrategy(\n            lazy_load=True,   # 初回アクセス時に初期化\n            priority=10        # 値が大きいほど先に読み込み\n        )\n\n    async def on_load(self, event):\n        self.logger.info("モジュール準備完了")',
      "features.middleware.title": "イベントミドルウェア",
      "features.middleware.desc":
        "イベント配信前のフィルタリング、変換、ログ記録などを行うコンポーザブルなミドルウェアパイプライン",
      "features.interactive.title": "インタラクティブ会話",
      "features.interactive.desc":
        "確認、選択メニュー、フォーム収集、マルチターン会話などのインタラクティブプリミティブを内蔵し、複雑なワークフローを簡単に構築",
      "features.parallel.title": "並列イベント処理",
      "features.parallel.desc":
        "同じ優先度のハンドラーは並列実行、異なる優先度は直列スケジューリング、Copy-On-Write でゼロオーバーヘッド、中断制御をサポート",
      "features.parallel.code":
        "@message.on_message(priority=10)\nasync def spam_filter(event):\n    if is_spam(event.get_text()):\n        event.mark_processed()  # 低優先度を中断\n\n# 同優先度 → 並列実行、ゼロコピー\n@message.on_message(priority=0)\nasync def handler_a(event):\n    event['result_a'] = await process_a()\n\n@message.on_message(priority=0)\nasync def handler_b(event):\n    event['result_b'] = await process_b()",
      "features.dashboard.title": "ダッシュボード",
      "features.dashboard.desc":
        "アダプター状態、モジュール読み込み進捗、Bot のオンライン状況をリアルタイム監視 — グローバル状態を一目で把握",
      "features.hooks.title": "ライフサイクルフック",
      "features.hooks.desc":
        "フレームワーク実行の各重要段階にカスタムロジックを挿入：モジュール読み込み、アダプター開始/停止、Bot オンライン/オフライン — 全プロセスを監視・応答可能",
      "features.hooks.code":
        '@sdk.lifecycle.on("module.load")\nasync def on_loaded(data):\n    sdk.logger.info(f"モジュール読み込み: {data}")\n\n@sdk.lifecycle.on("adapter.bot.online")\nasync def on_bot_online(data):\n    await notify_admin(f"Bot オンライン: {data[\'bot_id\']}")\n\n@sdk.lifecycle.on("adapter.stop")\nasync def on_stop(data):\n    sdk.logger.warning("アダプター停止中")',
      "features.multiplatform.title": "マルチプラットフォーム",
      "features.multiplatform.desc":
        "雲湖、Telegram、OneBot11/12、メールなど複数のプラットフォームに対応 — アダプターがプロトコルの違いを自動処理します",
      "features.multiplatform.code":
        '@command("hello")\nasync def hello(event):\n    # 雲湖 · Telegram · QQ · メール...\n    # 同じコード、全プラットフォームで実行\n    platform = event.get_platform()\n    await event.reply(f"Hello from {platform}!")',

      "market.title": "モジュールマーケット",
      "market.submit": "モジュールを提出",
      "market.search": "モジュールを検索...",
      "market.total": "総モジュール数",
      "market.modules": "機能モジュール",
      "market.adapters": "プラットフォームアダプター",
      "market.all": "すべてのモジュール",
      "market.install": "インストール",
      "market.docs": "ドキュメント",
      "market.empty": "一致するモジュールが見つかりません",
      "market.empty.hint":
        "別のキーワードを試すか、すべてのモジュールを閲覧してください",
      "market.loadFailed":
        "モジュールの読み込みに失敗しました。後でもう一度お試しください",
      "market.reload": "再読み込み",
      "market.installCmd": "インストールコマンド",
      "market.unverified": "未確認",

      "submit.title": "モジュールを提出",
      "submit.loginTitle": "ログイン方法を選択",
      "submit.loginDesc":
        "ログインしてモジュールを ErisPulse エコシステムに提出しましょう",
      "submit.loginYunhu": "雲湖",
      "submit.loginBtn": "GitHub でログイン",
      "submit.logout": "ログアウト",
      "submit.type": "提出タイプ",
      "submit.typeModule": "モジュール (Module)",
      "submit.typeAdapter": "アダプター (Adapter)",
      "submit.name": "モジュール名",
      "submit.nameHint": "英数字、アンダースコア、ハイフン",
      "submit.package": "PyPI パッケージ名",
      "submit.packageHint": "パッケージは PyPI に公開されている必要があります",
      "submit.description": "説明",
      "submit.descriptionPlaceholder": "モジュールの機能を簡単に説明...",
      "submit.author": "作者",
      "submit.repository": "リポジトリURL",
      "submit.minSdkVersion": "最小SDKバージョン",
      "submit.tags": "タグ",
      "submit.tagsPlaceholder": "カンマ区切り、例：ツール,AI,パーサー",
      "submit.submitBtn": "提出",
      "submit.validating": "検証中...",
      "submit.submitting": "送信中...",
      "submit.descTooShort": "説明が短すぎます（最低10文字必要）",
      "submit.pypiNotFound":
        "PyPI でパッケージ '{package}' が見つかりません。先に PyPI にパッケージを公開してください。",
      "submit.alreadyExists":
        "モジュール '{name}' は既に存在します。重複提出はできません。",
      "submit.successTitle": "提出完了！",
      "submit.successDesc":
        "提出完了！モジュールはマーケットに掲載されました（キャッシュの更新に時間がかかる場合があります）。管理者による確認が行われます。",
      "submit.submitAnother": "続けて提出",
      "submit.errorTitle": "提出に失敗しました",
      "submit.retryBtn": "再試行",
      "submit.loginFailed": "ログインに失敗しました。もう一度お試しください",
      "submit.oauthNotConfigured":
        "GitHub ログインは未設定です。管理者にお問い合わせください",
      "submit.unknownError": "不明なエラー",

      "submit.tabSubmit": "提出",
      "submit.tabMyModules": "自分のモジュール",

      "manage.loading": "読み込み中...",
      "manage.empty": "まだモジュールを提出していません",
      "manage.cacheHint":
        "提出したばかりのモジュールは数分かかる場合があります",
      "manage.loadFailed": "読み込みに失敗しました。もう一度お試しください",
      "manage.statusVerified": "確認済み",
      "manage.statusPending": "確認待ち",
      "manage.delete": "削除",
      "manage.edit": "編集",
      "manage.saveEdit": "変更を保存",
      "manage.confirmDelete":
        "モジュール {name} を削除してもよろしいですか？この操作は取り消せません！",
      "manage.successDelete": "モジュールを削除しました",
      "manage.failed": "操作に失敗しました。もう一度お試しください",

      "docs.title": "ドキュメント",
      "docs.welcome": "ErisPulse へようこそ",
      "docs.welcome.desc":
        "ErisPulse はオープンソースの Python ライブラリで、非同期・ノンブロッキングのボットプログラムを構築するためのシンプルで使いやすいフレームワークを提供します。",
      "docs.welcome.hint":
        "ドキュメントナビゲーションのリンクをクリックして、ErisPulse の機能と使い方を探索しましょう。",
      "docs.edit": "このページを編集",
      "docs.share": "共有",
      "docs.loading": "ドキュメントを読み込み中...",
      "docs.loadFailed": "ドキュメントを読み込めません",
      "docs.loadIndexFailed": "ドキュメントインデックスを読み込めません",
      "docs.searchTrigger": "ドキュメントを検索...",
      "docs.searchPlaceholder": "ドキュメントを検索...",
      "docs.searchHint":
        "<kbd>ESC</kbd> で閉じる · <kbd>↑↓</kbd> でナビゲーション",
      "docs.searchEmpty": "キーワードを入力して検索を開始",
      "docs.noResults": "関連ドキュメントが見つかりません",
      "docs.searchResults": "検索結果",
      "docs.searchIndexLoading": "検索インデックスを読み込み中...",
      "docs.backToCategories": "カテゴリに戻る",
      "docs.backToDocs": "ドキュメントに戻る",
      "docs.toc": "目次",
      "docs.linkCopied": "リンクがクリップボードにコピーされました",
      "docs.linkWarning":
        'リンクのヒント：クリックしたリンク "{link}" はサイト内ナビゲーションにまだ対応していません。サイドバーを使用して関連コンテンツを探してください。',
      "docs.docLoaded": "ドキュメントが読み込まれました",
      "docs.keywordLocated": '"{keyword}" が見つかりました',
      "docs.keywordNotFound": "コンテンツが見つかりません",
      "docs.prev": "前へ",
      "docs.next": "次へ",
      "docs.updatedAgo": "{time} に更新されました",
      "docs.noDoc": "リクエストされたドキュメントは存在しません",
      "docs.forbidden": "アクセスが拒否されました",
      "docs.serverError": "サーバー内部エラーです。後でもう一度お試しください",
      "docs.networkError": "ネットワーク接続に失敗しました",
      "docs.networkHint": "ネットワーク接続を確認して、もう一度お試しください",
      "docs.rateLimit": "GitHub API のリクエスト制限に達しました",
      "docs.rateLimitHint":
        "1時間待つか、GitHub個人アクセストークンを使用してください",
      "docs.retryHint":
        "ネットワーク接続を確認するか、後でもう一度お試しください",
      "docs.loadingModuleDoc": "ドキュメントを読み込み中...",

      "settings.title": "パーソナライズ設定",
      "settings.subtitle": "ErisPulse エクスペリエンスをカスタマイズ",
      "settings.animations": "アニメーション",
      "settings.animationsToggle": "アニメーションを有効にする",
      "settings.animationsDesc":
        "ページ遷移アニメーションとインタラクション効果を制御",
      "settings.content": "コンテンツ設定",
      "settings.compact": "コンパクトレイアウト",
      "settings.compactDesc": "間隔を減らしてより多くのコンテンツを表示",
      "settings.lineNumbers": "行番号を表示",
      "settings.lineNumbersDesc": "コードブロックに行番号を表示",
      "settings.nav": "ナビゲーション",
      "settings.stickyNav": "ナビゲーションを固定",
      "settings.stickyNavDesc": "スクロール時もナビゲーションバーを表示",
      "settings.reset": "設定をリセット",
      "settings.resetBtn": "すべての設定をリセット",
      "settings.resetDesc": "すべての設定をデフォルト値に戻す",
      "settings.resetConfirm":
        "すべての設定をリセットしてもよろしいですか？すべてのオプションがデフォルト値に戻ります。",

      // ドキュメントオフラインキャッシュ
      "settings.docsCache": "ドキュメントオフラインキャッシュ",
      "settings.manageDocsCache": "キャッシュを管理",
      "settings.docsCacheManageTitle": "ドキュメントキャッシュ管理",
      "settings.docsCacheManageDesc":
        "各言語のキャッシュされたドキュメントを表示・削除します。「現在の言語のドキュメントをすべてダウンロード」で、現在の言語を完全なオフラインキャッシュに追加または更新します。",
      "settings.offlineFirst": "オフライン優先モード",
      "settings.offlineFirstDesc":
        "有効にするとローカルキャッシュを優先し、キャッシュがない場合のみネットワークから取得します。オフライン時はキャッシュを使用し、クリアしません。",
      "settings.offlineFirstOn":
        "有効：ローカルキャッシュを優先し、ネットワークリクエストを削減",
      "settings.offlineFirstOff":
        "無効：毎回最新のドキュメントをネットワークから取得",
      "settings.downloadAll": "現在の言語のドキュメントをすべてダウンロード",
      "settings.clearDocsCache": "現在の言語のキャッシュをクリア",
      "settings.clearAllDocsCache": "すべてのキャッシュをクリア",
      "settings.docsCacheClearAllConfirm":
        "すべての言語のドキュメントキャッシュを削除しますか？",
      "settings.docsCacheAllCleared":
        "すべてのドキュメントキャッシュをクリアしました",
      "settings.docsCacheLangCleared":
        "{lang} のドキュメントキャッシュをクリアしました",
      "settings.docsCacheClearLang": "クリア",
      "settings.docsCacheDownloadLang": "ダウンロード/更新",
      "settings.docsCacheCurrentLang": "現在の言語",
      "settings.docsCacheNoVersion": "バージョン未記録",
      "settings.docsCacheNeedIndex":
        "ドキュメントインデックスがまだ読み込まれていません。後でもう一度お試しください",
      "settings.docsCacheOfflineDownload":
        "オフラインのためダウンロードできません",
      "settings.docsCacheProgress": "ダウンロード中... {done}/{total}",
      "settings.docsCacheDownloaded":
        "{success} 件のドキュメントをダウンロード、{failed} 件失敗",
      "settings.docsCacheCleared": "ドキュメントキャッシュをクリアしました",
      "settings.docsCacheVersion": "（v{version}）",
      "settings.docsCacheLocalized":
        "この言語は完全にローカライズされています{version}（{count} 件）",
      "settings.docsCachePartial": "{count} 件のドキュメントをキャッシュ済み",
      "settings.docsCacheEmpty": "まだドキュメントはキャッシュされていません",
      "settings.docsCacheFetchingVersion": "バージョン情報を取得中...",
      "settings.docsCacheUpdateAvailable":
        "ドキュメントが更新されました：{old} → {new}。再ダウンロードをお勧めします。",
      "settings.docsCacheUpdateToast":
        "ドキュメントが更新されました（{old} → {new}）。再ダウンロードをお勧めします。",
      "settings.docsCacheGoUpdate": "更新",

      "about.contributors": "コントリビューター",
      "about.contributorsDesc":
        "プロジェクトに貢献した素晴らしい開発者の皆さんに感謝します",
      "about.friendLinks": "フレンドリンク",
      "about.friendLinksDesc": "おすすめの技術・開発リソース",
      "about.copyright": "著作権",
      "about.copyrightText":
        "ErisPulse は MIT オープンソースライセンスの下で提供されており、自由な配布と改変が可能です。",

      "footer.home": "プロジェクトホーム",
      "footer.docs": "ドキュメント",
      "footer.contribute": "貢献と開発",
      "footer.issue": "Issue を報告",
      "footer.pr": "PR を提出",
      "footer.discussions": "ディスカッション",
      "footer.social": "ソーシャル",
      "footer.copyright": "ライセンス：MIT",

      "modal.moduleDetail": "モジュール詳細",
      "modal.tags": "タグ",
      "modal.repoInfo": "リポジトリ",
      "modal.viewSource": "ソースコードを表示",
      "modal.loadDocFailed": "ドキュメントを読み込めません",

      "common.loading": "読み込み中...",
      "common.noData": "データなし",
      "common.langSwitched": "{name} に切り替えました",
      "common.langSwitchFailed":
        "言語の切り替えに失敗しました。もう一度お試しください",
      "common.onlineRestored": "ネットワークが復旧しました",
      "common.offlineMode": "オフラインモード：ローカルキャッシュを使用します",
      "common.copyFailed": "コピーに失敗しました。手動でコピーしてください",

      "banner.text":
        "ご存知ですか？ErisPulse は完全な Vibe Coding ワークフローをサポートしています",
      "banner.link": "詳細を見る",
      "banner.slides": [
        {
          icon: "fa-wand-magic-sparkles",
          text: "ErisPulse は完全な Vibe Coding ワークフローをサポート — AI がすぐに使えるモジュールを生成",
          link: "#docs/ai-support/README.md",
        },
        {
          icon: "fa-exchange-alt",
          text: "OneBot12 標準の統一イベントフォーマット — ひとつのコードで全プラットフォーム対応",
          link: "#docs/getting-started/basic-concepts.md",
        },
        {
          icon: "fa-puzzle-piece",
          text: "PyPI でモジュールを配布、遅延読み込み、ホットリロード、完全なライフサイクル管理をサポート",
          link: "#docs/developer-guide/modules/getting-started.md",
        },
        {
          icon: "fa-comments",
          text: "確認、選択メニュー、フォーム収集、マルチターン会話などのプリミティブを内蔵",
          link: "#docs/getting-started/event-handling.md",
        },
        {
          icon: "fa-globe",
          text: "雲湖、Telegram、OneBot11/12、メールなどに同時対応 — アダプターがプロトコルの違いを自動処理",
          link: "#docs/platform-guide/README.md",
        },
      ],

      "time.yearsAgo": "{n}年前",
      "time.monthsAgo": "{n}ヶ月前",
      "time.daysAgo": "{n}日前",
      "time.hoursAgo": "{n}時間前",
      "time.minutesAgo": "{n}分前",
      "time.secondsAgo": "{n}秒前",

      "install.btn": "今すぐインストール",
      "install.title": "クイックインストール",
      "install.desc": "環境を自動検出し、最適なインストール方法をご案内します",
      "install.hint": "Docker、Python、uv など多数のインストール方法をサポート",
      "install.copied": "コピーしました！",
      "install.winCmd":
        "irm https://get.erisdev.com/install.ps1 -OutFile install.ps1; powershell -ExecutionPolicy Bypass -File install.ps1",
      "install.unixCmd":
        "curl -fsSL https://get.erisdev.com/install.sh -o install.sh && chmod +x install.sh && ./install.sh",
    },

    ru: {
      "nav.home": "Главная",
      "nav.market": "Маркет",
      "nav.docs": "Документация",
      "nav.settings": "Настройки",
      "nav.about": "О нас",
      "nav.builder": "Конструктор",
      "builder.welcome":
        "### Конструктор модулей\n\nЯ **Сяо-эрис**, официальный помощник ErisPulse по созданию модулей.\n\nЯ помогу собрать модуль в два шага:\n\n1. **Планирование**——расскажите, что хотите создать; я изучу документацию и предложу план\n2. **Генерация**——когда план готов, отправьте «**начать**», и я сгенерирую полный исходный код\n\nНастройте API-адрес и модель в «**Настройках**».",
      "builder.done":
        "Готово. Нажмите «Скачать ZIP», чтобы получить пакет модуля",
      "builder.phase.plan": "План",
      "builder.phase.generate": "Генерация",
      "builder.phaseSwitched":
        "Переключено в режим генерации. AI теперь может записывать файлы.",
      "builder.send": "Отправить",
      "builder.sending": "Генерация…",
      "builder.writing": "Запись…",
      "builder.clear": "Очистить",
      "builder.menu": "Меню",
      "builder.downloadZip": "Скачать ZIP",
      "builder.noFiles": "Файлов пока нет",
      "builder.generatedFiles": "Сгенерированные файлы",
      "builder.viewAll": "Все",
      "builder.sessions": "Сессии",
      "builder.newSession": "Новая",
      "builder.noSessions": "Нет сессий",
      "builder.exportSessions": "Экспорт сессий",
      "builder.exportCurrent": "Экспорт текущей сессии",
      "builder.exportAll": "Экспорт всех сессий",
      "builder.importSessions": "Импорт сессий",
      "builder.importSuccess": "Импортировано сессий: {n}",
      "builder.error.noActiveSession": "Нет активной сессии для экспорта",
      "builder.error.importRead": "Не удалось прочитать файл",
      "builder.error.importParse": "Файл не является корректным JSON",
      "builder.error.importFormat": "Неверный формат файла",
      "builder.error.importEmpty": "В файле нет сессий для импорта",
      "builder.deleteSessionConfirm":
        "Удалить эту сессию? Диалог и сгенерированные файлы будут удалены.",
      "builder.inputPlaceholderPlan": "Опишите задачу или ответьте на вопросы…",
      "builder.inputPlaceholderGenerate": "Дополните…",
      "builder.sendMode.enter": "Enter",
      "builder.sendMode.ctrlEnter": "Ctrl+Enter",
      "builder.sendModeTitle": "Выбор клавиши отправки",
      "builder.question.custom": "Свой ответ…",
      "builder.question.ok": "OK",
      "builder.question.submitAll": "Отправить все ответы",
      "builder.confirmCancel": "Отмена",
      "builder.confirmOk": "OK",
      "builder.confirmStartMsg": "Материалы готовы. Начать генерацию?",
      "builder.docsInitHint":
        "Инициализация индекса документации, это может занять время…",
      "builder.settingsTitle": "Конструктор модулей",
      "builder.settingsDesc":
        "Настройте OpenAI-совместимый API для конструктора. Перейдите на страницу «Конструктор», чтобы начать.",
      "builder.settingsPrivacy":
        "Все данные (настройки, сессии, сгенерированные файлы) хранятся локально в браузере и не передаются на сервер. Открытый исходный код: github.com/ErisPulse/erispulse.github.io",
      "builder.settingsConfigBtn": "Настроить модель",
      "builder.tool.search_docs": "Поиск в док.",
      "builder.tool.read_document": "Чтение док.",
      "builder.tool.list_documents": "Список док.",
      "builder.tool.write_file": "Запись файла",
      "builder.tool.get_manifest": "Список файлов",
      "builder.tool.finalize": "Завершить",
      "builder.tool.ask_question": "Вопрос",
      "builder.tool.confirm_start": "Подтвердить старт",
      "builder.error.noApiUrl": "Укажите API-адрес",
      "builder.error.noModel": "Укажите название модели",
      "builder.error.noConfig":
        "Сначала настройте API-адрес и модель в «Настройки → Конструктор модулей»",
      "builder.error.network": "Ошибка сети",
      "builder.error.apiError": "Ошибка API",
      "builder.error.docsLoad": "Ошибка загрузки документации",
      "builder.error.zip": "Ошибка упаковки",
      "builder.error.clearConfirm":
        "Очистить все диалоги и сгенерированные файлы?",

      "hero.subtitle":
        "Событийно-ориентированный · Мультиплатформенный · Один фреймворк для всего",
      "hero.start": "Начать",
      "hero.docs": "Документация",
      "hero.browse": "Маркет",

      "features.title": "Ключевые возможности",
      "features.eventdriven.code":
        '@message.on_message()\nasync def handler(event):\n    text = event.get_text()\n    await event.reply(f"Получено: {text}")',
      "features.eventdriven.title": "Событийно-ориентированная архитектура",
      "features.eventdriven.desc":
        "Все взаимодействия проходят через события, формируя полный асинхронный конвейер от платформы до модуля",
      "features.ob12.title": "Совместимость с OneBot12",
      "features.ob12.desc":
        "Единый стандарт формата событий, обеспечивающий согласованность и переносимость кода между платформами",
      "features.ob12.code":
        '@command("hello")\nasync def hello_handler(event):\n    platform = event.get_platform()\n    # Тот же код на всех платформах\n    await event.reply("Hello!")',
      "features.aicoding.title": "Разработка с помощью ИИ",
      "features.aicoding.desc":
        "Полная документация и спецификации позволяют ИИ напрямую генерировать готовые модули, поддерживая рабочий процесс Vibe Coding",
      "features.aicoding.code":
        '# Загрузите документацию ErisPulse в ИИ\n# Он сгенерирует готовые модули\n\nclass AIModule(BaseModule):\n    async def on_load(self):\n        self.logger.info("AI модуль готов")',
      "features.senddsl.title": "SendDSL Chain API",
      "features.senddsl.desc":
        "Стиль Send.To().At().Reply().Text() цепочечный интерфейс отправки сообщений — лаконичный и выразительный",
      "features.modular.title": "Модульность и ленивая загрузка",
      "features.modular.desc":
        "Модули распространяются как независимые PyPI-пакеты с поддержкой ленивой загрузки, горячих обновлений, топологической сортировки зависимостей и управления приоритетами",
      "features.modular.code":
        '# pip install ErisPulse-MyModule\n# or: epsdk install MyModule\n\nclass Main(BaseModule):\n    @staticmethod\n    def get_load_strategy():\n        return ModuleLoadStrategy(\n            lazy_load=True,   # Инициализация при первом доступе\n            priority=10        # Больше значение = загружается раньше\n        )\n\n    async def on_load(self, event):\n        self.logger.info("Модуль готов")',
      "features.middleware.title": "Посредники событий",
      "features.middleware.desc":
        "Компонуемый конвейер посредников для фильтрации, преобразования и логирования перед диспетчеризацией событий",
      "features.interactive.title": "Интерактивные диалоги",
      "features.interactive.desc":
        "Встроенные примитивы: подтверждение, меню выбора, сбор форм и многоходовые диалоги для сложных сценариев",
      "features.parallel.title": "Параллельная обработка событий",
      "features.parallel.desc":
        "Обработчики с одинаковым приоритетом выполняются параллельно, разные приоритеты — последовательно, Copy-On-Write с нулевыми накладными расходами, поддержка прерываний",
      "features.parallel.code":
        "@message.on_message(priority=10)\nasync def spam_filter(event):\n    if is_spam(event.get_text()):\n        event.mark_processed()  # Прервать низший приоритет\n\n# Одинаковый приоритет → параллельно, zero-copy\n@message.on_message(priority=0)\nasync def handler_a(event):\n    event['result_a'] = await process_a()\n\n@message.on_message(priority=0)\nasync def handler_b(event):\n    event['result_b'] = await process_b()",
      "features.dashboard.title": "Панель управления",
      "features.dashboard.desc":
        "Мониторинг в реальном времени состояния адаптеров, прогресса загрузки модулей и статуса ботов — полная видимость работы системы",
      "features.hooks.title": "Хуки жизненного цикла",
      "features.hooks.desc":
        "Вставляйте пользовательскую логику на каждом ключевом этапе работы фреймворка: загрузка модулей, запуск/остановка адаптеров, подключение/отключение ботов — всё отслеживаемо и управляемо",
      "features.hooks.code":
        '@sdk.lifecycle.on("module.load")\nasync def on_loaded(data):\n    sdk.logger.info(f"Модуль загружен: {data}")\n\n@sdk.lifecycle.on("adapter.bot.online")\nasync def on_bot_online(data):\n    await notify_admin(f"Bot онлайн: {data[\'bot_id\']}")\n\n@sdk.lifecycle.on("adapter.stop")\nasync def on_stop(data):\n    sdk.logger.warning("Адаптер останавливается")',
      "features.multiplatform.title": "Мультиплатформенность",
      "features.multiplatform.desc":
        "Единая кодовая база для Yunhu, Telegram, OneBot11/12, Email и других платформ — адаптеры автоматически обрабатывают различия протоколов",
      "features.multiplatform.code":
        '@command("hello")\nasync def hello(event):\n    # Yunhu · Telegram · QQ · Email...\n    # Одна кодовая база, все платформы\n    platform = event.get_platform()\n    await event.reply(f"Hello from {platform}!")',

      "market.title": "Маркет модулей",
      "market.submit": "Добавить модуль",
      "market.search": "Поиск модулей...",
      "market.total": "Всего модулей",
      "market.modules": "Модули",
      "market.adapters": "Адаптеры",
      "market.all": "Все модули",
      "market.install": "Установить",
      "market.docs": "Документация",
      "market.empty": "Подходящих модулей не найдено",
      "market.empty.hint":
        "Попробуйте другие ключевые слова или просмотрите все модули",
      "market.loadFailed":
        "Не удалось загрузить модули. Повторите попытку позже",
      "market.reload": "Обновить",
      "market.installCmd": "Команда установки",
      "market.unverified": "Непроверенный",

      "submit.title": "Добавить модуль",
      "submit.loginTitle": "Выберите способ входа",
      "submit.loginDesc":
        "Войдите, чтобы добавить свой модуль в экосистему ErisPulse",
      "submit.loginYunhu": "Yunhu",
      "submit.loginBtn": "Войти через GitHub",
      "submit.logout": "Выйти",
      "submit.type": "Тип",
      "submit.typeModule": "Модуль (Module)",
      "submit.typeAdapter": "Адаптер (Adapter)",
      "submit.name": "Название модуля",
      "submit.nameHint": "Буквы, цифры, подчёркивания, дефисы",
      "submit.package": "Имя пакета PyPI",
      "submit.packageHint": "Пакет должен быть опубликован на PyPI",
      "submit.description": "Описание",
      "submit.descriptionPlaceholder": "Краткое описание модуля...",
      "submit.author": "Автор",
      "submit.repository": "URL репозитория",
      "submit.minSdkVersion": "Мин. версия SDK",
      "submit.tags": "Теги",
      "submit.tagsPlaceholder": "Через запятую, например: инструмент,ИИ,парсер",
      "submit.submitBtn": "Добавить",
      "submit.validating": "Проверка...",
      "submit.submitting": "Отправка...",
      "submit.descTooShort": "Описание слишком короткое (минимум 10 символов)",
      "submit.pypiNotFound":
        "Пакет '{package}' не найден на PyPI. Сначала опубликуйте его.",
      "submit.alreadyExists":
        "Модуль '{name}' уже существует. Повторная отправка запрещена.",
      "submit.successTitle": "Отправлено!",
      "submit.successDesc":
        "Отправлено! Модуль добавлен в маркет (обновление кэша может занять некоторое время). Администратор проверит его позже.",
      "submit.submitAnother": "Отправить ещё",
      "submit.errorTitle": "Ошибка отправки",
      "submit.retryBtn": "Повторить",
      "submit.loginFailed": "Ошибка входа. Повторите попытку",
      "submit.oauthNotConfigured":
        "Вход через GitHub не настроен. Обратитесь к администратору",
      "submit.unknownError": "Неизвестная ошибка",

      "submit.tabSubmit": "Добавить",
      "submit.tabMyModules": "Мои модули",

      "manage.loading": "Загрузка...",
      "manage.empty": "Вы ещё не отправляли модули",
      "manage.cacheHint": "Новый модуль может появиться через несколько минут",
      "manage.loadFailed": "Ошибка загрузки. Повторите попытку",
      "manage.statusVerified": "Проверено",
      "manage.statusPending": "Ожидает проверки",
      "manage.delete": "Удалить",
      "manage.edit": "Редактировать",
      "manage.saveEdit": "Сохранить",
      "manage.confirmDelete":
        "Вы уверены, что хотите удалить модуль {name}? Это нельзя отменить!",
      "manage.successDelete": "Модуль удалён",
      "manage.failed": "Операция не удалась. Повторите попытку",

      "docs.title": "Документация",
      "docs.welcome": "Добро пожаловать в ErisPulse",
      "docs.welcome.desc":
        "ErisPulse — это библиотека Python с открытым исходным кодом, предоставляющая простой и удобный фреймворк для создания асинхронных неблокирующих бот-программ.",
      "docs.welcome.hint":
        "Нажмите на ссылки в навигации документации, чтобы изучить возможности ErisPulse.",
      "docs.edit": "Редактировать страницу",
      "docs.share": "Поделиться",
      "docs.loading": "Загрузка документа...",
      "docs.loadFailed": "Не удалось загрузить документ",
      "docs.loadIndexFailed": "Не удалось загрузить индекс документов",
      "docs.searchTrigger": "Поиск в документации...",
      "docs.searchPlaceholder": "Поиск в документации...",
      "docs.searchHint": "<kbd>ESC</kbd> закрыть · <kbd>↑↓</kbd> навигация",
      "docs.searchEmpty": "Введите ключевые слова для поиска",
      "docs.noResults": "Документы не найдены",
      "docs.searchResults": "Результаты поиска",
      "docs.searchIndexLoading": "Загрузка поискового индекса...",
      "docs.backToCategories": "К категориям",
      "docs.backToDocs": "К документации",
      "docs.toc": "Содержание",
      "docs.linkCopied": "Ссылка скопирована в буфер обмена",
      "docs.linkWarning":
        'Подсказка: ссылка "{link}" ещё не адаптирована для навигации по сайту. Используйте боковую панель.',
      "docs.docLoaded": "Документ загружен",
      "docs.keywordLocated": 'Найдено: "{keyword}"',
      "docs.keywordNotFound": "Содержимое не найдено",
      "docs.prev": "Назад",
      "docs.next": "Далее",
      "docs.updatedAgo": "Обновлено {time}",
      "docs.noDoc": "Запрашиваемый документ не существует",
      "docs.forbidden": "Доступ запрещён",
      "docs.serverError": "Внутренняя ошибка сервера. Повторите попытку позже",
      "docs.networkError": "Ошибка сетевого подключения",
      "docs.networkHint": "Проверьте сетевое подключение и повторите попытку",
      "docs.rateLimit": "Превышен лимит запросов GitHub API",
      "docs.rateLimitHint":
        "Подождите 1 час или используйте личный токен GitHub",
      "docs.retryHint":
        "Проверьте сетевое подключение или повторите попытку позже",
      "docs.loadingModuleDoc": "Загрузка документации...",

      "settings.title": "Персонализация",
      "settings.subtitle": "Настройте ErisPulse под себя",
      "settings.animations": "Анимации",
      "settings.animationsToggle": "Включить анимации",
      "settings.animationsDesc":
        "Управление анимациями переходов и интерактивными эффектами",
      "settings.content": "Настройки контента",
      "settings.compact": "Компактный макет",
      "settings.compactDesc":
        "Уменьшить отступы для отображения большего контента",
      "settings.lineNumbers": "Показать номера строк",
      "settings.lineNumbersDesc": "Отображать номера строк в блоках кода",
      "settings.nav": "Навигация",
      "settings.stickyNav": "Фиксированная навигация",
      "settings.stickyNavDesc":
        "Панель навигации остаётся видимой при прокрутке",
      "settings.reset": "Сбросить настройки",
      "settings.resetBtn": "Сбросить все настройки",
      "settings.resetDesc": "Восстановить все настройки по умолчанию",
      "settings.resetConfirm":
        "Вы уверены, что хотите сбросить все настройки? Все параметры вернутся к значениям по умолчанию.",

      // Офлайн-кэш документов
      "settings.docsCache": "Офлайн-кэш документов",
      "settings.manageDocsCache": "Управление кэшем",
      "settings.docsCacheManageTitle": "Управление кэшем документов",
      "settings.docsCacheManageDesc":
        "Просмотр и очистка кэша документов для каждого языка. «Скачать все документы текущего языка» добавит или обновит текущий язык в полном офлайн-кэше.",
      "settings.offlineFirst": "Офлайн-приоритет",
      "settings.offlineFirstDesc":
        "Если включено, сначала используется локальный кэш, а сеть — только при отсутствии кэша. В офлайне кэш используется и не очищается.",
      "settings.offlineFirstOn":
        "Включено: приоритет локального кэша, меньше сетевых запросов",
      "settings.offlineFirstOff":
        "Выключено: при каждом посещении документы загружаются из сети",
      "settings.downloadAll": "Скачать все документы текущего языка",
      "settings.clearDocsCache": "Очистить кэш текущего языка",
      "settings.clearAllDocsCache": "Очистить весь кэш",
      "settings.docsCacheClearAllConfirm":
        "Удалить кэш документов для всех языков?",
      "settings.docsCacheAllCleared": "Весь кэш документов очищен",
      "settings.docsCacheLangCleared": "Кэш документов {lang} очищен",
      "settings.docsCacheClearLang": "Очистить",
      "settings.docsCacheDownloadLang": "Скачать/обновить",
      "settings.docsCacheCurrentLang": "Текущий язык",
      "settings.docsCacheNoVersion": "Версия не записана",
      "settings.docsCacheNeedIndex":
        "Индекс документов ещё не загружен, попробуйте позже",
      "settings.docsCacheOfflineDownload": "Вы офлайн, загрузка невозможна",
      "settings.docsCacheProgress": "Загрузка... {done}/{total}",
      "settings.docsCacheDownloaded":
        "Загружено документов: {success}, неудачно: {failed}",
      "settings.docsCacheCleared": "Кэш документов очищен",
      "settings.docsCacheVersion": " (v{version})",
      "settings.docsCacheLocalized":
        "Этот язык полностью локализован{version}, {count} документов",
      "settings.docsCachePartial": "В кэше {count} документов",
      "settings.docsCacheEmpty": "Документы ещё не кэшированы",
      "settings.docsCacheFetchingVersion": "Получение информации о версии...",
      "settings.docsCacheUpdateAvailable":
        "Документы обновлены: {old} → {new}. Рекомендуется загрузить заново.",
      "settings.docsCacheUpdateToast":
        "Документы обновлены ({old} → {new}). Рекомендуется загрузить заново.",
      "settings.docsCacheGoUpdate": "Обновить",

      "about.contributors": "Наши контрибьюторы",
      "about.contributorsDesc":
        "Благодарим этих прекрасных разработчиков за их вклад в проект",
      "about.friendLinks": "Дружественные ссылки",
      "about.friendLinksDesc":
        "Рекомендуемые технические ресурсы и материалы для разработки",
      "about.copyright": "Авторские права",
      "about.copyrightText":
        "ErisPulse распространяется под лицензией MIT, разрешающей свободное распространение и модификацию.",

      "footer.home": "Главная проекта",
      "footer.docs": "Документация",
      "footer.contribute": "Вклад и разработка",
      "footer.issue": "Сообщить об Issue",
      "footer.pr": "Отправить PR",
      "footer.discussions": "Обсуждения",
      "footer.social": "Социальные сети",
      "footer.copyright": "Лицензия：MIT",

      "modal.moduleDetail": "Подробности модуля",
      "modal.tags": "Теги",
      "modal.repoInfo": "Репозиторий",
      "modal.viewSource": "Исходный код",
      "modal.loadDocFailed": "Не удалось загрузить документацию",

      "common.loading": "Загрузка...",
      "common.noData": "Нет данных",
      "common.langSwitched": "Переключено на {name}",
      "common.langSwitchFailed":
        "Не удалось переключить язык. Повторите попытку",
      "common.onlineRestored": "Сеть восстановлена",
      "common.offlineMode": "Офлайн-режим: используется локальный кэш",
      "common.copyFailed": "Не удалось скопировать. Скопируйте вручную",

      "banner.text":
        "Знаете ли вы? ErisPulse поддерживает полный рабочий процесс Vibe Coding",
      "banner.link": "Подробнее",
      "banner.slides": [
        {
          icon: "fa-wand-magic-sparkles",
          text: "ErisPulse поддерживает полный рабочий процесс Vibe Coding — ИИ генерирует готовые модули",
          link: "#docs/ai-support/README.md",
        },
        {
          icon: "fa-exchange-alt",
          text: "Единый формат событий OneBot12 — одна кодовая база работает на всех платформах",
          link: "#docs/getting-started/basic-concepts.md",
        },
        {
          icon: "fa-puzzle-piece",
          text: "Модули распространяются через PyPI с ленивой загрузкой, горячей перезагрузкой и полным управлением жизненным циклом",
          link: "#docs/developer-guide/modules/getting-started.md",
        },
        {
          icon: "fa-comments",
          text: "Встроенные примитивы: подтверждение, меню выбора, сбор форм и многоходовые диалоги",
          link: "#docs/getting-started/event-handling.md",
        },
        {
          icon: "fa-globe",
          text: "Подключение к Yunhu, Telegram, OneBot11/12, Email и другим платформам — адаптеры обрабатывают различия",
          link: "#docs/platform-guide/README.md",
        },
      ],

      "time.yearsAgo": "{n} г. назад",
      "time.monthsAgo": "{n} мес. назад",
      "time.daysAgo": "{n} дн. назад",
      "time.hoursAgo": "{n} ч. назад",
      "time.minutesAgo": "{n} мин. назад",
      "time.secondsAgo": "{n} сек. назад",

      "install.btn": "Установить",
      "install.title": "Быстрая установка",
      "install.desc":
        "Автоматическое определение среды и выбор лучшего способа установки",
      "install.hint":
        "Поддержка Docker, Python, uv и других способов установки",
      "install.copied": "Скопировано!",
      "install.winCmd":
        "irm https://get.erisdev.com/install.ps1 -OutFile install.ps1; powershell -ExecutionPolicy Bypass -File install.ps1",
      "install.unixCmd":
        "curl -fsSL https://get.erisdev.com/install.sh -o install.sh && chmod +x install.sh && ./install.sh",
    },
  };

  // ==================== 核心方法 ====================

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键
   * @param {Object} params - 替换参数，如 { name: 'xxx', n: 5 }
   * @returns {string}
   */
  function t(key, params) {
    const lang = currentLang;
    let text =
      (messages[lang] && messages[lang][key]) ||
      (messages["zh-CN"] && messages["zh-CN"][key]) ||
      key;

    if (params) {
      Object.keys(params).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), params[k]);
      });
    }

    return text;
  }

  /**
   * 获取当前语言
   */
  function getLang() {
    return currentLang;
  }

  /**
   * 设置语言并更新所有 UI
   * @param {string} lang - 语言代码
   * @param {boolean} syncDocs - 是否同步文档语言
   */
  function setLang(lang, syncDocs = true) {
    if (!messages[lang]) {
      console.warn(`不支持的语言: ${lang}`);
      return;
    }

    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // 更新 HTML lang 属性
    const langMap = {
      "zh-CN": "zh-CN",
      en: "en",
      "zh-TW": "zh-TW",
      ja: "ja",
      ru: "ru",
    };
    document.documentElement.lang = langMap[lang] || lang;

    // 更新所有全局语言切换器的选中状态
    document.querySelectorAll(".global-lang-select").forEach((select) => {
      select.value = lang;
    });

    // 更新文档侧边栏语言切换器
    const docsLangSelect = document.getElementById("lang-select");
    if (docsLangSelect) {
      docsLangSelect.value = lang;
    }

    // 同步文档语言
    if (syncDocs) {
      localStorage.setItem("erispulse-docs-lang", lang);
    }

    // 更新所有带 data-i18n 属性的元素
    applyTranslations();

    return true;
  }

  /**
   * 应用翻译到所有带 data-i18n 属性的元素
   */
  function applyTranslations() {
    // 文本内容
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);

      // 代码块文本替换后需要重新高亮
      if (el.tagName === "CODE" && typeof Prism !== "undefined") {
        Prism.highlightElement(el);
      }
    });

    // placeholder 属性
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = t(key);
    });

    // title 属性
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      el.title = t(key);
    });

    // aria-label 属性
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      el.setAttribute("aria-label", t(key));
    });

    // innerHTML 属性（用于渲染 Markdown 等含 HTML 的翻译）
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      el.innerHTML = t(key);
    });
  }

  /**
   * 获取语言显示名称
   */
  function getLanguageName(lang) {
    const names = {
      "zh-CN": "简体中文",
      en: "English",
      "zh-TW": "繁體中文",
      ja: "日本語",
      ru: "Русский",
    };
    return names[lang] || lang;
  }

  /**
   * 获取支持的语言列表
   */
  function getSupportedLanguages() {
    return [
      { code: "zh-CN", name: "简体中文" },
      { code: "en", name: "English" },
      { code: "zh-TW", name: "繁體中文" },
      { code: "ja", name: "日本語" },
      { code: "ru", name: "Русский" },
    ];
  }

  /**
   * 初始化（在 DOMContentLoaded 时调用）
   */
  function init() {
    // 同步 localStorage
    localStorage.setItem("erispulse-docs-lang", currentLang);

    // 应用翻译
    applyTranslations();

    // 设置 HTML lang
    document.documentElement.lang = currentLang;
  }

  // 公共 API
  return {
    t,
    getLang,
    setLang,
    applyTranslations,
    getLanguageName,
    getSupportedLanguages,
    init,
    STORAGE_KEY,
  };
})();
