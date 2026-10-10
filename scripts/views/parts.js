/* ── Reusable markup fragments shared by every view ───────────── */
import { ph, esc, isPlaceholder, art } from '../util.js';

/** A link, or an inert chip when the URL is still a placeholder. */
export function maybeLink(label, href, cls = 'card__link') {
  if (isPlaceholder(href) || !href) {
    return `<span class="${cls} todo" title="Add a real URL in scripts/content.js">${ph(label)} ↗</span>`;
  }
  const external = /^https?:/.test(href);
  return `<a class="${cls}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${ph(label)} ↗</a>`;
}

export const chips = (list = []) =>
  `<div class="chips">${list.map((t) => `<span class="chip">${ph(t)}</span>`).join('')}</div>`;

export const section = (title, body) =>
  `<section class="section"><h2 class="section__title">${esc(title)}</h2>${body}</section>`;

export const rows = (pairs = []) => `
  <div class="rows">
    ${pairs.map(({ label, value }) => `
      <div class="row">
        <span class="row__label">${esc(label)}</span>
        <span class="row__value">${ph(value)}</span>
      </div>`).join('')}
  </div>`;

export const timeline = (entries = []) => `
  <div class="timeline">
    ${entries.map((e) => `
      <article class="timeline__item">
        <p class="timeline__when">${ph(e.when)}</p>
        <h3 class="timeline__what">${ph(e.what)}</h3>
        <p class="timeline__where">${ph(e.where)}</p>
        ${e.bullets?.length ? `<ul class="prose">${e.bullets.map((b) => `<li>${ph(b)}</li>`).join('')}</ul>` : ''}
      </article>`).join('')}
  </div>`;

export const empty = (iconId, message) => `
  <div class="empty">
    ${art(iconId, 'empty__icon')}
    <p>${ph(message)}</p>
  </div>`;

/** Standard page header used by full-screen apps. */
export const header = ({ eyebrow, title, lede }) => `
  ${eyebrow ? `<p class="page__eyebrow">${esc(eyebrow)}</p>` : ''}
  <h1 class="page__title">${ph(title)}</h1>
  ${lede ? `<p class="page__lede">${ph(lede)}</p>` : ''}`;
