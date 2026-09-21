




export const CONFIG = {
   
  SITE: {
    name: "ErisPulse",
    description: "高性能异步机器人开发框架",
    version: "2.0.0",
    url: "https://www.erisdev.com",
    github: "https://github.com/ErisPulse",
    author: "ErisPulse Team",
  },

   
  FRIEND_LINKS: [
    {
      name: "Python",
      url: "https://www.python.org",
      description: "Python 官方网站",
      icon: "fab fa-python",
    },
    {
      name: "OneBot",
      url: "https://12.onebot.dev",
      description: "OneBot12 协议规范",
      icon: "fas fa-robot",
    },
    {
      name: "GitHub",
      url: "https://github.com",
      description: "全球最大的代码托管平台",
      icon: "fab fa-github",
    },
    {
      name: "Codeberg",
      url: "https://codeberg.org",
      description: "自由、开源的代码托管社区",
      icon: "assets/img/codeberg.svg",
    },
  ],

   
  DEPENDENCIES: [
    {
      name: "rich",
      version: ">=13.0.0",
      url: "https://github.com/Textualize/rich",
      description: "优雅的终端富文本与格式化输出",
      icon: "fas fa-terminal",
    },
    {
      name: "toml",
      version: ">=0.10.2",
      url: "https://github.com/uiri/toml",
      description: "TOML 配置文件解析",
      icon: "fas fa-file-code",
    },
    {
      name: "websockets",
      version: ">=12.0",
      url: "https://github.com/python-websockets/websockets",
      description: "高性能异步 WebSocket 通信",
      icon: "fas fa-network-wired",
    },
    {
      name: "aiohttp",
      version: ">=3.9.0",
      url: "https://github.com/aio-libs/aiohttp",
      description: "异步 HTTP 客户端 / 服务端",
      icon: "fas fa-cloud",
    },
    {
      name: "fastapi",
      version: ">=0.116.1",
      url: "https://github.com/fastapi/fastapi",
      description: "高性能异步 Web 框架",
      icon: "fas fa-bolt",
    },
    {
      name: "uvicorn",
      version: ">=0.30.0",
      url: "https://github.com/encode/uvicorn",
      description: "轻量极速的 ASGI 服务器",
      icon: "fas fa-server",
    },
  ],

   
  DOCS: {
    baseUrl:
      "https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/",
    githubBaseUrl:
      "https://github.com/ErisPulse/ErisPulse/edit/Develop/v2/docs/",

     
    pyprojectUrl:
      "https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/pyproject.toml",
    pyprojectRawUrl:
      "https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/pyproject.toml",

     
    index: {
      cdnUrl:
        "https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/_meta/",
      githubUrl:
        "https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/_meta/",
      mappingFile: "docs-mapping.json",
      searchIndexFile: "docs-search-index.json",
       
      autoApiMappingFile: "docs-auto-api-mapping.json",
      autoApiSearchIndexFile: "docs-auto-api-search-index.json",
      cacheExpiry: 24 * 60 * 60 * 1000,  
      storageKeys: {
        mapping: "erispulse-docs-mapping",
        searchIndex: "erispulse-docs-search-index",
        autoApiMapping: "erispulse-docs-auto-api-mapping",
        autoApiSearchIndex: "erispulse-docs-auto-api-search-index",
        searchHistory: "erispulse-search-history",
      },
    },

     
    contentCache: {
      expiry: 4 * 60 * 60 * 1000,  
      keyPrefix: "erispulse-doc-content:",
      indexKey: "erispulse-doc-content-index",
    },
  },

   
  SETTINGS_VERSION: "1.0",
  STORAGE_KEYS: {
    SETTINGS: "erispulse-settings",
    THEME: "theme",
  },
  DEFAULT_USER_SETTINGS: {
    version: "1.0",
    theme: "auto",
    animations: true,
    compactLayout: false,
    showLineNumbers: false,
    stickyNav: true,
    gh_proxy: "https://cdn.gh-proxy.org/",
    disableOnlineCacheRefresh: true,
    docsLocalized: {},
  },

   
   
   
   
  MODULE_CATEGORIES: [
    { id: 1, key: "tool" },
    { id: 2, key: "fun" },
    { id: 3, key: "admin" },
    { id: 4, key: "notify" },
    { id: 5, key: "ai" },
    { id: 6, key: "platform" },
    { id: 7, key: "analytics" },
  ],

   
   
  SDK_PACKAGE: "ErisPulse",

   
  API: {
    contributors:
      "https://api.github.com/repos/ErisPulse/ErisPulse/contributors",
    packages: "https://erisdev.com/packages.json",
    oauthToken: "https://erisdev.com/api/oauth-token",
    userInfo: "https://erisdev.com/api/userinfo",
    myModules: "https://erisdev.com/api/my-modules",
    manageModule: "https://erisdev.com/api/manage-module",
    submitModule: "https://erisdev.com/api/submit-module",
    checkPyPI: "https://erisdev.com/api/check-pypi",
    pypiVersions: "https://erisdev.com/api/pypi-versions",
  },

  OAUTH_PROVIDERS: {
    github: {
      clientId: "Ov23lioo2vSXXnRcDixA",
      authUrl: "https://github.com/login/oauth/authorize",
      redirectUri: null,
      scope: "read:user,user:email",
      parseUser: function (data) {
        return {
          uid: "github:" + data.id,
          login: data.login,
          avatar_url: data.avatar_url,
          name: data.name || data.login,
        };
      },
    },
    codeberg: {
      clientId: "182590e7-41fd-4242-835f-f407bd112f8c",
      authUrl: "https://codeberg.org/login/oauth/authorize",
      redirectUri: null,
      scope: "read:user",
      parseUser: function (data) {
        return {
          uid: "codeberg:" + data.id,
          login: data.login,
          avatar_url: data.avatar_url,
          name: data.full_name || data.login,
        };
      },
    },
    yunhu: {
      clientId: "DmqnwUGFrLVkmykgeAJXzYBJqd8hM_ga",
      authUrl: "https://oauth2.jwzhd.com/oauth/authorize",
      redirectUri: "https://www.erisdev.com/#market",
      scope: "profile",
      parseUser: function (data) {
        var a = data.avatar_url || "";
        return {
          uid: "yunhu:" + data.user_id,
          login: data.nickname || String(data.user_id),
          avatar_url: a.includes("jwznb.com")
            ? "https://erisdev.com/api/avatar?url=" + encodeURIComponent(a)
            : a,
          name: data.nickname || String(data.user_id),
        };
      },
    },
  },
};
