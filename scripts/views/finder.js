/* ── Smaller Finder windows: Writing, Trash ────────────────────── */
import { WRITING } from '../content.js';
import { ph } from '../util.js';
import { maybeLink, empty } from './parts.js';

export function writing() {
  return {
    title: 'Writing',
    subtitle: `${WRITING.length} items`,
    window: { width: 660, height: 480 },
    html: `
      <div class="page">
        <div class="card-grid">
          ${WRITING.map((w) => `
            <article class="card">
              <h2 class="card__title">${ph(w.title)}</h2>
              <p class="card__desc">${ph(w.blurb)}</p>
              <footer class="card__footer">
                <span class="row__value" style="font-size:12.5px">${ph(w.date)}</span>
                ${maybeLink('Read', w.href)}
              </footer>
            </article>`).join('')}
        </div>
        ${WRITING.length === 0 ? empty('i-notes', 'Nothing published yet.') : ''}
      </div>`,
  };
}

export function trash() {
  return {
    title: 'Trash',
    subtitle: 'Empty',
    window: { width: 520, height: 340 },
    html: `<div class="page">${empty('i-trash', 'Trash is empty. Nothing to see — which is the point.')}</div>`,
  };
}
