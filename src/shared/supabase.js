import { createClient } from '@supabase/supabase-js';

export function readSupabaseConfig(env = import.meta.env ?? {}) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server.');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Supabase URL must be a valid project API URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Use the Supabase project API URL, not the dashboard URL.');
  }
  if (key.startsWith('sb_secret_')) throw new Error('A secret key cannot be used in the browser. Use a publishable or legacy anon key.');
  if (key.split('.').length === 3) {
    let role;
    try { role = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role; } catch { throw new Error('The legacy browser key is invalid.'); }
    if (role !== 'anon') throw new Error('Use a legacy anon key, never a service-role key, in the browser.');
  } else if (!key.startsWith('sb_publishable_')) {
    throw new Error('Use a Supabase publishable or legacy anon browser key.');
  }
  return { url: parsed.origin, key };
}

let client;
export function getSupabase() {
  if (!client) {
    const { url, key } = readSupabaseConfig();
    client = createClient(url, key, {
      auth: { storage: window.sessionStorage, storageKey: 'bridge-builder:teamup-auth:v1' },
    });
  }
  return client;
}

// A real, read-only request to Supabase's public Auth configuration endpoint.
// Works before application tables exist. This does not sign in or audit table RLS.
export async function checkSupabaseConnection({ env, signal, request = fetch } = {}) {
  const { url, key } = readSupabaseConfig(env);
  const headers = { apikey: key, Accept: 'application/json' };
  if (!key.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${key}`;
  const response = await request(`${url}/auth/v1/settings`, { headers, signal });
  if (!response.ok) {
    throw new Error(`Supabase Auth returned HTTP ${response.status}. Check the project API URL, browser key, and project availability.`);
  }
  const document = await response.json();
  if (!document.external || typeof document.external.email !== 'boolean' || typeof document.disable_signup !== 'boolean') {
    throw new Error('The response was not a Supabase Auth settings response. Check the API URL.');
  }
  return { host: new URL(url).hostname, emailEnabled: document.external.email, signupEnabled: !document.disable_signup, checkedAt: new Date().toISOString() };
}
