import { timeAgo } from '../shared/format.js';
import { OUTCOME_META } from '../shared/labels.js';
import { taskHref } from '../shared/router.js';
import { getProject, getSubmission, getTask, getUser } from '../shared/selectors.js';
import { store, useData } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { SampleBadge, SubmissionPill } from '../shared/ui/bits.jsx';

export function ReviewRow({ submission }) {
  const data = useData();
  const task = getTask(data, submission.task_id);
  const author = getUser(data, submission.author_id);
  return (
    <li className="task-row">
      <Avatar user={author} size={34} />
      <span className="task-row-main">
        <a className="task-row-title stretched-link" href={taskHref(task.id)}>
          {task.title}
        </a>
        <span className="task-row-sub">
          {author?.name} in {getProject(data, task.project_id)?.title}, {timeAgo(submission.created_at)}
        </span>
      </span>
      <span className="task-row-meta">
        {store.isSeeded(submission.id) && <SampleBadge>Sample</SampleBadge>}
        <SubmissionPill status={submission.status} />
      </span>
    </li>
  );
}

export function ReviewedRow({ feedback }) {
  const data = useData();
  const submission = getSubmission(data, feedback.submission_id);
  const task = getTask(data, submission?.task_id);
  const author = getUser(data, submission?.author_id);
  const outcome = OUTCOME_META[feedback.rubric?.outcome];
  if (!task) return null;
  return (
    <li className="task-row">
      <Avatar user={author} size={34} />
      <span className="task-row-main">
        <a className="task-row-title stretched-link" href={taskHref(task.id)}>
          {task.title}
        </a>
        <span className="task-row-sub">
          {author?.name}, reviewed {timeAgo(feedback.created_at)}
        </span>
      </span>
      <span className="task-row-meta">
        {store.isSeeded(feedback.id) && <SampleBadge>Sample</SampleBadge>}
        {outcome && <span className={`pill tone-${outcome.tone}`}>{outcome.label}</span>}
      </span>
    </li>
  );
}
