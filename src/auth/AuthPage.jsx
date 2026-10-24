import { useRef, useState } from 'react';
import { Field, FormError } from '../shared/ui/Field.jsx';
import { Logo } from '../shared/ui/Logo.jsx';
import { useAuth } from './AuthProvider.jsx';
import { validateUsername } from './accountAccess.js';
import './auth.css';

export function AuthPage() {
  const auth = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submitting = useRef(false);
  const setup = auth.status === 'needs_profile';
  const loading = auth.status === 'loading';

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setPending(true); setError(''); setNotice('');
    try {
      if (setup) {
        const next = validateUsername(username);
        const result = await auth.client.from('account_profiles').update({ username: next }).eq('id', auth.user.id).select('id').single();
        if (result.error) throw new Error(result.error.code === '23505' ? 'That username is taken. Choose another.' : 'Could not save your username. Please retry.');
        await auth.refresh();
      } else {
        if (mode === 'signup') validateUsername(username);
        const result = mode === 'signup'
          ? await auth.client.auth.signUp({ email: email.trim(), password, options: { data: { username: validateUsername(username) } } })
          : await auth.client.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
        if (mode === 'signup' && !result.data.session) {
          setNotice('Check your email to confirm your account, then return here to sign in.');
          setMode('signin');
        }
        setPassword('');
      }
    } catch (error) { setError(error.message || 'Could not complete your request. Please retry.'); }
    finally { submitting.current = false; setPending(false); }
  }

  async function signOut() {
    setPending(true); setError('');
    try { await auth.signOut(); } catch (error) { setError(error.message); }
    finally { setPending(false); }
  }

  return (
    <main className="auth-screen">
      <title>{mode === 'signup' ? 'Create account – sAI' : 'Sign in – sAI'}</title>
      <section className="auth-card" aria-labelledby="auth-title">
        <Logo />
        <div className="auth-heading">
          <p className="auth-eyebrow">SMALL CONTRIBUTIONS. REAL CONNECTIONS.</p>
          <h1 id="auth-title">{loading ? 'Checking your session…' : setup ? 'Choose your username' : mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p>{setup ? 'Finish your profile to enter Bridge Builder.' : 'Sign in to find your team and start building together.'}</p>
        </div>
        <FormError>{error || auth.error}</FormError>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {loading ? <p role="status">Verifying your account with Supabase…</p> : auth.status === 'error' ? (
          <button type="button" className="btn btn-primary btn-block" disabled={!auth.client} onClick={auth.refresh}>Retry connection</button>
        ) : auth.status === 'confirm_email' ? (
          <><p role="status">Confirm your email address before entering the site.</p><button type="button" className="btn btn-primary" onClick={auth.refresh}>I’ve confirmed my email</button><button type="button" className="btn btn-ghost" disabled={pending} onClick={signOut}>Back to sign in</button></>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {!setup && <Field label="Email"><input type="email" autoComplete="email" required value={email} disabled={pending} onChange={(event) => setEmail(event.target.value)} /></Field>}
            {(mode === 'signup' || setup) && <Field label="Username" hint="3–24 characters. Start with a letter; use letters, numbers, or underscores."><input type="text" autoComplete="username" minLength={3} maxLength={24} required value={username} disabled={pending} onChange={(event) => setUsername(event.target.value)} /></Field>}
            {!setup && <Field label="Password"><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required value={password} disabled={pending} onChange={(event) => setPassword(event.target.value)} /></Field>}
            <button type="submit" className="btn btn-primary btn-block" disabled={pending}>{pending ? 'Please wait…' : setup ? 'Save username and continue' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
            {setup ? <button type="button" className="btn btn-ghost btn-block" disabled={pending} onClick={signOut}>Sign out</button> : <p className="auth-switch">{mode === 'signin' ? 'New to Bridge Builder?' : 'Already have an account?'} <button type="button" disabled={pending} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); setPassword(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>}
          </form>
        )}
        <p className="auth-footer">HackOHI/O student project · Not an official Ohio State service.</p>
      </section>
    </main>
  );
}
