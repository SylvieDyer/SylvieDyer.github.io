/* ── Desktop icon grid ─────────────────────────────────────────
   Single click selects, double click (or Enter) opens — the macOS
   convention. A one-time hint says so, because a website visitor has
   no reason to guess it.
   ─────────────────────────────────────────────────────────────── */
import { $, $$, el, art, esc, store, announce, isMobile } from './util.js';
import { on as itemsOn, BY_ID } from './data.js';
import { openWindow } from './windows.js';

/* Injected by main.js so this module doesn't import the router (which
   imports the dock, which imports this file). */
let openApp = () => {};
let openPage = () => {};
export const setOpeners = ({ app, page }) => { openApp = app; openPage = page; };

export function initDesktop() {
  const grid = $('#icon-grid');
  if (!grid) return;

  grid.replaceChildren(...itemsOn('desktop').map(renderIcon));

  grid.addEventListener('click', (e) => {
    const button = e.target.closest('[data-id]');
    if (!button) return;
    select(button.dataset.id);
  });

  grid.addEventListener('dblclick', (e) => {
    const button = e.target.closest('[data-id]');
    if (button) openItem(button.dataset.id);
  });

  grid.addEventListener('keydown', (e) => {
    const button = e.target.closest('[data-id]');
    if (!button) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openItem(button.dataset.id);
    }
  });

  // Clicking bare desktop clears the selection
  $('#desktop-surface').addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.icon')) clearSelection();
  });

  showFirstRunHint();
}

function renderIcon(item) {
  return el('li', {}, [
    el('button', {
      class: 'icon',
      dataset: { id: item.id },
      'aria-label': `${item.label} — double-click to open`,
      html: `${art(item.icon, 'icon__art')}<span class="icon__label">${esc(item.label)}</span>`,
    }),
  ]);
}

export function select(id) {
  for (const node of $$('#icon-grid .icon')) {
    node.classList.toggle('is-selected', node.dataset.id === id);
  }
}

export const clearSelection = () =>
  $$('#icon-grid .icon').forEach((n) => n.classList.remove('is-selected'));

/**
 * Route an item to the right opener regardless of which surface asked.
 * Desktop: apps go full screen, folders and files become windows.
 * Mobile: everything becomes a full-screen page — there is no window layer.
 */
export function openItem(id, sourceEl = null) {
  const item = BY_ID.get(id);
  if (!item) return false;
  const source = sourceEl ?? $(`#dock [data-id="${id}"]`);

  if (isMobile()) openPage(id, source);
  else if (item.kind === 'app') openApp(id, source);
  else openWindow(id);
  return true;
}

/** Reposition icons into the default grid order. */
export function tidyDesktop() {
  const grid = $('#icon-grid');
  grid.replaceChildren(...itemsOn('desktop').map(renderIcon));
  announce('Desktop cleaned up');
}

/* ── First-run hint ───────────────────────────────────────────── */
function showFirstRunHint() {
  if (store.get('hint-seen')) return;

  const hint = el('div', {
    class: 'hint-toast',
    role: 'status',
    html: `<strong>Double-click</strong> a folder to open it · <strong>⌘K</strong> to search · icons in the dock open full screen`,
  });
  $('#desktop').append(hint);

  const dismiss = () => {
    hint.classList.add('is-leaving');
    setTimeout(() => hint.remove(), 300);
    store.set('hint-seen', true);
  };
  hint.addEventListener('click', dismiss);
  setTimeout(dismiss, 9000);
}
