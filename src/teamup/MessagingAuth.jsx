import { useEffect, useId, useState } from 'react';
import { getSupabase } from '../shared/supabase.js';
import { useData } from '../shared/store.js';
import './teamup.css';

// Auth is real. The selected display persona is fictional and grants no project permissions.
export function MessagingAuth({ me, children }) {
  const data = useData();
  const id = useId();
  const [connection] = useState(() => {
    try { return { client: getSupabase() }; } catch (error) { return { error: error.message }; }
  });
  const client = connection.client;
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [revision, setRevision] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const students = data.users.filter((person) => person.type === 'student');
  const [personaId, setPersonaId] = useState(me.type === 'student' ? me.id : students[0]?.id ?? '');

  useEffect(() => {
    if (!client) return;
    let active = true;
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setAccount(null); }
    });
    client.auth.getUser().then(({ data: result }) => {
      if (active) { setUser(result.user ?? null); setLoading(false); }
    }).catch(() => { if (active) { setError('Could not check your sign-in. Retry below.'); setLoading(false); } });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [client, revision]);

  useEffect(() => {
    if (!client || !user) return;
    let active = true;
    setLoading(true);
    client.from('teamup_accounts').select('id, demo_user_id, display_name').eq('id', user.id).maybeSingle()
      .then(({ data: result, error: readError }) => {
        if (active) {
          setAccount(result);
          if (readError) setError('Could not load your messaging profile. Retry below.');
          setLoading(false);
        }
      }).catch(() => { if (active) { setError('Could not load your messaging profile. Retry below.'); setLoading(false); } });
    return () => { active = false; };
  }, [client, user, revision]);

  async function authenticate(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(''); setNotice('');
    try {
      const result = mode === 'signup'
        ? await client.auth.signUp({ email: email.trim(), password })
        : await client.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      setPassword('');
      if (mode === 'signup' && !result.data.session) {
        setNotice('Check your email to confirm your account, then return here and sign in.');
        setMode('signin');
      }
    } catch (authError) { setError(authError.message || 'Sign-in failed. Please retry.'); }
    finally { setPending(false); }
  }

  async function linkPersona(event) {
    event.preventDefault();
    if (pending) return;
    const persona = students.find((person) => person.id === personaId);
    if (!persona) return;
    setPending(true); setError('');
    try {
      const { data: result, error: writeError } = await client.from('teamup_accounts')
        .insert({ id: user.id, demo_user_id: persona.id, display_name: persona.name })
        .select('id, demo_user_id, display_name').single();
      if (writeError) throw new Error(writeError.code === '23505' ? 'That sample persona is already linked. Choose another.' : 'Could not save your messaging profile. Please retry.');
      setAccount(result);
    } catch (writeError) { setError(writeError.message); }
    finally { setPending(false); }
  }

  async function signOut() {
    setPending(true); setError('');
    try {
      const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      setUser(null); setAccount(null);
    } catch { setError('Could not sign out. Please retry.'); }
    finally { setPending(false); }
  }

  if (connection.error) return <p role="alert">{connection.error}</p>;
  if (loading) return <p role="status">Loading secure messaging…</p>;

  return (
    <div className="teamup-live-messaging">
      {error && <div role="alert"><p>{error}</p><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRevision((value) => value + 1)}>Retry connection</button></div>}
      {notice && <p role="status">{notice}</p>}
      {!user ? (
        <form className="teamup-auth-form" onSubmit={authenticate}>
          <h2>{mode === 'signup' ? 'Create a messaging account' : 'Sign in to send messages'}</h2>
          <p>Messaging uses Supabase Auth. The sample-user menu does not sign you in.</p>
          <label htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor={`${id}-password`}>Password</label>
          <input id={`${id}-password`} type="password" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} />
          <div className="teamup-request-actions">
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'Create an account' : 'Use an existing account'}</button>
          </div>
        </form>
      ) : !account ? (
        <form className="teamup-auth-form" onSubmit={linkPersona}>
          <h2>Choose your sample messaging name</h2>
          <p>This links your account to a fictional demo persona. It grants no project memberships or permissions.</p>
          <label htmlFor={`${id}-persona`}>Sample persona</label>
          <select id={`${id}-persona`} required value={personaId} onChange={(event) => setPersonaId(event.target.value)}>{students.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
          <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Use this sample name'}</button>
          <button className="btn btn-ghost" type="button" disabled={pending} onClick={signOut}>Sign out</button>
        </form>
      ) : (
        <>
          <div className="teamup-live-account"><span>Messaging as <strong>{account.display_name}</strong> · Supabase connected</span><button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={signOut}>Sign out</button></div>
          {children({ account, client })}
        </>
      )}
    </div>
  );
}
