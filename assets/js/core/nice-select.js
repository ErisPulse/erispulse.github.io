/**
 * 原生 select 的外观层（nice-select）：隐藏原生控件，以按钮 + 下拉菜单呈现。
 * 值与 change 事件仍由原生 select 承担；选项增删与文案变化经 MutationObserver
 * 同步到按钮与菜单，语言切换无需额外处理。
 */

let _docBound = false;

const chevronHtml = '<i class="fas fa-chevron-down nice-select-chev" aria-hidden="true"></i>';

/** 关闭页面上全部已展开的 nice-select */
function closeAll() {
    document.querySelectorAll('.nice-select.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.nice-select-btn').setAttribute('aria-expanded', 'false');
    });
}

/**
 * 增强指定根节点下的全部原生 select（已增强的跳过）
 * @param {ParentNode} root
 */
export function setupNiceSelects(root = document) {
    if (!_docBound) {
        document.addEventListener('click', closeAll);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
        _docBound = true;
    }
    (root || document).querySelectorAll('select').forEach(enhance);
}

function enhance(sel) {
    if (sel.dataset.nice) return;
    sel.dataset.nice = '1';
    sel.classList.add('nice-select-native');

    const wrap = document.createElement('span');
    wrap.className = 'nice-select';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nice-select-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const val = document.createElement('span');
    val.className = 'nice-select-val';
    btn.append(val);
    btn.insertAdjacentHTML('beforeend', chevronHtml);
    const menu = document.createElement('span');
    menu.className = 'nice-select-menu';
    menu.setAttribute('role', 'listbox');
    wrap.append(btn, menu);
    sel.parentNode.insertBefore(wrap, sel);
    wrap.append(sel);

    const sync = () => {
        const opt = sel.options[sel.selectedIndex];
        val.textContent = opt ? opt.textContent : '';
        menu.querySelectorAll('.nice-select-item').forEach(item => {
            const on = item.dataset.value === sel.value;
            item.classList.toggle('active', on);
            item.setAttribute('aria-selected', String(on));
        });
    };

    const buildMenu = () => {
        menu.innerHTML = [...sel.options].map(o =>
            `<button type="button" class="nice-select-item" role="option" data-value="${o.value}">${o.textContent}</button>`
        ).join('');
        sync();
    };
    buildMenu();

    // 选项集合或文案变化（语言切换、动态填充）时重建
    new MutationObserver(() => { buildMenu(); }).observe(sel, { childList: true, subtree: true, characterData: true });
    sel.addEventListener('change', sync);

    btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = wrap.classList.contains('open');
        closeAll();
        if (!open) {
            wrap.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            const active = menu.querySelector('.nice-select-item.active');
            if (active) active.scrollIntoView({ block: 'nearest' });
        }
    });

    menu.addEventListener('click', e => {
        const item = e.target.closest('.nice-select-item');
        if (!item) return;
        e.stopPropagation();
        if (sel.value !== item.dataset.value) {
            sel.value = item.dataset.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        closeAll();
    });
}
