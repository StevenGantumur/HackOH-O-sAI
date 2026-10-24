// Rules-based matching (AGENTS.md §6.2): skill overlap plus goal-to-tag overlap. No model and
// no training, and the UI says so wherever it shows a ranking (§6.3).

import { formatMinutes, joinList } from '../shared/format.js';
import { getProfile, getProject, getUser, isOpenMission } from '../shared/selectors.js';

const norm = (value) => String(value).trim().toLowerCase();

// Close-enough skills, so "Needs CAD; you listed SolidWorks" still counts, at half the weight
// of an exact match.
const RELATED_PAIRS = [
  ['CAD', 'SolidWorks'],
  ['User Interviews', 'Interviewing'],
  ['User Interviews', 'User Research'],
  ['UX Research', 'User Research'],
  ['UX Research', 'User Interviews'],
  ['Copywriting', 'Technical Writing'],
  ['Data Visualization', 'Tableau'],
  ['Statistics', 'SPSS'],
];

const RELATED = new Map();
for (const [a, b] of RELATED_PAIRS) {
  for (const [from, to] of [
    [a, b],
    [b, a],
  ]) {
    RELATED.set(norm(from), [...(RELATED.get(norm(from)) ?? []), norm(to)]);
  }
}

export function matchSkills(have = [], needed = []) {
  const haveByKey = new Map(have.map((skill) => [norm(skill), skill]));
  const exact = [];
  const related = [];
  for (const need of needed) {
    if (haveByKey.has(norm(need))) {
      exact.push(need);
      continue;
    }
    const near = (RELATED.get(norm(need)) ?? []).map((k) => haveByKey.get(k)).find(Boolean);
    if (near) related.push({ need, have: near });
  }
  return { exact, related };
}

export function matchGoals(goals = [], tags = []) {
  const tagKeys = new Set(tags.map(norm));
  return goals.filter((goal) => tagKeys.has(norm(goal)));
}

function explain({ exact, related }, goals) {
  const reasons = [];
  if (exact.length) reasons.push(`Needs ${joinList(exact)}, which you listed.`);
  for (const { need, have } of related) reasons.push(`Needs ${need}; you listed ${have}.`);
  if (goals.length) reasons.push(`Fits your goal${goals.length > 1 ? 's' : ''}: ${joinList(goals)}.`);
  return reasons;
}

const skillPoints = ({ exact, related }) => exact.length * 2 + related.length;

export function scoreProject(profile, project) {
  const skills = matchSkills(profile?.skills, project.needed_skills);
  const goals = matchGoals(profile?.goals, project.tags);
  return { score: skillPoints(skills) + goals.length, reasons: explain(skills, goals) };
}

export function scoreMission(profile, task, project, { minutes = null } = {}) {
  const skills = matchSkills(profile?.skills, task.required_skills);
  const goals = matchGoals(profile?.goals, project?.tags);
  const reasons = explain(skills, goals);
  let score = skillPoints(skills) + goals.length;
  const fitsTime = minutes == null || task.estimated_minutes <= minutes;
  if (minutes != null && fitsTime) {
    score += 1;
    reasons.push(`Fits in your ${formatMinutes(minutes)}.`);
  }
  if (task.difficulty === 'beginner') {
    score += 0.5;
    reasons.push('Beginner-friendly.');
  }
  return { score, reasons, fitsTime };
}

const dueTime = (task) => (task.deadline ? Date.parse(task.deadline) : Number.MAX_SAFE_INTEGER);
const contains = (haystack, q) => !q || haystack.toLowerCase().includes(q);

// Open missions, best match first.
export function rankMissions(data, userId, { minutes = null, role = null, difficulty = null, skill = null, text = '' } = {}) {
  const profile = getProfile(data, userId);
  const q = norm(text);
  return data.tasks
    .filter(isOpenMission)
    .map((task) => {
      const project = getProject(data, task.project_id);
      return { task, project, ...scoreMission(profile, task, project, { minutes }) };
    })
    .filter(
      ({ task, project, fitsTime }) =>
        fitsTime &&
        (!role || task.role === role) &&
        (!difficulty || task.difficulty === difficulty) &&
        (!skill || task.required_skills.some((s) => norm(s) === norm(skill))) &&
        contains(`${task.title} ${task.description} ${project?.title ?? ''}`, q),
    )
    .sort((a, b) => b.score - a.score || a.task.estimated_minutes - b.task.estimated_minutes || dueTime(a.task) - dueTime(b.task));
}

export function rankProjects(data, userId, { text = '', skill = null, role = null, poster = null } = {}) {
  const profile = getProfile(data, userId);
  const q = norm(text);
  return data.projects
    .map((project) => ({ project, owner: getUser(data, project.owner_id), ...scoreProject(profile, project) }))
    .filter(
      ({ project, owner }) =>
        (!skill || project.needed_skills.some((s) => norm(s) === norm(skill))) &&
        (!role || project.needed_roles.includes(role)) &&
        (!poster || owner?.type === poster) &&
        contains(`${project.title} ${project.description} ${project.tags.join(' ')}`, q),
    )
    .sort((a, b) => b.score - a.score || a.project.title.localeCompare(b.project.title));
}
