import { loadAccountDirectory, updateDirectoryDetails } from '../api/profiles.js';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { store } from '../shared/store.js';
import { ACCOUNT_USER_ID, switchDemoUser } from '../shared/session.js';

const DirectoryContext = createContext(null);

export function AccountDirectoryProvider({ children }) {
  const { client, profile } = useAuth();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const alive = useRef(true);

  const reload = useCallback(async () => {
    setStatus('loading'); setError('');
    try {
      const { data, error: readError } = await loadAccountDirectory(client);
      if (readError) throw new Error('Could not load registered accounts. Please retry.');
      if (!alive.current) return;
      store.registerAccounts(data);
      setStatus('ready'); setVersion((value) => value + 1);
    } catch (readError) {
      if (alive.current) { setError(readError.message); setStatus('error'); }
    }
  }, [client]);

  useEffect(() => {
    alive.current = true;
    try {
      store.registerAccounts([profile]);
      switchDemoUser(ACCOUNT_USER_ID);
      setReady(true);
      reload();
    } catch (error) { setError(error.message); setStatus('error'); }
    return () => { alive.current = false; };
  }, [profile.id, profile.username, reload]);

  async function updateDetails(patch) {
    const { data, error } = await updateDirectoryDetails(profile.id, patch, client);
    if (error) throw new Error('Could not save your profile. Please retry.');
    store.registerAccounts([data]);
    setVersion((value) => value + 1);
    return data;
  }

  return (
    <DirectoryContext.Provider value={{ status, error, reload, updateDetails, version }}>
      {ready ? children : <main><p role={error ? 'alert' : 'status'}>{error || 'Loading your account…'}</p>{error && <button type="button" onClick={() => window.location.reload()}>Retry</button>}</main>}
    </DirectoryContext.Provider>
  );
}

export const useAccountDirectory = () => useContext(DirectoryContext);
