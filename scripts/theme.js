/* ── Appearance: light / dark / auto + wallpaper ───────────────── */
import { $, store } from './util.js';

export const WALLPAPERS = [
  { id: 'default', label: 'Default' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'mint', label: 'Mint' },
  { id: 'mono', label: 'Mono' },
];

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Resolved theme actually applied to the document: 'light' | 'dark'. */
export function getTheme() {
  return document.documentElement.dataset.theme || 'light';
}

/** @param {'light'|'dark'|'auto'} pref */
export function setTheme(pref) {
  const resolved = pref === 'auto' ? (systemDark() ? 'dark' : 'light') : pref;
  document.documentElement.dataset.theme = resolved;
  store.set('theme', pref);
  updateThemeButton(resolved);
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export const getWallpaper = () => document.body.dataset.wallpaper || 'default';

export function setWallpaper(id) {
  document.body.dataset.wallpaper = id;
  store.set('wallpaper', id);
}

export function cycleWallpaper() {
  const at = WALLPAPERS.findIndex((w) => w.id === getWallpaper());
  setWallpaper(WALLPAPERS[(at + 1) % WALLPAPERS.length].id);
}

function updateThemeButton(resolved) {
  const use = $('[data-action="theme"] use');
  if (use) use.setAttribute('href', resolved === 'dark' ? '#i-sun' : '#i-moon');
}

export function initTheme() {
  setTheme(store.get('theme', 'auto'));
  setWallpaper(store.get('wallpaper', 'default'));

  // Follow the OS while the user hasn't picked an explicit preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.get('theme', 'auto') === 'auto') setTheme('auto');
  });

  $('[data-action="theme"]')?.addEventListener('click', toggleTheme);
}
