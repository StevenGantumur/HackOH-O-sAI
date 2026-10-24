import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../../seed/seed.js';
import { ROLES } from '../shared/contracts.js';
import { createMockDb, memoryStorage } from '../shared/mockDb.js';
import { buildAgentContext } from './context.js';
import { generateAgentReply } from './llm.js';
import { coachState, mockCoachReply, planReply } from './mockCoach.js';
import { coachProfile } from './persona.js';
import { BASE_PROMPT } from './prompts/base.js';
import { getSystemPrompt } from './prompts/index.js';
import { teamNoteFor } from './teamNotes.js';

const user = (content) => ({ sender: 'user', content });
const agent = (content) => ({ sender: 'agent', content });
const ask = (role, messages, context = {}) => mockCoachReply({ role, messages, context });
const ATTEMPT = 'Here is my draft so far:\n1. Do you use the bus every day?\n2. What was hard about reaching a stop last time?\n3. Don’t you think ramps matter?';

test('every role prompt starts with the shared coaching rules', () => {
  for (const role of ROLES) assert.ok(getSystemPrompt(role).startsWith(BASE_PROMPT), role);
});

test('"just do it" requests are declined, with a next step offered', () => {
  for (const request of ['Can you just write the interview guide for me?', 'just do it', 'give me the answer', 'Write it for me please']) {
    const reply = ask('RESEARCHER', [user(request)]);
    assert.match(reply, /can’t do the task for you/, request);
    assert.match(reply, /next step/, request);
  }
});

test('every reply ends with one concrete thing for the person to do', () => {
  const messages = ['hi', 'I’m stuck', 'What should I focus on?', 'Explain the key idea', 'Show me a similar example', ATTEMPT, 'Who on my team can help?', 'just do it'];
  for (const role of ['RESEARCHER', 'BUILDER', 'LEADER', 'MENTOR']) {
    for (const text of messages) {
      const lastParagraph = ask(role, [user(text)]).split('\n\n').at(-1);
      assert.match(lastParagraph, /^Your turn: /, `${role}: ${text}`);
    }
  }
});

test('think first: no hint until the person shares an attempt', () => {
  const before = planReply({ role: 'RESEARCHER', messages: [user('hi'), agent('…'), user('I’m stuck')] });
  assert.equal(before.rung, 1);
  assert.match(before.content, /show me where you are/);
  const after = planReply({ role: 'RESEARCHER', messages: [user(ATTEMPT), agent('…'), user('I’m stuck')] });
  assert.equal(after.rung, 3);
  assert.match(after.content, /^Hint:/);
});

test('worked examples unlock only after two attempts', () => {
  const one = planReply({ role: 'RESEARCHER', messages: [user(ATTEMPT), agent('…'), user('Show me a similar example')] });
  assert.equal(one.rung, 1);
  assert.match(one.content, /So far you’ve made 1\./);
  const two = planReply({ role: 'RESEARCHER', messages: [user(ATTEMPT), agent('…'), user(ATTEMPT), agent('…'), user('Show me a similar example')] });
  assert.equal(two.rung, 5);
  assert.deepEqual(coachState([user(ATTEMPT), user('ok'), user(ATTEMPT)]), { attempts: 2, hintsUnlocked: true, exampleUnlocked: true });
});

test('an attempt gets read: the research coach spots yes/no and leading questions', () => {
  const reply = ask('RESEARCHER', [user(ATTEMPT)], { currentTask: { title: 'Guide', criteria: ['Open questions', 'Consent script'] } });
  assert.match(reply, /You wrote 3 questions\./);
  assert.match(reply, /2 questions can be answered with a plain yes or no, like “Do you use the bus every day\?”/);
  assert.match(reply, /“Don’t you think ramps matter\?” hints at the answer you want to hear/);
  assert.match(reply, /1\. Open questions\n2\. Consent script/);
});

test('the first reply names the current task and when it is due', () => {
  const deadline = new Date(Date.now() + 2 * 864e5).toISOString();
  const reply = ask('DESIGNER', [user('hi')], { currentTask: { title: 'Sketch labels', deadline, status: 'in_progress', criteria: [] } });
  assert.match(reply, /“Sketch labels” \(due in 2 days\)/);
});

test('coaches are named for the role and the kind of project', () => {
  const project = Object.fromEntries(seed.projects.map((p) => [p.id, p]));
  assert.equal(coachProfile('BUILDER', project['p-busstop']).title, 'Software engineering coach');
  assert.equal(coachProfile('BUILDER', project['p-grip']).title, 'Hardware engineering coach');
  assert.equal(coachProfile('RESEARCHER', project['p-busstop']).title, 'UX research coach');
  assert.equal(coachProfile('DESIGNER', project['p-grip']).title, 'Product design coach');
});

test('connected coaches share one team context and point people at each other', async () => {
  const db = createMockDb({ seed, storage: memoryStorage(), latency: [0, 0] });
  await db.claimTask({ userId: 'u-riley', taskId: 't-b1' });
  const riley = buildAgentContext(db.getSnapshot(), { userId: 'u-riley', projectId: 'p-busstop' });
  assert.equal(riley.connections[0].name, 'Nia');
  assert.equal(riley.connections[0].kind, 'note');
  assert.ok(riley.connections.some((c) => c.kind === 'reviewer' && c.name === 'Grace'));
  assert.match(ask('RESEARCHER', [user('hi')], riley), /From Nia’s coach: “Nia is lining up five riders/);

  const diego = buildAgentContext(db.getSnapshot(), { userId: 'u-diego', projectId: 'p-busstop' });
  assert.deepEqual(diego.notes, riley.notes);
  assert.deepEqual(diego.board, riley.board);
  assert.equal(diego.coach.title, 'Software engineering coach');
  assert.match(diego.connections[0].text, /Geocode 120 stops/);
});

test('team notes describe the work and never quote the private chat', () => {
  const context = { person: { first: 'Riley' }, currentTask: { title: 'Draft an interview guide', criteria: [] }, project: { title: 'Bus' } };
  const note = teamNoteFor({ role: 'RESEARCHER', messages: [user('honestly I am exhausted and thinking about quitting the team')], context });
  assert.match(note, /^Riley is working on “Draft an interview guide”\. Current focus: /);
  for (const word of ['exhausted', 'quitting', 'honestly']) assert.ok(!note.includes(word), word);
});

test('the leader coach flags unassigned and overdue work but never assigns it', () => {
  const reply = ask('LEADER', [user('What should I focus on?')], {
    unassignedTasks: [{ id: 't1', title: 'Route map' }],
    overdueTasks: [{ id: 't2', title: 'Volume estimate', owner: 'Priya Shah' }],
    awaitingReview: [],
    notes: [{ authorId: 'u-x', author: 'Riley', content: 'Riley is drafting the survey.' }],
  });
  assert.match(reply, /“Route map”/);
  assert.match(reply, /“Volume estimate” is overdue/);
  assert.match(reply, /can’t assign it for you/);
  assert.match(reply, /What your team’s coaches are hearing:\n• Riley is drafting the survey\./);
  assert.match(ask('LEADER', [user('Just assign the tasks for me')]), /can’t make the assignments for you/);
});

test('generateAgentReply returns exactly { content }', async () => {
  const result = await generateAgentReply({ role: 'ANALYST', userId: 'u', projectId: 'p', messages: [user('hi')], context: {} });
  assert.deepEqual(Object.keys(result), ['content']);
  assert.equal(typeof result.content, 'string');
});
