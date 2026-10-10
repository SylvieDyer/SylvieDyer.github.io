/* ── Lock screen → desktop ─────────────────────────────────────
   Any click, key, tap, or scroll wakes the machine. Every page load
   starts locked — the wake is the front door, so it should be there on
   a refresh too. The one exception is a deep link (#/app/projects),
   where the visitor asked for a specific page and a lock screen would
   just be in the way.
   ─────────────────────────────────────────────────────────────── */
import { $, announce, prefersReducedMotion } from './util.js';

const WAKE_MS = 520;              // matches --t-slow in tokens.css
let stage = 'locked';
let onStageChange = () => {};

export const isLocked = () => stage === 'locked';

/** Let the shell react to lock/unlock (e.g. re-sync aria-hidden). */
export const setStageListener = (fn) => { onStageChange = fn; };

export function wake({ instant = false } = {}) {
  if (stage !== 'locked') return;
  stage = 'waking';
  document.body.dataset.stage = 'waking';

  const finish = () => {
    stage = 'desktop';
    document.body.dataset.stage = 'desktop';
    $('#lock-screen').setAttribute('aria-hidden', 'true');
    onStageChange(stage);
    announce('Desktop ready');
  };

  instant || prefersReducedMotion() ? finish() : setTimeout(finish, WAKE_MS);
}

export function lockScreen() {
  if (stage === 'locked') return;
  stage = 'locked';
  document.body.dataset.stage = 'locked';
  $('#lock-screen').setAttribute('aria-hidden', 'false');
  $('#lock-screen').focus();
  onStageChange(stage);
  announce('Screen locked. Press any key to wake.');
}

export function initBoot() {
  const lock = $('#lock-screen');

  // A shared link points at a specific page — don't make them unlock first
  const deepLink = location.hash && location.hash !== '#/' && location.hash !== '#';
  if (deepLink) {
    wake({ instant: true });
    return;
  }

  const onWake = (e) => {
    // Modifier keys alone shouldn't count as "press any key"
    if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
    wake();
  };

  lock.addEventListener('click', onWake);
  lock.addEventListener('touchstart', onWake, { passive: true });
  window.addEventListener('keydown', onWake, { once: false });
  window.addEventListener('wheel', onWake, { passive: true });

  lock.focus();
}
