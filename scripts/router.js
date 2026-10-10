/* ── Router + full-screen transition ──────────────────────────────
   URLs so pages are shareable and the back button behaves:
     #/                 desktop
     #/app/<id>         full-screen app
     #/open/<id>        desktop with that window open
   Dock launches fly a cloned icon from the dock into the full-screen
   page, which is what makes the transition read as "the icon opened".
   ─────────────────────────────────────────────────────────────── */
import { $, art, announce, prefersReducedMotion, isMobile, wait } from './util.js';
import { BY_ID } from './data.js';
import { renderView } from './views/index.js';
import { openWindow, closeAllWindows } from './windows.js';
import { syncRunningDots } from './dock.js';

let currentApp = null;
let pendingSource = null;      // dock icon the launch came from

/* ── Public API ───────────────────────────────────────────────── */

export function initRouter() {
  window.addEventListener('hashchange', applyRoute);
  applyRoute({ initial: true });
}

/** Launch a full-screen app. `sourceEl` is the icon it should fly from. */
export function openApp(id, sourceEl = null) {
  const item = BY_ID.get(id);
  if (!item || item.kind !== 'app') return false;
  pendingSource = sourceEl;
  setHash(`#/app/${id}`);
  return true;
}

/**
 * Open any item as a full-screen page regardless of kind. Mobile uses this
 * for folders too, since there is no window layer on a phone.
 */
export function openAsPage(id, sourceEl = null) {
  const item = BY_ID.get(id);
  if (!item?.view) return false;
  pendingSource = sourceEl;
  setHash(`#/app/${id}`);
  return true;
}

export function exitApp() {
  if (!currentApp) return false;
  setHash('#/');
  return true;
}

export const activeApp = () => currentApp;

/* ── Route handling ───────────────────────────────────────────── */
function setHash(hash) {
  if (location.hash === hash) { applyRoute(); return; }
  location.hash = hash;
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [kind, id] = raw.split('/');
  if (kind === 'app' && id) return { kind: 'app', id };
  if (kind === 'open' && id) return { kind: 'open', id };
  return { kind: 'desktop' };
}

async function applyRoute({ initial = false } = {}) {
  const route = parseHash();

  if (route.kind === 'app') {
    const item = BY_ID.get(route.id);
    if (!item?.view) { setHash('#/'); return; }
    if (currentApp === route.id) return;
    await showApp(route.id, { instant: initial });
    return;
  }

  if (route.kind === 'open') {
    if (currentApp) await hideApp();
    const item = BY_ID.get(route.id);
    // On a phone there is no window layer, so a window link becomes a page
    if (!item) return;
    if (isMobile()) openAsPage(route.id);
    else if (item.kind !== 'app') openWindow(route.id);
    return;
  }

  if (currentApp) await hideApp();
}

/* ── Show / hide the full-screen layer ────────────────────────── */
async function showApp(id, { instant = false } = {}) {
  const item = BY_ID.get(id);
  const view = renderView(item.view);

  const body = $('#app-layer-body');
  $('#app-layer-title').textContent = view.title;
  body.innerHTML = view.html;
  body.scrollTop = 0;

  const wasApp = currentApp;
  currentApp = id;
  document.body.dataset.app = id;
  $('#app-layer').setAttribute('aria-hidden', 'false');

  // Fly the icon only for a fresh launch from a visible source
  const source = pendingSource;
  pendingSource = null;
  if (!instant && !wasApp && source && !prefersReducedMotion() && !isMobile()) {
    await flyGhost(source, item);
  }

  document.body.classList.add('app-open');
  syncRunningDots(id);

  view.mount?.(body, {
    close: exitApp,
    open: (target) => {
      const t = BY_ID.get(target);
      if (!t) return false;
      t.kind === 'app' ? openApp(target) : (exitApp(), openWindow(target));
      return true;
    },
  });

  // Move focus into the page so keyboard users land in the new content
  body.focus({ preventScroll: true });
  announce(`${view.title} opened full screen`);
}

async function hideApp() {
  document.body.classList.remove('app-open');
  const layer = $('#app-layer');
  layer.setAttribute('aria-hidden', 'true');
  const wasApp = currentApp;
  currentApp = null;
  delete document.body.dataset.app;
  syncRunningDots();

  await wait(260);
  // Only clear if nothing new opened in the meantime
  if (!currentApp) $('#app-layer-body').innerHTML = '';
  announce('Back to desktop');
  return wasApp;
}

/* ── The zoom ghost ───────────────────────────────────────────── */
async function flyGhost(sourceEl, item) {
  const ghost = $('#zoom-ghost');
  const from = sourceEl.getBoundingClientRect();
  if (!from.width) return;

  ghost.innerHTML = art(item.icon, '');
  Object.assign(ghost.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    transform: 'none',
    borderRadius: '12px',
  });
  ghost.classList.add('is-flying');

  // Scale the icon up until it covers the viewport, moving its centre to the centre
  const scale = Math.max(window.innerWidth / from.width, window.innerHeight / from.height) * 1.15;
  const dx = window.innerWidth / 2 - (from.left + from.width / 2);
  const dy = window.innerHeight / 2 - (from.top + from.height / 2);

  await new Promise((r) => requestAnimationFrame(r));
  ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
  ghost.style.borderRadius = '0px';

  await wait(240);
  ghost.classList.remove('is-flying');
  ghost.style.transform = 'none';
  ghost.innerHTML = '';
}

/* ── Deep-link helper for menus and Spotlight ─────────────────── */
export function goHome({ closeWindows = false } = {}) {
  if (closeWindows) closeAllWindows();
  setHash('#/');
}

/** Wire the app layer's own chrome (traffic lights + Back). */
export function initAppLayerChrome() {
  $('#app-layer').addEventListener('click', (e) => {
    if (e.target.closest('[data-action="exit-fullscreen"]')) exitApp();
  });
}
