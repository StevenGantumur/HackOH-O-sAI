import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../../seed/seed.js';
import { activityDateKey, buildContributionCalendar, contributionEvents, shiftDay } from './contributionActivity.js';

function fixture() {
  return {
    projects: [{ id: 'shared' }, { id: 'private' }],
    memberships: [
      { user_id: 'author', project_id: 'shared' },
      { user_id: 'author', project_id: 'private' },
      { user_id: 'viewer', project_id: 'shared' },
      { user_id: 'reviewer', project_id: 'shared' },
    ],
    tasks: [{ id: 'task', project_id: 'shared', owner_id: 'author', status: 'done' }],
    files: [{ id: 'file', project_id: 'shared' }, { id: 'secret', project_id: 'private' }],
    versions: [
      { id: 'v1', file_id: 'file', author_id: 'author', created_at: '2026-10-20T12:00:00Z' },
      { id: 'v2', file_id: 'file', author_id: 'author', created_at: '2026-10-21T12:00:00Z' },
      { id: 'private-v', file_id: 'secret', author_id: 'author', created_at: '2026-10-22T12:00:00Z' },
    ],
    submissions: [{ id: 's1', task_id: 'task', version_id: 'v2', author_id: 'author', status: 'reviewed', created_at: '2026-10-21T12:01:00Z' }],
    feedback: [{ id: 'r1', submission_id: 's1', reviewer_id: 'reviewer', created_at: '2026-10-22T12:00:00Z' }],
  };
}
const options = { now: new Date('2026-10-24T16:00:00Z'), timeZone: 'America/New_York' };

test('submissions and attached uploads count once, at the submission timestamp', () => {
  const data = fixture();
  const events = contributionEvents(data, 'author', 'viewer');
  assert.deepEqual(events.map((event) => event.id), ['version:v1', 'submission:s1']);
  assert.equal(events[1].createdAt, data.submissions[0].created_at);
  assert.equal(buildContributionCalendar(events, options).total, 2);
});

test('reviews count for their reviewer, without another author completion or evidence event', () => {
  const data = fixture();
  assert.deepEqual(contributionEvents(data, 'reviewer', 'reviewer').map((event) => event.id), ['review:r1']);
  assert.equal(contributionEvents(data, 'author', 'viewer').length, 2);
  data.feedback.push({ ...data.feedback[0], id: 'self-review', reviewer_id: 'author' });
  assert.equal(contributionEvents(data, 'author', 'viewer').length, 2);
});

test('visibility is checked before counting or exposing event details', () => {
  const data = fixture();
  assert.equal(contributionEvents(data, 'author', 'author').length, 3);
  assert.equal(contributionEvents(data, 'author', 'viewer').length, 2);
  assert.deepEqual(contributionEvents(data, 'author', 'outsider'), []);
  assert.deepEqual(contributionEvents(data, 'unknown', 'viewer'), []);
});

test('missing timestamps, broken references, and duplicate IDs do not inflate totals', () => {
  const data = fixture();
  data.versions.push(data.versions[0], { id: 'missing', author_id: 'author', file_id: 'file' }, { id: 'bad-date', author_id: 'author', file_id: 'file', created_at: 'invalid' }, { id: 'orphan', author_id: 'author', file_id: 'absent', created_at: '2026-10-20T12:00:00Z' });
  data.submissions.push({ ...data.submissions[0], id: 'orphan-submission', task_id: 'absent' });
  assert.equal(contributionEvents(data, 'author', 'viewer').length, 2);
});

test('invalid submission dates do not hide a valid uploaded version', () => {
  const data = fixture();
  data.submissions[0].created_at = null;
  assert.deepEqual(contributionEvents(data, 'author', 'viewer').map((event) => event.id), ['version:v1', 'version:v2']);
});

test('standalone uploads, restores, link submissions, and separate resubmissions count', () => {
  const data = fixture();
  data.versions.push({ ...data.versions[0], id: 'restored', parent_version_id: 'v2', message: 'Restore v1' });
  data.submissions.push({ ...data.submissions[0], id: 's2', version_id: null, external_url: 'https://example.com/work' });
  assert.equal(contributionEvents(data, 'author', 'viewer').length, 4);
});

test('actual timestamps are bucketed by the chosen local date at midnight and DST boundaries', () => {
  assert.equal(activityDateKey('2026-10-21T02:30:00Z', 'America/New_York'), '2026-10-20');
  assert.equal(activityDateKey('2026-10-21T02:30:00Z', 'UTC'), '2026-10-21');
  assert.equal(activityDateKey('2026-11-01T05:30:00Z', 'America/New_York'), '2026-11-01');
  assert.equal(activityDateKey('2026-11-01T06:30:00Z', 'America/New_York'), '2026-11-01');
  assert.equal(activityDateKey(null), null);
  assert.equal(activityDateKey('invalid'), null);
  assert.equal(shiftDay('2024-02-28', 1), '2024-02-29');
  assert.equal(shiftDay('2026-03-08', 1), '2026-03-09');
});

test('trailing year includes both boundary dates, excludes old and future timestamps', () => {
  const timestamps = ['2025-10-24T16:00:00Z', '2025-10-25T04:00:00Z', '2026-10-24T15:59:00Z', '2026-10-24T16:01:00Z', '2026-10-25T16:00:00Z'];
  const calendar = buildContributionCalendar(timestamps.map((createdAt) => ({ createdAt })), options);
  assert.equal(calendar.start, '2025-10-25');
  assert.equal(calendar.end, '2026-10-24');
  assert.equal(calendar.total, 2);
  assert.equal(calendar.days.length, 365);
  assert.equal(new Set(calendar.days.map((day) => day.date)).size, 365);
  assert.equal(calendar.cells.length % 7, 0);
  assert.equal(new Date(`${calendar.gridStart}T00:00:00Z`).getUTCDay(), 0);
  assert.deepEqual(calendar.cells.filter(Boolean).map((day) => day.date), calendar.days.map((day) => day.date));
});

test('empty and leap-year calendars contain consecutive real days without fabricated activity', () => {
  const calendar = buildContributionCalendar([], { now: new Date('2024-03-01T12:00:00Z'), timeZone: 'UTC' });
  assert.equal(calendar.total, 0);
  assert.ok(calendar.days.some((day) => day.date === '2024-02-29'));
  assert.ok(calendar.days.every((day) => day.events.length === 0));
});

test('shared seed counts match source records and remain deterministic across refresh-like copies', () => {
  const riley = contributionEvents(seed, 'u-riley', 'u-riley');
  assert.deepEqual(new Set(riley.map((event) => event.id)), new Set(['version:v-survey-1', 'version:v-survey-2', 'submission:s-c1']));
  const elena = contributionEvents(seed, 'u-elena', 'u-elena');
  assert.deepEqual(elena.map((event) => event.id), ['review:fb-c1', 'version:v-checkin-1']);
  const before = buildContributionCalendar(riley, options);
  const after = buildContributionCalendar(contributionEvents(structuredClone(seed), 'u-riley', 'u-riley'), options);
  assert.deepEqual(before, after);
  assert.equal(before.total, 3);
});
