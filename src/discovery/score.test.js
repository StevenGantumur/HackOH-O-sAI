import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../../seed/seed.js';
import { createMockDb } from '../shared/mockDb.js';
import { rankMissions, rankProjects, scoreProject } from './score.js';

const data = createMockDb({ seed, latency: [0, 0] }).getSnapshot();

test('the demo student’s top mission is the interview guide, with plain reasons', () => {
  const [top] = rankMissions(data, 'u-riley');
  assert.equal(top.task.id, 't-b1');
  assert.equal(top.reasons[0], 'Needs User Interviews and Survey Design, which you listed.');
  assert.ok(top.reasons.includes('Fits your goal: UX research.'));
});

test('related skills explain themselves', () => {
  const result = scoreProject({ skills: ['SolidWorks'], goals: [] }, { needed_skills: ['CAD'], tags: [] });
  assert.deepEqual(result, { score: 1, reasons: ['Needs CAD; you listed SolidWorks.'] });
});

test('the time filter drops missions that need longer', () => {
  const ranked = rankMissions(data, 'u-riley', { minutes: 30 });
  assert.ok(ranked.length > 0);
  assert.ok(ranked.every(({ task }) => task.estimated_minutes <= 30));
  assert.ok(ranked[0].reasons.includes('Fits in your 30 min.'));
});

test('only open missions are listed', () => {
  const ids = rankMissions(data, 'u-riley').map(({ task }) => task.id);
  assert.ok(!ids.includes('t-c3'), 'claimed mission should not be listed');
  assert.ok(!ids.includes('t-c2'), 'ordinary tasks are not missions');
});

test('project search filters by poster type and needed role', () => {
  const faculty = rankProjects(data, 'u-riley', { poster: 'faculty' }).map(({ project }) => project.id);
  assert.deepEqual(faculty.sort(), ['p-clinic', 'p-grip']);
  const builders = rankProjects(data, 'u-riley', { role: 'BUILDER' }).map(({ project }) => project.id);
  assert.ok(builders.every((id) => data.projects.find((p) => p.id === id).needed_roles.includes('BUILDER')));
});
