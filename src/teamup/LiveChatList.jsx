import { useEffect, useState } from 'react';
import { href } from '../shared/router.js';

export function LiveChatList({ account, client, activePersonId }) {
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([
      client.from('direct_messages').select('author_id, recipient_id, created_at').order('created_at', { ascending: false }).limit(100),
      client.from('account_directory').select('id, username'),
    ]).then(([history, directory]) => {
      if (!active) return;
      if (history.error || directory.error) { setError('Could not load your chat list. Please refresh.'); return; }
      const people = new Map(directory.data.map((person) => [person.id, person]));
      const grouped = new Map();
      for (const message of history.data) {
        const peerId = message.author_id === account.id ? message.recipient_id : message.author_id;
        if (!grouped.has(peerId)) grouped.set(peerId, { person: people.get(peerId), last: message, count: 0 });
        grouped.get(peerId).count += 1;
      }
      setChats([...grouped.values()].filter((chat) => chat.person));
    }).catch(() => { if (active) setError('Could not load your chat list. Please refresh.'); })
      .finally(() => { if (active) setLoading(false); });
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('teamup-message-saved', refresh);
    return () => { active = false; window.removeEventListener('teamup-message-saved', refresh); };
  }, [account.id, client, revision]);

  return (
    <nav className="teamup-demo-chats" aria-label="Saved demo conversations">
      <h2>Demo chats <span>Saved in Supabase · registered accounts</span></h2>
      {loading && <p role="status">Loading chats…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && !chats.length && <p>Your conversations appear here after the first saved message.</p>}
      {chats.map(({ person, last }) => (
        <a key={person.id} href={href('/messages', { person: person.id })} aria-current={person.id === activePersonId ? 'page' : undefined}>
          <strong># demo · {person.username}</strong>
          <span>{account.username} ↔ {person.username}</span>
          <span>Last: {last.author_id === account.id ? `${account.username} → ${person.username}` : `${person.username} → ${account.username}`}</span>
        </a>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => setRevision((value) => value + 1)}>Refresh chats</button>
    </nav>
  );
}
