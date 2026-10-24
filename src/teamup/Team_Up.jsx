import { useState } from 'react';
import { Page } from '../app/Page.jsx';
import { useData, useMe } from '../shared/store.js';
import { Modal } from '../shared/ui/Dialog.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { TeamUpButtons } from './TeamUpButtons.jsx';
import { DemoProgress } from './DemoProgress.jsx';
import { ConnectionInbox } from './ConnectionInbox.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useAccountDirectory } from '../auth/AccountDirectoryProvider.jsx';
import { isSamplePerson, peopleForDiscovery } from '../shared/accountPeople.js';
import { href } from '../shared/router.js';

// MOCK: Fictional cumulative history for design previews. Replace with database data later.
const SAMPLE_POINTS = [
  { date: '2026-10-01', total: 0 },
  { date: '2026-10-04', total: 1 },
  { date: '2026-10-08', total: 3 },
  { date: '2026-10-12', total: 3 },
  { date: '2026-10-16', total: 5 },
  { date: '2026-10-20', total: 6 },
  { date: '2026-10-24', total: 8 },
];

export function Team_Up() {
  const data = useData();
  const me = useMe();
  const { profile } = useAuth();
  const directory = useAccountDirectory();
  const [panel, setPanel] = useState(null);
  const [search, setSearch] = useState('');
  const people = peopleForDiscovery(data.users, profile.id);
  const results = people.filter((person) => person.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Page title="Team Up">
      <div className="teamup-layout">
        <div className="teamup-main">
          <section className="teamup-search-card" aria-labelledby="teamup-search-title">
            <div>
              <p className="teamup-eyebrow">LESS GUESSING. MORE BUILDING.</p>
              <h2 id="teamup-search-title">Meet your next teammate.</h2>
              <p>Try a 30-minute challenge together. Decide where it goes.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setPanel('search')}><Icon name="search" size={18} /> Find a demo partner</button>
          </section>
          {directory.error && <p role="alert">{directory.error} <button type="button" className="btn btn-ghost btn-sm" onClick={directory.reload}>Retry accounts</button></p>}
          <DemoProgress points={SAMPLE_POINTS} sample />
          <div className="teamup-practice-heading"><h2>A little practice, a little confidence.</h2><span>GO AT YOUR PACE</span></div>
          <TeamUpButtons onPractice={() => setPanel('practice')} onCategories={() => setPanel('categories')} />
          <a className="teamup-muted" href="#/team-up/supabase">Developer: check Supabase connection</a>
        </div>
        <ConnectionInbox key={me.id} people={people.filter(isSamplePerson).slice(0, 3)} />
      </div>
      {panel && (
        <Modal title={panel === 'search' ? 'Find a demo partner' : panel === 'categories' ? 'Choose a practice category' : 'Volunteer scheduling challenge'} description={panel === 'search' ? 'Registered accounts and clearly labeled fictional students. This list does not indicate who is online.' : 'Design preview · no invitations are sent or progress recorded.'} onClose={() => setPanel(null)}>
          {panel === 'search' ? (
            <div className="teamup-search-preview">
              <label htmlFor="teamup-partner-search">Search people</label>
              <input id="teamup-partner-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name…" />
              <div className="teamup-search-results">
                {results.map((person) => <div key={person.id}><Avatar user={person} size={36} /><a href={href(`/people/${person.id}`)}>{person.name}</a><span>{isSamplePerson(person) ? 'Sample student' : 'Registered account'}</span><a className="btn btn-outline btn-sm" href={href('/messages', { person: person.id })}>Chat</a></div>)}
                {!results.length && <p role="status">No people match that name.</p>}
                <button className="btn btn-ghost btn-sm" type="button" disabled={directory.status === 'loading'} onClick={directory.reload}>{directory.status === 'loading' ? 'Loading accounts…' : 'Refresh registered accounts'}</button>
              </div>
            </div>
          ) : panel === 'categories' ? (
            <div className="teamup-category-options">{['Coding', 'Testing', 'Design', 'Research', 'Communication'].map((category) => <button key={category} type="button" className="btn btn-outline" onClick={() => setPanel(category)}>{category}</button>)}</div>
          ) : (
            <div className="teamup-practice-prompt">
              <span className="teamup-session-tag">{panel === 'practice' ? 'Mixed disciplines' : panel} · 30 minutes · Sample problem</span>
              <h3>Help a fictional nonprofit cover every shift.</h3>
              <p>Three volunteers are available for two overlapping shifts. Each shift needs two people, and nobody can cover both. Identify the conflict, propose a workable alternative, and explain what you would ask the coordinator.</p>
              <p>Try a sketch, a test case, a short algorithm, or a clear requirements note. This preview does not save work.</p>
            </div>
          )}
        </Modal>
      )}
    </Page>
  );
}
