/**
 * GitHub Markdown 特殊语法增强
 *
 * 把 marked 输出的 HTML 做后处理，支持 GitHub Alerts：
 *   > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
 * 转换为彩色提示框（.markdown-alert-*，样式见 markdown.css）。
 *
 * 其余 GitHub 语法（任务列表、表格、删除线、自动链接）由 marked 的
 * GFM 模式（默认开启）直接支持，无需处理。
 *
 * 用法：html = enhanceGitHubMarkdown(marked.parse(markdown))
 */

var ALERT_TYPES = {
    NOTE:      { cls: 'note',      icon: 'fas fa-circle-info',          label: 'Note' },
    TIP:       { cls: 'tip',       icon: 'fas fa-lightbulb',            label: 'Tip' },
    IMPORTANT: { cls: 'important', icon: 'fas fa-comment-dots',         label: 'Important' },
    WARNING:   { cls: 'warning',   icon: 'fas fa-triangle-exclamation', label: 'Warning' },
    CAUTION:   { cls: 'caution',   icon: 'fas fa-fire',                 label: 'Caution' },
};

// 标记可独占一行，也可与内容同行（[!IMPORTANT] 内容...），两种都兼容
var ALERT_RE = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

function detectAlert(quote) {
    var first = quote.firstElementChild;
    while (first && first.tagName === 'P' === false) {
        // 只认第一个 p（GitHub 约定标记在首段）
        break;
    }
    if (!first || first.tagName !== 'P') return null;

    // 在首段的前几个文本节点里找标记（内联元素前可能有空白文本）
    var nodes = first.childNodes;
    for (var i = 0; i < nodes.length && i < 4; i++) {
        var node = nodes[i];
        if (node.nodeType !== 3) break; // 遇到元素即停
        var m = ALERT_RE.exec(node.nodeValue || '');
        if (m) {
            return {
                type: ALERT_TYPES[m[1].toUpperCase()],
                container: first,
                textNode: node,
                rest: (node.nodeValue || '').replace(ALERT_RE, ''),
            };
        }
        if ((node.nodeValue || '').trim() !== '') break; // 首个非空文本不含标记即放弃
    }
    return null;
}

export function enhanceGitHubMarkdown(html) {
    if (!html) return html;

    // 修复 markdown 强调语法吞噬 dunder 文件名：
    // `__init__.py` 会被 marked 按 CommonMark 解析成 <strong>init</strong>.py
    // （GitHub 网页端同款行为）。还原为纯文本，保证标题里与
    // 「Core.py - 基础模块」这类兄弟标题风格一致，正文也不突兀。
    // 仅处理后跟常见扩展名的形态，正常加粗文本不受影响。
    html = html.replace(
        /<strong>([A-Za-z_][A-Za-z0-9_]*)<\/strong>(\.(?:py|js|mjs|cjs|ts|json|toml|ya?ml|md|cfg|ini|txt|sh|bat)\b)/g,
        '__$1__$2'
    );

    // ErisPulse 注释风格标签（{!--< tips >!--} 等）：
    // tips 块转 Tip 提示框，其余标记与孤儿闭合剥离
    html = enhanceErisDocTags(html);

    if (html.indexOf('[!') === -1) return html;

    try {
        var doc = new DOMParser().parseFromString(
            '<div id="__gh_root">' + html + '</div>',
            'text/html'
        );
        var root = doc.getElementById('__gh_root');
        var quotes = Array.prototype.slice.call(root.querySelectorAll('blockquote'));
        var converted = 0;

        quotes.forEach(function (quote) {
            var hit = detectAlert(quote);
            if (!hit) return;

            var type = hit.type;
            var alert = doc.createElement('div');
            alert.className = 'markdown-alert markdown-alert-' + type.cls;

            var title = doc.createElement('p');
            title.className = 'markdown-alert-title';
            title.innerHTML = '<i class="' + type.icon + '" aria-hidden="true"></i>' + type.label;
            alert.appendChild(title);

            // 剥离标记：标记独行则整段删除，否则保留剩余文本
            hit.textNode.nodeValue = hit.rest;
            if (hit.container.textContent.trim() === '' && !hit.container.querySelector('img,code,a')) {
                hit.container.remove();
            }

            while (quote.firstChild) {
                alert.appendChild(quote.firstChild);
            }
            quote.parentNode.replaceChild(alert, quote);
            converted++;
        });

        if (!converted) return html;
        return root.innerHTML;
    } catch (e) {
        console.warn('[gh-markdown] Alerts 后处理失败，回退原始 HTML:', e);
        return html;
    }
}

/**
 * ErisPulse 注释风格标签处理（{!--< xxx >!--}）
 *
 * - {!--< tips >!--} ... {!--< /tips >!--} 块（标记各占一个块级元素）
 *   打包为 Tip 提示框，复用 GitHub Alerts 的 DOM 结构与样式
 * （.markdown-alert.markdown-alert-tip，样式见 markdown.css）
 * - 其余特殊标签（internal-use / ignore / deprecated / experimental）
 *   与孤儿闭合标记从文本中剥离
 * - 代码块（pre/code）内的一律不动——风格规范页靠它展示标签原文
 */
var ERIS_OPEN_RE = /^\s*\{!--<\s*tips\s*>!--\}\s*$/;
var ERIS_CLOSE_RE = /\{!--<\s*\/tips\s*>!--\}/;
var ERIS_STRIP_RE = /\s*\{!--<\s*\/?(?:tips|internal-use|ignore|deprecated|experimental)\s*>!--\}/g;

function enhanceErisDocTags(html) {
    if (html.indexOf('{!--<') === -1 && html.indexOf('{!--&lt;') === -1) return html;

    try {
        var doc = new DOMParser().parseFromString(
            '<div id="__eris_root">' + html + '</div>',
            'text/html'
        );
        var root = doc.getElementById('__eris_root');

        function inCode(node) {
            var p = node.parentElement;
            while (p && p !== root) {
                var t = p.tagName;
                if (t === 'PRE' || t === 'CODE') return true;
                p = p.parentNode;
            }
            return false;
        }

        // 1) tips 块打包。闭合标记常被 markdown 列表吞进末项（不占独立块），
        //    所以在全文文本节点里找它，打包范围覆盖到它所在的顶层节点。
        var guard = 0;
        var wrapped = true;
        while (wrapped && guard < 20) {
            wrapped = false;
            guard++;
            var top = Array.prototype.slice.call(root.childNodes);
            var startIdx = -1;
            for (var i = 0; i < top.length; i++) {
                if (top[i].nodeType !== 1) continue;
                if (ERIS_OPEN_RE.test((top[i].textContent || '').trim())) {
                    startIdx = i;
                    break;
                }
            }
            if (startIdx === -1) break;

            var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            var closeIdx = -1;
            var closeNode = null;
            var tn;
            while ((tn = walker.nextNode())) {
                if (inCode(tn)) continue;
                if (!ERIS_CLOSE_RE.test(tn.nodeValue || '')) continue;
                var ancTop = tn.parentElement;
                while (ancTop && ancTop.parentNode !== root) ancTop = ancTop.parentNode;
                var idx = ancTop ? top.indexOf(ancTop) : -1;
                if (idx > startIdx) {
                    closeIdx = idx;
                    closeNode = tn;
                    break;
                }
            }
            if (closeIdx === -1) break;

            closeNode.nodeValue = (closeNode.nodeValue || '').replace(ERIS_CLOSE_RE, '');

            var alert = doc.createElement('div');
            alert.className = 'markdown-alert markdown-alert-tip';
            var title = doc.createElement('p');
            title.className = 'markdown-alert-title';
            title.innerHTML = '<i class="fas fa-lightbulb" aria-hidden="true"></i>Tips';
            alert.appendChild(title);
            for (var j = startIdx + 1; j <= closeIdx; j++) {
                alert.appendChild(top[j]);
            }
            root.replaceChild(alert, top[startIdx]);
            wrapped = true;
        }

        // 2) 剩余标记剥离（孤儿闭合、行内形式；跳过 pre/code）
        var walker2 = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var texts = [];
        var t2;
        while ((t2 = walker2.nextNode())) texts.push(t2);
        texts.forEach(function (node) {
            if (inCode(node)) return;
            if (ERIS_STRIP_RE.test(node.nodeValue)) {
                node.nodeValue = node.nodeValue.replace(ERIS_STRIP_RE, '');
            }
        });

        return root.innerHTML;
    } catch (e) {
        console.warn('[gh-markdown] ErisPulse 标签后处理失败，回退原始 HTML:', e);
        return html;
    }
}
