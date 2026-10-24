import { useMemo, useSyncExternalStore } from 'react';

// Hash routing: no server rewrites needed, and a link like #/tasks?task=t-b1 opens a task
// drawer on any page.

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

const getHash = () => window.location.hash;

export function parseHash(hash) {
  const [path = '', search = ''] = hash.replace(/^#/, '').split('?');
  return { path: path || '/', query: new URLSearchParams(search) };
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getHash);
  return useMemo(() => parseHash(hash), [hash]);
}

export function href(path, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '' && value !== false) query.set(key, String(value));
  }
  const search = query.toString();
  return `#${path}${search ? `?${search}` : ''}`;
}

export function navigate(to, { replace = false } = {}) {
  const target = to.startsWith('#') ? to : `#${to}`;
  if (replace) {
    window.history.replaceState(window.history.state, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

// Merge into the current query. Filters replace history so Back skips every checkbox click.
export function updateQuery(patch, { replace = true } = {}) {
  const { path, query } = parseHash(window.location.hash);
  for (const [key, value] of Object.entries(patch)) {
    const empty = value == null || value === '' || value === false || (Array.isArray(value) && value.length === 0);
    if (empty) query.delete(key);
    else query.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const search = query.toString();
  navigate(`${path}${search ? `?${search}` : ''}`, { replace });
}

// Link to the current page with a task drawer open.
export function taskHref(taskId) {
  const { path, query } = parseHash(window.location.hash);
  query.set('task', taskId);
  return `#${path}?${query.toString()}`;
}

export const openTask = (taskId) => updateQuery({ task: taskId }, { replace: false });
export const closeTask = () => updateQuery({ task: null });

export function matchPath(pattern, path) {
  const want = pattern.split('/').filter(Boolean);
  const have = path.split('/').filter(Boolean);
  if (want.length !== have.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i += 1) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = decodeURIComponent(have[i]);
    else if (want[i] !== have[i]) return null;
  }
  return params;
}
