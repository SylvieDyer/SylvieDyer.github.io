/* ── Mail → Contact (full-screen app) ──────────────────────────── */
import { PROFILE, LINKS } from '../content.js';
import { ph, esc, $, isPlaceholder, announce } from '../util.js';
import { header, section, maybeLink } from './parts.js';

export default function contact() {
  const linkRows = LINKS.map((l) => {
    const dead = isPlaceholder(l.href) || !l.href;
    const inner = `
      <span class="link-list__icon" aria-hidden="true">${esc(l.glyph || '→')}</span>
      <span class="link-list__text">
        <span class="link-list__title">${ph(l.label)}</span>
        <span class="link-list__sub">${ph(l.detail)}</span>
      </span>`;
    return dead
      ? `<span class="link-list__item todo" title="Add a real URL in scripts/content.js">${inner}</span>`
      : `<a class="link-list__item" href="${esc(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>`;
  }).join('');

  return {
    title: 'Mail',
    window: { width: 720, height: 600 },
    html: `
      <div class="page">
        ${header({
          eyebrow: 'Get in touch',
          title: 'Say hello',
          lede: 'Let\'s be friends!',
        })}

        <form class="form" id="contact-form" novalidate>
          <div class="field">
            <label class="field__label" for="cf-name">Your name</label>
            <input class="field__input" id="cf-name" name="name" type="text" required autocomplete="name">
          </div>
          <div class="field">
            <label class="field__label" for="cf-email">Your email</label>
            <input class="field__input" id="cf-email" name="email" type="email" required autocomplete="email">
          </div>
          <div class="field">
            <label class="field__label" for="cf-subject">Subject</label>
            <input class="field__input" id="cf-subject" name="subject" type="text" value="Hello from your site">
          </div>
          <div class="field">
            <label class="field__label" for="cf-body">Message</label>
            <textarea class="field__textarea" id="cf-body" name="body" required></textarea>
          </div>
          <div class="btn-row" style="margin-top:4px">
            <button class="btn btn--primary" type="submit">Open in mail app</button>
            <button class="btn" type="button" data-copy="${esc(PROFILE.email)}">Copy address</button>
          </div>
          <p class="form__note" id="cf-note">
            (Will redirect you to your own mail client with any information stored here, pending integrated mailing system... but who uses email these days anyway xD)
          </p>
        </form>

        ${section('Elsewhere', `<div class="link-list">${linkRows}</div>`)}
      </div>`,

    mount(root) {
      const form = $('#contact-form', root);
      const note = $('#cf-note', root);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;

        const d = new FormData(form);
        const to = isPlaceholder(PROFILE.email) ? '' : PROFILE.email;
        if (!to) {
          note.textContent = 'Set PROFILE.email in scripts/content.js first.';
          note.classList.add('todo');
          return;
        }
        const subject = encodeURIComponent(d.get('subject') || 'Hello');
        const body = encodeURIComponent(
          `${d.get('body')}\n\n— ${d.get('name')} (${d.get('email')})`
        );
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        announce('Opening your mail app');
      });

      form.querySelector('[data-copy]').addEventListener('click', async (e) => {
        const address = e.currentTarget.dataset.copy;
        try {
          await navigator.clipboard.writeText(address);
          e.currentTarget.textContent = 'Copied ✓';
          announce('Email address copied');
          setTimeout(() => { e.currentTarget.textContent = 'Copy address'; }, 1600);
        } catch {
          note.textContent = `Copy failed — the address is ${address}`;
        }
      });
    },
  };
}
