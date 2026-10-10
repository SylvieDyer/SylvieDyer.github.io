/* ── Experience folder: work history + education ───────────────── */
import { EXPERIENCE, EDUCATION } from '../content.js';
import { section, timeline } from './parts.js';

export default function experience() {
  return {
    title: 'Experience',
    subtitle: `${EXPERIENCE.length + EDUCATION.length} items`,
    window: { width: 720, height: 580 },
    html: `
      <div class="page">
        ${section('Work', timeline(EXPERIENCE))}
        ${section('Education', timeline(EDUCATION))}
      </div>`,
  };
}
