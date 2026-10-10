/* ── Menu bar dropdowns, right-click menus, and shell actions ─────
   Menus are data (see data.js) and every entry resolves to one action
   string, so the same handler serves the menu bar, the context menu,
   and keyboard shortcuts.
   ─────────────────────────────────────────────────────────────── */
import { $, $$, el, esc, clamp, announce } from './util.js';
import { MENUS, DESKTOP_MENU, ITEM_MENU, BY_ID } from './data.js';
import { PROFILE } from './content.js';
import { openWindow, closeAllWindows, closeFocusedWindow, tidyWindows } from './windows.js';
import { openApp, exitApp } from './router.js';
import { openItem, tidyDesktop, select } from './desktop.js';
import { toggleTheme, cycleWallpaper } from './theme.js';
import { openSpotlight } from './spotlight.js';
import { lockScreen } from './boot.js';

let closeOpenMenu = null;

/* ── Actions ──────────────────────────────────────────────────── */
export function runAction(action, context = {}) {
  if (!action) return;

  if (action.startsWith('open:')) { openItem(action.slice(5)); return; }
  if (action.startsWith('route:')) { location.hash = action.slice(6); return; }

  switch (action) {
    case 'openSelf':       openItem(context.itemId); break;
    case 'fullscreenSelf': {
      const item = BY_ID.get(context.itemId);
      if (!item) break;
      // Folders have no full-screen route of their own, so zoom the window instead
      item.kind === 'app' ? openApp(item.id) : openWindow(item.id)?.classList.add('is-maximized');
      break;
    }
    case 'theme':         toggleTheme(); break;
    case 'wallpaper':     cycleWallpaper(); announce('Wallpaper changed'); break;
    case 'spotlight':     openSpotlight(); break;
    case 'lock':          lockScreen(); break;
    case 'tidy':          tidyDesktop(); tidyWindows(); break;
    case 'closeAll':      closeAllWindows(); exitApp(); break;
    case 'closeFocused':  if (!closeFocusedWindow()) exitApp(); break;
    case 'copyEmail':
      navigator.clipboard?.writeText(PROFILE.email)
        .then(() => announce('Email address copied'))
        .catch(() => announce(`Email: ${PROFILE.email}`));
      break;
    case 'resetAll':
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('desk:')) localStorage.removeItem(key);
      }
      location.hash = '#/';
      location.reload();
      break;
    default: break;
  }
}

/* ── Shared menu renderer ─────────────────────────────────────── */
function renderMenu(container, entries, { itemId = null, cls } = {}) {
  container.replaceChildren(...entries.map((entry) => {
    if (entry.sep) return el('li', { class: `${cls}__sep`, role: 'separator' });
    return el('li', { role: 'none' }, [
      el('button', {
        class: `${cls}__item`,
        role: 'menuitem',
        disabled: entry.disabled || null,
        dataset: { action: entry.action || '', itemId: itemId || '' },
        html: `<span>${esc(entry.label.replace('%s', BY_ID.get(itemId)?.label ?? ''))}</span>
               ${entry.key ? `<span class="${cls}__key">${esc(entry.key)}</span>` : ''}`,
      }),
    ]);
  }));
}

/** Keep a floating menu inside the viewport. */
function place(node, x, y) {
  node.style.left = '0px';
  node.style.top = '0px';
  node.setAttribute('aria-hidden', 'false');
  const r = node.getBoundingClientRect();
  node.style.left = `${clamp(x, 4, window.innerWidth - r.width - 4)}px`;
  node.style.top = `${clamp(y, 4, window.innerHeight - r.height - 4)}px`;
}

function dismiss() {
  closeOpenMenu?.();
  closeOpenMenu = null;
}

/* ── Menu bar ─────────────────────────────────────────────────── */
export function initMenubar() {
  const dropdown = $('#menu-dropdown');

  for (const button of $$('.menubar [data-menu]')) {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = button.dataset.menu;
      const alreadyOpen = button.getAttribute('aria-expanded') === 'true';
      dismiss();
      if (alreadyOpen) return;

      renderMenu(dropdown, MENUS[name] ?? [], { cls: 'menu-dropdown' });
      const r = button.getBoundingClientRect();
      place(dropdown, r.left - 4, r.bottom + 2);
      button.setAttribute('aria-expanded', 'true');

      closeOpenMenu = () => {
        dropdown.setAttribute('aria-hidden', 'true');
        button.setAttribute('aria-expanded', 'false');
      };
    });
  }

  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('[data-action]');
    if (!item || item.disabled) return;
    dismiss();
    runAction(item.dataset.action);
  });

  // Menu-bar buttons act as one menu: hovering moves between them once open
  $('.menubar')?.addEventListener('pointerover', (e) => {
    if (!closeOpenMenu) return;
    const button = e.target.closest('[data-menu]');
    if (button && button.getAttribute('aria-expanded') !== 'true') button.click();
  });
}

/* ── Right-click menus ────────────────────────────────────────── */
export function initContextMenu() {
  const menu = $('#context-menu');

  document.addEventListener('contextmenu', (e) => {
    // Let the browser's own menu appear on real text and inputs
    if (e.target.closest('input, textarea, a, .window__content, .app-layer__body')) return;
    const inDesktop = e.target.closest('#desktop-surface, .desktop__wallpaper, #icon-grid');
    if (!inDesktop) return;

    e.preventDefault();
    dismiss();

    const iconEl = e.target.closest('.icon');
    if (iconEl) select(iconEl.dataset.id);

    renderMenu(menu, iconEl ? ITEM_MENU : DESKTOP_MENU, {
      itemId: iconEl?.dataset.id ?? null,
      cls: 'context-menu',
    });
    place(menu, e.clientX, e.clientY);
    closeOpenMenu = () => menu.setAttribute('aria-hidden', 'true');
  });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-action]');
    if (!item || item.disabled) return;
    const { action, itemId } = item.dataset;
    dismiss();
    runAction(action, { itemId });
  });
}

/** One global dismiss for both menu kinds. */
export function initMenuDismissal() {
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#menu-dropdown, #context-menu, .menubar [data-menu]')) return;
    dismiss();
  });
  window.addEventListener('blur', dismiss);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dismiss(); });
}
