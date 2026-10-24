// Filter and sort state for the Tasks views. It lives in the URL, so views can be shared,
// refreshed and bookmarked.

import { isMission } from '../../shared/selectors.js';

export const SORTS = [
  { id: 'deadline', label: 'Due date, soonest first' },
  { id: 'difficulty', label: 'Difficulty, easiest first' },
  { id: 'title', label: 'Title, A to Z' },
];

const list = (value) => (value ? value.split(',').filter(Boolean) : []);

export function readFilters(query) {
  const sort = query.get('sort');
  return {
    labels: list(query.get('label')),
    projects: list(query.get('project')),
    mine: query.get('mine') === '1',
    missions: query.get('missions') === '1',
    sort: SORTS.some((s) => s.id === sort) ? sort : 'deadline',
  };
}

export const activeFilterCount = (f) => f.labels.length + f.projects.length + Number(f.mine) + Number(f.missions);

export function applyFilters(tasks, f, userId) {
  return tasks.filter(
    (t) =>
      (!f.labels.length || f.labels.includes(t.role)) &&
      (!f.projects.length || f.projects.includes(t.project_id)) &&
      (!f.mine || t.owner_id === userId) &&
      (!f.missions || isMission(t)),
  );
}

const LEVEL = { beginner: 0, intermediate: 1, advanced: 2 };
const dueTime = (t) => (t.deadline ? Date.parse(t.deadline) : Number.MAX_SAFE_INTEGER);

export function sortTasks(tasks, sort) {
  const byDue = (a, b) => dueTime(a) - dueTime(b);
  const compare = {
    deadline: byDue,
    difficulty: (a, b) => (LEVEL[a.difficulty] ?? 3) - (LEVEL[b.difficulty] ?? 3) || byDue(a, b),
    title: (a, b) => a.title.localeCompare(b.title),
  }[sort];
  return [...tasks].sort(compare);
}
