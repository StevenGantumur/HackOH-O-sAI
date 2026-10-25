import test from 'node:test';
import assert from 'node:assert/strict';
import { readSupabaseConfig } from './client.js';
import { checkSupabaseConnection } from './connection.js';

const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };

test('configuration identifies missing fields without exposing configured values', () => {
  assert.throws(() => readSupabaseConfig({ VITE_SUPABASE_URL: env.VITE_SUPABASE_URL }), /Set VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.throws(() => readSupabaseConfig({ VITE_SUPABASE_ANON_KEY: 'private-test-value' }), (error) => {
    assert.match(error.message, /Set VITE_SUPABASE_URL/);
    assert.match(error.message, /\.env\.example is only a template/);
    assert.ok(!error.message.includes('private-test-value'));
    return true;
  });
});

test('a whitespace-only publishable value allows a configured legacy anon key', () => {
  const anon = `header.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`;
  assert.equal(readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: '  ', VITE_SUPABASE_ANON_KEY: ` ${anon} ` }).key, anon);
});

test('Supabase configuration rejects missing values, dashboard URLs, and privileged keys', () => {
  assert.throws(() => readSupabaseConfig({}), /Set VITE/);
  assert.throws(() => readSupabaseConfig({ ...env, VITE_SUPABASE_URL: 'https://supabase.com/dashboard/project/example' }), /dashboard/);
  assert.throws(() => readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test' }), /secret key/);
  const serviceKey = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.throws(() => readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: serviceKey }), /service-role/);
});

test('connection check uses the public Auth endpoint and returns safe, real response fields', async () => {
  const controller = new AbortController();
  const result = await checkSupabaseConnection({ env, signal: controller.signal, request: async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/settings');
    assert.equal(options.headers.apikey, env.VITE_SUPABASE_PUBLISHABLE_KEY);
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.signal, controller.signal);
    return new Response(JSON.stringify({ external: { email: true }, disable_signup: true }));
  } });
  assert.equal(result.emailEnabled, true);
  assert.equal(result.signupEnabled, false);
  assert.equal(result.host, 'example.supabase.co');
  assert.equal('key' in result, false);
});

test('connection check surfaces rejected credentials and malformed successful responses', async () => {
  await assert.rejects(checkSupabaseConnection({ env, request: async () => new Response('{}', { status: 401 }) }), /HTTP 401/);
  await assert.rejects(checkSupabaseConnection({ env, request: async () => new Response('{}') }), /not a Supabase Auth/);
});

test('connection check propagates aborted requests instead of reporting success', async () => {
  await assert.rejects(checkSupabaseConnection({ env, request: async () => { throw new DOMException('Aborted', 'AbortError'); } }), { name: 'AbortError' });
});
