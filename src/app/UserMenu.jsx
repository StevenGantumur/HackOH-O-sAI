import { useState } from 'react';
import { USER_TYPE_META } from '../shared/labels.js';
import { personaLine } from '../shared/people.js';
import { getUser } from '../shared/selectors.js';
import { switchDemoUser } from '../shared/session.js';
import { useData, useMe } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { Popover } from '../shared/ui/Popover.jsx';
import { useToast } from '../shared/ui/Toast.jsx';
import { ResetDemoModal } from './ResetDemoModal.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

// The people a demo usually needs, listed first: student, industry lead, faculty mentor, student leader.
const CAST = ['u-riley', 'u-grace', 'u-elena', 'u-leila'];

export function UserMenu() {
  const data = useData();
  const me = useMe();
  const toast = useToast();
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const people = [...CAST.map((id) => getUser(data, id)).filter(Boolean), ...data.users.filter((u) => !CAST.includes(u.id))];

  return (
    <>
      <Popover
        align="end"
        label="Account and demo users"
        panelClassName="user-panel"
        trigger={(props) => (
          <button {...props} className="user-trigger" aria-label={`Account ${profile.username}. Sample persona ${me.name}`}>
            <Avatar user={me} size={46} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="user-head">
              <Avatar user={me} size={40} />
              <div>
                <p className="user-name">{profile.username}</p>
                <p className="user-meta">{USER_TYPE_META[me.type].label} sample persona: {me.name}</p>
              </div>
            </div>
            <a className="menu-item" href="#/profile" onClick={close}>
              <Icon name="user" size={18} />
              Your profile
            </a>
            <div className="menu-sep" />
            <p className="menu-label">Switch sample persona</p>
            <p className="menu-note">Sample project data only. This does not change your authenticated account or message access.</p>
            <div className="user-list" role="group" aria-label="Demo users">
              {people.map((person) => {
                const current = person.id === me.id;
                return (
                  <button
                    key={person.id}
                    type="button"
                    className={`menu-item user-option ${current ? 'is-current' : ''}`}
                    aria-pressed={current}
                    onClick={() => {
                      close();
                      if (current) return;
                      switchDemoUser(person.id);
                      toast({ tone: 'info', title: `Now viewing as ${person.name}` });
                    }}
                  >
                    <Avatar user={person} size={28} />
                    <span className="user-option-text">
                      <span className="user-option-name">{person.name}</span>
                      <span className="user-option-meta">{personaLine(data, person)}</span>
                    </span>
                    {current && <Icon name="check" size={16} />}
                  </button>
                );
              })}
            </div>
            <div className="menu-sep" />
            <button
              type="button" className="menu-item" disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try { await signOut(); }
                catch (error) { toast({ tone: 'error', title: error.message }); setSigningOut(false); }
              }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                close();
                setResetOpen(true);
              }}
            >
              <Icon name="refresh" size={18} />
              Reset demo data…
            </button>
          </>
        )}
      </Popover>
      {resetOpen && <ResetDemoModal onClose={() => setResetOpen(false)} />}
    </>
  );
}
