import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useAccountDirectory } from '../auth/AccountDirectoryProvider.jsx';
import { validateUsername } from '../auth/accountAccess.js';
import { useData } from '../shared/store.js';
import { getProfile } from '../shared/selectors.js';
import { Field, FormError } from '../shared/ui/Field.jsx';

export function AccountProfileEditor() {
  const { profile, client, refresh } = useAuth();
  const directory = useAccountDirectory();
  const data = useData();
  const [username, setUsername] = useState(profile.username);
  const [major, setMajor] = useState(getProfile(data, profile.id)?.major ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function save(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(''); setNotice('');
    try {
      const cleanUsername = validateUsername(username);
      // The RPC commits private username and public major together, or rolls both back.
      const { error: writeError } = await client.rpc('update_my_account_profile', { new_username: cleanUsername, new_major: major.trim() });
      if (writeError) throw new Error(writeError.code === '23505' ? 'That username is taken.' : 'Could not save your profile. Please retry.');
      if (cleanUsername !== profile.username) await refresh();
      else { await directory.reload(); setNotice('Profile saved.'); }
    } catch (saveError) { setError(saveError.message); }
    finally { setPending(false); }
  }

  return (
    <section className="card side-card">
      <h2 className="section-title">Your account details</h2>
      <p className="muted small">Your email is private. Other signed-in users can see your username, major, skills, and goals.</p>
      <form className="auth-form" onSubmit={save}>
        <Field label="Email" hint="Managed by Supabase Auth; visible only to you."><input type="email" value={profile.email} readOnly /></Field>
        <Field label="Username"><input value={username} minLength={3} maxLength={24} required disabled={pending} onChange={(event) => setUsername(event.target.value)} /></Field>
        <Field label="Major" optional><input value={major} maxLength={120} disabled={pending} onChange={(event) => setMajor(event.target.value)} /></Field>
        <FormError>{error}</FormError>
        {notice && <p role="status">{notice}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save account details'}</button>
      </form>
    </section>
  );
}
