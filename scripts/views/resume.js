/* ── resume.pdf (opens as a Preview-style window) ──────────────── */
import { RESUME, PROFILE, EXPERIENCE, EDUCATION } from '../content.js';
import { ph, esc, isPlaceholder } from '../util.js';
import { section, timeline, rows } from './parts.js';

export default function resume() {
  const file = RESUME.file;
  const hasFile = !isPlaceholder(file) && file;

  return {
    title: 'resume.pdf',
    subtitle: '1 page',
    window: { width: 780, height: 640 },
    html: `
      <div class="page">
        <div class="hero" style="gap:18px;margin-bottom:20px">
          <div>
            <h1 class="hero__name" style="font-size:23px">${ph(PROFILE.name)} — Résumé</h1>
            <p class="hero__role">${ph(PROFILE.role)} · ${ph(PROFILE.location)}</p>
          </div>
        </div>

        <p class="prose" style="margin-bottom:4px">${ph(RESUME.summary)}</p>

        <div class="btn-row">
          ${hasFile
            ? `<a class="btn btn--primary" href="${esc(file)}" download>Download PDF</a>
               <a class="btn" href="${esc(file)}" target="_blank" rel="noopener">Open in new tab</a>`
            : `<span class="btn todo" title="Put your PDF at assets/resume.pdf and update RESUME.file">Download PDF — ${ph(file)}</span>`}
          <a class="btn" href="mailto:${esc(PROFILE.email)}">Email me</a>
        </div>

        ${section('Highlights', `<ul class="prose">${RESUME.highlights.map((h) => `<li>${ph(h)}</li>`).join('')}</ul>`)}
        ${section('Experience', timeline(EXPERIENCE))}
        ${section('Education', timeline(EDUCATION))}
        ${section('Contact', rows([
          { label: 'Email',    value: PROFILE.email },
          { label: 'Location', value: PROFILE.location },
          { label: 'Status',   value: PROFILE.status },
        ]))}
      </div>`,
  };
}
