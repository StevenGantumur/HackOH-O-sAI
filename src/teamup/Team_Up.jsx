import { useState } from 'react';
import { Page } from '../app/Page.jsx';
import { useData, useMe } from '../shared/store.js';
import { Modal } from '../shared/ui/Dialog.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { TeamUpButtons } from './TeamUpButtons.jsx';
import { DemoProgress } from './DemoProgress.jsx';
import { ConnectionInbox } from './ConnectionInbox.jsx';

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
  const [panel, setPanel] = useState(null);
  const [search, setSearch] = useState('');
  // MOCK: Reuse the shared sample cast; this is not a live availability or matching query.
  const people = data.users.filter((user) => user.type === 'student' && user.id !== me.id);
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
          <DemoProgress points={SAMPLE_POINTS} sample />
          <div className="teamup-practice-heading"><h2>A little practice, a little confidence.</h2><span>GO AT YOUR PACE</span></div>
          <TeamUpButtons onPractice={() => setPanel('practice')} onCategories={() => setPanel('categories')} />
        </div>
        <ConnectionInbox key={me.id} people={people.slice(0, 3)} />
      </div>
      {panel && (
        <Modal title={panel === 'search' ? 'Find a demo partner' : panel === 'categories' ? 'Choose a practice category' : 'Volunteer scheduling challenge'} description="Design preview · sample content only. No invitations are sent or progress recorded." onClose={() => setPanel(null)}>
          {panel === 'search' ? (
            <div className="teamup-search-preview">
              <label htmlFor="teamup-partner-search">Search sample students</label>
              <input id="teamup-partner-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name…" />
              <div className="teamup-search-results">
                {results.map((person) => <div key={person.id}><Avatar user={person} size={36} /><strong>{person.name}</strong><span>Sample student</span></div>)}
                {!results.length && <p role="status">No sample students match that name.</p>}
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
