/* ═══════════════════════════════════════════════════════════════
   THE MANIFEST — one list drives the desktop, the dock, Spotlight,
   the mobile home screen, and the URL router. Add an entry here and
   it appears everywhere it belongs.

   kind:  'folder' | 'file'  → opens in a draggable window
          'app'              → opens as a full-screen page
   where: which surfaces show it
   view:  key in scripts/views/index.js
   ═══════════════════════════════════════════════════════════════ */

export const ITEMS = [
  /* ── Desktop: folders and files → windows ── */
  {
    id: 'about', label: 'About Me', kind: 'folder', icon: 'i-folder', view: 'about',
    where: ['desktop', 'spotlight', 'mobile'],
    keywords: ['bio', 'who', 'me', 'intro', 'skills'],
  },
  {
    id: 'experience', label: 'Experience', kind: 'folder', icon: 'i-folder', view: 'experience',
    where: ['desktop', 'spotlight', 'mobile'],
    keywords: ['work', 'jobs', 'cv', 'history', 'education'],
  },
  {
    id: 'writing', label: 'Writing', kind: 'folder', icon: 'i-notes', view: 'writing',
    where: ['desktop', 'spotlight', 'mobile'],
    keywords: ['blog', 'posts', 'essays', 'notes'],
  },
  {
    id: 'resume', label: 'resume.pdf', kind: 'file', icon: 'i-file', view: 'resume',
    where: ['desktop', 'spotlight', 'mobile'],
    keywords: ['cv', 'download', 'pdf', 'hire'],
  },

  /* ── Dock: apps → full-screen pages ── */
  {
    id: 'projects', label: 'Projects', kind: 'app', icon: 'i-app-window', view: 'projects',
    where: ['dock', 'spotlight', 'mobile-dock'],
    keywords: ['work', 'portfolio', 'builds', 'code'],
  },
  {
    id: 'photos', label: 'Photos', kind: 'app', icon: 'i-photos', view: 'photos',
    where: ['dock', 'desktop', 'spotlight', 'mobile'],
    keywords: ['pictures', 'gallery', 'albums', 'travel', 'camera'],
  },
  {
    id: 'browser', label: 'Elsewhere', kind: 'app', icon: 'i-globe', view: 'browser',
    where: ['dock', 'spotlight', 'mobile'],
    keywords: ['links', 'github', 'linkedin', 'social'],
  },
  {
    id: 'contact', label: 'Mail', kind: 'app', icon: 'i-mail', view: 'contact',
    where: ['dock', 'spotlight', 'mobile-dock'],
    keywords: ['email', 'contact', 'hire', 'hello', 'reach'],
  },
  {
    id: 'music', label: 'Now Playing', kind: 'app', icon: 'i-music', view: 'music',
    where: ['dock', 'spotlight', 'mobile'],
    keywords: ['now', 'reading', 'listening', 'interests'],
  },
  {
    id: 'terminal', label: 'Terminal', kind: 'app', icon: 'i-terminal', view: 'terminal',
    where: ['dock', 'spotlight', 'mobile'],
    keywords: ['shell', 'cli', 'command', 'zsh'],
  },
  { id: 'sep-1', kind: 'separator', where: ['dock'] },
  {
    id: 'settings', label: 'System Settings', kind: 'app', icon: 'i-settings', view: 'settings',
    where: ['dock', 'spotlight', 'mobile-dock'],
    keywords: ['preferences', 'theme', 'dark mode', 'wallpaper', 'appearance'],
  },
  {
    id: 'trash', label: 'Trash', kind: 'folder', icon: 'i-trash', view: 'trash',
    where: ['dock', 'spotlight'],
    keywords: ['bin', 'empty'],
  },
];

/** Fast lookup by id. */
export const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export const on = (surface) => ITEMS.filter((i) => i.where?.includes(surface));

/* ── Menu bar dropdowns ──────────────────────────────────────────
   action: 'open:<id>' | 'route:<hash>' | a named shell command
   ─────────────────────────────────────────────────────────────── */
export const MENUS = {
  /* The monogram menu — site-level, the way a vendor menu is OS-level */
  home: [
    { label: 'About This Site', action: 'open:settings' },
    { label: 'Settings…', action: 'open:settings', key: '⌘,' },
    { sep: true },
    { label: 'Search…', action: 'spotlight', key: '⌘K' },
    { label: 'Open Terminal', action: 'open:terminal' },
    { sep: true },
    { label: 'Close All Windows', action: 'closeAll', key: '⌥⌘W' },
    { label: 'Lock Screen', action: 'lock', key: '⌃⌘Q' },
  ],
  about: [
    { label: 'About Me', action: 'open:about' },
    { label: 'Experience', action: 'open:experience' },
    { label: 'Résumé', action: 'open:resume', key: '⌘O' },
    { sep: true },
    { label: 'Now Playing', action: 'open:music' },
  ],
  work: [
    { label: 'Projects', action: 'open:projects' },
    { label: 'Experience', action: 'open:experience' },
    { sep: true },
    { label: 'Elsewhere on the Web', action: 'open:browser' },
  ],
  writing: [
    { label: 'All Writing', action: 'open:writing' },
    { label: 'Photos', action: 'open:photos' },
  ],
  contact: [
    { label: 'Send a Message', action: 'open:contact' },
    { label: 'Copy Email Address', action: 'copyEmail' },
    { sep: true },
    { label: 'All Links', action: 'open:browser' },
  ],
  display: [
    { label: 'Toggle Appearance', action: 'theme' },
    { label: 'Next Wallpaper', action: 'wallpaper' },
    { sep: true },
    { label: 'Clean Up Desktop', action: 'tidy' },
    { label: 'Close Window', action: 'closeFocused', key: '⌘W' },
    { sep: true },
    { label: 'Reset Everything', action: 'resetAll' },
  ],
};

/* ── Right-click on the desktop ── */
export const DESKTOP_MENU = [
  { label: 'New Folder', disabled: true },
  { label: 'Get Info', action: 'open:about' },
  { sep: true },
  { label: 'Clean Up', action: 'tidy' },
  { label: 'Change Wallpaper', action: 'wallpaper' },
  { label: 'Toggle Appearance', action: 'theme' },
  { sep: true },
  { label: 'Open Terminal Here', action: 'open:terminal' },
  { label: 'Search…', action: 'spotlight', key: '⌘K' },
];

/** Right-click on a desktop icon. `%s` is replaced with the item label. */
export const ITEM_MENU = [
  { label: 'Open', action: 'openSelf' },
  { label: 'Open in Full Screen', action: 'fullscreenSelf' },
  { sep: true },
  { label: 'Get Info', action: 'openSelf' },
  { label: 'Move to Trash', disabled: true },
];
