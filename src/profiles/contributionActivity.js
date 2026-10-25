import { getFile, getProject, getSubmission, getTask, projectIdsOf } from '../shared/selectors.js';

// Calendar arithmetic uses UTC date-only values; event timestamps are grouped in the
// viewer's time zone. This avoids DST creating skipped or duplicated calendar days.
const DAY = 86400000;
export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function activityDateKey(timestamp, timeZone = localTimeZone()) {
  if (typeof timestamp !== 'string' || !timestamp.trim()) return null;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export const dayTimestamp = (key) => Date.parse(`${key}T00:00:00Z`);
export const shiftDay = (key, offset) => new Date(dayTimestamp(key) + offset * DAY).toISOString().slice(0, 10);
export const activityDateLabel = (key, options = {}) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric', ...options,
}).format(new Date(dayTimestamp(key)));

// Read-only projection of the shared snapshot. Tasks have no completion timestamp,
// and a reviewed submission / evidence card is not a second event for its author.
export function contributionEvents(data, userId, viewerId) {
  const visibleProjects = projectIdsOf(data, viewerId);
  const events = new Map();
  const submittedVersions = new Set();
  const canSee = (projectId) => visibleProjects.has(projectId) && Boolean(getProject(data, projectId));
  const validDate = (value) => typeof value === 'string' && value.trim() && Number.isFinite(Date.parse(value));

  for (const submission of data.submissions) {
    const task = getTask(data, submission.task_id);
    if (submission.author_id !== userId || !task || !canSee(task.project_id) || !validDate(submission.created_at)) continue;
    events.set(`submission:${submission.id}`, {
      id: `submission:${submission.id}`, kind: 'submission', sourceId: submission.id,
      projectId: task.project_id, taskId: task.id, title: task.title,
      createdAt: submission.created_at,
    });
    // submitWork creates its attached Version in the same operation. Count the
    // submission at its timestamp, not both the submission and its upload.
    if (submission.version_id) submittedVersions.add(submission.version_id);
  }

  for (const version of data.versions) {
    const file = getFile(data, version.file_id);
    if (version.author_id !== userId || submittedVersions.has(version.id) || !file || !canSee(file.project_id) || !validDate(version.created_at)) continue;
    events.set(`version:${version.id}`, {
      id: `version:${version.id}`, kind: 'version', sourceId: version.id,
      projectId: file.project_id, fileId: file.id, versionId: version.id,
      title: file.name, message: version.message, createdAt: version.created_at,
    });
  }

  for (const feedback of data.feedback) {
    const submission = getSubmission(data, feedback.submission_id);
    const task = submission && getTask(data, submission.task_id);
    if (feedback.reviewer_id !== userId || submission?.author_id === userId || !task || !canSee(task.project_id) || !validDate(feedback.created_at)) continue;
    events.set(`review:${feedback.id}`, {
      id: `review:${feedback.id}`, kind: 'review', sourceId: feedback.id,
      projectId: task.project_id, taskId: task.id, title: task.title,
      createdAt: feedback.created_at,
    });
  }
  return [...events.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}

export function buildContributionCalendar(events, { now = new Date(), timeZone = localTimeZone() } = {}) {
  const end = activityDateKey(now.toISOString(), timeZone);
  const start = shiftDay(end, -364);
  const gridStart = shiftDay(start, -new Date(dayTimestamp(start)).getUTCDay());
  const byDay = new Map();
  for (const event of events) {
    const key = activityDateKey(event.createdAt, timeZone);
    if (!key || key < start || key > end || Date.parse(event.createdAt) > now.getTime()) continue;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(event);
  }
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = shiftDay(start, index);
    return { date, events: byDay.get(date) ?? [] };
  });
  const offset = Math.round((dayTimestamp(start) - dayTimestamp(gridStart)) / DAY);
  const columns = Math.ceil((offset + days.length) / 7);
  const cells = Array.from({ length: columns * 7 }, (_, index) => {
    const dayIndex = index - offset;
    return dayIndex >= 0 && dayIndex < days.length ? { ...days[dayIndex], index: dayIndex } : null;
  });
  return { start, end, gridStart, columns, cells, days, total: days.reduce((sum, day) => sum + day.events.length, 0) };
}
