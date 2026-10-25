import { useMemo, useSyncExternalStore } from 'react';
import { seed } from '../../seed/seed.js';
import { createMockDb } from './mockDb.js';
import { getUser } from './selectors.js';
import { DEFAULT_USER_ID, useSessionUserId } from './session.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { accountPerson } from './accountPeople.js';
import { useWorkspace } from './workspaceContext.js';

function browserStorage() {
  try {
    const storage = window.localStorage;
    storage.setItem('bridge-builder:probe', '1');
    storage.removeItem('bridge-builder:probe');
    return storage;
  } catch {
    return null; // private mode or blocked: run in memory
  }
}

// MOCK: Project workspace data only; Auth, account profiles, and direct messages use Supabase.
export const store = createMockDb({ seed, storage: browserStorage() });

// Another tab changed the demo data. Pick it up, so side-by-side student and mentor windows
// stay in sync.
window.addEventListener('storage', (event) => {
  if (event.key === store.key) store.reloadFromStorage();
});

export function useData() {
  const sample = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const workspace = useWorkspace();
  const live = workspace?.snapshot;
  return useMemo(() => live ? { ...sample,
    projects: [...live.projects, ...sample.projects],
    tasks: [...live.tasks, ...sample.tasks],
    memberships: [...live.memberships, ...sample.memberships],
    taskContributors: live.taskContributors,
  } : sample, [sample, live]);
}

export function useMe() {
  const { profile } = useAuth();
  const data = useData();
  const userId = useSessionUserId();
  return getUser(data, userId) ?? (profile ? accountPerson(profile) : getUser(data, DEFAULT_USER_ID));
}
