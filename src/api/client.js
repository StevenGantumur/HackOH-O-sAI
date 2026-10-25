import { createClient } from '@supabase/supabase-js';

export function readSupabaseConfig(env = import.meta.env ?? {}) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    const missing = [!url && 'VITE_SUPABASE_URL', !key && 'VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY)'].filter(Boolean);
    throw new Error(`Set ${missing.join(' and ')} in a project-root .env or .env.local file, then restart the dev server. .env.example is only a template and is not loaded.`);
  }
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

