export function normalizeUsername(value = '') {
  return value.trim().toLowerCase();
}

export function validateUsername(value) {
  if (!/^[a-z][a-z0-9_]{2,23}$/.test(normalizeUsername(value))) {
    throw new Error('Use 3–24 characters: start with a letter, then use letters, numbers, or underscores.');
  }
  return normalizeUsername(value);
}

// Only a server-verified, email-confirmed account with its own profile opens the app.
export function resolveAccountAccess(user, profile) {
  if (!user || user.is_anonymous) return 'signed_out';
  if (!user.email_confirmed_at) return 'confirm_email';
  if (!profile || profile.id !== user.id || !profile.username) return 'needs_profile';
  return 'authenticated';
}
