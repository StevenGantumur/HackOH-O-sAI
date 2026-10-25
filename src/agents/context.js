// What every coach on a project is told (AGENTS.md §5.4). The shared part (the board, recent team
// messages and the one-line note each coach keeps about its person) is identical for every coach
// on the project; only the person, their role and their current task differ. Private coach chats
// are never included.

import { REVIEWER_ROLES } from '../shared/contracts.js';
import { firstName } from '../shared/format.js';
import { ROLE_META } from '../shared/labels.js';
import {
  channelsInProject,
  getProject,
  getUser,
  isMission,
  isOverdue,
  membersOf,
  membershipOf,
  messagesIn,
  tasksInProject,
  teamNotesIn,
} from '../shared/selectors.js';
import { coachProfile } from './persona.js';

const dueTime = (task) => (task.deadline ? Date.parse(task.deadline) : Number.MAX_SAFE_INTEGER);
const summary = (task) => ({ id: task.id, title: task.title, deadline: task.deadline, status: task.status });

// prettier-ignore
const STOPWORDS = new Set([
  'about', 'after', 'also', 'before', 'best', 'build', 'could', 'draft', 'each', 'every', 'first',
  'from', 'have', 'into', 'just', 'make', 'more', 'most', 'need', 'needed', 'only', 'project',
  'short', 'should', 'some', 'task', 'team', 'than', 'that', 'their', 'them', 'then', 'they',
  'this', 'what', 'when', 'where', 'which', 'will', 'with', 'work', 'would', 'write', 'your',
]);

export function keywords(text = '') {
  const words = new Set();
  for (const raw of text.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
    const word = raw.length > 4 && raw.endsWith('s') && !raw.endsWith('ss') ? raw.slice(0, -1) : raw;
    if (!STOPWORDS.has(word)) words.add(word);
  }
  return words;
}

function overlap(a, b) {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared;
}

const STATUS_VERB = { todo: 'is about to start', in_progress: 'is working on', review: 'is waiting on review for', done: 'finished' };

// Teammates whose work touches the person's current task: the project's reviewers when the task
// gets reviewed, plus anyone whose coach note or own task shares at least two key words with it.
// A coach note wins over a task match because it is fresher.
function findConnections({ data, projectId, userId, current, team, tasks }) {
  if (!current) return [];
  const found = [];
  if (isMission(current) || current.status === 'review') {
    for (const m of membersOf(data, projectId)) {
      if (m.user_id === userId || !REVIEWER_ROLES.includes(m.role)) continue;
      const user = getUser(data, m.user_id);
      found.push({ id: user.id, name: firstName(user.name), roleLabel: ROLE_META[m.role].label, kind: 'reviewer', text: null, strength: 2 });
    }
  }
  const mine = keywords(`${current.title} ${current.description}`);
  for (const mate of team) {
    if (found.some((c) => c.id === mate.id)) continue;
    const noteScore = mate.note ? overlap(mine, keywords(mate.note)) : 0;
    if (noteScore >= 2) {
      found.push({ id: mate.id, name: mate.first, roleLabel: mate.roleLabel, kind: 'note', text: mate.note, strength: noteScore + 1 });
      continue;
    }
    let best = null;
    for (const task of tasks) {
      if (task.owner_id !== mate.id || task.id === current.id) continue;
      const score = overlap(mine, keywords(`${task.title} ${task.description}`));
      if (score >= 2 && score > (best?.strength ?? 0)) {
        best = { id: mate.id, name: mate.first, roleLabel: mate.roleLabel, kind: 'task', text: `${STATUS_VERB[task.status]} “${task.title}”`, strength: score };
      }
    }
    if (best) found.push(best);
  }
  return found.sort((a, b) => b.strength - a.strength).slice(0, 3);
}

export function buildAgentContext(data, { userId, projectId, focusTaskId = null, now = Date.now() }) {
  const role = membershipOf(data, userId, projectId)?.role ?? null;
  const project = getProject(data, projectId);
  const person = getUser(data, userId);
  const tasks = tasksInProject(data, projectId);
  const channels = channelsInProject(data, projectId);
  const nameOf = (id) => firstName(getUser(data, id)?.name ?? '');

  const mine = tasks.filter((t) => t.owner_id === userId && t.status !== 'done').sort((a, b) => dueTime(a) - dueTime(b));
  const current = tasks.find((t) => t.id === focusTaskId) ?? mine.find((t) => t.status === 'in_progress') ?? mine[0] ?? null;

  const notes = teamNotesIn(data, projectId).map((n) => ({ authorId: n.author_id, author: nameOf(n.author_id), role: n.role, content: n.content, at: n.updated_at }));
  const team = membersOf(data, projectId)
    .filter((m) => m.user_id !== userId)
    .map((m) => {
      const user = getUser(data, m.user_id);
      return {
        id: user.id,
        name: user.name,
        first: firstName(user.name),
        role: m.role,
        roleLabel: ROLE_META[m.role].label,
        activeTasks: tasks.filter((t) => t.owner_id === user.id && t.status !== 'done').map(summary),
        note: notes.find((n) => n.authorId === user.id)?.content ?? null,
      };
    });

  const board = { todo: 0, in_progress: 0, review: 0, done: 0 };
  for (const task of tasks) board[task.status] += 1;

  const recentMessages = channels
    .flatMap((c) => messagesIn(data, c.id).map((m) => ({ channel: c.name, author: nameOf(m.author_id), content: m.content, at: m.created_at })))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 4);

  const context = {
    role,
    coach: coachProfile(role, project),
    person: person ? { id: person.id, name: person.name, first: firstName(person.name) } : null,
    project: project ? { id: project.id, title: project.title, channel: channels[0]?.name ?? 'general' } : null,
    currentTask: current
      ? { ...summary(current), deliverable: current.deliverable_instructions, criteria: current.review_criteria ?? [] }
      : null,
    team,
    notes,
    board,
    recentMessages,
    connections: findConnections({ data, projectId, userId, current, team, tasks }),
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
