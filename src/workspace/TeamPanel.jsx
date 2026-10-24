import { formatDate } from '../shared/format.js';
import { profileHeadline } from '../shared/people.js';
import { getProfile, getUser, membersOf } from '../shared/selectors.js';
import { useData } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { RoleBadge, UserTypeBadge } from '../shared/ui/bits.jsx';

const ORDER = { LEADER: 0, MENTOR: 1 };

export function TeamPanel({ project }) {
  const data = useData();
  const members = membersOf(data, project.id).sort(
    (a, b) => (ORDER[a.role] ?? 2) - (ORDER[b.role] ?? 2) || Date.parse(a.joined_at) - Date.parse(b.joined_at),
  );
  return (
    <section className="section" aria-labelledby="team-title">
      <div className="section-head">
        <h2 className="section-title" id="team-title">
          {members.length} people
        </h2>
        <span className="section-note">Roles are fixed and picked on joining. Leaders and mentors review submitted work.</span>
      </div>
      <ul className="team-list">
        {members.map((m) => {
          const person = getUser(data, m.user_id);
          return (
            <li key={m.user_id} className="team-member">
              <Avatar user={person} size={44} />
              <div className="team-who">
                <a className="team-name" href={`#/people/${person?.id}`}>
                  {person?.name}
                </a>
                <p className="muted small">{profileHeadline(getProfile(data, m.user_id), person)}</p>
              </div>
              <div className="team-tags">
                <RoleBadge role={m.role} />
                <UserTypeBadge type={person?.type} />
              </div>
              <span className="muted small team-joined">Joined {formatDate(m.joined_at)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
