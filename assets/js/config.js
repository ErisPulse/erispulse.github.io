/**
 * ErisPulse 网站全局配置
 * 所有静态配置（站点信息、文档源、API、OAuth、默认设置）集中于此。
 */

export const CONFIG = {
  // 网站基础配置
  SITE: {
    name: "ErisPulse",
    description: "高性能异步机器人开发框架",
    version: "2.0.0",
    url: "https://www.erisdev.com",
    github: "https://github.com/ErisPulse",
    author: "ErisPulse Team",
  },

  // 友链配置
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

  // 文档配置
  DOCS: {
    baseUrl:
      "https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/",
    githubBaseUrl:
      "https://github.com/ErisPulse/ErisPulse/edit/Develop/v2/docs/",

    // pyproject.toml（用于获取 ErisPulse 版本，确定文档版本）
    pyprojectUrl:
      "https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/pyproject.toml",
    pyprojectRawUrl:
      "https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/pyproject.toml",

    // 索引文件配置
    index: {
      cdnUrl:
        "https://cdn.gh-proxy.org/https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/_meta/",
      githubUrl:
        "https://raw.githubusercontent.com/ErisPulse/ErisPulse/Develop/v2/docs/_meta/",
      mappingFile: "docs-mapping.json",
      searchIndexFile: "docs-search-index.json",
      cacheExpiry: 24 * 60 * 60 * 1000, // 24小时
      storageKeys: {
        mapping: "erispulse-docs-mapping",
        searchIndex: "erispulse-docs-search-index",
        searchHistory: "erispulse-search-history",
      },
    },

    // 文档内容缓存配置
    contentCache: {
      expiry: 4 * 60 * 60 * 1000, // 4小时
      keyPrefix: "erispulse-doc-content:",
      indexKey: "erispulse-doc-content-index",
    },
  },

  // 应用设置
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

  // API 端点
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
