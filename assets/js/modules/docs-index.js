





import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';

export const DocsIndexManager = (function () {
    let mappingCache = null;
    let searchIndexCache = null;
    let isLoadingMapping = false;
    let isLoadingSearchIndex = false;
    let loadCallbacks = [];

    


    function getLanguageIndexFile(filename) {
        const lang = I18n.getLang();
        return `${lang}/${filename}`;
    }

    


    async function loadMapping() {
        if (isLoadingMapping && mappingCache) {
            return mappingCache;
        }

        isLoadingMapping = true;

         
        if (!navigator.onLine) {
            try {
                const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.mapping, true);
                mappingCache = data;
                console.log('✓ 离线模式：从缓存加载映射索引');
                notifyLoadCallbacks('mapping', true, data);
                return data;
            } catch (cacheError) {
                console.error('离线模式且无缓存可用', cacheError);
                const error = new Error(I18n.t('docs.loadIndexFailed'));
                notifyLoadCallbacks('mapping', false, null, error);
                throw error;
            }
        }

        try {
            console.log('尝试从CDN加载映射索引...');
            const lang = I18n.getLang();
            const langFilename = getLanguageIndexFile(CONFIG.DOCS.index.mappingFile);
            const data = await loadFromCDN(langFilename);
            mappingCache = data;
            saveToCache(CONFIG.DOCS.index.storageKeys.mapping, data);
            console.log(`✓ 从CDN成功加载${lang}映射索引`);
            notifyLoadCallbacks('mapping', true, data);
            return data;
        } catch (cdnError) {
            console.warn('CDN加载失败，尝试从GitHub加载...', cdnError);
            try {
                const data = await loadFromGitHub(CONFIG.DOCS.index.mappingFile);
                mappingCache = data;
                saveToCache(CONFIG.DOCS.index.storageKeys.mapping, data);
                console.log('✓ 从GitHub成功加载映射索引');
                notifyLoadCallbacks('mapping', true, data);
                return data;
            } catch (githubError) {
                console.warn('GitHub加载失败，尝试从缓存加载...', githubError);
                try {
                    const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.mapping);
                    mappingCache = data;
                    console.log('✓ 从缓存成功加载映射索引');
                    notifyLoadCallbacks('mapping', true, data);
                    return data;
                } catch (cacheError) {
                    console.error('所有加载方式均失败', cacheError);
                    const error = new Error(I18n.t('docs.loadIndexFailed'));
                    notifyLoadCallbacks('mapping', false, null, error);
                    throw error;
                }
            }
        } finally {
            isLoadingMapping = false;
        }
    }

    


    async function loadSearchIndex() {
        if (isLoadingSearchIndex && searchIndexCache) {
            return searchIndexCache;
        }

        isLoadingSearchIndex = true;

         
        if (!navigator.onLine) {
            try {
                const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.searchIndex, true);
                searchIndexCache = data;
                console.log('✓ 离线模式：从缓存加载搜索索引');
                notifyLoadCallbacks('search', true, data);
                return data;
            } catch (cacheError) {
                console.error('离线模式且无缓存可用', cacheError);
                const error = new Error(I18n.t('docs.loadIndexFailed'));
                notifyLoadCallbacks('search', false, null, error);
                throw error;
            }
        }

        try {
            console.log('尝试从CDN加载搜索索引...');
            const lang = I18n.getLang();
            const langFilename = getLanguageIndexFile(CONFIG.DOCS.index.searchIndexFile);
            const data = await loadFromCDN(langFilename);
            searchIndexCache = data;
            saveToCache(CONFIG.DOCS.index.storageKeys.searchIndex, data);
            console.log(`✓ 从CDN成功加载${lang}搜索索引`);
            notifyLoadCallbacks('search', true, data);
            return data;
        } catch (cdnError) {
            console.warn('CDN加载失败，尝试从GitHub加载...', cdnError);
            try {
                const data = await loadFromGitHub(CONFIG.DOCS.index.searchIndexFile);
                searchIndexCache = data;
                saveToCache(CONFIG.DOCS.index.storageKeys.searchIndex, data);
                console.log('✓ 从GitHub成功加载搜索索引');
                notifyLoadCallbacks('search', true, data);
                return data;
            } catch (githubError) {
                console.warn('GitHub加载失败，尝试从缓存加载...', githubError);
                try {
                    const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.searchIndex);
                    searchIndexCache = data;
                    console.log('✓ 从缓存成功加载搜索索引');
                    notifyLoadCallbacks('search', true, data);
                    return data;
                } catch (cacheError) {
                    console.error('所有加载方式均失败', cacheError);
                    const error = new Error(I18n.t('docs.loadIndexFailed'));
                    notifyLoadCallbacks('search', false, null, error);
                    throw error;
                }
            }
        } finally {
            isLoadingSearchIndex = false;
        }
    }

    


    function onLoad(callback) {
        loadCallbacks.push(callback);
    }

    


    function notifyLoadCallbacks(type, success, data, error = null) {
        loadCallbacks.forEach(callback => {
            try {
                callback(type, success, data, error);
            } catch (e) {
                console.error('回调执行失败:', e);
            }
        });
    }

    


    function isLoaded() {
        return mappingCache !== null && searchIndexCache !== null;
    }

    


    async function loadFromCDN(filename) {
        const url = CONFIG.DOCS.index.cdnUrl + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CDN请求失败: ${response.status}`);
        }
        return await response.json();
    }

    


    async function loadFromGitHub(filename) {
        const url = CONFIG.DOCS.index.githubUrl + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GitHub请求失败: ${response.status}`);
        }
        return await response.json();
    }

    


    async function loadFromCache(storageKey, allowExpired = false) {
        try {
            const cached = localStorage.getItem(storageKey);
            if (!cached) {
                throw new Error('缓存不存在');
            }

            const data = JSON.parse(cached);

             
            if (!allowExpired && data.timestamp && Date.now() - data.timestamp > CONFIG.DOCS.index.cacheExpiry) {
                throw new Error('缓存已过期');
            }

            return data.content;
        } catch (error) {
            throw new Error(`缓存加载失败: ${error.message}`);
        }
    }

    


    function saveToCache(storageKey, content) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                content: content
            };
            localStorage.setItem(storageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('保存缓存失败:', error);
        }
    }

    


    function _findDoc(mapping, predicate) {
        if (!mapping || !mapping.categories) return null;
        for (const [categoryName, category] of Object.entries(mapping.categories)) {
            if (category.documents) {
                const doc = category.documents.find(predicate);
                if (doc) return { doc, categoryName, category };
            }
            if (category.subgroups) {
                for (const sg of Object.values(category.subgroups)) {
                    const doc = sg.documents.find(predicate);
                    if (doc) return { doc, categoryName, category };
                }
            }
        }
        return null;
    }

    function getDocumentPath(docId) {
        const found = _findDoc(mappingCache, d => d.path === docId || d.path.includes(docId));
        return found ? found.doc.path : null;
    }

    


    function getDocumentTitle(docPath) {
        const found = _findDoc(mappingCache, d => d.path === docPath);
        return found ? found.doc.title : null;
    }

    


    function getDocumentCategory(docPath) {
        const found = _findDoc(mappingCache, d => d.path === docPath);
        if (!found) return null;
        return {
            name: found.categoryName,
            title: found.categoryName,
            description: found.category.description
        };
    }

    


    function getAllDocuments() {
        if (!mappingCache || !mappingCache.categories) {
            return [];
        }

        const docs = [];
        for (const [categoryName, category] of Object.entries(mappingCache.categories)) {
            if (category.documents) {
                category.documents.forEach(doc => {
                    docs.push({ path: doc.path, title: doc.title, level: doc.level, category: categoryName });
                });
            }
            if (category.subgroups) {
                for (const sg of Object.values(category.subgroups)) {
                    sg.documents.forEach(doc => {
                        docs.push({ path: doc.path, title: doc.title, level: doc.level, category: categoryName });
                    });
                }
            }
        }
        return docs;
    }

    


    function searchDocuments(query) {
        if (!searchIndexCache || !searchIndexCache.keywords) {
            return [];
        }

        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const [keyword, occurrences] of Object.entries(searchIndexCache.keywords)) {
            if (keyword.toLowerCase().includes(lowerQuery) || lowerQuery.includes(keyword.toLowerCase())) {
                occurrences.forEach(occurrence => {
                    results.push({
                        document: occurrence.document,
                        title: occurrence.title,
                        line: occurrence.line,
                        level: occurrence.level,
                        keyword: keyword,
                        relevance: calculateRelevance(query, keyword)
                    });
                });
            }
        }

         
        results.sort((a, b) => b.relevance - a.relevance);

        return results;
    }

    


    function calculateRelevance(query, keyword) {
        const lowerQuery = query.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();

         
        if (lowerKeyword === lowerQuery) {
            return 100;
        }

         
        if (lowerKeyword.startsWith(lowerQuery)) {
            return 80;
        }

         
        if (lowerKeyword.includes(lowerQuery)) {
            return 60;
        }

        return 0;
    }

    


    function clearCache() {
        try {
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.mapping);
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.searchIndex);
            console.log('缓存已清除');
        } catch (error) {
            console.warn('清除缓存失败:', error);
        }
    }

     
    return {
        loadMapping,
        loadSearchIndex,
        onLoad,
        isLoaded,
        getDocumentPath,
        getDocumentTitle,
        getDocumentCategory,
        getAllDocuments,
        searchDocuments,
        clearCache,
        get mapping() { return mappingCache; },
        get searchIndex() { return searchIndexCache; }
    };
})();
