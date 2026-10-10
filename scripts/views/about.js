/* ── About Me (opens as a Finder-style window) ─────────────────── */
import { PROFILE } from '../content.js';
import { ph, esc } from '../util.js';
import { section, chips, rows } from './parts.js';

export default function about() {
  const avatar = PROFILE.avatar
    ? `<img class="hero__avatar" src="${esc(PROFILE.avatar)}" alt="">`
    : `<div class="hero__avatar" aria-hidden="true">${ph(PROFILE.initials)}</div>`;

  const skills = Object.entries(PROFILE.skills)
    .map(([group, list]) => `
      <div style="margin-bottom:16px">
        <h3 style="font-size:13px;font-weight:650;margin-bottom:7px">${esc(group)}</h3>
        ${chips(list)}
      </div>`)
    .join('');

  return {
    title: 'About Me',
    subtitle: `${Object.values(PROFILE.skills).flat().length} items`,
    window: { width: 760, height: 560 },
    html: `
      <div class="page">
        <div class="hero">
          ${avatar}
          <div>
            <h1 class="hero__name">${ph(PROFILE.name)}</h1>
            <p class="hero__role">${ph(PROFILE.role)}</p>
            <div class="hero__meta">
              <span>${ph(PROFILE.location)}</span>
              <span>${ph(PROFILE.timezone)}</span>
              <span>${ph(PROFILE.status)}</span>
            </div>
          </div>
        </div>

        <div class="prose">
          ${PROFILE.bio.map((p) => `<p>${ph(p)}</p>`).join('')}
        </div>

        ${section('Skills', skills)}
        ${section('At a glance', rows(PROFILE.facts))}
      </div>`,
  };
}
