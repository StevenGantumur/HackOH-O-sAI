import { getSupabase } from './client.js';

export const loadAccountProfile = (userId, client = getSupabase()) =>
  client.from('account_profiles').select('id, username, email').eq('id', userId).maybeSingle();

export const setAccountUsername = (userId, username, client = getSupabase()) =>
  client.from('account_profiles').update({ username }).eq('id', userId).select('id').single();

export const loadAccountDirectory = (client = getSupabase()) =>
  client.from('account_directory').select('id, username, major, skills, goals').order('username');

export const loadDirectoryNames = (client = getSupabase()) =>
  client.from('account_directory').select('id, username');

export const loadDirectoryPerson = (userId, client = getSupabase()) =>
  client.from('account_directory').select('id, username').eq('id', userId).maybeSingle();

export const updateDirectoryDetails = (userId, patch, client = getSupabase()) =>
  client.from('account_directory').update(patch).eq('id', userId)
    .select('id, username, major, skills, goals').single();

// Commit private username and public major together, or roll both back.
export const saveAccountDetails = ({ username, major }, client = getSupabase()) =>
  client.rpc('update_my_account_profile', { new_username: username, new_major: major });
