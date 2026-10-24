import { useState } from 'react';
import { Page } from '../../app/Page.jsx';
import { updateQuery, useRoute } from '../../shared/router.js';
import { getProject, leadsAnywhere, projectIdsOf, tasksInMyProjects } from '../../shared/selectors.js';
import { useData, useMe } from '../../shared/store.js';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { AddTaskModal } from './AddTaskModal.jsx';
import { TaskBoard } from './TaskBoard.jsx';
import { TaskCalendar } from './TaskCalendar.jsx';
import { ActiveFilters, FilterMenu, SortMenu, clearFilters } from './TaskFilters.jsx';
import { TaskTable } from './TaskTable.jsx';
import { applyFilters, readFilters, sortTasks } from './taskQuery.js';
import './tasks.css';

const VIEWS = [
  { id: 'board', label: 'Board', icon: 'board', activeIcon: 'boardSolid' },
  { id: 'table', label: 'Table', icon: 'table' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function TasksPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const [adding, setAdding] = useState(false);

  const view = VIEWS.some((v) => v.id === query.get('view')) ? query.get('view') : 'board';
  const filters = readFilters(query);
  const projects = [...projectIdsOf(data, me.id)].map((id) => getProject(data, id)).filter(Boolean);
  const tasks = sortTasks(applyFilters(tasksInMyProjects(data, me.id), filters, me.id), filters.sort);
  const canAdd = leadsAnywhere(data, me.id);

  let content;
  if (!projects.length) {
    content = (
      <EmptyState
        icon="tasks"
        title="No tasks yet"
        action={
          <a className="btn btn-primary" href="#/missions">
            Browse missions
          </a>
        }
      >
        Tasks from the projects you join show up here. Claiming a mission is the quickest way in.
      </EmptyState>
    );
  } else if (view !== 'board' && !tasks.length) {
    content = (
      <EmptyState
        icon="filter"
        title="No tasks match these filters"
        action={
          <button type="button" className="btn btn-soft" onClick={clearFilters}>
            Clear filters
          </button>
        }
      />
    );
  } else if (view === 'table') {
    content = <TaskTable tasks={tasks} />;
  } else if (view === 'calendar') {
    content = <TaskCalendar tasks={tasks} />;
  } else {
    content = <TaskBoard tasks={tasks} onAdd={canAdd ? () => setAdding(true) : null} />;
  }

  return (
    <Page
      title="Tasks"
      subtitle={projects.length ? `${plural(tasks.length, 'task')} across ${plural(projects.length, 'project')} you’re part of` : undefined}
      actions={
        <button type="button" className="btn btn-outline btn-lg" onClick={() => setAdding(true)} aria-label="Add task">
          <Icon name="plus" size={18} strokeWidth={2.2} />
          <span className="btn-label">Add Task</span>
        </button>
      }
    >
      <div className="view-bar">
        <div className="view-tabs" role="group" aria-label="View">
          {VIEWS.map((v) => {
            const active = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                className={`view-tab ${active ? 'is-active' : ''}`}
                aria-pressed={active}
                onClick={() => updateQuery({ view: v.id === 'board' ? null : v.id })}
              >
                <Icon name={active && v.activeIcon ? v.activeIcon : v.icon} size={18} />
                {v.label}
              </button>
            );
          })}
        </div>
        <div className="view-tools">
          <FilterMenu filters={filters} projects={projects} />
          <SortMenu sort={filters.sort} />
        </div>
      </div>
      <ActiveFilters filters={filters} projects={projects} />
      {content}
      {adding && <AddTaskModal onClose={() => setAdding(false)} />}
    </Page>
  );
}
