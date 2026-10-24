import { ROLE_META, projectArt } from '../shared/labels.js';
import { href } from '../shared/router.js';
import { getUser, isOpenMission, membersOf, membershipOf, tasksInProject } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { AvatarStack } from '../shared/ui/Avatar.jsx';
import { RoleBadge, UserTypeBadge } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import './discovery.css';

export function ProjectCard({ project, reasons = [] }) {
  const data = useData();
  const me = useMe();
  const owner = getUser(data, project.owner_id);
  const art = projectArt(project);
  const members = membersOf(data, project.id)
    .map((m) => getUser(data, m.user_id))
    .filter(Boolean);
  const membership = membershipOf(data, me.id, project.id);
  const missions = tasksInProject(data, project.id).filter(isOpenMission).length;

  return (
    <article className="project-card">
      <div className="project-cover" style={{ background: art.bg }}>
        <span className="cover-emoji" aria-hidden="true">
          {art.emoji}
        </span>
      </div>
      <div className="project-content">
        <div className="project-top">
          <UserTypeBadge type={owner?.type} />
          {membership && <RoleBadge role={membership.role} />}
        </div>
        <div>
          <h3 className="project-title">
            <a className="stretched-link" href={href(`/projects/${project.id}`)}>
              {project.title}
            </a>
          </h3>
          <p className="project-owner">Posted by {owner?.name}</p>
        </div>
        <p className="project-desc">{project.description}</p>
        <div className="tags" aria-label="Roles needed">
          {project.needed_roles.map((role) => (
            <span key={role} className="tag" style={{ background: ROLE_META[role].soft, color: ROLE_META[role].color }}>
              {ROLE_META[role].tag}
            </span>
          ))}
        </div>
        {!membership && reasons.length > 0 && (
          <p className="mission-why">
            <Icon name="checkCircle" size={16} />
            <span>{reasons.slice(0, 2).join(' ')}</span>
          </p>
        )}
        <footer className="project-foot">
          <AvatarStack users={members} size={28} max={4} />
          <span className="muted small">{missions ? `${missions} open mission${missions === 1 ? '' : 's'}` : 'No open missions'}</span>
        </footer>
      </div>
    </article>
  );
}
