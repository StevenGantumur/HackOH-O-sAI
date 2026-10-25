import { firstName, joinList } from '../shared/format.js';
import { projectArt } from '../shared/labels.js';
import { taskHref } from '../shared/router.js';
import { getUser, reviewersOf } from '../shared/selectors.js';
import { useData } from '../shared/store.js';
import { AvatarStack } from '../shared/ui/Avatar.jsx';
import { DifficultyChip, DueChip, RoleLabel, TimeChip } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import './missions.css';

export function MissionCard({ task, project, reasons = [], featured = false }) {
  const data = useData();
  const art = projectArt(project);
  const reviewers = reviewersOf(data, project.id)
    .map((m) => getUser(data, m.user_id))
    .filter(Boolean);

  return (
    <article className={`mission-card ${featured ? 'is-featured' : ''}`}>
      <div className="mission-content">
        <div className="mission-top">
          <span className="card-project-mark" style={{ '--card-art-light': art.bg, '--card-art-dark': art.darkBg }} aria-hidden="true">{art.emoji}</span>
          <span className="mission-project">{project.title}</span>
          <RoleLabel role={task.role} />
          {featured && <span className="cover-badge">Best match</span>}
        </div>
        <div>
          <h3 className="mission-title">
            <a className="stretched-link" href={taskHref(task.id)}>
              {task.title}
            </a>
          </h3>
        </div>
        <p className="mission-desc">{task.description}</p>
        <div className="chips">
          <DifficultyChip value={task.difficulty} />
          <TimeChip minutes={task.estimated_minutes} />
          <DueChip iso={task.deadline} />
        </div>
        {reasons.length > 0 && (
          <p className="mission-why">
            <Icon name="checkCircle" size={16} />
            <span>{reasons.slice(0, 2).join(' ')}</span>
          </p>
        )}
        {reviewers.length > 0 && (
          <footer className="mission-foot">
            <AvatarStack users={reviewers} size={26} />
            <span className="muted small">Reviewed by {joinList(reviewers.map((u) => firstName(u.name)))}</span>
          </footer>
        )}
      </div>
    </article>
  );
}
