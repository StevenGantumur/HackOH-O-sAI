import { firstName, joinList } from '../shared/format.js';
import { ROLE_META } from '../shared/labels.js';
import { href, taskHref } from '../shared/router.js';
import { getUser, isOpenMission, membersOf, reviewersOf, tasksInProject } from '../shared/selectors.js';
import { useData } from '../shared/store.js';
import { AvatarStack } from '../shared/ui/Avatar.jsx';
import { DifficultyChip, RoleLabel, TimeChip } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';

function SkillList({ skills, label = 'Relevant skills' }) {
  const visible = skills.slice(0, 3);
  const remaining = skills.length - visible.length;
  return (
    <div className="home-skill-list" aria-label={label}>
      {visible.map((skill) => (
        <span className="home-skill" key={skill}>
          {skill}
        </span>
      ))}
      {remaining > 0 && <span className="home-skill home-skill-more">+{remaining}</span>}
    </div>
  );
}

export function HomeMissionCard({ match, bestMatch = false }) {
  const data = useData();
  const { task, project, reasons } = match;
  const reviewers = reviewersOf(data, project.id)
    .map((membership) => getUser(data, membership.user_id))
    .filter(Boolean);

  return (
    <article className="home-recommendation-card home-mission-card">
      <div className="home-card-labels">
        <RoleLabel role={task.role} />
        {bestMatch && <span className="home-match-label">Best match</span>}
      </div>
      <div>
        <h3 className="home-card-title">
          <a href={taskHref(task.id)}>{task.title}</a>
        </h3>
        <p className="home-card-context">{project.title}</p>
      </div>
      <p className="home-card-description">{task.description}</p>
      <SkillList skills={task.required_skills} />
      <div className="home-card-meta">
        <DifficultyChip value={task.difficulty} />
        <TimeChip minutes={task.estimated_minutes} />
      </div>
      {reasons.length > 0 && (
        <p className="home-match-reason">
          <Icon name="checkCircle" size={15} />
          <span>{reasons[0]}</span>
        </p>
      )}
      <footer className="home-card-footer">
        {reviewers.length > 0 ? (
          <span className="home-card-team">
            <AvatarStack users={reviewers} size={24} max={3} />
            <span>Reviewed by {joinList(reviewers.map((user) => firstName(user.name)))}</span>
          </span>
        ) : (
          <span />
        )}
        <a className="text-link" href={taskHref(task.id)} aria-label={`View mission: ${task.title}`}>
          View mission
          <Icon name="arrowRight" size={15} />
        </a>
      </footer>
    </article>
  );
}

export function HomeProjectCard({ match }) {
  const data = useData();
  const { project, owner, reasons } = match;
  const members = membersOf(data, project.id)
    .map((membership) => getUser(data, membership.user_id))
    .filter(Boolean);
  const openMissions = tasksInProject(data, project.id).filter(isOpenMission).length;

  return (
    <article className="home-recommendation-card home-project-card">
      <div className="home-project-heading">
        <span className="home-project-icon" aria-hidden="true">
          <Icon name="folder" size={18} />
        </span>
        <div>
          <h3 className="home-card-title">
            <a href={href(`/projects/${project.id}`)}>{project.title}</a>
          </h3>
          <p className="home-card-context">Led by {owner?.name ?? 'Project team'}</p>
        </div>
      </div>
      <p className="home-card-description">{project.description}</p>
      <SkillList skills={project.needed_skills} label="Technologies and skills needed" />
      {reasons.length > 0 && (
        <p className="home-match-reason">
          <Icon name="checkCircle" size={15} />
          <span>{reasons[0]}</span>
        </p>
      )}
      <footer className="home-card-footer">
        <span className="home-card-team">
          <AvatarStack users={members} size={24} max={3} />
          <span>
            {members.length} member{members.length === 1 ? '' : 's'} · {openMissions} open mission{openMissions === 1 ? '' : 's'}
          </span>
        </span>
        <a className="text-link" href={href(`/projects/${project.id}`)} aria-label={`Explore project: ${project.title}`}>
          Explore
          <Icon name="arrowRight" size={15} />
        </a>
      </footer>
    </article>
  );
}

export function HomeProjectRow({ project, membership, activeTaskCount }) {
  const data = useData();
  const members = membersOf(data, project.id)
    .map((item) => getUser(data, item.user_id))
    .filter(Boolean);
  const role = ROLE_META[membership.role];

  return (
    <li className="home-project-row">
      <span className="label-dot" style={{ background: role?.dot }} aria-hidden="true" />
      <span className="home-project-row-main">
        <a href={href(`/projects/${project.id}`)}>{project.title}</a>
        <span>
          {role?.label ?? membership.role}
          {activeTaskCount > 0 ? ` · ${activeTaskCount} active task${activeTaskCount === 1 ? '' : 's'}` : ''}
        </span>
      </span>
      <AvatarStack users={members} size={24} max={3} />
      <Icon name="chevronRight" size={16} />
    </li>
  );
}
