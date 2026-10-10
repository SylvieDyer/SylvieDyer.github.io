/* ── Live clock ────────────────────────────────────────────────
   Every element with [data-clock] gets updated on a shared tick, so
   the lock screen, menu bar, and mobile status bar never drift apart.
   ─────────────────────────────────────────────────────────────── */
import { $$ } from './util.js';

const FORMATS = {
  'time-short':   { hour: 'numeric', minute: '2-digit' },
  'weekday-date': { weekday: 'long', month: 'long', day: 'numeric' },
  'menubar':      { weekday: 'short', hour: 'numeric', minute: '2-digit' },
};

function tick() {
  const now = new Date();
  for (const node of $$('[data-clock]')) {
    const opts = FORMATS[node.dataset.clock];
    if (!opts) continue;
    node.textContent = now.toLocaleString(undefined, opts);
    node.dateTime = now.toISOString();
  }
}

export function initClock() {
  tick();
  // Align the first tick to the next minute boundary, then tick each minute.
  const msToNextMinute = 60_000 - (Date.now() % 60_000);
  setTimeout(() => { tick(); setInterval(tick, 60_000); }, msToNextMinute);

  // Coming back from a background tab should not show a stale time.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
