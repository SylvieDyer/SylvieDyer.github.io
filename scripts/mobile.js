/* ── Mobile home screen ────────────────────────────────────────
   Same manifest, phone metaphor: an icon grid plus a bottom dock, one
   tap opens a full-screen page, and swiping down on the page header
   dismisses it. Only rendered when the viewport is phone-sized.
   ─────────────────────────────────────────────────────────────── */
import { $, el, art, esc, isMobile } from './util.js';
import { on as itemsOn } from './data.js';
import { openItem } from './desktop.js';
import { exitApp, activeApp } from './router.js';

const SWIPE_CLOSE_PX = 90;

export function initMobile() {
  renderMobile();
  wireTaps();
  wireSwipeToClose();
  syncAriaHidden();

  // Crossing the breakpoint swaps which tree is authoritative
  window.matchMedia('(max-width: 767px)').addEventListener('change', syncAriaHidden);
}

function renderMobile() {
  const grid = $('#mobile-grid');
  const dock = $('#mobile-dock');
  if (!grid || !dock) return;

  const inDock = itemsOn('mobile-dock');
  const inGrid = itemsOn('mobile');

  grid.replaceChildren(...inGrid.map(tile));
  dock.replaceChildren(...inDock.map(tile));
}

function tile(item) {
  return el('li', {}, [
    el('button', {
      class: 'mobile-icon',
      dataset: { id: item.id },
      'aria-label': item.label,
      html: `${art(item.icon, 'mobile-icon__art')}
             <span class="mobile-icon__label">${esc(item.label)}</span>`,
    }),
  ]);
}

function wireTaps() {
  $('#mobile-home')?.addEventListener('click', (e) => {
    const button = e.target.closest('[data-id]');
    if (button) openItem(button.dataset.id, button);
  });
}

/** Drag the page down from its header to dismiss it. */
function wireSwipeToClose() {
  const layer = $('#app-layer');
  const chrome = $('.app-layer__chrome');
  const body = $('#app-layer-body');
  if (!layer || !chrome) return;

  let startY = null;
  let dragging = false;

  const canStart = (e) =>
    isMobile() && activeApp() &&
    (e.target.closest('.app-layer__chrome') || body.scrollTop <= 0);

  layer.addEventListener('touchstart', (e) => {
    if (!canStart(e)) return;
    startY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });

  layer.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) return;
    // Rubber-band: follow the finger, but damped
    layer.style.transform = `translateY(${dy * 0.6}px)`;
    layer.style.transition = 'none';
  }, { passive: true });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    const dy = (e.changedTouches?.[0]?.clientY ?? startY) - startY;
    layer.style.transition = '';
    layer.style.transform = '';
    if (dy > SWIPE_CLOSE_PX) exitApp();
  };

  layer.addEventListener('touchend', end);
  layer.addEventListener('touchcancel', end);
}

/**
 * Exactly one of desktop / mobile-home should be exposed to screen readers,
 * otherwise every item is announced twice.
 */
export function syncAriaHidden() {
  const mobile = isMobile();
  const locked = document.body.dataset.stage === 'locked';
  $('#desktop')?.setAttribute('aria-hidden', String(mobile || locked));
  $('#mobile-home')?.setAttribute('aria-hidden', String(!mobile || locked));
}
