/* ── Entry point ───────────────────────────────────────────────
   Boots every subsystem in dependency order and owns the global
   keyboard shortcuts. Nothing else registers document-level keys, so
   there's one place to look when a shortcut misbehaves.
   ─────────────────────────────────────────────────────────────── */
import { $, isMobile } from './util.js';
import { initTheme } from './theme.js';
import { initClock } from './clock.js';
import { initBoot, setStageListener, isLocked, lockScreen } from './boot.js';
import { initDesktop, setOpeners, clearSelection } from './desktop.js';
import { initDock } from './dock.js';
import { initRouter, initAppLayerChrome, openApp, openAsPage, exitApp, activeApp } from './router.js';
import { initSpotlight, toggleSpotlight, closeSpotlight, spotlightIsOpen } from './spotlight.js';
import { initMenubar, initContextMenu, initMenuDismissal, runAction } from './menus.js';
import { initMobile, syncAriaHidden } from './mobile.js';
import { reflowWindows, closeFocusedWindow, focusedWindowId, minimizeWindow } from './windows.js';

/* Break the desktop ⇄ router import cycle by injecting the openers. */
setOpeners({ app: openApp, page: openAsPage });

function boot() {
  initTheme();
  initClock();

  initDesktop();
  initDock();
  initMobile();

  initAppLayerChrome();
  initRouter();

  initSpotlight();
  initMenubar();
  initContextMenu();
  initMenuDismissal();

  setStageListener(syncAriaHidden);
  initBoot();
  syncAriaHidden();

  initShortcuts();
  initViewportHandling();
}

/* ── Global keyboard shortcuts ────────────────────────────────── */
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (isLocked()) return;

    const mod = e.metaKey || e.ctrlKey;
    const typing = e.target.matches('input, textarea, [contenteditable="true"], #term');

    // ⌘K or ⌘-Space → Spotlight
    if (mod && (e.key.toLowerCase() === 'k' || e.code === 'Space')) {
      e.preventDefault();
      toggleSpotlight();
      return;
    }

    // "/" opens search too, as long as you're not typing into something
    if (e.key === '/' && !mod && !typing && !spotlightIsOpen()) {
      e.preventDefault();
      toggleSpotlight();
      return;
    }

    if (mod && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      if (!closeFocusedWindow()) exitApp();
      return;
    }

    if (mod && e.key.toLowerCase() === 'm') {
      const id = focusedWindowId();
      if (id) { e.preventDefault(); minimizeWindow(id); }
      return;
    }

    if (mod && e.key === ',') { e.preventDefault(); runAction('open:settings'); return; }

    if (mod && e.ctrlKey && e.key.toLowerCase() === 'q') { e.preventDefault(); lockScreen(); return; }

    // Escape unwinds one layer at a time: search → app → window → selection
    if (e.key === 'Escape') {
      if (spotlightIsOpen()) { closeSpotlight(); return; }
      if (activeApp()) { exitApp(); return; }
      if (closeFocusedWindow()) return;
      clearSelection();
    }
  });
}

/* ── Viewport changes ─────────────────────────────────────────── */
function initViewportHandling() {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile()) reflowWindows();
      syncAriaHidden();
    }, 120);
  });

  // A tap on the mobile status bar scrolls the open page back to the top
  $('.mobile-home__statusbar')?.addEventListener('click', () => {
    $('#app-layer-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();
