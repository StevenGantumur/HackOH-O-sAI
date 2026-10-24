import { getSupabase } from '../shared/supabase.js';

// Team-approved direct chats, separate from shared project-channel messages.
export async function sendDirectMessage({ recipientId, content }, client = getSupabase()) {
  const text = content?.trim();
  if (!text || text.length > 2000) throw new Error('Write a message between 1 and 2,000 characters.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipientId ?? '')) {
    throw new Error('This student needs a linked Supabase account before you can send a message.');
  }

  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw new Error('Could not verify your sign-in. Sign in again before sending.');
  if (!auth.user) throw new Error('Sign in before sending a message.');
  if (auth.user.id === recipientId) throw new Error('Choose another student to message.');

  const { data, error } = await client
    .from('direct_messages')
    .insert({ author_id: auth.user.id, recipient_id: recipientId, content: text })
    .select('id, author_id, recipient_id, content, created_at')
    .single();
  if (error) throw new Error('Your message was not saved. Please try again.');
  if (!data) throw new Error('Supabase did not confirm the saved message.');
  return data;
}

export async function loadDirectMessages(recipientId, client = getSupabase()) {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error('Sign in to load messages.');
  if (!/^[0-9a-f-]{36}$/i.test(recipientId)) throw new Error('Choose a linked messaging account.');
  const { data, error } = await client.from('direct_messages')
    .select('id, author_id, recipient_id, content, created_at')
    .or(`and(author_id.eq.${auth.user.id},recipient_id.eq.${recipientId}),and(author_id.eq.${recipientId},recipient_id.eq.${auth.user.id})`)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100);
  if (error) throw new Error('Could not load messages. Please retry.');
  return data.toReversed();
}
