// React screens use this from an effect and return stop() during cleanup.
// Refresh after each completed request, so slow connections never overlap reads.
export function startAutoRefresh(load, onData, onError, {
  delay = 3000, page = document, events = window, timers = window,
} = {}) {
  let stopped = false;
  let running = false;
  let queued = false;
  let timer;

  async function refresh() {
    if (stopped) return;
    timers.clearTimeout(timer);
    if (running) { queued = true; return; }
    if (page.visibilityState === 'hidden') return;
    running = true;
    try {
      const data = await load();
      if (!stopped) onData(data);
    } catch (error) {
      if (!stopped) onError(error);
    } finally {
      running = false;
      if (!stopped) {
        if (queued) { queued = false; refresh(); }
        else timer = timers.setTimeout(refresh, delay);
      }
    }
  }

  const onVisible = () => { if (page.visibilityState !== 'hidden') refresh(); };
  page.addEventListener('visibilitychange', onVisible);
  events.addEventListener('focus', onVisible);
  events.addEventListener('online', onVisible);
  events.addEventListener('teamup-message-saved', refresh);
  refresh();

  return () => {
    stopped = true;
    timers.clearTimeout(timer);
    page.removeEventListener('visibilitychange', onVisible);
    events.removeEventListener('focus', onVisible);
    events.removeEventListener('online', onVisible);
    events.removeEventListener('teamup-message-saved', refresh);
  };
}

// An older background read must not erase a message just confirmed by Send.
export function mergeMessageHistory(previous, incoming) {
  const rows = new Map(previous.map((message) => [message.id, message]));
  for (const message of incoming) rows.set(message.id, message);
  return [...rows.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)).slice(-100);
}
