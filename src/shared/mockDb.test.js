import test from 'node:test';
import assert from 'node:assert/strict';
import { seed, SEED_ANCHOR } from '../../seed/seed.js';
import { createMockDb, memoryStorage } from './mockDb.js';
import { versionsForFile } from './selectors.js';

function makeDb(options = {}) {
  let n = 0;
  return createMockDb({ seed, storage: memoryStorage(), latency: [0, 0], newId: () => `new-${(n += 1)}`, ...options });
}

const taskIn = (db, id) => db.getSnapshot().tasks.find((t) => t.id === id);
const allMeet = (task) => task.review_criteria.map((label) => ({ label, rating: 'meets' }));

test('demo flow: a student claims a mission, submits, and a reviewer approves it', async () => {
  const db = makeDb();
  const { task, joined } = await db.claimTask({ userId: 'u-riley', taskId: 't-b1' });
  assert.equal(task.status, 'in_progress');
  assert.equal(task.owner_id, 'u-riley');
  assert.ok(task.claimed_at);
  assert.deepEqual(joined && { role: joined.role, project: joined.project_id }, { role: 'RESEARCHER', project: 'p-busstop' });

  const submission = await db.submitWork({ userId: 'u-riley', taskId: 't-b1', externalUrl: 'https://example.org/guide', note: 'First draft' });
  assert.equal(submission.status, 'submitted');
  assert.equal(taskIn(db, 't-b1').status, 'review');

  await assert.rejects(
    db.postFeedback({ userId: 'u-grace', submissionId: submission.id, comments: 'Strong start overall.', rubric: { outcome: 'approved', criteria: [] } }),
    /Start the review/,
  );
  const started = await db.startReview({ userId: 'u-grace', submissionId: submission.id });
  assert.equal(started.status, 'under_review');

  await db.postFeedback({
    userId: 'u-grace',
    submissionId: submission.id,
    comments: 'Open questions throughout, and the consent script is clear.',
    rubric: { outcome: 'approved', criteria: allMeet(task), improve: '' },
  });
  const after = db.getSnapshot();
  assert.equal(taskIn(db, 't-b1').status, 'done');
  assert.equal(after.submissions.find((s) => s.id === submission.id).status, 'reviewed');
  assert.equal(after.feedback.at(-1).reviewer_id, 'u-grace');
});

test('a second claim reports who got there first', async () => {
  const db = makeDb();
  await db.claimTask({ userId: 'u-riley', taskId: 't-b1' });
  await assert.rejects(db.claimTask({ userId: 'u-nia', taskId: 't-b1' }), (err) => err.code === 'conflict' && /Riley Nguyen claimed this first/.test(err.message));
});

test('reviewing is limited to the project leader and mentors, never the author', async () => {
  const db = makeDb();
  await assert.rejects(db.startReview({ userId: 'u-riley', submissionId: 's-c3' }), (err) => err.code === 'forbidden');
  await assert.rejects(db.startReview({ userId: 'u-grace', submissionId: 's-c3' }), (err) => err.code === 'forbidden');
  const started = await db.startReview({ userId: 'u-elena', submissionId: 's-c3' });
  assert.equal(started.status, 'under_review');
});

test('mentors cannot claim tasks and staff cannot claim missions as outsiders', async () => {
  const db = makeDb();
  await assert.rejects(db.claimTask({ userId: 'u-elena', taskId: 't-c5' }), (err) => err.code === 'forbidden');
  await assert.rejects(db.claimTask({ userId: 'u-osei', taskId: 't-b1' }), (err) => err.code === 'forbidden');
  await assert.rejects(db.claimTask({ userId: 'u-riley', taskId: 't-g3' }), /Join the project/);
});

test('requesting changes sends the task back and requires a note on what to fix', async () => {
  const db = makeDb();
  await db.startReview({ userId: 'u-elena', submissionId: 's-c3' });
  const base = { userId: 'u-elena', submissionId: 's-c3', comments: 'Concept C reads fastest of the three.' };
  const criteria = allMeet(taskIn(db, 't-c3'));
  await assert.rejects(db.postFeedback({ ...base, rubric: { outcome: 'changes_requested', criteria, improve: ' ' } }), /what needs to change/);
  await db.postFeedback({ ...base, rubric: { outcome: 'changes_requested', criteria, improve: 'Make the icons larger.' } });
  assert.equal(taskIn(db, 't-c3').status, 'in_progress');
});

test('uploads append versions and restoring never rewrites history', async () => {
  const db = makeDb();
  const upload = { name: 'pickup-survey.md', mime: 'text/markdown', size: 12, kind: 'text', data: '# draft 3\n' };
  const v3 = await db.uploadVersion({ userId: 'u-riley', projectId: 'p-compost', fileId: 'f-survey', upload, message: 'Third pass' });
  assert.equal(v3.parent_version_id, 'v-survey-2');
  assert.deepEqual(db.readBlob(v3.storage_ref), { kind: 'text', data: '# draft 3\n' });

  const before = structuredClone(versionsForFile(db.getSnapshot(), 'f-survey').slice(0, 3));
  const restored = await db.restoreVersion({ userId: 'u-riley', versionId: 'v-survey-1' });
  const history = versionsForFile(db.getSnapshot(), 'f-survey');
  assert.equal(history.length, 4);
  assert.deepEqual(history.slice(0, 3), before);
  assert.equal(restored.message, 'Restore v1');
  assert.equal(restored.storage_ref, 'seed/pickup-survey-v1.md');
  assert.equal(db.getSnapshot().files.find((f) => f.id === 'f-survey').current_version_id, restored.id);
});

test('non-members cannot post or upload', async () => {
  const db = makeDb();
  await assert.rejects(db.postMessage({ userId: 'u-riley', channelId: 'ch-bus-general', content: 'hi' }), (err) => err.code === 'forbidden');
  const upload = { name: 'x.txt', mime: 'text/plain', size: 1, kind: 'text', data: 'x' };
  await assert.rejects(db.uploadVersion({ userId: 'u-riley', projectId: 'p-clinic', upload, message: 'x' }), (err) => err.code === 'forbidden');
});

test('submissions need an http(s) link or a file', async () => {
  const db = makeDb();
  await db.claimTask({ userId: 'u-riley', taskId: 't-b1' });
  await assert.rejects(db.submitWork({ userId: 'u-riley', taskId: 't-b1' }), /link or a file/);
  await assert.rejects(db.submitWork({ userId: 'u-riley', taskId: 't-b1', externalUrl: 'javascript:alert(1)' }), /http/);
});

test('state survives a reload, and reset restores the seed', async () => {
  const storage = memoryStorage();
  const first = makeDb({ storage });
  await first.claimTask({ userId: 'u-riley', taskId: 't-b1' });
  const second = makeDb({ storage });
  assert.equal(taskIn(second, 't-b1').owner_id, 'u-riley');
  second.reset();
  assert.equal(taskIn(second, 't-b1').owner_id, null);
  assert.equal(taskIn(makeDb({ storage }), 't-b1').owner_id, null);
});

test('seed dates shift with the clock, so relative deadlines stay relative', () => {
  const tenDays = 10 * 864e5;
  const db = makeDb({ now: () => Date.parse(SEED_ANCHOR) + tenDays });
  const original = seed.tasks.find((t) => t.id === 't-b1').deadline;
  assert.equal(Date.parse(taskIn(db, 't-b1').deadline), Date.parse(original) + tenDays);
});

test('a full disk rejects the write and leaves data unchanged', async () => {
  const storage = memoryStorage();
  const db = makeDb({ storage });
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  await assert.rejects(db.claimTask({ userId: 'u-riley', taskId: 't-b1' }), (err) => err.code === 'storage');
  assert.equal(taskIn(db, 't-b1').owner_id, null);
});

test('team notes: one line per person, members only, removable only by its subject', async () => {
  const db = makeDb();
  const note = (content) => ({ userId: 'u-riley', projectId: 'p-compost', role: 'RESEARCHER', content });
  await assert.rejects(db.setTeamNote({ ...note('x'), projectId: 'p-clinic' }), (err) => err.code === 'forbidden');
  await assert.rejects(db.setTeamNote({ ...note('x'), role: 'DESIGNER' }), (err) => err.code === 'forbidden');

  await db.setTeamNote(note('Riley is drafting the survey.'));
  const latest = await db.setTeamNote(note('Riley is revising the survey.'));
  const rileys = db.getSnapshot().teamNotes.filter((n) => n.author_id === 'u-riley' && n.project_id === 'p-compost');
  assert.deepEqual(rileys.map((n) => n.content), ['Riley is revising the survey.']);
  assert.equal(db.isSeeded(latest.id), false);

  await db.removeTeamNote({ userId: 'u-riley', projectId: 'p-compost' });
  await assert.rejects(db.removeTeamNote({ userId: 'u-riley', projectId: 'p-compost' }), (err) => err.code === 'not_found');
  assert.ok(db.getSnapshot().teamNotes.some((n) => n.author_id === 'u-amara' && n.project_id === 'p-compost'), 'other people’s notes stay');
});

test('only seed records are flagged as sample data', async () => {
  const db = makeDb();
  assert.equal(db.isSeeded('fb-c1'), true);
  await db.claimTask({ userId: 'u-riley', taskId: 't-b1' });
  const submission = await db.submitWork({ userId: 'u-riley', taskId: 't-b1', externalUrl: 'https://example.org/x' });
  assert.equal(db.isSeeded(submission.id), false);
});
