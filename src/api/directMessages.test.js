import test from 'node:test';
import assert from 'node:assert/strict';
import { loadChatList, loadDirectMessages, sendDirectMessage } from './directMessages.js';

const author = '00000000-0000-4000-8000-000000000001';
const recipient = '00000000-0000-4000-8000-000000000002';

function fakeClient({ user = { id: author }, error = null } = {}) {
  const calls = [];
  const row = { id: 'message-1', author_id: author, recipient_id: recipient, content: 'Hello', created_at: '2026-10-24T21:00:00Z' };
  return { calls, row, auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      calls.push({ table });
      return { insert(payload) {
        calls.push(payload);
        return { select: () => ({ single: async () => ({ data: error ? null : row, error }) }) };
      } };
    },
  };
}

test('message write derives its author from Auth and returns the confirmed database row', async () => {
  const client = fakeClient();
  const row = await sendDirectMessage({ recipientId: recipient, content: ' Hello ', authorId: 'forged-author' }, client);
  assert.deepEqual(client.calls, [{ table: 'direct_messages' }, { author_id: author, recipient_id: recipient, content: 'Hello' }]);
  assert.equal(row, client.row);
});

test('message history filters both participants and reverses the latest page into chronological order', async () => {
  let filter;
  const query = {
    select: () => query,
    or: (value) => { filter = value; return query; },
    order: () => query,
    limit: async (value) => { assert.equal(value, 100); return { data: [{ id: 'newer' }, { id: 'older' }], error: null }; },
  };
  const client = { auth: { getUser: async () => ({ data: { user: { id: author } }, error: null }) }, from: () => query };
  assert.deepEqual(await loadDirectMessages(recipient, client), [{ id: 'older' }, { id: 'newer' }]);
  assert.equal(filter, `and(author_id.eq.${author},recipient_id.eq.${recipient}),and(author_id.eq.${recipient},recipient_id.eq.${author})`);
});

test('unauthenticated, invalid recipient, self-message, and empty message do not write', async () => {
  const client = fakeClient({ user: null });
  await assert.rejects(sendDirectMessage({ recipientId: recipient, content: 'Hello' }, client), /Sign in/);
  await assert.rejects(sendDirectMessage({ recipientId: 'u-leila', content: 'Hello' }, client), /registered account/);
  await assert.rejects(sendDirectMessage({ recipientId: author, content: 'Hello' }, fakeClient()), /another student/);
  await assert.rejects(sendDirectMessage({ recipientId: recipient, content: ' ' }, client), /Write a message/);
  assert.equal(client.calls.length, 0);
});

test('a database failure is surfaced instead of reported as a sent message', async () => {
  await assert.rejects(sendDirectMessage({ recipientId: recipient, content: 'Hello' }, fakeClient({ error: { code: '42501' } })), /not saved/);
});

test('chat list groups both message directions and keeps the latest message per known peer', async () => {
  const newest = { author_id: recipient, recipient_id: author, created_at: '2026-10-24T22:00:00Z' };
  const history = [newest, { author_id: author, recipient_id: recipient }, { author_id: author, recipient_id: 'unavailable' }];
  const client = { from(table) {
    if (table === 'account_directory') return { select: async () => ({ data: [{ id: recipient, username: 'Sample' }], error: null }) };
    const query = { select: () => query, order: () => query, limit: async () => ({ data: history, error: null }) };
    return query;
  } };
  assert.deepEqual(await loadChatList(author, client), [{ person: { id: recipient, username: 'Sample' }, last: newest, count: 2 }]);
});

test('chat list rejects failed reads instead of treating them as an empty inbox', async () => {
  const client = { from(table) {
    if (table === 'account_directory') return { select: async () => ({ data: [], error: null }) };
    const query = { select: () => query, order: () => query, limit: async () => ({ data: null, error: { code: '42501' } }) };
    return query;
  } };
  await assert.rejects(loadChatList(author, client), /Could not load your chat list/);
});
