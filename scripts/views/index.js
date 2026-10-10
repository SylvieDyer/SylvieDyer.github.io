/* ── View registry ─────────────────────────────────────────────
   Maps the `view` key on each item in data.js to a factory function.
   A factory returns:
     { title, subtitle?, window?: {width,height}, html, mount?(root, ctx) }
   `mount` runs after the HTML is in the DOM; `ctx` gives views a way to
   ask the shell to do things ({ open(id), close() }).
   ─────────────────────────────────────────────────────────────── */
import about from './about.js';
import experience from './experience.js';
import projects from './projects.js';
import photos from './photos.js';
import resume from './resume.js';
import contact from './contact.js';
import { writing, trash } from './finder.js';
import { browser, music, terminal, settings } from './system.js';

export const VIEWS = {
  about, experience, projects, photos, resume, contact,
  writing, trash,
  browser, music, terminal, settings,
};

/** Build a view by key, or a visible fallback if the key is unknown. */
export function renderView(key) {
  const factory = VIEWS[key];
  if (!factory) {
    return {
      title: 'Not found',
      html: `<div class="page"><div class="empty"><p>No view registered for
             <code>${key}</code>. Add it to <code>scripts/views/index.js</code>.</p></div></div>`,
    };
  }
  return factory();
}
