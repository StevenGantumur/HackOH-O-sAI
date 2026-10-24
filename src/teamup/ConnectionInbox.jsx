import { useState } from 'react';
import { href } from '../shared/router.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { Icon } from '../shared/ui/Icon.jsx';

// MOCK: Incoming requests use shared fictional users; all actions stay in this preview.
export function ConnectionInbox({ people }) {
  const [activeId, setActiveId] = useState(null);
  const [dismissed, setDismissed] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const requests = people.filter((person) => !dismissed.includes(person.id));

  return (
    <aside className="teamup-inbox" aria-labelledby="teamup-inbox-title">
      <header className="teamup-inbox-header">
        <span className="teamup-action-icon"><Icon name="mail" /></span>
        <div><h2 id="teamup-inbox-title">Connections</h2><p>Your next collaboration starts here.</p></div>
        <span className="teamup-request-count" aria-label={`${requests.length} sample requests`}>{requests.length}</span>
      </header>
      <div className="teamup-inbox-label">DEMO REQUESTS <span>Sample</span></div>
      <div className="teamup-requests">
        {requests.map((person, index) => (
          <article className={`teamup-request ${activeId === person.id ? 'is-selected' : ''}`} key={person.id}>
            <button type="button" className="teamup-request-person" onClick={() => setActiveId(activeId === person.id ? null : person.id)} aria-expanded={activeId === person.id} aria-controls={`request-${person.id}`}>
              <Avatar user={person} size={42} />
              <span><strong>{person.name}</strong><span>{accepted.includes(person.id) ? 'Accepted in preview' : 'Wants to try a demo with you'}</span></span>
              <span className="teamup-unread-dot" aria-label="Sample request" />
            </button>
            <p className="teamup-request-excerpt">{index % 2 === 0 ? '“Want to work through a scheduling challenge together?”' : '“I’d love to test ideas and tackle some edge cases.”'}</p>
            <span className="teamup-session-tag"><Icon name="users" size={14} /> 30-minute collaboration</span>
            <div className="teamup-request-actions">
              <a className="btn btn-outline btn-sm" href={href('/messages', { person: person.id })}>
                <Icon name="mail" size={14} /> Chat with {person.name.split(' ')[0]}
              </a>
            </div>
            {activeId === person.id && (
              <div id={`request-${person.id}`} className="teamup-request-detail">
                <p>Sample invitation · Volunteer scheduling challenge</p>
                {accepted.includes(person.id) ? <p role="status">Accepted in this preview. No message was sent or session scheduled.</p> : (
                  <div className="teamup-request-actions">
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => setAccepted([...accepted, person.id])}>Accept preview</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDismissed([...dismissed, person.id])}>Dismiss</button>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
        {!requests.length && <p className="teamup-inbox-empty" role="status">You're all caught up. New demo requests will appear here.</p>}
      </div>
      <footer className="teamup-inbox-footer"><Icon name="users" size={18} /><p>A little teamwork goes a long way.<br />One challenge. Thirty minutes. See how you click.</p></footer>
      <p className="teamup-preview-note">Design preview · fictional requests and messages. Changes reset when you leave this page.</p>
    </aside>
  );
}
