import { pad2 } from '../../shared/format.js';
import { projectArt } from '../../shared/labels.js';
import { href, taskHref } from '../../shared/router.js';
import {
  artifactCount,
  feedbackCount,
  feedbackFor,
  getProject,
  getUser,
  isMission,
  isOpenMission,
  isOverdue,
  latestSubmission,
  membershipOf,
  versionsForTask,
} from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { AvatarStack } from '../../shared/ui/Avatar.jsx';
import { DifficultyChip, DueChip, RoleLabel, TimeChip } from '../../shared/ui/bits.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { Popover } from '../../shared/ui/Popover.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';

// The newest image attached to the task, shown as the card cover (like the design's first card).
function imageCover(data, task) {
  for (const version of versionsForTask(data, task.id)) {
    if (!version.mime_type.startsWith('image/')) continue;
    const blob = store.readBlob(version.storage_ref);
    if (!blob) continue;
    if (blob.kind === 'dataUrl') return blob.data;
    if (version.mime_type === 'image/svg+xml') return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(blob.data)}`;
  }
  return null;
}

export function TaskCard({ task }) {
  const data = useData();
  const project = getProject(data, task.project_id);
  const owner = task.owner_id ? getUser(data, task.owner_id) : null;
  const submission = latestSubmission(data, task.id);
  const reviewers = submission ? feedbackFor(data, submission.id).map((f) => getUser(data, f.reviewer_id)) : [];
  const people = [owner, ...reviewers].filter((u, i, all) => u && all.findIndex((x) => x?.id === u.id) === i);
  const image = imageCover(data, task);
  const art = projectArt(project);
  const showEmoji = !image && isOpenMission(task);
  const artifacts = artifactCount(data, task.id);
  const comments = feedbackCount(data, task.id);

  return (
    <article className="task-card">
      <div className="task-card-top">
        <RoleLabel role={task.role} />
        {isMission(task) && <span className="mission-flag">Mission</span>}
        <CardMenu task={task} />
      </div>

      {image && (
        <div className="task-cover task-cover-image">
          <img src={image} alt="" />
        </div>
      )}
      {showEmoji && (
        <div className="task-cover" style={{ background: art.bg }}>
          <span className="cover-emoji" aria-hidden="true">
            {art.emoji}
          </span>
        </div>
      )}

      <div className="task-card-heading">
        <h3 className="task-title">
          <a className="stretched-link" href={taskHref(task.id)}>
            {task.title}
          </a>
        </h3>
        <p className="task-project">{project?.title}</p>
      </div>
      {!image && !showEmoji && task.description && <p className="task-desc">{task.description}</p>}

      <div className="chips">
        <DifficultyChip value={task.difficulty} />
        {task.status === 'todo' && <TimeChip minutes={task.estimated_minutes} />}
        {task.status !== 'done' && <DueChip iso={task.deadline} overdue={isOverdue(task)} />}
      </div>

      <footer className="task-foot">
        {people.length ? (
          <AvatarStack users={people} size={32} />
        ) : (
          <span className="open-slot">
            <span className="open-slot-ring" aria-hidden="true">
              <Icon name="plus" size={14} />
            </span>
            {isOpenMission(task) ? 'Open to claim' : 'No owner yet'}
          </span>
        )}
        <span className="task-counts">
          <span title="Artifacts: files and links">
            <Icon name="link" size={17} />
            <span className="visually-hidden">Artifacts: </span>
            {pad2(artifacts)}
          </span>
          <span title="Feedback">
            <Icon name="comment" size={17} />
            <span className="visually-hidden">Feedback: </span>
            {pad2(comments)}
          </span>
        </span>
      </footer>
    </article>
  );
}

function CardMenu({ task }) {
  const data = useData();
  const me = useMe();
  const toast = useToast();
  const role = membershipOf(data, me.id, task.project_id)?.role;

  async function copyLink(close) {
    close();
    const url = `${window.location.origin}${window.location.pathname}${href('/tasks', { task: task.id })}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ tone: 'success', title: 'Link copied' });
    } catch {
      toast({ tone: 'error', title: 'Could not copy the link', body: url });
    }
  }

  return (
    <div className="card-menu">
      <Popover
        align="end"
        label={`Actions for ${task.title}`}
        panelClassName="card-menu-panel"
        trigger={(props) => (
          <button {...props} className="icon-btn icon-btn-sm" aria-label={`More actions for ${task.title}`}>
            <Icon name="dots" size={18} />
          </button>
        )}
      >
        {(close) => (
          <>
            <a className="menu-item" href={taskHref(task.id)} onClick={close}>
              <Icon name="eye" size={18} />
              Open details
            </a>
            {role && (
              <a className="menu-item" href={href('/coach', { project: task.project_id, task: task.id })} onClick={close}>
                <Icon name="sparkles" size={18} />
                Ask your coach
              </a>
            )}
            <button type="button" className="menu-item" onClick={() => copyLink(close)}>
              <Icon name="copy" size={18} />
              Copy link
            </button>
          </>
        )}
      </Popover>
    </div>
  );
}
