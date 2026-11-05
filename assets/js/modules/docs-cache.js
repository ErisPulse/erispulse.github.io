/**
 * 文档内容缓存管理器
 * 负责文档正文（Markdown）的本地缓存、按语言统计、本地化标记与清理。
 */

import { CONFIG } from "../config.js";
import { I18n } from "../i18n.js";

export const DocsContentCache = (function () {
  const cfg = () => CONFIG.DOCS.contentCache;

  function _key(lang, docPath) {
    return cfg().keyPrefix + lang + ":" + docPath;
  }

  /**
   * 读取缓存的原始条目（不做过期判断）
   * @returns {{content:string, commitInfo:object|null, timestamp:number}|null}
   */
  function getRaw(lang, docPath) {
    try {
      const raw = localStorage.getItem(_key(lang, docPath));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * 缓存条目是否在有效期内
   */
  function isFresh(entry) {
    if (!entry || !entry.timestamp) return false;
    return Date.now() - entry.timestamp <= cfg().expiry;
  }

  /**
   * 写入文档内容缓存
   */
  function set(lang, docPath, content, commitInfo) {
    try {
      const entry = {
        timestamp: Date.now(),
        lang: lang,
        docPath: docPath,
        content: content,
        commitInfo: commitInfo || null,
      };
      localStorage.setItem(_key(lang, docPath), JSON.stringify(entry));
      _addToIndex(lang, docPath);
      return true;
    } catch (e) {
      console.warn("文档内容缓存写入失败（可能超出存储限制）:", e);
      return false;
    }
  }

  /**
   * 获取当前语言已缓存的文档数量
   */
  function count(lang) {
    const index = _getIndex();
    return (index[lang] || []).length;
  }

  /**
   * 检查某语言是否已标记为完整本地化
   */
  function isLocalized(lang) {
    try {
      const settings = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || "{}",
      );
      return !!(settings.docsLocalized && settings.docsLocalized[lang]);
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取本地化时记录的 SDK 版本号
   */
  function getLocalizedVersion(lang) {
    try {
      const settings = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || "{}",
      );
      const v = settings.docsLocalized && settings.docsLocalized[lang];
      return typeof v === "string" ? v : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 标记/取消标记某语言为已完整本地化。
   * value 为版本号字符串（标记本地化）或 false/null（取消标记）。
   */
  function setLocalized(lang, value) {
    try {
      const settings = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || "{}",
      );
      if (!settings.docsLocalized) settings.docsLocalized = {};
      if (value) {
        settings.docsLocalized[lang] = value;
      } else {
        delete settings.docsLocalized[lang];
      }
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings),
      );
    } catch (e) {
      console.warn("更新本地化标记失败:", e);
    }
  }

  /**
   * 检查指定文档是否需要更新（基于 commitInfo 对比）
   * @param {string} lang - 语言代码
   * @param {string} docPath - 文档路径
   * @param {object|string} newCommitInfo - 新的提交信息（或 commit hash）
   * @returns {boolean} true 表示需要更新，false 表示可使用缓存
   */
  function shouldUpdate(lang, docPath, newCommitInfo) {
    const entry = getRaw(lang, docPath);
    if (!entry) return true; // 无缓存，需要下载

    // 缓存过期也需要更新
    if (!isFresh(entry)) return true;

    // 对比 commitInfo
    const oldCommitInfo = entry.commitInfo;

    // 如果新旧 commitInfo 都是字符串，直接对比
    if (
      typeof oldCommitInfo === "string" &&
      typeof newCommitInfo === "string"
    ) {
      return oldCommitInfo !== newCommitInfo;
    }

    // 如果是对象，对比关键字段（如 hash、sha、lastModified）
    if (
      typeof oldCommitInfo === "object" &&
      typeof newCommitInfo === "object"
    ) {
      const oldHash =
        oldCommitInfo.hash ||
        oldCommitInfo.sha ||
        oldCommitInfo.commit ||
        oldCommitInfo.lastModified;
      const newHash =
        newCommitInfo.hash ||
        newCommitInfo.sha ||
        newCommitInfo.commit ||
        newCommitInfo.lastModified;
      return oldHash !== newHash;
    }

    // 无法对比，保守起见返回 true
    return true;
  }

  /**
   * 获取文档内容（带自动更新检查）
   * @param {string} lang - 语言代码
   * @param {string} docPath - 文档路径
   * @param {object|string} newCommitInfo - 新的提交信息
   * @returns {{content:string|null, needUpdate:boolean, fromCache:boolean}}
   */
  function getWithCheck(lang, docPath, newCommitInfo) {
    const entry = getRaw(lang, docPath);
    if (!entry) {
      return { content: null, needUpdate: true, fromCache: false };
    }

    const fresh = isFresh(entry);
    const needUpdate = shouldUpdate(lang, docPath, newCommitInfo);

    return {
      content: fresh ? entry.content : null,
      needUpdate: needUpdate,
      fromCache: fresh && !needUpdate,
    };
  }

  /**
   * 批量检查多个文档是否需要更新
   * @param {string} lang - 语言代码
   * @param {Array<{path:string, commitInfo:object|string}>} docs - 文档列表
   * @returns {Object} { docsToUpdate: Array<{path:string, commitInfo:object|string}>, cachedDocs: Array<{path:string, content:string}> }
   */
  function batchCheckUpdate(lang, docs) {
    const docsToUpdate = [];
    const cachedDocs = [];

    docs.forEach(function (doc) {
      const result = getWithCheck(lang, doc.path, doc.commitInfo);
      if (result.needUpdate) {
        docsToUpdate.push({
          path: doc.path,
          commitInfo: doc.commitInfo,
        });
      } else if (result.content) {
        cachedDocs.push({
          path: doc.path,
          content: result.content,
        });
      }
    });

    return { docsToUpdate, cachedDocs };
  }

  /**
   * 获取所有支持语言的缓存统计
   */
  function getAllLangStats() {
    const langs = I18n.getSupportedLanguages();
    const index = _getIndex();
    return langs.map(function (l) {
      return {
        code: l.code,
        name: l.name,
        count: (index[l.code] || []).length,
        localized: isLocalized(l.code),
        version: getLocalizedVersion(l.code),
      };
    });
  }

  /**
   * 清除指定语言的文档内容缓存
   */
  function clearLang(lang) {
    const index = _getIndex();
    const paths = index[lang] || [];
    paths.forEach(function (path) {
      localStorage.removeItem(_key(lang, path));
    });
    delete index[lang];
    _saveIndex(index);
    setLocalized(lang, false);
  }

  /**
   * 清除所有语言的文档内容缓存
   */
  function clearAll() {
    const index = _getIndex();
    Object.keys(index).forEach(function (lang) {
      (index[lang] || []).forEach(function (path) {
        localStorage.removeItem(_key(lang, path));
      });
    });
    localStorage.removeItem(cfg().indexKey);

    try {
      const settings = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || "{}",
      );
      if (settings.docsLocalized) {
        delete settings.docsLocalized;
        localStorage.setItem(
          CONFIG.STORAGE_KEYS.SETTINGS,
          JSON.stringify(settings),
        );
      }
    } catch (e) {
      console.warn("清除本地化标记失败:", e);
    }
  }

  // ---- 索引管理（用于统计 / 清理 / 本地化标记）----
  function _getIndex() {
    try {
      return JSON.parse(localStorage.getItem(cfg().indexKey) || "{}");
    } catch (e) {
      return {};
    }
  }

  function _saveIndex(index) {
    try {
      localStorage.setItem(cfg().indexKey, JSON.stringify(index));
    } catch (e) {
      console.warn("保存内容缓存索引失败:", e);
    }
  }

  function _addToIndex(lang, docPath) {
    const index = _getIndex();
    if (!index[lang]) index[lang] = [];
    if (index[lang].indexOf(docPath) === -1) {
      index[lang].push(docPath);
      _saveIndex(index);
    }
  }

  return {
    getRaw: getRaw,
    isFresh: isFresh,
    set: set,
    count: count,
    getAllLangStats: getAllLangStats,
    isLocalized: isLocalized,
    getLocalizedVersion: getLocalizedVersion,
    setLocalized: setLocalized,
    clearLang: clearLang,
    clearAll: clearAll,
    shouldUpdate: shouldUpdate,
    getWithCheck: getWithCheck,
    batchCheckUpdate: batchCheckUpdate,
  };
})();
