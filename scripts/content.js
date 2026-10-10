/* ═══════════════════════════════════════════════════════════════
    Home to content! 
   ═══════════════════════════════════════════════════════════════ */

  export const PROFILE = {
  name:      'Sylvie Dyer',
  initials:  'SD',                       
  role:      'Software Engineer',
  tagline:   'Hardworking techie who loves scalable infrastructure and loves her hobbies more :)',
  location:  'Seattle, USA',
  timezone:  'UTC-7',
  email:     'sylvierdyer@gmail.com',
  status:    'Figuring it out',
  avatar:    null,                         // e.g. 'assets/avatar.jpg' → replaces initials

  // Bio
  bio: [
    'loading...'
  ],

  // Grouped skills by sections
  skills: {
    'Languages':  ['Java', 'TypeScript', 'Ruby', 'Python', 'HTML'],
    'Frameworks': ['Coral', 'React', 'Django'],
    'Infra':      ['AWS'],
    'Practices':  ['DevOps', 'CI/CD', 'Design systems', 'Accessibility'],
  },
  

  // About Me fun facts
  facts: [
    { label: 'Currently',   value: 'Button clicking away in Seattle!' },
    { label: 'Off the clock', value: 'You can find me playing music, hiking, or taking photos!' },
    { label: 'Learning',    value: 'How to be a better human..' },
  ],
};

/* ── Projects (Projects app, full screen) ────────────────────── */
export const PROJECTS = [
  {
    name: '[Project]',
    blurb: '[Loading...]',
    tags: ['[TypeScript]', '[React]', '[AWS]'],
    year: '[10 AD]',
    role: '[Role]',
    links: [
      { label: 'Live site', href: '[https://example.com]' },
      { label: 'Source',    href: '[https://github.com/you/repo]' },
    ],
    thumb: null,   // e.g. 'assets/projects/one.png'
    featured: true,
  },
];

/* ── Experience & education (Experience folder) ──────────────── */
export const EXPERIENCE = [
  {
    when: 'Apr 2024 — Present',
    what: 'Software Development Engineer',
    where: 'AWS · Seattle, WA',
    bullets: [
      '[Content loading...]',
    ],
  },
];

export const EDUCATION = [
  {
    when: 'Aug 2020 — Dec 2023',
    what: 'Bachelors of Science, Computer Science',
    where: 'Case Western Reserve University',
    bullets: ['[Content loading...]'],
  },
];

/* ── Writing  ────────────────────────────────── */
export const WRITING = [
  { title: '[Content loading...]', date: '[Content loading...]', blurb: '[Content loading...]', href: '[https://example.com/post-1]' },
];

/* ── Photos (Photos app, full screen) ────────────────────────────  */
export const ALBUMS = [
  {
    name: '[Album One]',
    blurb: '[Content loading...]',
    location: '[Content loading...]',   // becomes a Location filter chip
    category: '[Content loading...]',             // becomes a Category filter chip
    when: '[Content loading...]',
    cover: null,                      // e.g. 'assets/photos/lisbon/cover.jpg'
    photos: [
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
    ],
  },
  {
    name: '[Album Two]',
    blurb: '[Content loading...]',
    location: '[Content loading...]',
    category: '[Content loading...]',
    when: '[Content loading...]',
    cover: null,
    photos: [
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
      { caption: '[Content loading...]', src: null },
    ],
  },
];

/* ── Links (Browser app + Contact page) ──────────────────────── */
export const LINKS = [
  { label: 'Email',    detail: 'sylvierdyer@gmail.com',            href: 'mailto:[sylvierdyer@gmail.com]', glyph: '✉' },
  { label: 'GitHub',   detail: 'github.com/SylvieDyer',      href: 'https://github.com/SylvieDyer', glyph: '⌥' },
  { label: 'LinkedIn', detail: 'linkedin.com/in/SylvieDyer', href: 'https://linkedin.com/in/SylvieDyer', glyph: 'in' },
  // TODO: { label: 'Résumé',   detail: '[PDF, 1 page]',                href: '[assets/resume.pdf]', glyph: '↓' },
];

/* ── Now Playing (Music app) — current interests ─────────────── */
export const NOW = {
  heading: 'Now',
  updated: 'October 2026',
  items: [
    { label: 'Reading',   value: 'Before the Coffee Gets Cold — Toshikazu Kawaguchi' },
    { label: 'Listening', value: 'Daughter from Hell - Gracie Abrams' },
    { label: 'Building',  value: '.... this :)' },
    { label: 'Somewhere', value: 'Seattle' },
  ],
};

/* ── Résumé (resume.pdf) ─────────────────────────────────────── */
export const RESUME = {
  file: '[assets/resume.pdf]',          
  summary: '[Content loading...]',
  highlights: [
    '[Content loading...]',
    '[Content loading...]',
    '[Content loading...]',
  ],
};
