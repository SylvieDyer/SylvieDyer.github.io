/* ── Photos (full-screen app, launched from the dock) ──────────────
   Same shape as the Projects app — a filtered grid of cards — except a
   card is an album, and opening one swaps the grid for that album's
   contact sheet. Two filter dimensions (location, category) that AND
   together, and a lightbox for a single frame.
   ─────────────────────────────────────────────────────────────── */
import { ALBUMS } from '../content.js';
import { ph, esc, $, $$, trapFocus } from '../util.js';
import { header, empty } from './parts.js';

/** Distinct filter values in the order they first appear. */
const valuesOf = (key) => [...new Set(ALBUMS.map((a) => a[key]).filter(Boolean))];

/** Lower-cased and whitespace-collapsed, so a chip and a card always agree. */
const slug = (s) => String(s ?? '').trim().toLowerCase();

const count = (n) => `${n} photo${n === 1 ? '' : 's'}`;

const filterGroup = (label, key, values) => `
  <div class="filter-group">
    <span class="filter-group__label">${esc(label)}</span>
    <div class="chips" data-filter-group="${esc(key)}">
      <button class="chip chip--accent" data-filter="*" aria-pressed="true">All</button>
      ${values.map((v) => `
        <button class="chip" data-filter="${esc(slug(v))}" aria-pressed="false">${ph(v)}</button>
      `).join('')}
    </div>
  </div>`;

/* The whole card is clickable for convenience, but the accessible control
   is the real button in the footer — a <button> may only contain phrasing
   content, so it can't wrap the heading and blurb. */
const albumCard = (album, i) => `
  <article class="card card--album"
           data-album="${i}"
           data-location="${esc(slug(album.location))}"
           data-category="${esc(slug(album.category))}">
    ${album.cover
      ? `<img class="card__thumb" src="${esc(album.cover)}" alt="" loading="lazy" style="object-fit:cover">`
      : `<div class="card__thumb"><span class="todo">[COVER]</span></div>`}
    <h2 class="card__title">
      ${ph(album.name)}
      <span class="chip">${count((album.photos || []).length)}</span>
    </h2>
    <p class="card__desc">${ph(album.blurb)}</p>
    <div class="chips">
      ${album.location ? `<span class="chip">${ph(album.location)}</span>` : ''}
      ${album.category ? `<span class="chip chip--accent">${ph(album.category)}</span>` : ''}
    </div>
    <footer class="card__footer">
      <span class="row__value" style="font-size:12.5px">${ph(album.when)}</span>
      <button class="card__link" data-album="${i}">Open album →</button>
    </footer>
  </article>`;

/** One tile in an album's contact sheet. */
const tile = (photo, i) => {
  const caption = photo.caption ?? '';
  return photo.src
    ? `<button class="gallery__tile" data-photo="${i}" aria-label="${esc(caption)}">
         <img src="${esc(photo.src)}" alt="${esc(caption)}" loading="lazy">
       </button>`
    : `<button class="gallery__tile" data-photo="${i}">
         <span class="todo">${ph(caption)}</span>
       </button>`;
};

export default function photos() {
  const locations = valuesOf('location');
  const categories = valuesOf('category');

  return {
    title: 'Photos',
    subtitle: `${ALBUMS.length} album${ALBUMS.length === 1 ? '' : 's'}`,
    window: { width: 900, height: 620 },
    html: `
      <div class="page page--wide" id="photos-app">

        <!-- Album index -->
        <div data-pane="albums">
          ${header({
            eyebrow: 'Photographs',
            title: 'Photos',
            lede: '[Content loading...]',
          })}

          ${ALBUMS.length ? `
            <div class="filter-bar">
              ${filterGroup('Location', 'location', locations)}
              ${filterGroup('Category', 'category', categories)}
            </div>

            <div class="card-grid" id="album-grid">
              ${ALBUMS.map(albumCard).join('')}
            </div>
            <p class="empty" id="album-none" hidden>No albums match those filters.</p>
          ` : empty('i-photos', 'No albums yet.')}

          <p class="form__note" style="margin-top:28px">
            Add or remove albums in <code>scripts/content.js</code> → <code>ALBUMS</code>.
          </p>
        </div>

        <!-- Single album: filled in on open -->
        <div data-pane="album" hidden>
          <button class="app-layer__back album__back" data-back>← All albums</button>
          <div id="album-detail"></div>
        </div>
      </div>`,

    mount(root) {
      const panes = {
        albums: $('[data-pane="albums"]', root),
        album: $('[data-pane="album"]', root),
      };
      const detail = $('#album-detail', root);
      const cards = $$('#album-grid .card--album', root);
      const noMatches = $('#album-none', root);

      /* ── Filtering: one active value per dimension, ANDed ── */
      const active = { location: '*', category: '*' };

      function applyFilters() {
        let shown = 0;
        for (const card of cards) {
          const match = (active.location === '*' || card.dataset.location === active.location)
                     && (active.category === '*' || card.dataset.category === active.category);
          card.hidden = !match;
          if (match) shown++;
        }
        if (noMatches) noMatches.hidden = shown > 0;
      }

      for (const group of $$('[data-filter-group]', root)) {
        const key = group.dataset.filterGroup;
        group.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-filter]');
          if (!btn) return;
          active[key] = btn.dataset.filter;
          for (const b of $$('[data-filter]', group)) {
            const on = b === btn;
            b.setAttribute('aria-pressed', String(on));
            b.classList.toggle('chip--accent', on);
          }
          applyFilters();
        });
      }

      /* ── Album index ⇄ single album ── */
      function showAlbum(index) {
        const album = ALBUMS[index];
        if (!album) return;
        const list = album.photos || [];

        detail.innerHTML = `
          <div class="album__head">
            <div>
              <p class="page__eyebrow">${ph(album.category)}</p>
              <h1 class="page__title">${ph(album.name)}</h1>
              <p class="page__lede">${ph(album.blurb)}</p>
            </div>
          </div>
          <div class="chips" style="margin-bottom:22px">
            ${album.location ? `<span class="chip">${ph(album.location)}</span>` : ''}
            ${album.when ? `<span class="chip">${ph(album.when)}</span>` : ''}
            <span class="chip">${count(list.length)}</span>
          </div>
          ${list.length
            ? `<div class="gallery">${list.map(tile).join('')}</div>`
            : empty('i-photos', 'This album is empty.')}`;

        panes.albums.hidden = true;
        panes.album.hidden = false;
        shots = list;                 // what the lightbox now pages through
        root.scrollTop = 0;           // root is the scroller in both containers
        $('[data-back]', root)?.focus();
      }

      function showIndex() {
        closeLightbox();
        panes.album.hidden = true;
        panes.albums.hidden = false;
        detail.innerHTML = '';
      }

      root.addEventListener('click', (e) => {
        const card = e.target.closest('[data-album]');
        if (card) { showAlbum(Number(card.dataset.album)); return; }
        if (e.target.closest('[data-back]')) showIndex();
      });

      /* ── Lightbox ─────────────────────────────────────────────
         One frame at a time: ← → to move, Escape or a backdrop
         click to leave. Built on demand and torn down on close, so
         nothing is left listening once the view is gone. ── */
      let box = null;
      let releaseFocus = null;
      let at = 0;
      let shots = [];

      function openLightbox(index) {
        at = index;
        if (!box) {
          box = document.createElement('div');
          box.className = 'lightbox';
          box.setAttribute('role', 'dialog');
          box.setAttribute('aria-modal', 'true');
          box.setAttribute('aria-label', 'Photo');
          box.innerHTML = `
            <button class="lightbox__close" data-lb="close" aria-label="Close">✕</button>
            <button class="lightbox__nav lightbox__nav--prev" data-lb="prev" aria-label="Previous photo">‹</button>
            <figure class="lightbox__frame">
              <div class="lightbox__media"></div>
              <figcaption class="lightbox__caption"></figcaption>
            </figure>
            <button class="lightbox__nav lightbox__nav--next" data-lb="next" aria-label="Next photo">›</button>`;

          box.addEventListener('click', (e) => {
            const action = e.target.closest('[data-lb]')?.dataset.lb;
            if (action === 'close' || e.target === box) closeLightbox();
            if (action === 'prev') step(-1);
            if (action === 'next') step(1);
          });
          document.body.append(box);
          // Capture phase, so Escape closes the lightbox instead of falling
          // through to main.js's unwind chain and exiting the whole app.
          document.addEventListener('keydown', onKey, { capture: true });
          releaseFocus = trapFocus(box);
        }
        paint();
        // Next frame, so the browser has an opacity:0 starting style to
        // transition from rather than snapping straight to opaque
        requestAnimationFrame(() => box?.classList.add('is-open'));
        $('.lightbox__close', box).focus();
      }

      function paint() {
        const photo = shots[at];
        if (!photo || !box) return;
        const caption = photo.caption ?? '';
        $('.lightbox__media', box).innerHTML = photo.src
          ? `<img src="${esc(photo.src)}" alt="${esc(caption)}">`
          : `<div class="lightbox__placeholder"><span class="todo">${ph(caption)}</span></div>`;
        $('.lightbox__caption', box).innerHTML =
          `${ph(caption)} <span class="lightbox__count">${at + 1} / ${shots.length}</span>`;
        // Single-photo albums have nowhere to page to
        for (const nav of $$('.lightbox__nav', box)) nav.hidden = shots.length < 2;
      }

      const step = (delta) => {
        if (!shots.length) return;
        at = (at + delta + shots.length) % shots.length;
        paint();
      };

      function onKey(e) {
        if (!box) return;
        if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.stopPropagation();
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      }

      function closeLightbox() {
        if (!box) return;
        document.removeEventListener('keydown', onKey, { capture: true });
        releaseFocus?.();
        releaseFocus = null;
        box.remove();
        box = null;
      }

      root.addEventListener('click', (e) => {
        const tileEl = e.target.closest('[data-photo]');
        if (tileEl) openLightbox(Number(tileEl.dataset.photo));
      });

      /* The lightbox has to live on <body>, because .window's
         backdrop-filter would otherwise make position:fixed resolve
         against the window instead of the viewport. That means it can
         outlive its view — so watch for the view going away and take the
         lightbox with it. Both teardown paths (a window removed from the
         layer, the app layer's body being emptied) mutate one of these. */
      const app = $('#photos-app', root);
      const watched = root.closest('.window')?.parentNode ?? root;
      const teardown = new MutationObserver(() => {
        if (app.isConnected) return;
        closeLightbox();
        teardown.disconnect();
      });
      teardown.observe(watched, { childList: true });
    },
  };
}
