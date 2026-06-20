




import { CONFIG } from "../config.js";
import { I18n } from "../i18n.js";

export const DocsContentCache = (function () {
  const cfg = () => CONFIG.DOCS.contentCache;

  function _key(lang, docPath) {
    return cfg().keyPrefix + lang + ":" + docPath;
  }

  



  function getRaw(lang, docPath) {
    try {
      const raw = localStorage.getItem(_key(lang, docPath));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  


  function isFresh(entry) {
    if (!entry || !entry.timestamp) return false;
    return Date.now() - entry.timestamp <= cfg().expiry;
  }

  


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

  


  function count(lang) {
    const index = _getIndex();
    return (index[lang] || []).length;
  }

  


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

  






  function shouldUpdate(lang, docPath, newCommitInfo) {
    const entry = getRaw(lang, docPath);
    if (!entry) return true;  

     
    if (!isFresh(entry)) return true;

     
    const oldCommitInfo = entry.commitInfo;

     
    if (
      typeof oldCommitInfo === "string" &&
      typeof newCommitInfo === "string"
    ) {
      return oldCommitInfo !== newCommitInfo;
    }

     
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

     
    return true;
  }

  






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
