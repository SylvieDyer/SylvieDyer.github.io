/* ── Window manager ────────────────────────────────────────────
   Owns everything about draggable/resizable windows: creation, focus
   stacking, minimize/restore/zoom, geometry persistence, and cleanup.
   Nothing else in the app touches window DOM directly.
   ─────────────────────────────────────────────────────────────── */
import { $, $$, el, clamp, store, announce, prefersReducedMotion, art, esc } from './util.js';
import { BY_ID, on as itemsOn } from './data.js';
import { renderView } from './views/index.js';

const Z_BASE = 200;
const MIN_W = 340;
const MIN_H = 220;
const KEEP_VISIBLE = 90;      // px of titlebar that must stay reachable
const CASCADE = 28;

/** id → { node, item, geometry, minimized } */
const open = new Map();
let zTop = Z_BASE;
let focusedId = null;
let cascadeAt = 0;
const listeners = new Set();

const layer = () => $('#window-layer');
const bounds = () => {
  const r = layer().getBoundingClientRect();
  return { w: r.width, h: r.height };
};

function emit() { listeners.forEach((fn) => fn(openIds())); }
export const onWindowsChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const openIds = () => [...open.keys()].filter((id) => !open.get(id).minimized);
export const allOpenIds = () => [...open.keys()];
export const isOpen = (id) => open.has(id);

/* ── Geometry ─────────────────────────────────────────────────── */
function initialGeometry(item, view) {
  const { w: maxW, h: maxH } = bounds();
  const saved = store.get(`geom:${item.id}`);

  const wantW = view.window?.width ?? 720;
  const wantH = view.window?.height ?? 520;
  const width = clamp(saved?.w ?? wantW, MIN_W, Math.max(MIN_W, maxW - 40));
  const height = clamp(saved?.h ?? wantH, MIN_H, Math.max(MIN_H, maxH - 90));

  if (saved && Number.isFinite(saved.x)) {
    return {
      x: clamp(saved.x, -width + KEEP_VISIBLE, maxW - KEEP_VISIBLE),
      y: clamp(saved.y, 0, Math.max(0, maxH - 60)),
      w: width, h: height,
    };
  }

  // Fresh window: centre-ish, then cascade so stacks stay readable
  const step = (cascadeAt++ % 5) * CASCADE;
  return {
    x: clamp(Math.round((maxW - width) / 2) - 60 + step, 12, Math.max(12, maxW - width - 12)),
    y: clamp(Math.round((maxH - height) / 2) - 40 + step, 12, Math.max(12, maxH - height - 12)),
    w: width, h: height,
  };
}

function applyGeometry(node, g) {
  node.style.left = `${g.x}px`;
  node.style.top = `${g.y}px`;
  node.style.width = `${g.w}px`;
  node.style.height = `${g.h}px`;
}

const persist = (id, g) => store.set(`geom:${id}`, g);

/* ── Sidebar: makes a window feel like Finder ─────────────────── */
function sidebar(activeId) {
  const items = itemsOn('desktop');
  return el('nav', { class: 'window__sidebar', 'aria-label': 'Locations' }, [
    el('p', { class: 'window__sidebar-label', text: 'Favourites' }),
    ...items.map((it) => el('button', {
      class: 'window__sidebar-item',
      dataset: { navigate: it.id },
      'aria-current': it.id === activeId ? 'true' : null,
      html: `${art(it.icon, '')}<span>${esc(it.label)}</span>`,
    })),
  ]);
}

/* ── Create ───────────────────────────────────────────────────── */
export function openWindow(id, { focus = true } = {}) {
  const item = BY_ID.get(id);
  if (!item) return null;

  // Already there → restore and raise instead of duplicating
  if (open.has(id)) {
    const rec = open.get(id);
    if (rec.minimized) restoreWindow(id);
    if (focus) focusWindow(id);
    return rec.node;
  }

  const view = renderView(item.view);
  const g = initialGeometry(item, view);

  const node = el('section', {
    class: 'window is-opening',
    id: `win-${id}`,
    role: 'dialog',
    'aria-label': view.title,
    tabindex: '-1',
    dataset: { id },
  });
  applyGeometry(node, g);

  node.append(
    el('header', { class: 'window__titlebar' }, [
      el('div', { class: 'win-controls' }, [
        el('button', {
          class: 'win-btn win-btn--close', dataset: { win: 'close' },
          'aria-label': `Close ${view.title}`,
          html: `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-x"/></svg>`,
        }),
        el('button', {
          class: 'win-btn', dataset: { win: 'minimize' },
          'aria-label': `Minimize ${view.title}`,
          html: `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-minus"/></svg>`,
        }),
        el('button', {
          class: 'win-btn win-btn--zoom', dataset: { win: 'zoom' },
          'aria-label': `Maximize ${view.title}`,
          html: `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-expand"/></svg>`,
        }),
      ]),
      el('h2', { class: 'window__title', html: `${esc(view.title)}${view.subtitle ? `<span class="window__title-sub">${esc(view.subtitle)}</span>` : ''}` }),
    ]),
    el('div', { class: 'window__body' }, [
      sidebar(id),
      el('div', { class: 'window__content', html: view.html }),
    ]),
    ...['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'].map((dir) =>
      el('div', { class: `resize-handle rh-${dir}`, dataset: { resize: dir } })),
  );

  layer().append(node);
  open.set(id, { node, item, view, geometry: g, minimized: false });

  wireWindow(node, id);
  view.mount?.($('.window__content', node), {
    close: () => closeWindow(id),
    open: (target) => openWindow(target) !== null,
  });

  if (focus) focusWindow(id);
  announce(`${view.title} window opened`);
  emit();
  return node;
}

/* ── Focus stacking ───────────────────────────────────────────── */
export function focusWindow(id) {
  const rec = open.get(id);
  if (!rec) return;
  if (focusedId && focusedId !== id) open.get(focusedId)?.node.classList.remove('is-focused');
  rec.node.style.zIndex = String(++zTop);
  rec.node.classList.add('is-focused');
  focusedId = id;
  rec.node.focus({ preventScroll: true });
}

export const focusedWindowId = () =>
  focusedId && open.has(focusedId) && !open.get(focusedId).minimized ? focusedId : null;

/* ── Close / minimize / zoom ──────────────────────────────────── */
export function closeWindow(id) {
  const rec = open.get(id);
  if (!rec) return;
  persist(id, currentGeometry(rec.node));
  rec.node.classList.add('is-closing');
  const finish = () => {
    rec.node.remove();
    open.delete(id);
    if (focusedId === id) {
      focusedId = null;
      const next = openIds().at(-1);
      if (next) focusWindow(next);
    }
    emit();
  };
  prefersReducedMotion() ? finish() : setTimeout(finish, 200);
  announce(`${rec.view.title} closed`);
}

export function closeFocusedWindow() {
  const id = focusedWindowId();
  if (id) { closeWindow(id); return true; }
  return false;
}

export function closeAllWindows() {
  [...open.keys()].forEach(closeWindow);
}

/**
 * Anchor the window's transform-origin on the dock icon, then scale it to
 * nothing. Because the origin sits at the destination, a plain scale collapses
 * the window into the dock — smoother and cheaper than translating and
 * scaling at the same time, which reads as two competing motions.
 */
function collapseKeyframes(node, id) {
  const target = dockTargetRect(id);
  if (!target) return null;

  const from = node.getBoundingClientRect();
  node.style.transformOrigin =
    `${target.left + target.width / 2 - from.left}px ${target.top + target.height / 2 - from.top}px`;

  return [
    { transform: 'scale(1)',    opacity: 1,    offset: 0 },
    { transform: 'scale(0.42)', opacity: 0.92, offset: 0.5 },
    { transform: 'scale(0.02)', opacity: 0,    offset: 1 },
  ];
}

const TIMING_MINIMIZE = { duration: 400, easing: 'cubic-bezier(0.42, 0, 0.26, 1)' };
const TIMING_RESTORE  = { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };

export function minimizeWindow(id) {
  const rec = open.get(id);
  if (!rec || rec.minimized) return;
  persist(id, currentGeometry(rec.node));

  const done = () => {
    rec.minimized = true;
    rec.node.classList.add('is-minimized');
    rec.node.classList.remove('is-animating');
    rec.node.style.transformOrigin = '';
    if (focusedId === id) focusedId = null;
    emit();
  };

  const frames = prefersReducedMotion() ? null : collapseKeyframes(rec.node, id);
  if (!frames) { done(); return; }

  rec.node.classList.add('is-animating');
  rec.node.animate(frames, TIMING_MINIMIZE).finished.then(done, done);
  announce(`${rec.view.title} minimized`);
}

export function restoreWindow(id) {
  const rec = open.get(id);
  if (!rec) return;
  rec.node.classList.remove('is-minimized');
  rec.minimized = false;

  const frames = prefersReducedMotion() ? null : collapseKeyframes(rec.node, id);
  if (frames) {
    rec.node.classList.add('is-animating');
    // Reversing needs the offsets remapped too — they must stay ascending
    const rising = [...frames].reverse().map((f) => ({ ...f, offset: 1 - f.offset }));
    rec.node.animate(rising, TIMING_RESTORE).finished
      .then(() => {
        rec.node.classList.remove('is-animating');
        rec.node.style.transformOrigin = '';
      }, () => rec.node.classList.remove('is-animating'));
  }
  focusWindow(id);
  emit();
}

export function toggleZoom(id) {
  const rec = open.get(id);
  if (!rec) return;

  // Capture the pre-zoom geometry before the class changes the layout
  const before = currentGeometry(rec.node);
  const isMax = rec.node.classList.toggle('is-maximized');

  if (isMax) rec.restoreGeometry = before;
  else if (rec.restoreGeometry) applyGeometry(rec.node, rec.restoreGeometry);

  // The glyph reflects what the button will do next
  const zoomBtn = $('.win-btn--zoom', rec.node);
  if (zoomBtn) {
    $('use', zoomBtn).setAttribute('href', isMax ? '#i-collapse' : '#i-expand');
    zoomBtn.setAttribute('aria-label', `${isMax ? 'Restore' : 'Maximize'} ${rec.view.title}`);
  }

  focusWindow(id);
}

function currentGeometry(node) {
  return {
    x: node.offsetLeft, y: node.offsetTop,
    w: node.offsetWidth, h: node.offsetHeight,
  };
}

/** Where a minimized window should fly to. */
function dockTargetRect(id) {
  const dockItem = $(`#dock [data-id="${id}"]`) || $('#dock');
  return dockItem?.getBoundingClientRect() ?? null;
}

/* ── Interaction wiring ───────────────────────────────────────── */
function wireWindow(node, id) {
  // Drop the open animation as soon as it finishes, so later class changes
  // (dragging, resizing, focusing) can't restart it.
  node.addEventListener('animationend', (e) => {
    if (e.target === node) node.classList.remove('is-opening');
  }, { once: true });

  node.addEventListener('pointerdown', () => focusWindow(id), { capture: true });

  // Traffic lights
  node.addEventListener('click', (e) => {
    const action = e.target.closest('[data-win]')?.dataset.win;
    if (!action) return;
    e.stopPropagation();
    if (action === 'close') closeWindow(id);
    if (action === 'minimize') minimizeWindow(id);
    if (action === 'zoom') toggleZoom(id);
  });

  // Sidebar navigation
  node.addEventListener('click', (e) => {
    const target = e.target.closest('[data-navigate]')?.dataset.navigate;
    if (target) openWindow(target);
  });

  const titlebar = $('.window__titlebar', node);

  // Double-click the titlebar to zoom, like macOS
  titlebar.addEventListener('dblclick', (e) => {
    if (e.target.closest('[data-win]')) return;
    toggleZoom(id);
  });

  startDragging(node, id, titlebar);
  startResizing(node, id);
}

function startDragging(node, id, titlebar) {
  titlebar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('[data-win]')) return;
    if (node.classList.contains('is-maximized')) return;

    const start = { px: e.clientX, py: e.clientY, x: node.offsetLeft, y: node.offsetTop };
    const { w: maxW, h: maxH } = bounds();
    node.classList.add('is-dragging');
    titlebar.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const x = clamp(start.x + ev.clientX - start.px,
                      -node.offsetWidth + KEEP_VISIBLE, maxW - KEEP_VISIBLE);
      const y = clamp(start.y + ev.clientY - start.py, 0, maxH - 40);
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
    };
    const up = () => {
      node.classList.remove('is-dragging');
      titlebar.removeEventListener('pointermove', move);
      titlebar.removeEventListener('pointerup', up);
      titlebar.removeEventListener('pointercancel', up);
      persist(id, currentGeometry(node));
    };

    titlebar.addEventListener('pointermove', move);
    titlebar.addEventListener('pointerup', up);
    titlebar.addEventListener('pointercancel', up);
  });
}

function startResizing(node, id) {
  for (const handle of $$('[data-resize]', node)) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const dir = handle.dataset.resize;
      const start = {
        px: e.clientX, py: e.clientY,
        x: node.offsetLeft, y: node.offsetTop,
        w: node.offsetWidth, h: node.offsetHeight,
      };
      const { w: maxW, h: maxH } = bounds();
      node.classList.add('is-resizing');
      handle.setPointerCapture(e.pointerId);

      const move = (ev) => {
        const dx = ev.clientX - start.px;
        const dy = ev.clientY - start.py;
        let { x, y, w, h } = start;

        if (dir.includes('e')) w = clamp(start.w + dx, MIN_W, maxW - start.x);
        if (dir.includes('s')) h = clamp(start.h + dy, MIN_H, maxH - start.y);
        if (dir.includes('w')) {
          w = clamp(start.w - dx, MIN_W, start.x + start.w);
          x = start.x + start.w - w;
        }
        if (dir.includes('n')) {
          h = clamp(start.h - dy, MIN_H, start.y + start.h);
          y = start.y + start.h - h;
        }
        applyGeometry(node, { x, y, w, h });
      };
      const up = () => {
        node.classList.remove('is-resizing');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        persist(id, currentGeometry(node));
      };

      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }
}

/* ── Keep windows on screen when the viewport shrinks ─────────── */
export function reflowWindows() {
  const { w: maxW, h: maxH } = bounds();
  for (const [id, rec] of open) {
    if (rec.node.classList.contains('is-maximized')) continue;
    const g = currentGeometry(rec.node);
    const next = {
      w: clamp(g.w, MIN_W, Math.max(MIN_W, maxW - 24)),
      h: clamp(g.h, MIN_H, Math.max(MIN_H, maxH - 60)),
      x: 0, y: 0,
    };
    next.x = clamp(g.x, -next.w + KEEP_VISIBLE, Math.max(0, maxW - KEEP_VISIBLE));
    next.y = clamp(g.y, 0, Math.max(0, maxH - 48));
    applyGeometry(rec.node, next);
    persist(id, next);
  }
}

/** Re-cascade every open window into a tidy stack. */
export function tidyWindows() {
  cascadeAt = 0;
  const { w: maxW, h: maxH } = bounds();
  [...open.entries()].forEach(([id, rec], i) => {
    if (rec.minimized) return;
    rec.node.classList.remove('is-maximized');
    const w = Math.min(rec.view.window?.width ?? 720, maxW - 40);
    const h = Math.min(rec.view.window?.height ?? 520, maxH - 80);
    const g = { x: 40 + i * CASCADE, y: 24 + i * CASCADE, w, h };
    applyGeometry(rec.node, g);
    persist(id, g);
  });
}
