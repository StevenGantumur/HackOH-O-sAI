import { scoreMission } from '../../discovery/score.js';
import { dueLabel, formatDay, formatMinutes, timeAgo } from '../../shared/format.js';
import { ROLE_META, projectArt } from '../../shared/labels.js';
import { href } from '../../shared/router.js';
import {
  getFile,
  getProfile,
  getProject,
  getTask,
  getUser,
  isMission,
  isOverdue,
  membershipOf,
  reviewersOf,
  submissionsForTask,
  versionNumber,
  versionsForTask,
} from '../../shared/selectors.js';
import { useData, useMe } from '../../shared/store.js';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { DifficultyChip, EmptyState, RoleLabel, StatusPill, Tag } from '../../shared/ui/bits.jsx';
import { Drawer } from '../../shared/ui/Dialog.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { SubmissionCard } from '../../missions/SubmissionCard.jsx';
import { TaskActions } from '../../missions/TaskActions.jsx';
import './tasks.css';
import '../../missions/missions.css';

function Section({ title, children }) {
  return (
    <section className="drawer-section">
      <h3 className="drawer-section-title">{title}</h3>
      {children}
    </section>
  );
}

export function TaskDrawer({ taskId, onClose }) {
  const data = useData();
  const me = useMe();
  const task = getTask(data, taskId);

  if (!task) {
    return (
      <Drawer label="Task not found" onClose={onClose}>
        <header className="drawer-head">
          <span />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="drawer-body">
          <EmptyState icon="alert" title="This task doesn’t exist anymore">
            It may have been removed when the demo data was reset.
          </EmptyState>
        </div>
      </Drawer>
    );
  }

  const project = getProject(data, task.project_id);
  const art = projectArt(project);
  const membership = membershipOf(data, me.id, project.id);
  const owner = task.owner_id ? getUser(data, task.owner_id) : null;
  const mission = isMission(task);
  const overdue = isOverdue(task);
  const reviewers = reviewersOf(data, project.id).map((m) => ({ user: getUser(data, m.user_id), role: m.role }));
  const submissions = submissionsForTask(data, task.id);
  const files = versionsForTask(data, task.id);
  const profile = getProfile(data, me.id);
  const mySkills = new Set((profile?.skills ?? []).map((s) => s.toLowerCase()));
  const fit = mission && task.status === 'todo' && !task.owner_id ? scoreMission(profile, task, project) : null;
  const canSeeWorkspace = Boolean(membership);

  return (
    <Drawer label={task.title} onClose={onClose}>
      <header className="drawer-head">
        <div className="drawer-tags">
          <RoleLabel role={task.role} />
          {mission && <span className="mission-flag">Bridge Mission</span>}
          <StatusPill status={task.status} />
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
      </header>

      <div className="drawer-body">
        <div className="drawer-heading">
          <h2 className="drawer-title">{task.title}</h2>
          <a className="drawer-project" href={href(`/projects/${project.id}`)}>
            <span className="project-emoji" style={{ background: art.bg }} aria-hidden="true">
              {art.emoji}
            </span>
            {project.title}
          </a>
        </div>

        <dl className="meta-grid">
          <div>
            <dt>Owner</dt>
            <dd>
              {owner ? (
                <span className="person">
                  <Avatar user={owner} size={24} />
                  {owner.name}
                </span>
              ) : (
                <span className="muted">{mission ? 'Open to claim' : 'Unassigned'}</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>
              {task.deadline ? (
                <>
                  {formatDay(task.deadline)}
                  {task.status !== 'done' && <span className={overdue ? 'text-danger meta-sub' : 'muted meta-sub'}>{dueLabel(task.deadline)}</span>}
                </>
              ) : (
                <span className="muted">No deadline</span>
              )}
            </dd>
          </div>
          {mission && (
            <div>
              <dt>Time</dt>
              <dd>About {formatMinutes(task.estimated_minutes)}</dd>
            </div>
          )}
          {mission && (
            <div>
              <dt>Level</dt>
              <dd>
                <DifficultyChip value={task.difficulty} />
              </dd>
            </div>
          )}
        </dl>

        {task.description && <p className="drawer-desc">{task.description}</p>}

        {fit && fit.reasons.length > 0 && (
          <div className="why-box">
            <p className="why-title">Why it fits you</p>
            <ul>
              {fit.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="why-note">Matched on the skills and goals in your profile. Rules-based, no AI.</p>
          </div>
        )}

        {task.required_skills.length > 0 && (
          <Section title="Skills it uses">
            <div className="tags">
              {task.required_skills.map((skill) => (
                <Tag key={skill} active={mySkills.has(skill.toLowerCase())}>
                  {mySkills.has(skill.toLowerCase()) && <Icon name="check" size={13} strokeWidth={2.4} />}
                  {skill}
                </Tag>
              ))}
            </div>
          </Section>
        )}

        {mission && (
          <Section title="What to hand in">
            <p className="drawer-text">{task.deliverable_instructions}</p>
          </Section>
        )}

        {task.review_criteria.length > 0 && (
          <Section title="How it’s reviewed">
            <ul className="criteria">
              {task.review_criteria.map((criterion) => (
                <li key={criterion}>
                  <Icon name="checkCircle" size={17} />
                  {criterion}
                </li>
              ))}
            </ul>
            {reviewers.length > 0 && (
              <p className="reviewed-by">
                <span className="avatar-stack" style={{ '--avatar-size': '24px' }}>
                  {reviewers.map(({ user }) => (
                    <Avatar key={user.id} user={user} size={24} />
                  ))}
                </span>
                Reviewed by {reviewers.map(({ user, role }) => `${user.name} (${ROLE_META[role].label.toLowerCase()})`).join(' or ')}, a real person, not an AI.
              </p>
            )}
          </Section>
        )}

        <TaskActions task={task} project={project} membership={membership} />

        {submissions.length > 0 && (
          <Section title={submissions.length > 1 ? 'Submissions' : 'Submission'}>
            <div className="submission-list">
              {submissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} task={task} />
              ))}
            </div>
          </Section>
        )}

        {files.length > 0 && canSeeWorkspace && (
          <Section title="Files for this task">
            <ul className="linked-files">
              {files.map((version) => {
                const file = getFile(data, version.file_id);
                const author = getUser(data, version.author_id);
                return (
                  <li key={version.id}>
                    <a href={href(`/projects/${project.id}`, { tab: 'files', file: file?.id })}>
                      <Icon name={version.mime_type.startsWith('image/') ? 'image' : 'file'} size={18} />
                      <span className="linked-file-name">{file?.name}</span>
                      <span className="muted small">
                        v{versionNumber(data, version)}, {author?.name}, {timeAgo(version.created_at)}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>

      {canSeeWorkspace && (
        <footer className="drawer-foot">
          <a className="btn btn-ghost" href={href('/coach', { project: project.id, task: task.id })}>
            <Icon name="sparkles" size={18} />
            Ask your coach
          </a>
          <a className="btn btn-ghost" href={href(`/projects/${project.id}`, { tab: 'board' })}>
            <Icon name="board" size={18} />
            Project board
          </a>
        </footer>
      )}
    </Drawer>
  );
}
