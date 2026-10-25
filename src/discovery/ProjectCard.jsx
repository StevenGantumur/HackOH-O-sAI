import { ROLE_META, projectArt } from '../shared/labels.js';
import { href } from '../shared/router.js';
import { getUser, isOpenMission, membersOf, membershipOf, tasksInProject } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { AvatarStack } from '../shared/ui/Avatar.jsx';
import { RoleBadge, UserTypeBadge } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import './discovery.css';

function useProjectDetails(project) {
  const data = useData();
  const me = useMe();
  const tasks = tasksInProject(data, project.id);
  return {
    owner: getUser(data, project.owner_id),
    art: projectArt(project),
    members: membersOf(data, project.id).map((membership) => getUser(data, membership.user_id)).filter(Boolean),
    membership: membershipOf(data, me.id, project.id),
    openMissions: tasks.filter(isOpenMission).length,
    activeTasks: tasks.filter((task) => task.status !== 'done').length,
  };
}

function RoleTags({ roles = [], limit = 3 }) {
  const visible = roles.slice(0, limit);
  return (
    <span className="project-role-tags" aria-label={`Roles needed: ${roles.map((role) => ROLE_META[role]?.tag ?? role).join(', ') || 'none'}`}>
      {visible.map((role) => <span className="project-role-tag" key={role}>{ROLE_META[role]?.tag ?? role}</span>)}
      {roles.length > visible.length && <span className="project-role-tag project-role-more">+{roles.length - visible.length}</span>}
    </span>
  );
}

const missionLabel = (count) => `${count} open mission${count === 1 ? '' : 's'}`;

export function ProjectCard({ project, reasons = [], mode = 'discover' }) {
  const { owner, art, members, membership, openMissions, activeTasks } = useProjectDetails(project);
  const mine = mode === 'mine';

  return (
    <article className="project-card">
      <div className="project-content">
        <div className="project-top">
          <span className="card-project-mark" style={{ background: art.bg }} aria-hidden="true">{art.emoji}</span>
          <UserTypeBadge type={owner?.type} />
          {mine && membership && <RoleBadge role={membership.role} />}
        </div>
        <div className="project-card-identity">
          <h3 className="project-title">
            <a className="stretched-link" href={href(`/projects/${project.id}`)}>{project.title}</a>
          </h3>
          <p className="project-owner">Posted by {owner?.name ?? 'Project team'}</p>
        </div>
        <p className="project-desc">{project.description}</p>
        <RoleTags roles={project.needed_roles} />
        {!mine && reasons.length > 0 && (
          <p className="project-match-reason"><Icon name="checkCircle" size={14} /><span>{reasons.slice(0, 2).join(' ')}</span></p>
        )}
        <footer className="project-foot">
          <AvatarStack users={members} size={24} max={4} />
          <span className="project-foot-meta">
            {mine && <span>{activeTasks} active task{activeTasks === 1 ? '' : 's'} <span aria-hidden="true">·</span> </span>}
            {missionLabel(openMissions)}
          </span>
        </footer>
      </div>
    </article>
  );
}

export function ProjectRow({ project, reasons = [], mode = 'discover' }) {
  const { owner, art, members, membership, openMissions, activeTasks } = useProjectDetails(project);
  const mine = mode === 'mine';

  return (
    <a className="project-list-row" href={href(`/projects/${project.id}`)}>
      <span className="project-list-identity">
        <span className="card-project-mark" style={{ background: art.bg }} aria-hidden="true">{art.emoji}</span>
        <span className="project-list-name-group">
          <strong className="project-list-name">{project.title}</strong>
          <span className="project-list-description">{project.description}</span>
        </span>
      </span>
      <span className="project-list-poster">
        <UserTypeBadge type={owner?.type} />
        <span className="project-list-secondary">{owner?.name ?? 'Project team'}</span>
      </span>
      <RoleTags roles={project.needed_roles} limit={2} />
      <span className="project-list-missions">
        <strong>{openMissions}</strong>
        <span className="project-list-secondary">{mine ? `${activeTasks} active tasks` : 'Open missions'}</span>
      </span>
      {(mine || reasons.length > 0) && (
        <span className="project-list-context">
          {mine ? (
            <>
              {membership && <RoleBadge role={membership.role} />}
              <AvatarStack users={members} size={22} max={3} />
            </>
            ) : <span className="project-list-match">{reasons.slice(0, 2).join(' ')}</span>}
        </span>
      )}
      <Icon className="project-list-arrow" name="chevronRight" size={16} />
    </a>
  );
}
