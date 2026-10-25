import { getCurrentUser } from './auth.js';
import { loadDirectoryNames } from './profiles.js';
import { getSupabase } from './client.js';

export async function loadChatList(accountId, client = getSupabase()) {
  const [history, directory] = await Promise.all([
    client.from('direct_messages').select('author_id, recipient_id, created_at')
      .order('created_at', { ascending: false }).limit(100),
    loadDirectoryNames(client),
  ]);
  if (history.error || directory.error) throw new Error('Could not load your chat list. Please refresh.');
  const people = new Map(directory.data.map((person) => [person.id, person]));
  const grouped = new Map();
  for (const message of history.data) {
    const peerId = message.author_id === accountId ? message.recipient_id : message.author_id;
    if (!grouped.has(peerId)) grouped.set(peerId, { person: people.get(peerId), last: message, count: 0 });
    grouped.get(peerId).count += 1;
  }
  return [...grouped.values()].filter((chat) => chat.person);
}

// Team-approved direct chats, separate from shared project-channel messages.
export async function sendDirectMessage({ recipientId, content }, client = getSupabase()) {
  const text = content?.trim();
  if (!text || text.length > 2000) throw new Error('Write a message between 1 and 2,000 characters.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipientId ?? '')) {
    throw new Error('Choose a registered account to send a real message.');
  }

  const { data: auth, error: authError } = await getCurrentUser(client);
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
  const { data: auth, error: authError } = await getCurrentUser(client);
  if (authError || !auth.user) throw new Error('Sign in to load messages.');
  if (!/^[0-9a-f-]{36}$/i.test(recipientId)) throw new Error('Choose a linked messaging account.');
  const { data, error } = await client.from('direct_messages')
    .select('id, author_id, recipient_id, content, created_at')
    .or(`and(author_id.eq.${auth.user.id},recipient_id.eq.${recipientId}),and(author_id.eq.${recipientId},recipient_id.eq.${auth.user.id})`)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100);
  if (error) throw new Error('Could not load messages. Please retry.');
  return data.toReversed();
}
