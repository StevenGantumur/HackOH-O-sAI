// What every coach is told (AGENTS.md §5.4): the user's role, their current task and its
// deadline, and for leaders the project's unassigned and overdue tasks.

import { getProject, getUser, isMission, isOverdue, membershipOf, tasksInProject } from '../shared/selectors.js';

const dueTime = (task) => (task.deadline ? Date.parse(task.deadline) : Number.MAX_SAFE_INTEGER);
const summary = (task) => ({ id: task.id, title: task.title, deadline: task.deadline });

export function buildAgentContext(data, { userId, projectId, focusTaskId = null, now = Date.now() }) {
  const role = membershipOf(data, userId, projectId)?.role ?? null;
  const project = getProject(data, projectId);
  const tasks = tasksInProject(data, projectId);

  const mine = tasks.filter((t) => t.owner_id === userId && t.status !== 'done').sort((a, b) => dueTime(a) - dueTime(b));
  const current = tasks.find((t) => t.id === focusTaskId) ?? mine.find((t) => t.status === 'in_progress') ?? mine[0] ?? null;

  const context = {
    role,
    project: project ? { id: project.id, title: project.title } : null,
    currentTask: current
      ? { ...summary(current), status: current.status, deliverable: current.deliverable_instructions, criteria: current.review_criteria ?? [] }
      : null,
  };

  if (role === 'LEADER' || role === 'MENTOR') {
    const taskIds = new Set(tasks.map((t) => t.id));
    context.awaitingReview = data.submissions
      .filter((s) => s.status !== 'reviewed' && taskIds.has(s.task_id))
      .map((s) => ({ id: s.id, taskTitle: tasks.find((t) => t.id === s.task_id)?.title, author: getUser(data, s.author_id)?.name ?? null }));
  }
  if (role === 'LEADER') {
    // Open missions are unowned on purpose (students claim them), so they are not flagged.
    context.unassignedTasks = tasks.filter((t) => !t.owner_id && !isMission(t) && t.status !== 'done').map(summary);
    context.overdueTasks = tasks
      .filter((t) => isOverdue(t, now))
      .map((t) => ({ ...summary(t), owner: getUser(data, t.owner_id)?.name ?? null }));
  }
  return context;
}
