












var ALERT_TYPES = {
    NOTE:      { cls: 'note',      icon: 'fas fa-circle-info',          label: 'Note' },
    TIP:       { cls: 'tip',       icon: 'fas fa-lightbulb',            label: 'Tip' },
    IMPORTANT: { cls: 'important', icon: 'fas fa-comment-dots',         label: 'Important' },
    WARNING:   { cls: 'warning',   icon: 'fas fa-triangle-exclamation', label: 'Warning' },
    CAUTION:   { cls: 'caution',   icon: 'fas fa-fire',                 label: 'Caution' },
};

 
var ALERT_RE = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

function detectAlert(quote) {
    var first = quote.firstElementChild;
    while (first && first.tagName === 'P' === false) {
         
        break;
    }
    if (!first || first.tagName !== 'P') return null;

     
    var nodes = first.childNodes;
    for (var i = 0; i < nodes.length && i < 4; i++) {
        var node = nodes[i];
        if (node.nodeType !== 3) break;  
        var m = ALERT_RE.exec(node.nodeValue || '');
        if (m) {
            return {
                type: ALERT_TYPES[m[1].toUpperCase()],
                container: first,
                textNode: node,
                rest: (node.nodeValue || '').replace(ALERT_RE, ''),
            };
        }
        if ((node.nodeValue || '').trim() !== '') break;  
    }
    return null;
}

export function enhanceGitHubMarkdown(html) {
    if (!html) return html;

     
     
     
     
     
    html = html.replace(
        /<strong>([A-Za-z_][A-Za-z0-9_]*)<\/strong>(\.(?:py|js|mjs|cjs|ts|json|toml|ya?ml|md|cfg|ini|txt|sh|bat)\b)/g,
        '__$1__$2'
    );

     
     
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
