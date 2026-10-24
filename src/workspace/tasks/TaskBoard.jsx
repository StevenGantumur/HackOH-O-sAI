import { TASK_STATUSES } from '../../shared/contracts.js';
import { STATUS_META } from '../../shared/labels.js';
import { Icon } from '../../shared/ui/Icon.jsx';
import { TaskCard } from './TaskCard.jsx';

const EMPTY = {
  todo: 'Nothing waiting. New tasks and open missions land here.',
  in_progress: 'Nothing in progress right now.',
  review: 'Submitted work waits here for a reviewer.',
  done: 'Finished work shows up here.',
};

// Status changes only happen through real actions (claim, submit, review), never by
// dragging, so "done" always means a reviewer approved it (AGENTS.md §6.3).
export function TaskBoard({ tasks, onAdd }) {
  return (
    <div className="board">
      {TASK_STATUSES.map((status) => {
        const meta = STATUS_META[status];
        const items = tasks.filter((t) => t.status === status);
        const headingId = `board-col-${status}`;
        return (
          <section key={status} className={`board-col col-${meta.tone}`} aria-labelledby={headingId}>
            <header className="col-head">
              <h2 id={headingId}>{meta.column}</h2>
              <span className="col-count">
                {items.length}
                <span className="visually-hidden"> tasks</span>
              </span>
              {status === 'todo' && onAdd && (
                <button type="button" className="col-add" onClick={onAdd} aria-label="Add a task">
                  <Icon name="plus" size={16} strokeWidth={2.2} />
                </button>
              )}
            </header>
            <div className="col-cards">
              {items.length ? items.map((task) => <TaskCard key={task.id} task={task} />) : <p className="col-empty">{EMPTY[status]}</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
