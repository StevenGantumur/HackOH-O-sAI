// MOCK: the one line a coach shares with the rest of the team after each exchange. Neutral
// status only, built from the task and the coaching focus, never from the person's own words, so
// the 1:1 chat stays private (DECISIONS.md: board + shared notes). A real model would follow the
// same rule.

import { firstName } from '../shared/format.js';
import { planReply } from './mockCoach.js';

const short = (title = '', max = 60) => (title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title);

export function teamNoteFor({ role, messages, context }) {
  const name = context.person?.first ?? 'This teammate';

  if (role === 'LEADER') {
    const open = context.unassignedTasks?.length ?? 0;
    if (open) return `${name} is lining up owners for ${open === 1 ? 'one open task' : `${open} open tasks`}.`;
    return `${name} is planning the team’s next milestone.`;
  }
  if (role === 'MENTOR') {
    const next = context.awaitingReview?.[0];
    if (next) return `${name} is preparing feedback on ${firstName(next.author ?? '')}’s “${short(next.taskTitle)}”.`;
    return `${name} is thinking about how to give useful feedback.`;
  }

  const task = context.currentTask;
  if (!task) return `${name} is deciding what to pick up next on ${context.project?.title ?? 'the project'}.`;
  const title = `“${short(task.title)}”`;
  const { intent, topic } = planReply({ role, messages, context });
  if (intent === 'who') return `${name} is looking for teammates to team up with on ${title}.`;
  if (intent === 'attempt' || intent === 'review') return `${name} has a draft of ${title} and is checking it against the review criteria.`;
  return `${name} is working on ${title}. Current focus: ${topic}.`;
}
