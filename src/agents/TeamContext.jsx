import { useId } from 'react';
import { TASK_STATUSES } from '../shared/contracts.js';
import { firstName, timeAgo } from '../shared/format.js';
import { ROLE_META, STATUS_META } from '../shared/labels.js';
import { channelsInProject, getProject, getUser, isOverdue, membersOf, messagesIn, tasksInProject, teamNoteOf } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { SampleBadge } from '../shared/ui/bits.jsx';
import { coachProfile } from './persona.js';
import './agents.css';

const ROLE_ORDER = { LEADER: 0, MENTOR: 1 };

// One line per person, written by their coach and read by every coach on the project.
export function TeamNotesList({ projectId, allowRemove = true }) {
  const data = useData();
  const me = useMe();
  const project = getProject(data, projectId);
  const remove = useAction(() => store.removeTeamNote({ userId: me.id, projectId }), { success: 'Your team note was removed' });
  const members = membersOf(data, projectId).sort(
    (a, b) => Number(b.user_id === me.id) - Number(a.user_id === me.id) || (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2),
  );

  return (
    <ul className="team-notes">
      {members.map((m) => {
        const person = getUser(data, m.user_id);
        const note = teamNoteOf(data, m.user_id, projectId);
        const isMe = m.user_id === me.id;
        return (
          <li key={m.user_id} className={`team-note ${isMe ? 'is-me' : ''}`}>
            <Avatar user={person} size={30} />
            <div className="team-note-body">
              <p className="team-note-who">
                <strong>{isMe ? 'You' : firstName(person?.name)}</strong>
                <span className="team-note-coach" style={{ color: ROLE_META[m.role].color }}>
                  {coachProfile(m.role, project).title}
                </span>
              </p>
              <p className={`team-note-text ${note ? '' : 'muted'}`}>
                {note ? note.content : isMe ? 'After you talk to your coach, it shares one line about your work here.' : 'Nothing shared yet.'}
              </p>
              {note && (
                <p className="team-note-meta">
                  {timeAgo(note.updated_at)}
                  {store.isSeeded(note.id) && <SampleBadge>Sample</SampleBadge>}
                  {isMe && allowRemove && (
                    <button type="button" className="text-link" onClick={remove.run} disabled={remove.pending}>
                      {remove.pending ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// The context every coach on a project shares: the notes, the board and the latest messages.
export function TeamContext({ projectId }) {
  const data = useData();
  const titleId = useId();
  const project = getProject(data, projectId);
  const tasks = tasksInProject(data, projectId);
  const overdue = tasks.filter((t) => isOverdue(t));
  const latest = channelsInProject(data, projectId)
    .flatMap((channel) => messagesIn(data, channel.id).map((m) => ({ ...m, channel: channel.name })))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 2);

  return (
    <section className="card side-card team-context" aria-labelledby={titleId}>
      <div>
        <h2 className="section-title" id={titleId}>
          Shared team context
        </h2>
        <p className="muted small">Every coach on {project?.title} reads this. Your 1:1 chat stays private.</p>
      </div>
      <TeamNotesList projectId={projectId} />

      <div className="context-block">
        <h3 className="context-title">Board</h3>
        <div className="board-mini">
          {TASK_STATUSES.map((status) => (
            <span key={status} className={`pill tone-${STATUS_META[status].tone}`}>
              {STATUS_META[status].label} {tasks.filter((t) => t.status === status).length}
            </span>
          ))}
        </div>
        {overdue.length > 0 && <p className="small text-danger">Overdue: {overdue.map((t) => t.title).join(', ')}</p>}
      </div>

      {latest.length > 0 && (
        <div className="context-block">
          <h3 className="context-title">Latest in channels</h3>
          <ul className="context-msgs">
            {latest.map((m) => (
              <li key={m.id}>
                <p className="small">
                  <strong>{firstName(getUser(data, m.author_id)?.name)}</strong> <span className="muted">in #{m.channel}, {timeAgo(m.created_at)}</span>
                </p>
                <p className="context-msg-text">{m.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">The demo coaches write these lines from the board and your task, never from what you typed.</p>
    </section>
  );
}
