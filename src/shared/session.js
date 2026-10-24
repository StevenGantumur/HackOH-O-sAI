import { useSyncExternalStore } from 'react';

// MOCK: Sample-persona selection affects only demo project views, never Supabase Auth or
// message access. The 'account' selection uses the verified account's own username/UUID.
// Kept per tab so the fictional student and mentor can still be demonstrated side by side.

const KEY = 'bridge-builder:demo-user';
export const DEFAULT_USER_ID = 'u-riley';
export const ACCOUNT_USER_ID = 'account';

const listeners = new Set();
let current = readSaved();

function readSaved() {
  try {
    return window.sessionStorage.getItem(KEY) || ACCOUNT_USER_ID;
  } catch {
    return ACCOUNT_USER_ID;
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getUserId = () => current;

export function switchDemoUser(userId) {
  current = userId;
  try {
    window.sessionStorage.setItem(KEY, userId);
  } catch {
    /* tab-only state is fine */
  }
  listeners.forEach((listener) => listener());
}

export function useSessionUserId() {
  return useSyncExternalStore(subscribe, getUserId);
}
