import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSupabase } from '../api/client.js';
import { getCurrentUser, signOutAccount, subscribeToAuth } from '../api/auth.js';
import { loadAccountProfile } from '../api/profiles.js';
import { resolveAccountAccess } from './accountAccess.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [connection] = useState(() => {
    try { return { client: getSupabase() }; } catch (error) { return { error: error.message }; }
  });
  const client = connection.client;
  const [state, setState] = useState({ status: client ? 'loading' : 'error', error: connection.error ?? '', user: null, profile: null });
  const generation = useRef(0);
  const alive = useRef(false);

  const refresh = useCallback(async () => {
    if (!client) return;
    const current = ++generation.current;
    setState({ status: 'loading', user: null, profile: null, error: '' });
    try {
      const { data, error } = await getCurrentUser(client);
      if (!alive.current || current !== generation.current) return;
      if (error) {
        if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403) {
          setState({ status: 'signed_out', user: null, profile: null, error: '' });
          return;
        }
        throw new Error('Could not verify your session. Check your connection and retry.');
      }
      const user = data.user;
      if (!user || !user.email_confirmed_at || user.is_anonymous) {
        setState({ status: resolveAccountAccess(user, null), user, profile: null, error: '' });
        return;
      }
      const result = await loadAccountProfile(user.id, client);
      if (!alive.current || current !== generation.current) return;
      if (result.error) throw new Error('Could not load your account profile. Retry to continue.');
      if (!result.data) throw new Error('Your account profile is missing. Please contact the project administrator.');
      setState({ status: resolveAccountAccess(user, result.data), user, profile: result.data, error: '' });
    } catch (error) {
      if (alive.current && current === generation.current) setState({ status: 'error', user: null, profile: null, error: error.message });
    }
  }, [client]);

  useEffect(() => {
    if (!client) return;
    alive.current = true;
    const unsubscribe = subscribeToAuth((event) => {
      if (!alive.current || event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') {
        generation.current += 1;
        setState({ status: 'signed_out', user: null, profile: null, error: '' });
      } else {
        // Avoid calling other Auth methods while inside Supabase's Auth callback.
        queueMicrotask(() => { if (alive.current) refresh(); });
      }
    }, client);
    refresh();
    return () => { alive.current = false; generation.current += 1; unsubscribe(); };
  }, [client, refresh]);

  async function signOut() {
    const { error } = await signOutAccount(client);
    if (error) throw new Error('Could not sign out. Please retry.');
    generation.current += 1;
    setState({ status: 'signed_out', user: null, profile: null, error: '' });
  }

  return <AuthContext.Provider value={{ ...state, client, refresh, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider.');
  return auth;
}
