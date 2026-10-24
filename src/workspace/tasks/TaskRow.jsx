import { ROLE_META } from '../../shared/labels.js';
import { taskHref } from '../../shared/router.js';
import { getProject, isOverdue } from '../../shared/selectors.js';
import { useData } from '../../shared/store.js';
import { DueChip, StatusPill } from '../../shared/ui/bits.jsx';

// Compact one-line task for lists on Home and in panels.
export function TaskRow({ task, note }) {
  const data = useData();
  const project = getProject(data, task.project_id);
  return (
    <li className="task-row">
      <span className="label-dot" style={{ background: ROLE_META[task.role]?.dot }} aria-hidden="true" />
      <span className="task-row-main">
        <a className="task-row-title stretched-link" href={taskHref(task.id)}>
          {task.title}
        </a>
        <span className="task-row-sub">{note ?? project?.title}</span>
      </span>
      <span className="task-row-meta">
        <StatusPill status={task.status} />
        {task.deadline && task.status !== 'done' && <DueChip iso={task.deadline} overdue={isOverdue(task)} />}
      </span>
    </li>
  );
}
