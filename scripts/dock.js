/* ── Dock ──────────────────────────────────────────────────────
   Renders from the manifest, magnifies on hover, shows a running dot
   per open item, and hands clicks to the right opener: apps go
   full-screen, folders and files open as windows.
   ─────────────────────────────────────────────────────────────── */
import { $, $$, el, art, esc } from './util.js';
import { on as itemsOn, BY_ID } from './data.js';
import { isOpen, allOpenIds, minimizeWindow, restoreWindow, onWindowsChange } from './windows.js';
import { openItem } from './desktop.js';

const MAG_AMOUNT = 0.55;   // how much the icon under the cursor grows
const MAG_SPREAD = 72;     // px: how far the bulge reaches

export function initDock() {
  const dock = $('#dock');
  if (!dock) return;

  dock.replaceChildren(...itemsOn('dock').map(renderDockItem));

  dock.addEventListener('click', (e) => {
    const button = e.target.closest('[data-id]');
    if (!button) return;
    activate(button.dataset.id, button);
  });

  wireMagnification(dock);
  onWindowsChange(syncRunningDots);
  syncRunningDots();
}

function renderDockItem(item) {
  if (item.kind === 'separator') {
    return el('li', { class: 'dock__sep', role: 'presentation' });
  }
  return el('li', { role: 'listitem' }, [
    el('button', {
      class: 'dock__item',
      dataset: { id: item.id },
      'aria-label': `${item.label}${item.kind === 'app' ? ' — opens full screen' : ''}`,
      html: `
        <span class="dock__tip">${esc(item.label)}</span>
        ${art(item.icon, 'dock__art')}
        <span class="dock__dot" aria-hidden="true"></span>`,
    }),
  ]);
}

/** One click, three behaviours depending on what the thing is. */
function activate(id, sourceEl) {
  const item = BY_ID.get(id);
  if (!item) return;

  // A folder or file that's already open toggles, the way a running app does
  if (item.kind !== 'app' && isOpen(id)) {
    const node = $(`#win-${id}`);
    node?.classList.contains('is-minimized') ? restoreWindow(id) : minimizeWindow(id);
    return;
  }
  openItem(id, sourceEl);
}

/* ── Hover magnification ──────────────────────────────────────── */
function wireMagnification(dock) {
  const items = () => $$('.dock__item', dock);

  dock.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    for (const node of items()) {
      const r = node.getBoundingClientRect();
      const distance = Math.abs(e.clientX - (r.left + r.width / 2));
      // Gaussian falloff: the icon under the cursor grows most, neighbours less
      const mag = 1 + MAG_AMOUNT * Math.exp(-((distance / MAG_SPREAD) ** 2));
      node.style.setProperty('--mag', mag.toFixed(3));
    }
  });

  dock.addEventListener('pointerleave', () => {
    for (const node of items()) node.style.removeProperty('--mag');
  });
}

/* ── Running indicators ───────────────────────────────────────── */
export function syncRunningDots(extraRunningId = null) {
  const running = new Set(allOpenIds());
  if (extraRunningId) running.add(extraRunningId);
  const current = document.body.dataset.app;
  if (current) running.add(current);

  for (const node of $$('#dock .dock__item')) {
    node.classList.toggle('is-running', running.has(node.dataset.id));
  }
}
