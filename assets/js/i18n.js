/**
 * ErisPulse i18n 国际化模块
 * 支持语言：zh-CN（简体中文）、en（English）、zh-TW（繁體中文）
 */

const I18n = (function () {
    const STORAGE_KEY = 'erispulse-lang';
    let currentLang = localStorage.getItem(STORAGE_KEY) || 'zh-CN';

    // ==================== 翻译字典 ====================
    const messages = {
        'zh-CN': {
            // 导航栏
            'nav.home': '首页',
            'nav.market': '模块市场',
            'nav.docs': '文档中心',
            'nav.settings': '设置',
            'nav.about': '我们',

            // 首页 Hero
            'hero.subtitle': '高性能异步机器人开发框架',
            'hero.start': '开始使用',
            'hero.browse': '浏览模块',

            // 首页特性区
            'features.title': '核心特性',
            'features.lazy.title': '智能懒加载',
            'features.lazy.desc': '模块按需加载，显著提升启动速度和内存效率',
            'features.hotreload.title': '热重载开发',
            'features.hotreload.desc': '代码修改后自动重启，大幅提升开发效率',
            'features.modular.title': '模块化架构',
            'features.modular.desc': 'PyPI包形式模块系统，支持动态加载和热更新',
            'features.async.title': '异步高性能',
            'features.async.desc': '基于asyncio的事件驱动，确保高性能和低延迟',
            'features.api.title': '优雅的API',
            'features.api.desc': '链式调用DSL和类型提示，让代码更简洁',
            'features.platforms.title': '多平台支持',
            'features.platforms.desc': '云湖、Telegram、OneBot12等平台一键接入',

            // 首页代码演示
            'demo.title': '快速上手',
            'demo.subtitle': '只需几行代码，即可创建你的第一个机器人',
            'demo.run': '运行效果',
            'demo.copy': '复制',
            'demo.copied': '已复制',

            // 模块市场
            'market.title': '模块市场',
            'market.legacy': '查看 1.x 模块源 [已废弃]',
            'market.search': '搜索模块...',
            'market.total': '总模块数',
            'market.modules': '功能模块',
            'market.adapters': '平台适配器',
            'market.cli': 'CLI扩展',
            'market.all': '全部模块',
            'market.install': '安装',
            'market.docs': '文档',
            'market.commands': '命令',
            'market.empty': '未找到匹配的模块',
            'market.empty.hint': '尝试不同的搜索关键词或查看所有模块',
            'market.loadFailed': '加载模块失败，请稍后再试',
            'market.reload': '重新加载',
            'market.installCmd': '安装命令',

            // 文档中心
            'docs.title': '文档中心',
            'docs.welcome': '欢迎使用 ErisPulse',
            'docs.welcome.desc': 'ErisPulse 是一个开源的 Python 库，目标是提供一个简单、易于使用的框架，用于构建异步、非阻塞的机器人程序。',
            'docs.welcome.hint': '点击文档导航中的链接，开始探索 ErisPulse 的功能和用法吧。',
            'docs.edit': '编辑此页',
            'docs.share': '分享',
            'docs.loading': '正在加载文档...',
            'docs.loadFailed': '无法加载文档',
            'docs.loadIndexFailed': '无法加载文档索引',
            'docs.searchTrigger': '搜索文档...',
            'docs.searchPlaceholder': '搜索文档...',
            'docs.searchHint': '按 <kbd>ESC</kbd> 关闭 · <kbd>↑↓</kbd> 导航结果',
            'docs.searchEmpty': '输入关键词开始搜索',
            'docs.noResults': '未找到相关文档',
            'docs.searchResults': '搜索结果',
            'docs.searchIndexLoading': '搜索索引加载中...',
            'docs.backToCategories': '返回分类',
            'docs.backToDocs': '返回文档',
            'docs.toc': '目录',
            'docs.linkCopied': '链接已复制到剪贴板',
            'docs.linkWarning': '文档链接提示：点击的链接 "{link}" 暂未适配站内跳转，请使用左侧导航栏手动查找相关文档内容。',
            'docs.docLoaded': '文档已加载',
            'docs.keywordLocated': '已定位到 "{keyword}"',
            'docs.keywordNotFound': '未找到指定内容',
            'docs.prev': '上一篇',
            'docs.next': '下一篇',
            'docs.updatedAgo': '{time} 更新了此文档',
            'docs.noDoc': '请求的文档不存在，可能是URL错误',
            'docs.forbidden': '访问被拒绝，可能是权限问题',
            'docs.serverError': '服务器内部错误，请稍后再试',
            'docs.networkError': '网络连接失败',
            'docs.networkHint': '请检查您的网络连接后重试',
            'docs.rateLimit': 'GitHub API请求次数已达上限',
            'docs.rateLimitHint': '请等待1小时后重试，或使用GitHub个人访问令牌提高限制',
            'docs.retryHint': '请检查网络连接或稍后再试',
            'docs.loadingModuleDoc': '正在加载文档...',

            // 设置页
            'settings.title': '个性化设置',
            'settings.subtitle': '自定义您的 ErisPulse 体验',
            'settings.theme': '主题设置',
            'settings.light': '浅色主题',
            'settings.dark': '深色主题',
            'settings.auto': '自动 (跟随系统)',
            'settings.preset': '预设样式',
            'settings.defaultPreset': '默认样式',
            'settings.oceanPreset': '海洋风格',
            'settings.sunsetPreset': '日落风格',
            'settings.forestPreset': '森林风格',
            'settings.lavenderPreset': '薰衣草风格',
            'settings.applyPreset': '应用预设',
            'settings.advancedColors': '高级颜色设置',
            'settings.animations': '动画效果',
            'settings.animationsToggle': '启用动画效果',
            'settings.animationsDesc': '控制页面过渡动画和交互效果',
            'settings.content': '内容偏好',
            'settings.compact': '紧凑布局',
            'settings.compactDesc': '减少页面间距，显示更多内容',
            'settings.lineNumbers': '显示代码行号',
            'settings.lineNumbersDesc': '在代码块中显示行号',
            'settings.nav': '导航设置',
            'settings.stickyNav': '固定导航栏',
            'settings.stickyNavDesc': '滚动时保持导航栏可见',
            'settings.reset': '重置设置',
            'settings.resetBtn': '重置所有设置',
            'settings.resetDesc': '将所有设置恢复为默认值',
            'settings.resetConfirm': '确定要重置所有设置吗？这将恢复所有选项为默认值。',
            'settings.presetApplied': '已应用 {name} 预设样式',
            'settings.defaultRestored': '已恢复默认主题',
            'settings.colorsApplied': '颜色设置已应用',
            'settings.colorSettings': '高级颜色设置',

            // 高级颜色设置
            'colors.primary': '主色调',
            'colors.primaryDark': '主色调深色',
            'colors.primaryRgb': '主色调RGB',
            'colors.accent': '强调色',
            'colors.accentRgb': '强调色RGB',
            'colors.bg': '背景色',
            'colors.bgRgb': '背景色RGB',
            'colors.text': '文字颜色',
            'colors.textRgb': '文字颜色RGB',
            'colors.border': '边框颜色',
            'colors.cardBg': '卡片背景色',
            'colors.shadow': '阴影颜色',
            'colors.groupPrimary': '主色调设置',
            'colors.groupAccent': '强调色设置',
            'colors.groupBgText': '背景和文字',
            'colors.groupOther': '其他颜色',
            'colors.apply': '应用设置',
            'colors.cancel': '取消',

            // 关于页
            'about.contributors': '我们的贡献者',
            'about.contributorsDesc': '感谢这些优秀的开发者为项目做出的贡献',
            'about.dependencies': '项目依赖',
            'about.dependenciesDesc': '感谢这些优秀的开源项目，让 ErisPulse 成为可能',
            'about.friendLinks': '友情链接',
            'about.friendLinksDesc': '推荐一些优秀的技术和开发资源',
            'about.copyright': '版权声明',
            'about.copyrightText': 'ErisPulse 使用 MIT 开源协议，允许自由分发和修改。',
            'about.avatarCopyright': '头像版权归原作者所有：',

            // 页脚
            'footer.home': '项目主页',
            'footer.docs': '使用文档',
            'footer.contribute': '贡献与开发',
            'footer.issue': '报告Issue',
            'footer.pr': '提交PR',
            'footer.discussions': '讨论区',
            'footer.social': '社交平台',
            'footer.copyright': '开源许可证：MIT',

            // 模态框
            'modal.moduleDetail': '模块详情',
            'modal.availableCommands': '可用命令',
            'modal.tags': '标签',
            'modal.repoInfo': '仓库信息',
            'modal.viewSource': '查看源代码',
            'modal.loadDocFailed': '无法加载文档',

            // 通用
            'common.loading': '加载中...',
            'common.noData': '暂无数据',
            'common.langSwitched': '已切换到{name}',
            'common.langSwitchFailed': '切换语言失败，请重试',
            'common.copyFailed': '复制失败，请手动复制',

            // 时间格式
            'time.yearsAgo': '{n}年前',
            'time.monthsAgo': '{n}个月前',
            'time.daysAgo': '{n}天前',
            'time.hoursAgo': '{n}小时前',
            'time.minutesAgo': '{n}分钟前',
            'time.secondsAgo': '{n}秒前'
        },

        'en': {
            // 导航栏
            'nav.home': 'Home',
            'nav.market': 'Market',
            'nav.docs': 'Docs',
            'nav.settings': 'Settings',
            'nav.about': 'About',

            // 首页 Hero
            'hero.subtitle': 'High-Performance Async Bot Framework',
            'hero.start': 'Get Started',
            'hero.browse': 'Browse Modules',

            // 首页特性区
            'features.title': 'Core Features',
            'features.lazy.title': 'Smart Lazy Loading',
            'features.lazy.desc': 'Load modules on demand, significantly improving startup speed and memory efficiency',
            'features.hotreload.title': 'Hot Reload',
            'features.hotreload.desc': 'Auto-restart on code changes, greatly boosting development efficiency',
            'features.modular.title': 'Modular Architecture',
            'features.modular.desc': 'PyPI-style module system with dynamic loading and hot updates',
            'features.async.title': 'Async & High Performance',
            'features.async.desc': 'Event-driven based on asyncio, ensuring high performance and low latency',
            'features.api.title': 'Elegant API',
            'features.api.desc': 'Chain-call DSL and type hints make code cleaner',
            'features.platforms.title': 'Multi-Platform Support',
            'features.platforms.desc': 'One-click integration with Yunhu, Telegram, OneBot12 and more',

            // 首页代码演示
            'demo.title': 'Quick Start',
            'demo.subtitle': 'Create your first bot with just a few lines of code',
            'demo.run': 'Output',
            'demo.copy': 'Copy',
            'demo.copied': 'Copied',

            // 模块市场
            'market.title': 'Module Market',
            'market.legacy': 'View 1.x Modules [Deprecated]',
            'market.search': 'Search modules...',
            'market.total': 'Total Modules',
            'market.modules': 'Modules',
            'market.adapters': 'Adapters',
            'market.cli': 'CLI Extensions',
            'market.all': 'All Modules',
            'market.install': 'Install',
            'market.docs': 'Docs',
            'market.commands': 'Commands',
            'market.empty': 'No matching modules found',
            'market.empty.hint': 'Try different keywords or browse all modules',
            'market.loadFailed': 'Failed to load modules, please try again later',
            'market.reload': 'Reload',
            'market.installCmd': 'Install Command',

            // 文档中心
            'docs.title': 'Documentation',
            'docs.welcome': 'Welcome to ErisPulse',
            'docs.welcome.desc': 'ErisPulse is an open-source Python library that provides a simple and easy-to-use framework for building async, non-blocking bot programs.',
            'docs.welcome.hint': 'Click on the links in the doc navigation to explore ErisPulse features and usage.',
            'docs.edit': 'Edit this page',
            'docs.share': 'Share',
            'docs.loading': 'Loading document...',
            'docs.loadFailed': 'Unable to load document',
            'docs.loadIndexFailed': 'Unable to load document index',
            'docs.searchTrigger': 'Search docs...',
            'docs.searchPlaceholder': 'Search docs...',
            'docs.searchHint': 'Press <kbd>ESC</kbd> to close · <kbd>↑↓</kbd> to navigate',
            'docs.searchEmpty': 'Enter keywords to start searching',
            'docs.noResults': 'No related documents found',
            'docs.searchResults': 'Search Results',
            'docs.searchIndexLoading': 'Loading search index...',
            'docs.backToCategories': 'Back to Categories',
            'docs.backToDocs': 'Back to Docs',
            'docs.toc': 'Table of Contents',
            'docs.linkCopied': 'Link copied to clipboard',
            'docs.linkWarning': 'Link hint: The clicked link "{link}" is not yet adapted for in-site navigation. Please use the sidebar to find related content.',
            'docs.docLoaded': 'Document loaded',
            'docs.keywordLocated': 'Located "{keyword}"',
            'docs.keywordNotFound': 'Content not found',
            'docs.prev': 'Previous',
            'docs.next': 'Next',
            'docs.updatedAgo': 'Updated {time}',
            'docs.noDoc': 'The requested document does not exist',
            'docs.forbidden': 'Access denied',
            'docs.serverError': 'Internal server error, please try again later',
            'docs.networkError': 'Network connection failed',
            'docs.networkHint': 'Please check your network connection and try again',
            'docs.rateLimit': 'GitHub API rate limit exceeded',
            'docs.rateLimitHint': 'Please wait 1 hour or use a GitHub personal access token',
            'docs.retryHint': 'Please check your network connection or try again later',
            'docs.loadingModuleDoc': 'Loading documentation...',

            // 设置页
            'settings.title': 'Personalization',
            'settings.subtitle': 'Customize your ErisPulse experience',
            'settings.theme': 'Theme',
            'settings.light': 'Light Theme',
            'settings.dark': 'Dark Theme',
            'settings.auto': 'Auto (Follow System)',
            'settings.preset': 'Preset Styles',
            'settings.defaultPreset': 'Default',
            'settings.oceanPreset': 'Ocean',
            'settings.sunsetPreset': 'Sunset',
            'settings.forestPreset': 'Forest',
            'settings.lavenderPreset': 'Lavender',
            'settings.applyPreset': 'Apply Preset',
            'settings.advancedColors': 'Advanced Color Settings',
            'settings.animations': 'Animations',
            'settings.animationsToggle': 'Enable Animations',
            'settings.animationsDesc': 'Control page transition animations and interaction effects',
            'settings.content': 'Content Preferences',
            'settings.compact': 'Compact Layout',
            'settings.compactDesc': 'Reduce spacing to show more content',
            'settings.lineNumbers': 'Show Line Numbers',
            'settings.lineNumbersDesc': 'Display line numbers in code blocks',
            'settings.nav': 'Navigation',
            'settings.stickyNav': 'Sticky Navigation',
            'settings.stickyNavDesc': 'Keep navigation bar visible while scrolling',
            'settings.reset': 'Reset Settings',
            'settings.resetBtn': 'Reset All Settings',
            'settings.resetDesc': 'Restore all settings to default values',
            'settings.resetConfirm': 'Are you sure you want to reset all settings? This will restore all options to defaults.',
            'settings.presetApplied': 'Applied {name} preset',
            'settings.defaultRestored': 'Default theme restored',
            'settings.colorsApplied': 'Color settings applied',
            'settings.colorSettings': 'Advanced Color Settings',

            // 高级颜色设置
            'colors.primary': 'Primary Color',
            'colors.primaryDark': 'Primary Dark',
            'colors.primaryRgb': 'Primary RGB',
            'colors.accent': 'Accent Color',
            'colors.accentRgb': 'Accent RGB',
            'colors.bg': 'Background',
            'colors.bgRgb': 'Background RGB',
            'colors.text': 'Text Color',
            'colors.textRgb': 'Text RGB',
            'colors.border': 'Border Color',
            'colors.cardBg': 'Card Background',
            'colors.shadow': 'Shadow Color',
            'colors.groupPrimary': 'Primary Colors',
            'colors.groupAccent': 'Accent Colors',
            'colors.groupBgText': 'Background & Text',
            'colors.groupOther': 'Other Colors',
            'colors.apply': 'Apply',
            'colors.cancel': 'Cancel',

            // 关于页
            'about.contributors': 'Our Contributors',
            'about.contributorsDesc': 'Thanks to these excellent developers for their contributions',
            'about.dependencies': 'Project Dependencies',
            'about.dependenciesDesc': 'Thanks to these amazing open-source projects that make ErisPulse possible',
            'about.friendLinks': 'Friend Links',
            'about.friendLinksDesc': 'Recommended tech and development resources',
            'about.copyright': 'Copyright',
            'about.copyrightText': 'ErisPulse is licensed under MIT, allowing free distribution and modification.',
            'about.avatarCopyright': 'Avatar copyright belongs to the original author:',

            // 页脚
            'footer.home': 'Project Home',
            'footer.docs': 'Documentation',
            'footer.contribute': 'Contribute & Develop',
            'footer.issue': 'Report Issue',
            'footer.pr': 'Submit PR',
            'footer.discussions': 'Discussions',
            'footer.social': 'Social',
            'footer.copyright': 'License: MIT',

            // 模态框
            'modal.moduleDetail': 'Module Details',
            'modal.availableCommands': 'Available Commands',
            'modal.tags': 'Tags',
            'modal.repoInfo': 'Repository',
            'modal.viewSource': 'View Source',
            'modal.loadDocFailed': 'Unable to load documentation',

            // 通用
            'common.loading': 'Loading...',
            'common.noData': 'No data',
            'common.langSwitched': 'Switched to {name}',
            'common.langSwitchFailed': 'Failed to switch language, please retry',
            'common.copyFailed': 'Copy failed, please copy manually',

            // 时间格式
            'time.yearsAgo': '{n}y ago',
            'time.monthsAgo': '{n}mo ago',
            'time.daysAgo': '{n}d ago',
            'time.hoursAgo': '{n}h ago',
            'time.minutesAgo': '{n}m ago',
            'time.secondsAgo': '{n}s ago'
        },

        'zh-TW': {
            // 导航栏
            'nav.home': '首頁',
            'nav.market': '模組市場',
            'nav.docs': '文檔中心',
            'nav.settings': '設定',
            'nav.about': '關於',

            // 首页 Hero
            'hero.subtitle': '高效能非同步機器人開發框架',
            'hero.start': '開始使用',
            'hero.browse': '瀏覽模組',

            // 首页特性区
            'features.title': '核心特性',
            'features.lazy.title': '智慧懶載入',
            'features.lazy.desc': '模組按需載入，顯著提升啟動速度和記憶體效率',
            'features.hotreload.title': '熱重載開發',
            'features.hotreload.desc': '程式碼修改後自動重啟，大幅提升開發效率',
            'features.modular.title': '模組化架構',
            'features.modular.desc': 'PyPI套件形式模組系統，支援動態載入和熱更新',
            'features.async.title': '非同步高效能',
            'features.async.desc': '基於asyncio的事件驅動，確保高效能和低延遲',
            'features.api.title': '優雅的API',
            'features.api.desc': '鏈式呼叫DSL和型別提示，讓程式碼更簡潔',
            'features.platforms.title': '多平台支援',
            'features.platforms.desc': '雲湖、Telegram、OneBot12等平台一鍵接入',

            // 首页代码演示
            'demo.title': '快速上手',
            'demo.subtitle': '只需幾行程式碼，即可建立你的第一個機器人',
            'demo.run': '執行效果',
            'demo.copy': '複製',
            'demo.copied': '已複製',

            // 模块市场
            'market.title': '模組市場',
            'market.legacy': '檢視 1.x 模組原始碼 [已廢棄]',
            'market.search': '搜尋模組...',
            'market.total': '總模組數',
            'market.modules': '功能模組',
            'market.adapters': '平台適配器',
            'market.cli': 'CLI擴充',
            'market.all': '全部模組',
            'market.install': '安裝',
            'market.docs': '文檔',
            'market.commands': '命令',
            'market.empty': '未找到符合的模組',
            'market.empty.hint': '嘗試不同的搜尋關鍵字或檢視所有模組',
            'market.loadFailed': '載入模組失敗，請稍後再試',
            'market.reload': '重新載入',
            'market.installCmd': '安裝命令',

            // 文档中心
            'docs.title': '文檔中心',
            'docs.welcome': '歡迎使用 ErisPulse',
            'docs.welcome.desc': 'ErisPulse 是一個開源的 Python 函式庫，目標是提供一個簡單、易於使用的框架，用於建構非同步、非阻塞的機器人程式。',
            'docs.welcome.hint': '點擊文檔導航中的連結，開始探索 ErisPulse 的功能和用法吧。',
            'docs.edit': '編輯此頁',
            'docs.share': '分享',
            'docs.loading': '正在載入文檔...',
            'docs.loadFailed': '無法載入文檔',
            'docs.loadIndexFailed': '無法載入文檔索引',
            'docs.searchTrigger': '搜尋文檔...',
            'docs.searchPlaceholder': '搜尋文檔...',
            'docs.searchHint': '按 <kbd>ESC</kbd> 關閉 · <kbd>↑↓</kbd> 導覽結果',
            'docs.searchEmpty': '輸入關鍵字開始搜尋',
            'docs.noResults': '未找到相關文檔',
            'docs.searchResults': '搜尋結果',
            'docs.searchIndexLoading': '搜尋索引載入中...',
            'docs.backToCategories': '返回分類',
            'docs.backToDocs': '返回文檔',
            'docs.toc': '目錄',
            'docs.linkCopied': '連結已複製到剪貼簿',
            'docs.linkWarning': '文檔連結提示：點擊的連結 "{link}" 暫未適配站內跳轉，請使用左側導航欄手動查找相關文檔內容。',
            'docs.docLoaded': '文檔已載入',
            'docs.keywordLocated': '已定位到 "{keyword}"',
            'docs.keywordNotFound': '未找到指定內容',
            'docs.prev': '上一篇',
            'docs.next': '下一篇',
            'docs.updatedAgo': '{time} 更新了此文檔',
            'docs.noDoc': '請求的文檔不存在，可能是URL錯誤',
            'docs.forbidden': '存取被拒絕，可能是權限問題',
            'docs.serverError': '伺服器內部錯誤，請稍後再試',
            'docs.networkError': '網路連線失敗',
            'docs.networkHint': '請檢查您的網路連線後重試',
            'docs.rateLimit': 'GitHub API請求次數已達上限',
            'docs.rateLimitHint': '請等待1小時後重試，或使用GitHub個人存取令牌提高限制',
            'docs.retryHint': '請檢查網路連線或稍後再試',
            'docs.loadingModuleDoc': '正在載入文檔...',

            // 设置页
            'settings.title': '個人化設定',
            'settings.subtitle': '自訂您的 ErisPulse 體驗',
            'settings.theme': '主題設定',
            'settings.light': '淺色主題',
            'settings.dark': '深色主題',
            'settings.auto': '自動 (跟隨系統)',
            'settings.preset': '預設樣式',
            'settings.defaultPreset': '預設樣式',
            'settings.oceanPreset': '海洋風格',
            'settings.sunsetPreset': '日落風格',
            'settings.forestPreset': '森林風格',
            'settings.lavenderPreset': '薰衣草風格',
            'settings.applyPreset': '套用預設',
            'settings.advancedColors': '進階顏色設定',
            'settings.animations': '動畫效果',
            'settings.animationsToggle': '啟用動畫效果',
            'settings.animationsDesc': '控制頁面過渡動畫和互動效果',
            'settings.content': '內容偏好',
            'settings.compact': '緊湊佈局',
            'settings.compactDesc': '減少頁面間距，顯示更多內容',
            'settings.lineNumbers': '顯示程式碼行號',
            'settings.lineNumbersDesc': '在程式碼區塊中顯示行號',
            'settings.nav': '導覽設定',
            'settings.stickyNav': '固定導覽列',
            'settings.stickyNavDesc': '捲動時保持導覽列可見',
            'settings.reset': '重置設定',
            'settings.resetBtn': '重置所有設定',
            'settings.resetDesc': '將所有設定恢復為預設值',
            'settings.resetConfirm': '確定要重置所有設定嗎？這將恢復所有選項為預設值。',
            'settings.presetApplied': '已套用 {name} 預設樣式',
            'settings.defaultRestored': '已恢復預設主題',
            'settings.colorsApplied': '顏色設定已套用',
            'settings.colorSettings': '進階顏色設定',

            // 高级颜色设置
            'colors.primary': '主色調',
            'colors.primaryDark': '主色調深色',
            'colors.primaryRgb': '主色調RGB',
            'colors.accent': '強調色',
            'colors.accentRgb': '強調色RGB',
            'colors.bg': '背景色',
            'colors.bgRgb': '背景色RGB',
            'colors.text': '文字顏色',
            'colors.textRgb': '文字顏色RGB',
            'colors.border': '邊框顏色',
            'colors.cardBg': '卡片背景色',
            'colors.shadow': '陰影顏色',
            'colors.groupPrimary': '主色調設定',
            'colors.groupAccent': '強調色設定',
            'colors.groupBgText': '背景和文字',
            'colors.groupOther': '其他顏色',
            'colors.apply': '套用設定',
            'colors.cancel': '取消',

            // 关于页
            'about.contributors': '我們的貢獻者',
            'about.contributorsDesc': '感謝這些優秀的開發者為專案做出的貢獻',
            'about.dependencies': '專案依賴',
            'about.dependenciesDesc': '感謝這些優秀的開源專案，讓 ErisPulse 成為可能',
            'about.friendLinks': '友情連結',
            'about.friendLinksDesc': '推薦一些優秀的技術和開發資源',
            'about.copyright': '版權聲明',
            'about.copyrightText': 'ErisPulse 使用 MIT 開源協議，允許自由分發和修改。',
            'about.avatarCopyright': '頭像版權歸原作者所有：',

            // 页脚
            'footer.home': '專案主頁',
            'footer.docs': '使用文檔',
            'footer.contribute': '貢獻與開發',
            'footer.issue': '回報 Issue',
            'footer.pr': '提交 PR',
            'footer.discussions': '討論區',
            'footer.social': '社交平台',
            'footer.copyright': '開源授權：MIT',

            // 模态框
            'modal.moduleDetail': '模組詳情',
            'modal.availableCommands': '可用命令',
            'modal.tags': '標籤',
            'modal.repoInfo': '倉庫資訊',
            'modal.viewSource': '檢視原始碼',
            'modal.loadDocFailed': '無法載入文檔',

            // 通用
            'common.loading': '載入中...',
            'common.noData': '暫無資料',
            'common.langSwitched': '已切換到{name}',
            'common.langSwitchFailed': '切換語言失敗，請重試',
            'common.copyFailed': '複製失敗，請手動複製',

            // 时间格式
            'time.yearsAgo': '{n}年前',
            'time.monthsAgo': '{n}個月前',
            'time.daysAgo': '{n}天前',
            'time.hoursAgo': '{n}小時前',
            'time.minutesAgo': '{n}分鐘前',
            'time.secondsAgo': '{n}秒前'
        }
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
        let text = (messages[lang] && messages[lang][key]) || (messages['zh-CN'] && messages['zh-CN'][key]) || key;

        if (params) {
            Object.keys(params).forEach(k => {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
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
            'zh-CN': 'zh-CN',
            'en': 'en',
            'zh-TW': 'zh-TW'
        };
        document.documentElement.lang = langMap[lang] || lang;

        // 更新所有全局语言切换器的选中状态
        document.querySelectorAll('.global-lang-select').forEach(select => {
            select.value = lang;
        });

        // 更新文档侧边栏语言切换器
        const docsLangSelect = document.getElementById('lang-select');
        if (docsLangSelect) {
            docsLangSelect.value = lang;
        }

        // 同步文档语言
        if (syncDocs) {
            localStorage.setItem('erispulse-docs-lang', lang);
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
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });

        // placeholder 属性
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key);
        });

        // title 属性
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key);
        });

        // aria-label 属性
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            el.setAttribute('aria-label', t(key));
        });
    }

    /**
     * 获取语言显示名称
     */
    function getLanguageName(lang) {
        const names = {
            'zh-CN': '简体中文',
            'en': 'English',
            'zh-TW': '繁體中文'
        };
        return names[lang] || lang;
    }

    /**
     * 获取支持的语言列表
     */
    function getSupportedLanguages() {
        return [
            { code: 'zh-CN', name: '简体中文' },
            { code: 'en', name: 'English' },
            { code: 'zh-TW', name: '繁體中文' }
        ];
    }

    /**
     * 初始化（在 DOMContentLoaded 时调用）
     */
    function init() {
        // 同步 localStorage
        localStorage.setItem('erispulse-docs-lang', currentLang);

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
        STORAGE_KEY
    };
})();