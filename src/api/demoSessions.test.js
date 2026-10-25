import test from 'node:test';
import assert from 'node:assert/strict';
import { connectLiveDemo, joinDemo } from './demoSessions.js';

const room = '00000000-0000-4000-8000-000000000001';
const partner = '00000000-0000-4000-8000-000000000002';
const settle = async () => { for (let i = 0; i < 30; i += 1) await Promise.resolve(); };
function setup(handler) {
  const calls = [];
  const scheduled = new Map();
  let id = 0;
  const observations = { states: [], errors: [], events: [], pending: [] };
  return {
    calls, observations,
    client: { rpc(name, args) { calls.push({ name, args }); return { abortSignal: () => handler(name, args) }; } },
    timers: { clearTimeout: (key) => scheduled.delete(key), setTimeout: (fn) => { scheduled.set(++id, fn); return id; } },
    tick() { const tasks = [...scheduled.values()]; scheduled.clear(); tasks.forEach((fn) => fn()); },
    callbacks: {
      onState: (value) => observations.states.push(value), onError: (value) => observations.errors.push(value),
      onEvents: (value) => observations.events.push(value), onPending: (value) => observations.pending.push(value),
    },
  };
}
const ok = (data) => Promise.resolve({ data, error: null });

test('sample people cannot create a live room and join derives identity on the server', async () => {
  const env = setup(() => ok({ session_id: room }));
  assert.throws(() => joinDemo('u-riley', crypto.randomUUID(), env.client), /registered account/);
  await joinDemo(partner, crypto.randomUUID(), env.client);
  assert.equal(env.calls.length, 1);
  assert.deepEqual(Object.keys(env.calls[0].args).sort(), ['connection_id', 'partner_id']);
});

test('document writes wait for both participants and stop sends leave', async () => {
  let active = false;
  const env = setup((name) => {
    if (name === 'join_demo') return ok({ session_id: room });
    if (name === 'sync_demo') return ok({ events: [], both_active: active });
    return ok({ revision: 1, left: true });
  });
  const connection = connectLiveDemo(partner, env.callbacks, env.client, env.timers);
  await settle();
  connection.send({ kind: 'edit', patch: { nodes: [], deleted: [] } });
  env.tick(); await settle();
  assert.equal(env.calls.filter((call) => call.name === 'write_demo_event').length, 0);
  assert.equal(env.observations.states.at(-1).connected, false);
  active = true; env.tick(); await settle();
  assert.equal(env.calls.filter((call) => call.name === 'write_demo_event').length, 1);
  assert.equal(env.observations.pending.at(-1), 0);
  connection.stop(); await settle();
  assert.equal(env.calls.at(-1).name, 'leave_demo');
});

test('lost save responses retry the same operation and fail closed until recovery', async () => {
  let writes = 0;
  const env = setup((name) => {
    if (name === 'join_demo') return ok({ session_id: room });
    if (name === 'sync_demo') return ok({ events: [], both_active: true });
    if (name === 'write_demo_event' && ++writes === 1) return Promise.resolve({ error: { message: 'Temporary network failure' } });
    return ok({ revision: 1 });
  });
  const connection = connectLiveDemo(partner, env.callbacks, env.client, env.timers);
  await settle(); connection.send({ kind: 'problem', problem: { id: 'phone-words' } });
  env.tick(); await settle();
  assert.equal(env.observations.states.at(-1).connected, false);
  assert.equal(env.observations.pending.at(-1), 1);
  env.tick(); await settle();
  const saved = env.calls.filter((call) => call.name === 'write_demo_event');
  assert.equal(saved.length, 2);
  assert.equal(saved[0].args.operation_id, saved[1].args.operation_id);
  assert.equal(env.observations.pending.at(-1), 0);
  connection.stop();
});

test('closing during join still clears presence when the join eventually completes', async () => {
  let finishJoin;
  const env = setup((name) => name === 'join_demo' ? new Promise((resolve) => { finishJoin = resolve; }) : ok({ left: true }));
  const connection = connectLiveDemo(partner, env.callbacks, env.client, env.timers);
  connection.stop(); finishJoin({ data: { session_id: room }, error: null }); await settle();
  assert.deepEqual(env.calls.map((call) => call.name), ['join_demo', 'leave_demo']);
  assert.equal(env.observations.states.length, 0);
});
