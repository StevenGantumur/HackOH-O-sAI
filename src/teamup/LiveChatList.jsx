import { loadChatList } from '../api/directMessages.js';
import { useEffect, useState } from 'react';
import { href } from '../shared/router.js';
import { startAutoRefresh } from '../shared/autoRefresh.js';

export function LiveChatList({ account, client, activePersonId }) {
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setLoading(true); setError('');
    return startAutoRefresh(() => loadChatList(account.id, client), (chats) => {
      setChats(chats); setError(''); setLoading(false);
    }, () => {
      setError('Could not update your chat list. Retrying automatically…'); setLoading(false);
    });
  }, [account.id, client, revision]);

  return (
    <nav className="teamup-demo-chats" aria-label="Saved demo conversations">
      <h2>Demo chats <span>Saved in Supabase · updates automatically</span></h2>
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
