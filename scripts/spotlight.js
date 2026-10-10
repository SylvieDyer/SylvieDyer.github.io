/* ── Spotlight ─────────────────────────────────────────────────
   ⌘K (or ⌘/Ctrl+Space) opens a search over everything in the manifest
   plus the deeper content — projects, posts, sections — so a visitor
   can jump straight to a thing by name.
   ─────────────────────────────────────────────────────────────── */
import { $, $$, el, art, esc, trapFocus, announce } from './util.js';
import { on as itemsOn } from './data.js';
import { PROJECTS, WRITING, PROFILE } from './content.js';
import { openItem } from './desktop.js';

let isOpenNow = false;
let selectedAt = 0;
let results = [];
let releaseTrap = null;
let lastFocus = null;

/* ── Index: manifest items + content records ──────────────────── */
function buildIndex() {
  const entries = itemsOn('spotlight').map((item) => ({
    id: item.id,
    title: item.label,
    sub: item.kind === 'app' ? 'Application' : item.kind === 'file' ? 'Document' : 'Folder',
    kind: item.kind === 'app' ? 'App' : 'Finder',
    icon: item.icon,
    terms: [item.label, ...(item.keywords || [])],
    run: () => openItem(item.id),
  }));

  for (const p of PROJECTS) {
    entries.push({
      id: `project:${p.name}`,
      title: p.name,
      sub: `Project · ${(p.tags || []).join(', ')}`,
      kind: 'Project',
      icon: 'i-app-window',
      terms: [p.name, p.blurb, ...(p.tags || [])],
      run: () => openItem('projects'),
    });
  }

  for (const w of WRITING) {
    entries.push({
      id: `writing:${w.title}`,
      title: w.title,
      sub: `Writing · ${w.date}`,
      kind: 'Writing',
      icon: 'i-notes',
      terms: [w.title, w.blurb],
      run: () => openItem('writing'),
    });
  }

  entries.push({
    id: 'action:email',
    title: `Email ${PROFILE.name}`,
    sub: PROFILE.email,
    kind: 'Action',
    icon: 'i-mail',
    terms: ['email', 'contact', 'hire', 'message', PROFILE.email],
    run: () => openItem('contact'),
  });

  return entries;
}

let INDEX = [];

/* ── Scoring: prefix > word start > substring ──────────────────── */
function score(entry, query) {
  const q = query.toLowerCase();
  let best = 0;
  for (const term of entry.terms) {
    const t = String(term ?? '').toLowerCase();
    if (!t) continue;
    if (t.startsWith(q)) best = Math.max(best, 100 - t.length * 0.1);
    else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) best = Math.max(best, 70);
    else if (t.includes(q)) best = Math.max(best, 40);
  }
  return best;
}

function search(query) {
  const q = query.trim();
  if (!q) return INDEX.slice(0, 6);
  return INDEX
    .map((e) => ({ e, s: score(e, q) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 9)
    .map(({ e }) => e);
}

/* ── Rendering ────────────────────────────────────────────────── */
function render(query) {
  results = search(query);
  selectedAt = 0;
  const list = $('#spotlight-results');

  if (!results.length) {
    list.replaceChildren(el('li', { class: 'spotlight__empty', text: `No results for “${query}”` }));
    return;
  }

  list.replaceChildren(...results.map((r, i) => el('li', { role: 'presentation' }, [
    el('button', {
      class: 'spotlight__result',
      role: 'option',
      'aria-selected': i === 0 ? 'true' : 'false',
      dataset: { at: i },
      html: `
        ${art(r.icon, 'spotlight__result-art')}
        <span class="spotlight__result-text">
          <span class="spotlight__result-title">${esc(r.title)}</span>
          <span class="spotlight__result-sub">${esc(r.sub)}</span>
        </span>
        <span class="spotlight__result-kind">${esc(r.kind)}</span>`,
    }),
  ])));
}

function highlight(next) {
  const buttons = $$('#spotlight-results .spotlight__result');
  if (!buttons.length) return;
  selectedAt = (next + buttons.length) % buttons.length;
  buttons.forEach((b, i) => b.setAttribute('aria-selected', String(i === selectedAt)));
  buttons[selectedAt].scrollIntoView({ block: 'nearest' });
}

function run(at = selectedAt) {
  const entry = results[at];
  if (!entry) return;
  closeSpotlight();
  entry.run();
}

/* ── Open / close ─────────────────────────────────────────────── */
export function openSpotlight() {
  if (isOpenNow) return;
  INDEX = buildIndex();
  isOpenNow = true;
  lastFocus = document.activeElement;

  const root = $('#spotlight');
  root.setAttribute('aria-hidden', 'false');
  root.classList.add('is-open');

  const input = $('#spotlight-input');
  input.value = '';
  render('');
  input.focus();
  releaseTrap = trapFocus($('.spotlight__panel'));
  announce('Search opened');
}

export function closeSpotlight() {
  if (!isOpenNow) return;
  isOpenNow = false;
  const root = $('#spotlight');
  root.classList.remove('is-open');
  root.setAttribute('aria-hidden', 'true');
  releaseTrap?.();
  releaseTrap = null;
  lastFocus?.focus?.({ preventScroll: true });
}

export const spotlightIsOpen = () => isOpenNow;
export const toggleSpotlight = () => (isOpenNow ? closeSpotlight() : openSpotlight());

/* ── Wiring ───────────────────────────────────────────────────── */
export function initSpotlight() {
  const root = $('#spotlight');
  const input = $('#spotlight-input');

  input.addEventListener('input', () => render(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(selectedAt + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(selectedAt - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeSpotlight(); }
  });

  root.addEventListener('click', (e) => {
    const button = e.target.closest('[data-at]');
    if (button) { run(Number(button.dataset.at)); return; }
    if (e.target === root) closeSpotlight();     // click the scrim
  });
}
