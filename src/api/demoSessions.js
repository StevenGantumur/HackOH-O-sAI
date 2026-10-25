import { getSupabase } from './client.js';
import { isLiveId } from '../shared/liveRecords.js';

async function callDemo(name, args, client) {
  const { data, error } = await client.rpc(name, args).abortSignal(AbortSignal.timeout(12000));
  if (error) throw new Error(error.message || 'Demo connection failed. Retrying…');
  if (!data) throw new Error('Supabase did not confirm the demo operation.');
  return data;
}

export function joinDemo(partnerId, connectionId, client = getSupabase()) {
  if (!isLiveId(partnerId) || !isLiveId(connectionId)) throw new Error('Choose a registered account for a live demo.');
  return callDemo('join_demo', { partner_id: partnerId, connection_id: connectionId }, client);
}
export const syncDemo = (sessionId, connectionId, cursor, client = getSupabase()) =>
  callDemo('sync_demo', { session_id: sessionId, connection_id: connectionId, after_revision: cursor }, client);
export const writeDemoEvent = (sessionId, connectionId, event, client = getSupabase()) =>
  callDemo('write_demo_event', { session_id: sessionId, connection_id: connectionId, operation_id: event.id, payload: event.payload }, client);
export const leaveDemo = (sessionId, connectionId, client = getSupabase()) =>
  callDemo('leave_demo', { session_id: sessionId, connection_id: connectionId }, client);

// Poll server-confirmed heartbeats and the durable edit journal. This works
// across browsers/devices without enabling public Realtime channels.
export function connectLiveDemo(partnerId, callbacks, client = getSupabase(), timers = window) {
  const connection = crypto.randomUUID();
  let session;
  let cursor = 0;
  let stopped = false;
  let running = false;
  let timer;
  const queue = [];
  const leave = () => { if (session) leaveDemo(session, connection, client).catch(() => {}); };

  async function tick() {
    if (stopped || running) return;
    timers.clearTimeout(timer);
    running = true;
    let nextDelay = 1000;
    try {
      if (!session) {
        const receipt = await joinDemo(partnerId, connection, client);
        if (!isLiveId(receipt.session_id)) throw new Error('Invalid demo room receipt.');
        session = receipt.session_id;
        if (stopped) { leave(); return; }
      }
      const state = await syncDemo(session, connection, cursor, client);
      if (stopped) return;
      if (!Array.isArray(state.events)) throw new Error('Invalid shared document response.');
      callbacks.onEvents(state.events);
      for (const event of state.events) cursor = Math.max(cursor, event.revision);
      // Replay all pages before enabling edits on a returning client.
      const caughtUp = state.events.length < 100;
      callbacks.onState({ connected: state.both_active === true && caughtUp, ready: caughtUp, sessionId: session });
      callbacks.onError('');
      if (!caughtUp) nextDelay = 0;
      if (caughtUp && state.both_active === true) {
        for (let count = 0; queue.length && count < 20 && !stopped; count += 1) {
          await writeDemoEvent(session, connection, queue[0], client);
          queue.shift();
          if (!stopped) callbacks.onPending(queue.length);
        }
        if (queue.length) nextDelay = 0;
      }
    } catch (error) {
      if (!stopped) {
        callbacks.onState({ connected: false, ready: false, sessionId: session });
        callbacks.onError(`${error.message} Your draft is kept here while the connection retries.`);
      }
    } finally {
      running = false;
      if (!stopped) timer = timers.setTimeout(tick, nextDelay);
    }
  }
  tick();
  return {
    send(payload) {
      if (stopped) return;
      // Reuse this operation ID after a lost response: the database deduplicates it.
      queue.push({ id: crypto.randomUUID(), payload });
      callbacks.onPending(queue.length);
      if (!running) { timers.clearTimeout(timer); timer = timers.setTimeout(tick, 120); }
    },
    stop() { stopped = true; timers.clearTimeout(timer); leave(); },
  };
}
