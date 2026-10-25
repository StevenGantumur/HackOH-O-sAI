import { readSupabaseConfig } from './client.js';

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
