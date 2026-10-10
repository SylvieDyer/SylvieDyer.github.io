/* ── Browser, Music, Terminal, Settings (full-screen apps) ─────── */
import { LINKS, NOW, PROFILE, PROJECTS } from '../content.js';
import { ph, esc, $, $$, isPlaceholder, store, announce } from '../util.js';
import { header, section, rows } from './parts.js';
import { WALLPAPERS, getTheme, setTheme, getWallpaper, setWallpaper } from '../theme.js';

/* ── Browser: everything of yours that lives elsewhere ── */
export function browser() {
  return {
    title: 'Elsewhere',
    window: { width: 720, height: 540 },
    html: `
      <div class="page">
        ${header({
          eyebrow: 'Off-site',
          title: 'Elsewhere on the web',
          lede: 'Some other places you can find me!',
        })}
        <div class="link-list">
          ${LINKS.map((l) => {
            const dead = isPlaceholder(l.href) || !l.href;
            const inner = `
              <span class="link-list__icon" aria-hidden="true">${esc(l.glyph || '→')}</span>
              <span class="link-list__text">
                <span class="link-list__title">${ph(l.label)}</span>
                <span class="link-list__sub">${ph(l.detail)}</span>
              </span>`;
            return dead
              ? `<span class="link-list__item todo">${inner}</span>`
              : `<a class="link-list__item" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
          }).join('')}
        </div>
      </div>`,
  };
}

/* ── Music → a "Now" page ── */
export function music() {
  return {
    title: 'Now Playing',
    window: { width: 620, height: 520 },
    html: `
      <div class="page">
        ${header({
          eyebrow: `Updated ${esc(NOW.updated).replace(/[\[\]]/g, '') || 'recently'}`,
          title: NOW.heading,
          lede: '[Content loading...]',
        })}
        ${rows(NOW.items)}
        <p class="form__note" style="margin-top:18px">
          Edit <code>NOW</code> in <code>scripts/content.js</code> — a two-minute update every month or two.
        </p>
      </div>`,
  };
}

/* ── Terminal: a small toy shell ── */
export function terminal() {
  const user = isPlaceholder(PROFILE.name) ? 'guest' : PROFILE.name.toLowerCase().replace(/\s+/g, '');
  const prompt = () =>
    `<span class="terminal__prompt">${esc(user)}@portfolio</span>:<span class="terminal__path">~</span>$ `;

  const COMMANDS = {
    help: () => [
      'Available commands:',
      '  whoami      who is behind this site',
      '  ls          list what is on the desktop',
      '  projects    list projects',
      '  contact     how to reach me',
      '  open <app>  launch an app (projects, mail, settings…)',
      '  theme       toggle light/dark',
      '  clear       clear the screen',
      '  exit        back to the desktop',
    ],
    whoami: () => [
      `${PROFILE.name} — ${PROFILE.role}`,
      PROFILE.tagline,
      `${PROFILE.location} · ${PROFILE.status}`,
    ],
    ls: () => ['About Me/    Experience/    Writing/    Photos/    resume.pdf'],
    projects: () => PROJECTS.map((p) => `  ${p.name}  —  ${p.tags?.join(', ') || ''}`),
    contact: () => [`  ${PROFILE.email}`, ...LINKS.map((l) => `  ${l.label}: ${l.detail}`)],
    sudo: () => ['Nice try.'],
    date: () => [new Date().toString()],
  };

  return {
    title: 'Terminal',
    window: { width: 700, height: 460 },
    html: `
      <div class="terminal" id="term" role="log" aria-live="polite" tabindex="0">
        <div id="term-out"></div>
        <div><span id="term-prompt"></span><span id="term-typed"></span><span class="terminal__cursor"></span></div>
      </div>
      <p class="form__note" style="max-width:820px;margin:12px auto 0">
        Type <code>help</code> and press Enter. Click the terminal to focus it.
      </p>`,

    mount(root, ctx) {
      const term = $('#term', root);
      const out = $('#term-out', root);
      const typed = $('#term-typed', root);
      $('#term-prompt', root).innerHTML = prompt();

      let buffer = '';
      const history = [];
      let historyAt = -1;

      const write = (lines, cls = '') =>
        out.insertAdjacentHTML('beforeend',
          [].concat(lines).map((l) => `<div class="${cls}">${esc(l)}</div>`).join(''));

      write([
        `Last login: ${new Date().toLocaleString()}`,
        `Welcome. Type "help" for commands.`,
        '',
      ], 'terminal__dim');

      function run(raw) {
        const line = raw.trim();
        out.insertAdjacentHTML('beforeend', `<div>${prompt()}${esc(line)}</div>`);
        if (!line) return;
        history.push(line);
        historyAt = history.length;

        const [cmd, ...args] = line.split(/\s+/);
        if (cmd === 'clear') { out.innerHTML = ''; return; }
        if (cmd === 'exit')  { ctx?.close?.(); return; }
        if (cmd === 'theme') {
          setTheme(getTheme() === 'dark' ? 'light' : 'dark');
          write([`Appearance: ${getTheme()}`]);
          return;
        }
        if (cmd === 'open') {
          const ok = ctx?.open?.(args[0]);
          write([ok ? `Opening ${args[0]}…` : `open: no such app: ${args[0] ?? ''}`]);
          return;
        }
        const fn = COMMANDS[cmd];
        write(fn ? fn() : [`zsh: command not found: ${cmd}`]);
        write(['']);
      }

      term.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 'Enter')          { e.preventDefault(); run(buffer); buffer = ''; }
        else if (e.key === 'Backspace') { e.preventDefault(); buffer = buffer.slice(0, -1); }
        else if (e.key === 'ArrowUp')   { e.preventDefault(); if (historyAt > 0) buffer = history[--historyAt]; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); buffer = historyAt < history.length - 1 ? history[++historyAt] : ''; }
        else if (e.key.length === 1)    { e.preventDefault(); buffer += e.key; }
        else return;
        typed.textContent = buffer;
        term.scrollTop = term.scrollHeight;
      });

      term.addEventListener('click', () => term.focus());
      term.focus();
    },
  };
}

/* ── Settings: appearance + housekeeping ── */
export function settings() {
  return {
    title: 'System Settings',
    window: { width: 620, height: 520 },
    html: `
      <div class="page">
        ${header({ eyebrow: 'Preferences', title: 'System Settings' })}

        ${section('Appearance', `
          <div class="chips" id="theme-picker">
            ${['light', 'dark', 'auto'].map((t) => `
              <button class="chip" data-theme-set="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
          </div>`)}

        ${section('Wallpaper', `
          <div class="chips" id="wall-picker">
            ${WALLPAPERS.map((w) => `
              <button class="chip" data-wall-set="${esc(w.id)}">${esc(w.label)}</button>`).join('')}
          </div>`)}

        ${section('Storage', `
          <p class="prose">Window positions, appearance, and wallpaper are remembered in this
             browser's local storage. Nothing is sent anywhere — there is no server and no analytics.</p>
          <div class="btn-row">
            <button class="btn" id="reset-windows">Reset window positions</button>
            <button class="btn" id="reset-all">Clear all saved settings</button>
          </div>`)}

        ${section('About This Site', rows([
          { label: 'Built with', value: 'Hand-written HTML, CSS, and JavaScript — no framework, no build step' },
          { label: 'Owner',      value: PROFILE.name },
          { label: 'Shortcuts',  value: '⌘K search · ⌘W close window · Esc back' },
        ]))}
      </div>`,

    mount(root) {
      const syncTheme = () => $$('[data-theme-set]', root).forEach((b) =>
        b.classList.toggle('chip--accent', b.dataset.themeSet === (store.get('theme') ?? 'auto')));
      const syncWall = () => $$('[data-wall-set]', root).forEach((b) =>
        b.classList.toggle('chip--accent', b.dataset.wallSet === getWallpaper()));

      $$('[data-theme-set]', root).forEach((b) => b.addEventListener('click', () => {
        setTheme(b.dataset.themeSet); syncTheme();
      }));
      $$('[data-wall-set]', root).forEach((b) => b.addEventListener('click', () => {
        setWallpaper(b.dataset.wallSet); syncWall();
      }));

      $('#reset-windows', root).addEventListener('click', (e) => {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('desk:geom:')) localStorage.removeItem(key);
        }
        e.currentTarget.textContent = 'Reset ✓';
        announce('Window positions reset');
      });

      $('#reset-all', root).addEventListener('click', () => {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('desk:')) localStorage.removeItem(key);
        }
        location.reload();
      });

      syncTheme();
      syncWall();
    },
  };
}
