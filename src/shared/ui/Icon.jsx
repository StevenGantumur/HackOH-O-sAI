// Line icons on a 24px grid, drawn for this app (no icon dependency, AGENTS.md rule 5).

const dot = (cx) => <circle cx={cx} cy="12" r="1.5" fill="currentColor" stroke="none" />;

const ICONS = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15V15H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  folder: <path d="M3.5 7.5a2 2 0 0 1 2-2h3.7l2 2.2h7.3a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
  tasks: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="3.2" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </>
  ),
  tasksSolid: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="3.2" fill="currentColor" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" stroke="#fff" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13.5 6.2 5.5h11.6l2.7 8V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M3.5 13.5h5l1.6 2.5h3.8l1.6-2.5h5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7.5 8 5.5 8-5.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M10 3.5 11.7 8.3 16.5 10l-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7z" />
      <path d="M18 14.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.2-3.8 4-5.8 7.5-5.8s6.3 2 7.5 5.8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c1-3.6 3.5-5.6 6.5-5.6s5.5 2 6.5 5.6" />
      <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.8 14.6c1.8.8 3 2.6 3.7 5.4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.8a6 6 0 0 1 12 0c0 5.2 2 7.2 2 7.2H4s2-2 2-7.2" />
      <path d="M10 20.3a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  filter: <path d="M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2z" />,
  sort: (
    <>
      <path d="M8 19.5v-15M4.5 8 8 4.5 11.5 8" />
      <path d="M16 4.5v15M12.5 16l3.5 3.5 3.5-3.5" />
    </>
  ),
  board: (
    <>
      <rect x="3.5" y="4.5" width="7" height="15" rx="2" />
      <rect x="13.5" y="4.5" width="7" height="10" rx="2" />
    </>
  ),
  boardSolid: (
    <>
      <rect x="3.5" y="4.5" width="7" height="15" rx="2" fill="currentColor" />
      <rect x="13.5" y="4.5" width="7" height="15" rx="2" fill="currentColor" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M9.5 10v9.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10.5h17" />
    </>
  ),
  dots: (
    <>
      {dot(5.5)}
      {dot(12)}
      {dot(18.5)}
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
    </>
  ),
  comment: (
    <>
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.2A8 8 0 1 1 20 12z" />
      <path d="M8.8 10.5h6.4M8.8 13.6h3.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V10M9.5 3h5M12 3v3.5M18.5 6.5l-1.3 1.3" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 20.5v-16" />
      <path d="M5.5 4.5h11l-2.2 4 2.2 4h-11" />
    </>
  ),
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  upload: (
    <>
      <path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5" />
      <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </>
  ),
  file: (
    <>
      <path d="M13.5 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13.5 3.5V9H19" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m20.5 16-4.5-4.5L6 19.5" />
    </>
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10M19.5 4.5 11 13" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    </>
  ),
  history: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" />
      <path d="M4 4v4.5h4.5" />
      <path d="M12 8v4l2.8 1.8" />
    </>
  ),
  compare: (
    <>
      <path d="M8 4v16M16 4v16" />
      <path d="M4.5 8.5h7M12.5 15.5h7" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 10 14" />
      <path d="m20.5 3.5-6.5 17-4-6.5-6.5-4z" />
    </>
  ),
  hash: <path d="M5 9h14M5 15h14M10.5 4 8.5 20M15.5 4l-2 16" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  swap: (
    <>
      <path d="M16.5 3.5 20 7l-3.5 3.5M4 7h16" />
      <path d="M7.5 13.5 4 17l3.5 3.5M20 17H4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.6 13.5-1.4 7 4.8-2.4 4.8 2.4-1.4-7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 21 19.5H3z" />
      <path d="M12 10v4M12 16.8h.01" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
      <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className, label }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
