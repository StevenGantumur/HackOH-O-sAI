import { useEffect, useId, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useData } from '../shared/store.js';
import './teamup.css';

// The app-level AuthProvider verifies identity. Sample personas grant no project permissions.
export function MessagingAuth({ me, children }) {
  const { client, user } = useAuth();
  const data = useData();
  const id = useId();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const students = data.users.filter((person) => person.type === 'student');
  const [personaId, setPersonaId] = useState(me.type === 'student' ? me.id : students[0]?.id ?? '');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    client.from('teamup_accounts').select('id, demo_user_id, display_name').eq('id', user.id).maybeSingle()
      .then(({ data: result, error: readError }) => {
        if (!active) return;
        if (readError) throw new Error('Could not load your messaging profile. Please retry.');
        setAccount(result);
      })
      .catch((readError) => { if (active) setError(readError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [client, user.id, revision]);

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

  if (loading) return <p role="status">Loading your messaging profile…</p>;
  return (
    <div className="teamup-live-messaging">
      {error && <div role="alert"><p>{error}</p><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRevision((value) => value + 1)}>Retry</button></div>}
      {account ? <><p className="teamup-live-account">Sample messaging persona: <strong>{account.display_name}</strong></p>{children({ account, client })}</> : (
        <form className="teamup-auth-form" onSubmit={linkPersona}>
          <h2>Choose your sample messaging name</h2>
          <p>This links your account to a fictional demo persona. It grants no project permissions and does not change your username.</p>
          <label htmlFor={id}>Sample persona</label>
          <select id={id} required value={personaId} disabled={pending} onChange={(event) => setPersonaId(event.target.value)}>{students.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
          <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Use this sample name'}</button>
        </form>
      )}
    </div>
  );
}
