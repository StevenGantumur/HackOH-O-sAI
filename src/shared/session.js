import { useSyncExternalStore } from 'react';

// MOCK: demo-user switching stands in for Supabase Auth (AGENTS.md §5.6). It is NOT access
// control. The choice is kept per browser tab, so two windows can play the student and the
// mentor side by side while sharing the same demo data.

const KEY = 'bridge-builder:demo-user';
export const DEFAULT_USER_ID = 'u-riley';

const listeners = new Set();
let current = readSaved();

function readSaved() {
  try {
    return window.sessionStorage.getItem(KEY) || DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
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
