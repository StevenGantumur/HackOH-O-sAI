import { useEffect, useState } from 'react';
import { Page } from '../app/Page.jsx';
import { checkSupabaseConnection } from '../api/connection.js';
import './teamup.css';

export function SupabaseConnectionPage() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    let active = true;
    checkSupabaseConnection({ signal: controller.signal })
      .then((result) => { if (active) setState({ status: 'connected', result }); })
      .catch((error) => {
        if (active) setState({ status: 'error', error: error.name === 'AbortError' ? 'Connection timed out. Check your network and retry.' : error.message });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  return (
    <Page title="Supabase connection" subtitle="Developer check · real, read-only Auth request to your project.">
      <section className="teamup-progress" aria-labelledby="supabase-connection-heading" aria-busy={state.status === 'loading'}>
        <h2 id="supabase-connection-heading">{state.status === 'connected' ? 'Connected to Supabase' : state.status === 'error' ? 'Connection needs attention' : 'Checking Supabase…'}</h2>
        <div className="teamup-connection-details">
          {state.status === 'loading' && <p role="status">Contacting Supabase Auth with the browser key…</p>}
          {state.status === 'error' && <p role="alert">{state.error}</p>}
          {state.result && <div role="status">
            <p><strong>Project:</strong> {state.result.host}</p>
            <p><strong>Email sign-in:</strong> {state.result.emailEnabled ? 'Enabled' : 'Disabled'}</p>
            <p><strong>New account sign-up:</strong> {state.result.signupEnabled ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Last verified:</strong> {new Date(state.result.checkedAt).toLocaleString()}</p>
            <p>The public Auth API is responding. No account was created and no application data was read or changed.</p>
          </div>}
          <p className="teamup-muted">This check verifies the Auth connection, not database permissions or sign-in. Direct messaging has a separate Supabase sign-in; invitations and progress still use labeled demo data.</p>
          <div className="teamup-request-actions">
            <button type="button" className="btn btn-primary" disabled={state.status === 'loading'} onClick={() => setAttempt((value) => value + 1)}>Check again</button>
            <a className="btn btn-outline" href="#/team-up">Back to Team Up</a>
          </div>
        </div>
      </section>
    </Page>
  );
}
