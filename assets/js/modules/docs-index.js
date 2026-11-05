/**
 * 文档索引管理器
 * 负责映射索引 / 搜索索引的加载（CDN → GitHub → 本地缓存三层降级）、
 * 文档查询与全文搜索。
 */

import { CONFIG } from '../config.js';
import { I18n } from '../i18n.js';

export const DocsIndexManager = (function () {
    let mappingCache = null;
    let searchIndexCache = null;
    let autoApiMappingCache = null;
    let autoApiSearchCache = null;
    let autoApiMerged = false;
    let isLoadingMapping = false;
    let isLoadingSearchIndex = false;
    let isLoadingAutoApiMapping = false;
    let loadCallbacks = [];

    /**
     * 获取当前语言的索引文件名
     */
    function getLanguageIndexFile(filename) {
        const lang = I18n.getLang();
        return `${lang}/${filename}`;
    }

    /**
     * 加载映射索引（三层降级策略）
     */
    async function loadMapping() {
        if (isLoadingMapping && mappingCache) {
            return mappingCache;
        }

        isLoadingMapping = true;

        // 离线时直接使用本地缓存（允许过期，不清理）
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

    /**
     * 加载搜索索引（三层降级策略）
     */
    async function loadSearchIndex() {
        if (isLoadingSearchIndex && searchIndexCache) {
            return searchIndexCache;
        }

        isLoadingSearchIndex = true;

        // 离线时直接使用本地缓存（允许过期，不清理）
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

    /**
     * 加载 auto_api 独立映射索引（懒加载）
     * 仅在用户首次展开"自动生成 API"分组时调用。
     * 注意：auto_api 仅在 zh-CN 生成（其它语言为中文副本），始终从 zh-CN/ 加载。
     * 加载成功后合并到主 mapping 的"API 参考"分类下作为虚拟子分组。
     */
    async function loadAutoApiMapping() {
        if (autoApiMappingCache) return autoApiMappingCache;
        if (isLoadingAutoApiMapping) {
            // 等待已经在进行的加载
            while (isLoadingAutoApiMapping) {
                await new Promise(r => setTimeout(r, 50));
            }
            return autoApiMappingCache;
        }

        isLoadingAutoApiMapping = true;
        try {
            console.log('尝试从CDN加载 auto_api 映射索引（zh-CN）...');
            // auto_api 仅在 zh-CN 生成，固定从 zh-CN/ 加载
            const fixedFilename = `zh-CN/${CONFIG.DOCS.index.autoApiMappingFile}`;
            const data = await loadFromCDN(fixedFilename);
            autoApiMappingCache = data;
            saveToCache(CONFIG.DOCS.index.storageKeys.autoApiMapping, data);
            console.log('✓ 从CDN成功加载 auto_api 映射索引');
            mergeAutoApiIntoMapping();
            return data;
        } catch (cdnError) {
            console.warn('CDN加载 auto_api 失败，尝试 GitHub...', cdnError);
            try {
                const data = await loadFromGitHub(`zh-CN/${CONFIG.DOCS.index.autoApiMappingFile}`);
                autoApiMappingCache = data;
                saveToCache(CONFIG.DOCS.index.storageKeys.autoApiMapping, data);
                console.log('✓ 从GitHub成功加载 auto_api 映射索引');
                mergeAutoApiIntoMapping();
                return data;
            } catch (ghError) {
                console.warn('GitHub加载 auto_api 失败，尝试缓存...', ghError);
                try {
                    const data = await loadFromCache(CONFIG.DOCS.index.storageKeys.autoApiMapping);
                    autoApiMappingCache = data;
                    console.log('✓ 从缓存加载 auto_api 映射索引');
                    mergeAutoApiIntoMapping();
                    return data;
                } catch (cacheError) {
                    console.error('auto_api 索引所有加载方式均失败', cacheError);
                    throw cacheError;
                }
            }
        } finally {
            isLoadingAutoApiMapping = false;
        }
    }

    /**
     * 加载 auto_api 独立搜索索引（懒加载）
     * auto_api 仅在 zh-CN 生成，始终从 zh-CN/ 加载。
     */
    async function loadAutoApiSearchIndex() {
        if (autoApiSearchCache) return autoApiSearchCache;

        try {
            const fixedFilename = `zh-CN/${CONFIG.DOCS.index.autoApiSearchIndexFile}`;
            const data = await loadFromCDN(fixedFilename);
            autoApiSearchCache = data;
            saveToCache(CONFIG.DOCS.index.storageKeys.autoApiSearchIndex, data);
            // 合并到主搜索索引，使全局搜索能命中 auto_api 内容
            mergeAutoApiIntoSearchIndex();
            return data;
        } catch (cdnError) {
            console.warn('CDN加载 auto_api 搜索索引失败，尝试 GitHub...', cdnError);
            try {
                const data = await loadFromGitHub(`zh-CN/${CONFIG.DOCS.index.autoApiSearchIndexFile}`);
                autoApiSearchCache = data;
                saveToCache(CONFIG.DOCS.index.storageKeys.autoApiSearchIndex, data);
                mergeAutoApiIntoSearchIndex();
                return data;
            } catch (ghError) {
                console.warn('GitHub加载 auto_api 搜索索引失败', ghError);
                return null;
            }
        }
    }

    /**
     * 把 auto_api mapping 合并到主 mapping 的"API 参考"分类下，
     * 作为额外的虚拟子分组 "__auto_api__"。
     */
    function mergeAutoApiIntoMapping() {
        if (!mappingCache || !autoApiMappingCache || autoApiMerged) return;
        const apiCat = findApiReferenceCategory(mappingCache);
        if (!apiCat) {
            console.warn('未找到 API 参考分类，无法合并 auto_api');
            return;
        }
        const autoCat = Object.values(autoApiMappingCache.categories || {})[0];
        if (!autoCat) return;

        if (!apiCat.subgroups) apiCat.subgroups = {};
        // 使用稳定 key 避免冲突
        apiCat.subgroups['__auto_api__'] = {
            name: getAutoApiSubgroupDisplayName(),
            icon: 'fa-microchip',
            documents: autoCat.documents || [],
            // 嵌套：auto_api 自身的子分组作为二级分组数据
            _auto_subgroups: autoCat.subgroups || {},
            isAutoApi: true,
        };
        apiCat.count = (apiCat.count || 0) + (autoCat.count || 0);
        autoApiMerged = true;
        console.log('✓ auto_api 已合并到 API 参考分类');
    }

    /**
     * 把 auto_api 搜索索引的关键词合并到主搜索索引。
     */
    function mergeAutoApiIntoSearchIndex() {
        if (!searchIndexCache || !autoApiSearchCache) return;
        if (!searchIndexCache.keywords) searchIndexCache.keywords = {};
        const autoKw = autoApiSearchCache.keywords || {};
        for (const [kw, occs] of Object.entries(autoKw)) {
            if (!searchIndexCache.keywords[kw]) {
                searchIndexCache.keywords[kw] = [];
            }
            searchIndexCache.keywords[kw].push(...occs);
        }
        console.log('✓ auto_api 搜索索引已合并');
    }

    function findApiReferenceCategory(mapping) {
        if (!mapping || !mapping.categories) return null;
        // 按目录名 "api-reference" 反查本地化分类名
        const candidates = Object.values(mapping.categories).filter(c => c.icon === 'fa-book');
        // 进一步通过子分组/文档路径判断
        for (const [name, cat] of Object.entries(mapping.categories)) {
            const docs = cat.documents || [];
            const sample = docs[0];
            if (sample && sample.path && sample.path.startsWith('api-reference/')) {
                return cat;
            }
        }
        // 回退：返回第一个 icon=fa-book 的分类
        return candidates[0] || null;
    }

    function getAutoApiSubgroupDisplayName() {
        // 简单本地化（主 i18n.js 没有对应 key 时回退）
        const map = {
            'zh-CN': '自动生成 API',
            'en': 'Auto-generated API',
            'zh-TW': '自動生成 API',
            'ja': '自動生成 API',
            'ru': 'Авто-API',
        };
        return map[I18n.getLang()] || 'Auto-generated API';
    }

    /**
     * 注册加载完成回调
     */
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

    /**
     * 检查是否正在加载
     */
    function isLoaded() {
        return mappingCache !== null && searchIndexCache !== null;
    }

    /**
     * 从CDN加载
     */
    async function loadFromCDN(filename) {
        const url = CONFIG.DOCS.index.cdnUrl + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CDN请求失败: ${response.status}`);
        }
        return await response.json();
    }

    /**
     * 从GitHub加载
     */
    async function loadFromGitHub(filename) {
        const url = CONFIG.DOCS.index.githubUrl + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GitHub请求失败: ${response.status}`);
        }
        return await response.json();
    }

    /**
     * 从缓存加载
     */
    async function loadFromCache(storageKey, allowExpired = false) {
        try {
            const cached = localStorage.getItem(storageKey);
            if (!cached) {
                throw new Error('缓存不存在');
            }

            const data = JSON.parse(cached);

            // 检查缓存是否过期（离线时不清理，允许使用过期缓存）
            if (!allowExpired && data.timestamp && Date.now() - data.timestamp > CONFIG.DOCS.index.cacheExpiry) {
                throw new Error('缓存已过期');
            }

            return data.content;
        } catch (error) {
            throw new Error(`缓存加载失败: ${error.message}`);
        }
    }

    /**
     * 保存到缓存
     */
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

    /**
     * 获取文档路径
     */
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
                    // auto_api 嵌套二级子分组（CLI/Core 等）
                    if (sg._auto_subgroups) {
                        for (const childSg of Object.values(sg._auto_subgroups)) {
                            const childDoc = childSg.documents.find(predicate);
                            if (childDoc) return { doc: childDoc, categoryName, category };
                        }
                    }
                }
            }
        }
        return null;
    }

    function getDocumentPath(docId) {
        const found = _findDoc(mappingCache, d => d.path === docId || d.path.includes(docId));
        return found ? found.doc.path : null;
    }

    /**
     * 获取文档标题
     */
    function getDocumentTitle(docPath) {
        const found = _findDoc(mappingCache, d => d.path === docPath);
        return found ? found.doc.title : null;
    }

    /**
     * 获取文档分类
     */
    function getDocumentCategory(docPath) {
        const found = _findDoc(mappingCache, d => d.path === docPath);
        if (!found) return null;
        return {
            name: found.categoryName,
            title: found.categoryName,
            description: found.category.description
        };
    }

    /**
     * 获取所有文档列表
     */
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
                    // auto_api 嵌套二级子分组（CLI/Core 等）
                    if (sg._auto_subgroups) {
                        for (const childSg of Object.values(sg._auto_subgroups)) {
                            childSg.documents.forEach(doc => {
                                docs.push({ path: doc.path, title: doc.title, level: doc.level, category: categoryName });
                            });
                        }
                    }
                }
            }
        }
        return docs;
    }

    /**
     * 搜索文档
     */
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

        // 按相关性排序
        results.sort((a, b) => b.relevance - a.relevance);

        return results;
    }

    /**
     * 计算相关性
     */
    function calculateRelevance(query, keyword) {
        const lowerQuery = query.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();

        // 精确匹配
        if (lowerKeyword === lowerQuery) {
            return 100;
        }

        // 开头匹配
        if (lowerKeyword.startsWith(lowerQuery)) {
            return 80;
        }

        // 包含匹配
        if (lowerKeyword.includes(lowerQuery)) {
            return 60;
        }

        return 0;
    }

    /**
     * 清除缓存
     */
    function clearCache() {
        try {
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.mapping);
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.searchIndex);
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.autoApiMapping);
            localStorage.removeItem(CONFIG.DOCS.index.storageKeys.autoApiSearchIndex);
            autoApiMappingCache = null;
            autoApiSearchCache = null;
            autoApiMerged = false;
            console.log('缓存已清除');
        } catch (error) {
            console.warn('清除缓存失败:', error);
        }
    }

    /**
     * 重置 auto_api 状态（语言切换时调用，强制重新合并）
     */
    function resetAutoApiState() {
        autoApiMappingCache = null;
        autoApiSearchCache = null;
        autoApiMerged = false;
    }

    // 公共API
    return {
        loadMapping,
        loadSearchIndex,
        loadAutoApiMapping,
        loadAutoApiSearchIndex,
        onLoad,
        isLoaded,
        getDocumentPath,
        getDocumentTitle,
        getDocumentCategory,
        getAllDocuments,
        searchDocuments,
        clearCache,
        resetAutoApiState,
        get mapping() { return mappingCache; },
        get searchIndex() { return searchIndexCache; },
        get autoApiMapping() { return autoApiMappingCache; },
        get autoApiMerged() { return autoApiMerged; }
    };
})();
