import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUsername, resolveAccountAccess, validateUsername } from './accountAccess.js';

const user = { id: 'account-a', email_confirmed_at: '2026-10-24T20:00:00Z' };
const profile = { id: user.id, username: 'riley_demo' };

test('only a confirmed account with its own completed profile can open app routes', () => {
  assert.equal(resolveAccountAccess(null, profile), 'signed_out');
  assert.equal(resolveAccountAccess({ ...user, is_anonymous: true }, profile), 'signed_out');
  assert.equal(resolveAccountAccess({ ...user, email_confirmed_at: null }, profile), 'confirm_email');
  assert.equal(resolveAccountAccess(user, null), 'needs_profile');
  assert.equal(resolveAccountAccess(user, { ...profile, id: 'other-account' }), 'needs_profile');
  assert.equal(resolveAccountAccess(user, { ...profile, username: null }), 'needs_profile');
  assert.equal(resolveAccountAccess(user, profile), 'authenticated');
});

test('username validation normalizes names and rejects invalid or oversized input', () => {
  assert.equal(normalizeUsername(' Riley_Demo '), 'riley_demo');
  assert.equal(validateUsername(' Riley_Demo '), 'riley_demo');
  for (const value of ['', 'ab', '1riley', 'hello world', '<script>', 'a'.repeat(25)]) assert.throws(() => validateUsername(value));
});
