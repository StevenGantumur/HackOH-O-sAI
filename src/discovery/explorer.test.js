import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../../seed/seed.js';
import { createMockDb } from '../shared/mockDb.js';
import { projectCollections, readProjectPreference, saveProjectPreference } from './explorer.js';

const data = createMockDb({ seed, latency: [0, 0] }).getSnapshot();
const ids = (items) => items.map(({ project }) => project.id);

test('Discover and My Projects partition the same ranked projects for each user', () => {
  for (const userId of ['u-riley', 'u-leila']) {
    const { discover, mine, counts } = projectCollections(data, userId);
    const memberIds = new Set(data.memberships.filter((membership) => membership.user_id === userId).map((membership) => membership.project_id));
    assert.ok(discover.every(({ project }) => !memberIds.has(project.id)));
    assert.ok(mine.every(({ project }) => memberIds.has(project.id)));
    assert.equal(discover.length, counts.discover);
    assert.equal(mine.length, counts.mine);
    assert.equal(discover.length + mine.length, data.projects.length);
  }
  assert.notDeepEqual(ids(projectCollections(data, 'u-riley').mine), ids(projectCollections(data, 'u-leila').mine));
});

test('search and filters apply to both project collections', () => {
  const filters = { text: 'dashboard', poster: 'faculty', role: 'ANALYST' };
  const { discover, mine } = projectCollections(data, 'u-riley', filters);
  for (const { project, owner } of [...discover, ...mine]) {
    assert.match(`${project.title} ${project.description}`.toLowerCase(), /dashboard/);
    assert.equal(owner.type, 'faculty');
    assert.ok(project.needed_roles.includes('ANALYST'));
  }
  assert.ok(discover.length + mine.length > 0);
});

test('view preferences accept only known choices and survive unavailable storage', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(readProjectPreference(storage, 'view', ['grid', 'list'], 'grid'), 'grid');
  saveProjectPreference(storage, 'view', 'list');
  assert.equal(readProjectPreference(storage, 'view', ['grid', 'list'], 'grid'), 'list');
  saveProjectPreference(storage, 'view', 'unknown');
  assert.equal(readProjectPreference(storage, 'view', ['grid', 'list'], 'grid'), 'grid');
  assert.equal(readProjectPreference({ getItem() { throw new Error('blocked'); } }, 'view', ['grid', 'list'], 'grid'), 'grid');
});
