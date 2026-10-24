import { useSyncExternalStore } from 'react';

// MOCK: Tab-local demo history, separate from shared project channels and Supabase.
const KEY = 'bridge-builder:teamup-demo-chats:v1';
const listeners = new Set();
let chats = [];
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
  if (Array.isArray(saved) && saved.every((chat) => Array.isArray(chat.participants) && Array.isArray(chat.messages) && Number.isInteger(chat.number))) chats = saved;
} catch {
  // Storage can be unavailable; new messages will report a save error if so.
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => chats;
export const useDemoChats = () => useSyncExternalStore(subscribe, snapshot);

export function addDemoMessage(senderId, recipientId, text) {
  const content = text.trim();
  if (!content || content.length > 2000 || senderId === recipientId) throw new Error('Choose a recipient and write 1–2,000 characters.');
  const participants = [senderId, recipientId].sort();
  const key = JSON.stringify(participants);
  const existing = chats.find((chat) => chat.key === key);
  const message = { senderId, recipientId, content, createdAt: new Date().toISOString() };
  const updated = existing
    ? { ...existing, messages: [...existing.messages, message] }
    : { key, participants, number: chats.reduce((max, chat) => Math.max(max, chat.number), 0) + 1, messages: [message] };
  const next = existing ? chats.map((chat) => chat.key === key ? updated : chat) : [...chats, updated];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error('Could not save this demo message in this tab. Your draft is still here.');
  }
  chats = next;
  listeners.forEach((listener) => listener());
}
