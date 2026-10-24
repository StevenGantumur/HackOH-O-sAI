// Pure read helpers over a data snapshot. Every module reads through these instead of
// re-writing the same queries (AGENTS.md §6.5).

import { REVIEWER_ROLES } from './contracts.js';

const time = (iso) => Date.parse(iso);
const byNewest = (a, b) => time(b.created_at) - time(a.created_at);
const byOldest = (a, b) => time(a.created_at) - time(b.created_at);
const findById = (rows, id) => rows.find((row) => row.id === id) ?? null;

export const getUser = (data, id) => findById(data.users, id);
export const getProject = (data, id) => findById(data.projects, id);
export const getTask = (data, id) => findById(data.tasks, id);
export const getFile = (data, id) => findById(data.files, id);
export const getVersion = (data, id) => findById(data.versions, id);
export const getChannel = (data, id) => findById(data.channels, id);
export const getSubmission = (data, id) => findById(data.submissions, id);
export const getProfile = (data, userId) => data.profiles.find((p) => p.user_id === userId) ?? null;

export const membershipOf = (data, userId, projectId) =>
  data.memberships.find((m) => m.user_id === userId && m.project_id === projectId) ?? null;
export const membershipsOf = (data, userId) => data.memberships.filter((m) => m.user_id === userId);
export const membersOf = (data, projectId) => data.memberships.filter((m) => m.project_id === projectId);
export const projectIdsOf = (data, userId) => new Set(membershipsOf(data, userId).map((m) => m.project_id));

export const isReviewerIn = (data, userId, projectId) => REVIEWER_ROLES.includes(membershipOf(data, userId, projectId)?.role);
export const reviewsAnywhere = (data, userId) => membershipsOf(data, userId).some((m) => REVIEWER_ROLES.includes(m.role));
export const leadsAnywhere = (data, userId) => membershipsOf(data, userId).some((m) => m.role === 'LEADER');
export const reviewersOf = (data, projectId) => membersOf(data, projectId).filter((m) => REVIEWER_ROLES.includes(m.role));

// A Bridge Mission is a Task with the PROPOSED mission fields filled in (§5.1: extend Task,
// don't duplicate it).
export const isMission = (task) => task.estimated_minutes != null;
export const isOpenMission = (task) => isMission(task) && task.status === 'todo' && !task.owner_id;
export const isOverdue = (task, now = Date.now()) => Boolean(task.deadline) && task.status !== 'done' && time(task.deadline) < now;
export const openMissions = (data) => data.tasks.filter(isOpenMission);

export const tasksInProject = (data, projectId) => data.tasks.filter((t) => t.project_id === projectId);
export function tasksInMyProjects(data, userId) {
  const ids = projectIdsOf(data, userId);
  return data.tasks.filter((t) => ids.has(t.project_id));
}

export const submissionsForTask = (data, taskId) => data.submissions.filter((s) => s.task_id === taskId).sort(byNewest);
export const latestSubmission = (data, taskId) => submissionsForTask(data, taskId)[0] ?? null;
export const feedbackFor = (data, submissionId) => data.feedback.filter((f) => f.submission_id === submissionId).sort(byOldest);

export const filesInProject = (data, projectId) => data.files.filter((f) => f.project_id === projectId);
export const versionsForFile = (data, fileId) => data.versions.filter((v) => v.file_id === fileId).sort(byOldest);
export const versionsForTask = (data, taskId) => data.versions.filter((v) => v.task_id === taskId).sort(byNewest);
export const versionsByAuthor = (data, userId) => data.versions.filter((v) => v.author_id === userId).sort(byNewest);
export const versionNumber = (data, version) => versionsForFile(data, version.file_id).findIndex((v) => v.id === version.id) + 1;

// Card counters: artifacts (file versions + submitted links) and feedback received.
export function artifactCount(data, taskId) {
  const links = data.submissions.filter((s) => s.task_id === taskId && s.external_url).length;
  return versionsForTask(data, taskId).length + links;
}
export function feedbackCount(data, taskId) {
  const ids = new Set(submissionsForTask(data, taskId).map((s) => s.id));
  return data.feedback.filter((f) => ids.has(f.submission_id)).length;
}

// Submissions waiting on this user, oldest first, never their own.
export function reviewQueue(data, userId) {
  return data.submissions
    .filter((s) => s.status !== 'reviewed' && s.author_id !== userId)
    .filter((s) => {
      const task = getTask(data, s.task_id);
      return task && isReviewerIn(data, userId, task.project_id);
    })
    .sort(byOldest);
}

export const feedbackGivenBy = (data, userId) => data.feedback.filter((f) => f.reviewer_id === userId).sort(byNewest);

export const channelsInProject = (data, projectId) => data.channels.filter((c) => c.project_id === projectId);
export const messagesIn = (data, channelId) => data.messages.filter((m) => m.channel_id === channelId).sort(byOldest);

export const agentThread = (data, { userId, projectId, role }) =>
  data.agentMessages.filter((m) => m.user_id === userId && m.project_id === projectId && m.role === role).sort(byOldest);
