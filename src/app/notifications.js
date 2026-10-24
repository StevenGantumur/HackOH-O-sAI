// In-app activity derived from existing records. Nothing is stored and nothing is sent: email
// and push are out of scope for the demo (AGENTS.md rule 10).

import { getSubmission, getTask, getUser, membershipOf, reviewQueue } from '../shared/selectors.js';

export function deriveNotifications(data, userId) {
  const items = [];

  for (const feedback of data.feedback) {
    const submission = getSubmission(data, feedback.submission_id);
    if (submission?.author_id !== userId) continue;
    const task = getTask(data, submission.task_id);
    const reviewer = getUser(data, feedback.reviewer_id);
    const verb = feedback.rubric?.outcome === 'approved' ? 'approved' : 'asked for changes on';
    items.push({ id: `fb-${feedback.id}`, at: feedback.created_at, actor: reviewer, text: `${reviewer?.name} ${verb} “${task?.title}”`, taskId: task?.id });
  }

  for (const submission of reviewQueue(data, userId)) {
    const task = getTask(data, submission.task_id);
    const author = getUser(data, submission.author_id);
    items.push({ id: `sub-${submission.id}`, at: submission.created_at, actor: author, text: `${author?.name} submitted “${task?.title}” for review`, taskId: task?.id });
  }

  for (const task of data.tasks) {
    if (!task.claimed_at || !task.owner_id || task.owner_id === userId) continue;
    if (membershipOf(data, userId, task.project_id)?.role !== 'LEADER') continue;
    const owner = getUser(data, task.owner_id);
    items.push({ id: `claim-${task.id}-${task.claimed_at}`, at: task.claimed_at, actor: owner, text: `${owner?.name} claimed “${task.title}”`, taskId: task.id });
  }

  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 12);
}
