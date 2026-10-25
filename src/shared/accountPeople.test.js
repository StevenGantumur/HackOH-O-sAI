import test from 'node:test';
import assert from 'node:assert/strict';
import { accountPerson, isSamplePerson, peopleForDiscovery } from './accountPeople.js';
import { createMockDb, memoryStorage } from './mockDb.js';
import { seed } from '../../seed/seed.js';
import { SAMPLE_PROJECT_LEADERS } from './sampleLeadership.js';

const live = { id: '00000000-0000-4000-8000-000000000001', username: 'actual_student', email: 'private@example.invalid', major: 'Engineering', skills: ['JavaScript'], goals: ['Accessibility'] };

test('public account shapes exclude email and coexist with sample students', () => {
  assert.deepEqual(accountPerson(live), { id: live.id, name: 'actual_student', type: 'student' });
  assert.equal('email' in accountPerson(live), false);
  const people = peopleForDiscovery([{ id: 'u-riley', name: 'Riley', type: 'student' }, accountPerson(live), { id: 'viewer', name: 'Me', type: 'student' }], 'viewer');
  assert.deepEqual(people.map((person) => person.id), [live.id, 'u-riley']);
  assert.equal(isSamplePerson(people[0]), false);
  assert.equal(isSamplePerson(people[1]), true);
});

test('account mirror preserves the sample cast, ignores private fields, and updates existing names', () => {
  const db = createMockDb({ seed, storage: memoryStorage(), latency: [0, 0] });
  const initialCount = db.getSnapshot().users.length;
  const riley = db.getSnapshot().users.find((person) => person.id === 'u-riley');
  db.registerAccounts([live]);
  db.registerAccounts([{ ...live, username: 'renamed_student' }]);
  const snapshot = db.getSnapshot();
  assert.equal(snapshot.users.length, initialCount + 1);
  assert.equal(snapshot.users.find((person) => person.id === live.id).name, 'renamed_student');
  assert.deepEqual(snapshot.users.find((person) => person.id === 'u-riley'), riley);
  assert.equal(JSON.stringify(snapshot).includes('private@example.invalid'), false);
  assert.equal(db.isSeeded(live.id), false);
  assert.equal(db.isSeeded('u-riley'), true);
});

test('account mirror leaves academic data intact when only the Auth username is refreshed', () => {
  const db = createMockDb({ seed, storage: memoryStorage(), latency: [0, 0] });
  db.registerAccounts([live]);
  db.registerAccounts([{ id: live.id, username: 'new_name' }]);
  const profile = db.getSnapshot().profiles.find((profile) => profile.user_id === live.id);
  assert.deepEqual(profile.skills, ['JavaScript']);
  assert.equal(profile.major, 'Engineering');
});

test('resetting sample work keeps registered identities available', () => {
  const db = createMockDb({ seed, storage: memoryStorage(), latency: [0, 0] });
  db.registerAccounts([live]);
  db.reset();
  assert.equal(db.getSnapshot().users.find((person) => person.id === live.id).name, live.username);
  assert.deepEqual(db.getSnapshot().profiles.find((profile) => profile.user_id === live.id).skills, live.skills);
});

test('registered accounts can still claim a sample mission using their own identity', async () => {
  const db = createMockDb({ seed, storage: memoryStorage(), latency: [0, 0] });
  db.registerAccounts([live]);
  const { task } = await db.claimTask({ userId: live.id, taskId: 't-b1' });
  assert.equal(task.owner_id, live.id);
  assert.equal(db.getSnapshot().memberships.some((member) => member.user_id === live.id && member.project_id === task.project_id), true);
});

test('approved sample leader replaces the old leader and survives rename, reload, and reset', async () => {
  const storage = memoryStorage();
  const db = createMockDb({ seed, storage, latency: [0, 0] });
  const { projectId, userId } = SAMPLE_PROJECT_LEADERS[0];
  const tasksBefore = db.getSnapshot().tasks;
  db.registerAccounts([{ id: userId, username: 'designated_leader' }]);
  db.registerAccounts([{ id: userId, username: 'renamed_leader' }]);
  function verify(snapshot) {
    assert.equal(snapshot.projects.find((project) => project.id === projectId).owner_id, userId);
    const leaders = snapshot.memberships.filter((member) => member.project_id === projectId && member.role === 'LEADER');
    assert.deepEqual(leaders.map((member) => member.user_id), [userId]);
    assert.equal(snapshot.memberships.find((member) => member.project_id === projectId && member.user_id === 'u-leila').role, 'COMMUNICATIONS');
  }
  verify(db.getSnapshot());
  assert.deepEqual(db.getSnapshot().tasks, tasksBefore);
  const reloaded = createMockDb({ seed, storage, latency: [0, 0] });
  verify(reloaded.getSnapshot());
  reloaded.reset(); verify(reloaded.getSnapshot());
  const task = await reloaded.createTask({ userId, projectId, title: 'Leader permission check', role: 'RESEARCHER' });
  assert.equal(task.project_id, projectId);
});

test('a different account with the same name cannot receive sample leadership', () => {
  const db = createMockDb({ seed, storage: memoryStorage(), latency: [0, 0] });
  db.registerAccounts([{ ...live, username: 'aditya_bhosale' }]);
  assert.equal(db.getSnapshot().projects.find((project) => project.id === 'p-compost').owner_id, 'u-leila');
});
