import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessageHistory, startAutoRefresh } from './autoRefresh.js';

function environment() {
  const pending = new Map();
  let id = 0;
  const page = new EventTarget();
  page.visibilityState = 'visible';
  return {
    page, events: new EventTarget(),
    timers: { setTimeout: (callback) => { pending.set(++id, callback); return id; }, clearTimeout: (key) => pending.delete(key) },
    tick: () => { const tasks = [...pending.values()]; pending.clear(); tasks.forEach((callback) => callback()); },
    pending,
  };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('auto refresh loads incoming replies without a manual event, pauses hidden tabs, and resumes on focus', async () => {
  const env = environment();
  const received = [];
  let reads = 0;
  const stop = startAutoRefresh(async () => ++reads, (value) => received.push(value), assert.fail, env);
  await settle(); env.tick(); await settle();
  assert.deepEqual(received, [1, 2]);
  env.page.visibilityState = 'hidden';
  env.tick(); await settle();
  assert.equal(reads, 2);
  env.page.visibilityState = 'visible';
  env.events.dispatchEvent(new Event('focus')); await settle();
  assert.deepEqual(received, [1, 2, 3]);
  stop();
  assert.equal(env.pending.size, 0);
  env.events.dispatchEvent(new Event('focus')); await settle();
  assert.equal(reads, 3);
});

test('refreshes never overlap and ignore in-flight results after cleanup', async () => {
  const env = environment();
  let resolve;
  let reads = 0;
  const received = [];
  const stop = startAutoRefresh(() => { reads += 1; return new Promise((done) => { resolve = done; }); }, (value) => received.push(value), assert.fail, env);
  env.events.dispatchEvent(new Event('focus'));
  env.events.dispatchEvent(new Event('teamup-message-saved'));
  assert.equal(reads, 1);
  stop(); resolve('stale'); await settle();
  assert.deepEqual(received, []);
  assert.equal(env.pending.size, 0);
});

test('a failed background read retries and recovers', async () => {
  const env = environment();
  let reads = 0;
  const errors = [];
  const received = [];
  const stop = startAutoRefresh(async () => { if (++reads === 1) throw new Error('offline'); return 'reply'; }, (value) => received.push(value), (error) => errors.push(error.message), env);
  await settle(); env.tick(); await settle(); stop();
  assert.deepEqual(errors, ['offline']);
  assert.deepEqual(received, ['reply']);
});

test('an older history read does not erase a newly saved message or duplicate rows', () => {
  const old = { id: 'one', created_at: '2026-10-24T10:00:00Z' };
  const sent = { id: 'two', created_at: '2026-10-24T10:01:00Z' };
  assert.deepEqual(mergeMessageHistory([old, sent], [old]), [old, sent]);
  assert.deepEqual(mergeMessageHistory([old], [old, sent]), [old, sent]);
});
