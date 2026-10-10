/* ── Small shared helpers ─────────────────────────────────────── */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Create an element in one call: el('div', {class:'x'}, [child, 'text']) */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return node;
}

/** Reference into the SVG sprite in index.html. */
export function icon(id, size = 24) {
  return `<svg class="ico" viewBox="0 0 ${id.startsWith('i-battery') ? '28 14' : '24 24'}"
            width="${size}" height="${size}" aria-hidden="true"><use href="#${id}"/></svg>`;
}

/** Sprite icons drawn on a 64×64 canvas (folders, app tiles). */
export function art(id, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><use href="#${id}"/></svg>`;
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Escape untrusted text before it goes into an innerHTML template. */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/**
 * Escape, then highlight any [bracketed] placeholder so unfinished copy is
 * impossible to miss while you're filling the site in. Once no brackets
 * remain, this is just esc() — nothing to remove later.
 */
export const ph = (s) =>
  esc(s ?? '').replace(/\[([^\]]*)\]/g, '<span class="todo">[$1]</span>');

/** True if a value is still an unedited placeholder. */
export const isPlaceholder = (s) => typeof s === 'string' && /^\s*\[.*\]\s*$/.test(s);

/** Strip brackets for use in href/src attributes, or return '' if unedited. */
export const link = (s) => (isPlaceholder(s) ? '' : String(s ?? ''));

/* ── localStorage that never throws (private mode, quota, disabled) ── */
const NS = 'desk:';
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  del(key) {
    try { localStorage.removeItem(NS + key); } catch { /* ignore */ }
  },
};

/* ── Environment queries ── */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

/** Announce a state change to screen readers. */
export function announce(message) {
  const live = $('#a11y-live');
  if (live) live.textContent = message;
}

/** Resolve after `ms`, or immediately when motion is reduced. */
export const wait = (ms) =>
  new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : ms));

/** Trap Tab focus inside `container` until the returned function is called. */
export function trapFocus(container) {
  const SELECTOR = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    const items = $$(SELECTOR, container).filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}
