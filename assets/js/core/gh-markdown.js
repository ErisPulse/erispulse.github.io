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
    if (!html || html.indexOf('[!') === -1) return html;

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
