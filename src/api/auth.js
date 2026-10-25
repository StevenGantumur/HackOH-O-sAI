import { getSupabase } from './client.js';

// Keep SDK results intact so the auth UI can distinguish missing sessions,
// unconfirmed accounts, and network failures.
export const getCurrentUser = (client = getSupabase()) => client.auth.getUser();

export const signIn = ({ email, password }, client = getSupabase()) =>
  client.auth.signInWithPassword({ email, password });

export const signUp = ({ email, password, username }, client = getSupabase()) =>
  client.auth.signUp({ email, password, options: { data: { username } } });

export const signOutAccount = (client = getSupabase()) =>
  client.auth.signOut({ scope: 'local' });

export const subscribeToAuth = (callback, client = getSupabase()) => {
  const { data } = client.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
};
