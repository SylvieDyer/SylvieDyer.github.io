/* ── Projects (full-screen app, launched from the dock) ────────── */
import { PROJECTS } from '../content.js';
import { ph, esc, $$ } from '../util.js';
import { header, maybeLink } from './parts.js';

const card = (p) => `
  <article class="card" data-tags="${esc((p.tags || []).join('|').toLowerCase())}">
    ${p.thumb
      ? `<img class="card__thumb" src="${esc(p.thumb)}" alt="" style="object-fit:cover">`
      : `<div class="card__thumb"><span class="todo">[SCREENSHOT]</span></div>`}
    <h2 class="card__title">
      ${ph(p.name)}
      ${p.featured ? '<span class="chip chip--accent">Featured</span>' : ''}
    </h2>
    <p class="card__desc">${ph(p.blurb)}</p>
    <div class="chips">${(p.tags || []).map((t) => `<span class="chip">${ph(t)}</span>`).join('')}</div>
    <footer class="card__footer">
      <span class="row__value" style="font-size:12.5px">${ph(p.year)} · ${ph(p.role)}</span>
      <span style="display:flex;gap:12px">
        ${(p.links || []).map((l) => maybeLink(l.label, l.href)).join('')}
      </span>
    </footer>
  </article>`;

export default function projects() {
  const allTags = [...new Set(PROJECTS.flatMap((p) => p.tags || []))];

  return {
    title: 'Projects',
    window: { width: 900, height: 620 },
    html: `
      <div class="page page--wide">
        ${header({
          eyebrow: 'Selected work',
          title: 'Projects',
          lede: '[Content loading...]',
        })}

        <div class="chips" id="project-filters" style="margin-bottom:22px">
          <button class="chip chip--accent" data-filter="*" aria-pressed="true">All</button>
          ${allTags.map((t) => `<button class="chip" data-filter="${esc(t.toLowerCase())}" aria-pressed="false">${ph(t)}</button>`).join('')}
        </div>

        <div class="card-grid" id="project-grid">
          ${PROJECTS.map(card).join('')}
        </div>

        <p class="form__note" style="margin-top:28px">
          Add or remove entries in <code>scripts/content.js</code> → <code>PROJECTS</code>.
        </p>
      </div>`,

    /** Wire up tag filtering once the markup is in the DOM. */
    mount(root) {
      const buttons = $$('#project-filters [data-filter]', root);
      const cards = $$('#project-grid .card', root);

      buttons.forEach((btn) => btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        buttons.forEach((b) => {
          const on = b === btn;
          b.setAttribute('aria-pressed', String(on));
          b.classList.toggle('chip--accent', on);
        });
        cards.forEach((c) => {
          const match = filter === '*' || c.dataset.tags.split('|').includes(filter);
          c.style.display = match ? '' : 'none';
        });
      }));
    },
  };
}
