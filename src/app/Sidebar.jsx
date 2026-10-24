import { useState } from 'react';
import { DOER_ROLES } from '../shared/contracts.js';
import { ROLE_META } from '../shared/labels.js';
import { href } from '../shared/router.js';
import { reviewQueue, reviewsAnywhere } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { Icon } from '../shared/ui/Icon.jsx';
import { Logo } from '../shared/ui/Logo.jsx';
import { ResetDemoModal } from './ResetDemoModal.jsx';
import { isMac, useShell } from './shellContext.js';

const NAV = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/missions', label: 'Missions', icon: 'target' },
  { path: '/projects', label: 'Projects', icon: 'folder' },
  { path: '/tasks', label: 'Tasks', icon: 'tasks', activeIcon: 'tasksSolid' },
  { path: '/reviews', label: 'Reviews', icon: 'inbox', reviewersOnly: true },
  { path: '/messages', label: 'Messages', icon: 'mail' },
  { path: '/coach', label: 'Coach', icon: 'sparkles' },
  { path: '/profile', label: 'Profile', icon: 'user' },
];

export function Sidebar({ path, query, open, onClose }) {
  const data = useData();
  const me = useMe();
  const { openSearch } = useShell();
  const [resetOpen, setResetOpen] = useState(false);

  const waiting = reviewQueue(data, me.id).length;
  const canReview = reviewsAnywhere(data, me.id);
  const labels = path === '/tasks' ? (query.get('label')?.split(',') ?? []) : [];
  const isActive = (target) => (target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`));

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Sidebar">
        <div className="sidebar-top">
          <a href="#/" className="brand-link" onClick={onClose} aria-label="sAI Bridge Builder home">
            <Logo />
          </a>
          <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close navigation">
            <Icon name="x" />
          </button>
        </div>

        <button
          type="button"
          className="search-trigger"
          onClick={() => {
            onClose();
            openSearch();
          }}
        >
          <Icon name="search" />
          <span>Search</span>
          <kbd aria-label={isMac ? 'Command K' : 'Control K'}>{isMac ? '⌘ K' : 'Ctrl K'}</kbd>
        </button>

        <nav aria-labelledby="nav-main">
          <p className="nav-section" id="nav-main">
            Main menu
          </p>
          <ul className="nav-list">
            {NAV.filter((item) => !item.reviewersOnly || canReview).map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <a className={`nav-link ${active ? 'is-active' : ''}`} href={`#${item.path}`} aria-current={active ? 'page' : undefined} onClick={onClose}>
                    <Icon name={active && item.activeIcon ? item.activeIcon : item.icon} />
                    <span>{item.label}</span>
                    {item.path === '/reviews' && waiting > 0 && (
                      <span className="nav-badge">
                        {waiting}
                        <span className="visually-hidden"> waiting</span>
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-labelledby="nav-labels">
          <p className="nav-section" id="nav-labels">
            Label
          </p>
          <ul className="nav-list">
            {DOER_ROLES.map((role) => {
              const meta = ROLE_META[role];
              const active = labels.length === 1 && labels[0] === role;
              return (
                <li key={role}>
                  <a
                    className={`nav-link nav-label ${active ? 'is-active' : ''}`}
                    href={active ? '#/tasks' : href('/tasks', { label: role })}
                    aria-current={active ? 'true' : undefined}
                    onClick={onClose}
                  >
                    <span className="label-dot" style={{ background: meta.dot }} aria-hidden="true" />
                    <span>{meta.tag}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="demo-note">
          <p>
            <strong>Demo mode.</strong> All people and projects are sample data
            {store.persistent ? ', saved in this browser.' : '. Changes reset when you reload.'}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResetOpen(true)}>
            <Icon name="refresh" size={16} />
            Reset demo data
          </button>
          <p className="demo-credit">Built by team sAI for HackOHI/O 2026. Not an official Ohio State service.</p>
        </div>
      </aside>
      {resetOpen && <ResetDemoModal onClose={() => setResetOpen(false)} />}
    </>
  );
}
