import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../shared/contracts.js';
import { BASE_PROMPT } from './prompts/base.js';
import { getSystemPrompt } from './prompts/index.js';
import { mockCoachReply } from './mockCoach.js';
import { generateAgentReply } from './llm.js';

const ask = (role, content, context = {}, history = []) => mockCoachReply({ role, messages: [...history, { sender: 'user', content }], context });

test('every role prompt starts with the shared coaching rules', () => {
  for (const role of ROLES) assert.ok(getSystemPrompt(role).startsWith(BASE_PROMPT), role);
});

test('"just do it" requests are declined, with a next step offered', () => {
  for (const request of ['Can you just write the interview guide for me?', 'just do it', 'give me the answer', 'Write it for me please']) {
    const reply = ask('RESEARCHER', request);
    assert.match(reply, /can’t do the task for you/, request);
    assert.match(reply, /next step/, request);
  }
});

test('the first reply names the current task and when it is due', () => {
  const deadline = new Date(Date.now() + 2 * 864e5).toISOString();
  const reply = ask('DESIGNER', 'hi', { currentTask: { title: 'Sketch labels', deadline, criteria: [] } });
  assert.match(reply, /“Sketch labels” \(due in 2 days\)/);
});

test('asking for a review walks through the task’s real criteria', () => {
  const reply = ask('RESEARCHER', 'Can you review my draft?', { currentTask: { title: 'Guide', criteria: ['Open questions', 'Consent script'] } });
  assert.match(reply, /1\. Open questions\n2\. Consent script/);
});

test('the leader coach flags unassigned and overdue work but never assigns it', () => {
  const reply = ask('LEADER', 'What should I focus on?', {
    unassignedTasks: [{ id: 't1', title: 'Route map' }],
    overdueTasks: [{ id: 't2', title: 'Volume estimate', owner: 'Priya Shah' }],
    awaitingReview: [],
  });
  assert.match(reply, /“Route map”/);
  assert.match(reply, /“Volume estimate” is overdue/);
  assert.match(reply, /can’t assign it for you/);
});

test('generateAgentReply returns exactly { content }', async () => {
  const result = await generateAgentReply({ role: 'ANALYST', userId: 'u', projectId: 'p', messages: [{ sender: 'user', content: 'hi' }], context: {} });
  assert.deepEqual(Object.keys(result), ['content']);
  assert.equal(typeof result.content, 'string');
});
