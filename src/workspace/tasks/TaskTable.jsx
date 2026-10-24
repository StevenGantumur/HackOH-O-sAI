import { formatDate, formatMinutes } from '../../shared/format.js';
import { taskHref } from '../../shared/router.js';
import { getProject, getUser, isOverdue } from '../../shared/selectors.js';
import { useData } from '../../shared/store.js';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { DifficultyChip, RoleLabel, StatusPill } from '../../shared/ui/bits.jsx';

export function TaskTable({ tasks }) {
  const data = useData();
  return (
    <div className="table-wrap">
      <table className="task-table">
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Project</th>
            <th scope="col">Owner</th>
            <th scope="col">Status</th>
            <th scope="col">Difficulty</th>
            <th scope="col">Time</th>
            <th scope="col">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const owner = task.owner_id ? getUser(data, task.owner_id) : null;
            const overdue = isOverdue(task);
            return (
              <tr key={task.id}>
                <td>
                  <div className="table-task">
                    <RoleLabel role={task.role} />
                    <a href={taskHref(task.id)}>{task.title}</a>
                  </div>
                </td>
                <td className="muted">{getProject(data, task.project_id)?.title}</td>
                <td>
                  {owner ? (
                    <span className="person">
                      <Avatar user={owner} size={24} />
                      {owner.name}
                    </span>
                  ) : (
                    <span className="muted">Open</span>
                  )}
                </td>
                <td>
                  <StatusPill status={task.status} />
                </td>
                <td>{task.difficulty ? <DifficultyChip value={task.difficulty} /> : <span className="muted">–</span>}</td>
                <td className="muted">{task.estimated_minutes ? formatMinutes(task.estimated_minutes) : '–'}</td>
                <td className={overdue ? 'text-danger' : ''}>
                  {task.deadline ? formatDate(task.deadline) : '–'}
                  {overdue && <span className="table-late"> late</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
