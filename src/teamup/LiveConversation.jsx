import { loadDirectoryPerson } from '../api/profiles.js';
import { useEffect, useId, useRef, useState } from 'react';
import { href } from '../shared/router.js';
import { formatTime } from '../shared/format.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { DemoLobby } from '../workspace/channels/DemoLobby.jsx';
import { loadDirectMessages, sendDirectMessage } from '../api/directMessages.js';
import { mergeMessageHistory, startAutoRefresh } from '../shared/autoRefresh.js';

export function LiveConversation({ person, account, client }) {
  const id = useId();
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [text, setText] = useState('');
  const [revision, setRevision] = useState(0);
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const sending = useRef(false);
  const log = useRef(null);
  const followLatest = useRef(true);
  const me = { id: account.id, name: account.username };
  const isSelf = account.id === person.id;

  useEffect(() => {
    let loadedRecipient;
    setLoading(true); setRefreshError('');
    async function load() {
      if (loadedRecipient === undefined) {
        const { data, error: profileError } = await loadDirectoryPerson(person.id, client);
        if (profileError) throw new Error('Could not find the recipient. Please retry.');
        loadedRecipient = data;
      }
      const history = loadedRecipient && loadedRecipient.id !== account.id ? await loadDirectMessages(loadedRecipient.id, client) : [];
      return { recipient: loadedRecipient, history };
    }
    return startAutoRefresh(load, ({ recipient, history }) => {
      setRecipient(recipient);
      setMessages((previous) => mergeMessageHistory(previous, history));
      setRefreshError(''); setLoading(false);
    }, (loadError) => {
      setRefreshError(`${loadError.message} Retrying automatically…`); setLoading(false);
    });
  }, [client, person.id, account.id, revision]);

  useEffect(() => {
    if (log.current && followLatest.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages.at(-1)?.id]);

  async function send(event) {
    event.preventDefault();
    if (sending.current || !recipient || !text.trim()) return;
    sending.current = true; setPending(true); setError('');
    try {
      const saved = await sendDirectMessage({ recipientId: recipient.id, content: text }, client);
      followLatest.current = true;
      setMessages((previous) => mergeMessageHistory(previous, [saved]));
      window.dispatchEvent(new Event('teamup-message-saved'));
      setText('');
    } catch (sendError) { setError(sendError.message); }
    finally { sending.current = false; setPending(false); }
  }

  return (
    <section className="channel teamup-live-channel" aria-labelledby={`${id}-title`}>
      <header className="channel-head teamup-chat-head">
        <Avatar user={person} size={36} />
        <h2 className="channel-title" id={`${id}-title`}>{person.name}</h2>
        <button className="btn btn-primary btn-sm teamup-start-demo" type="button" disabled={isSelf || !recipient} onClick={() => setLobbyOpen(true)}><Icon name="users" size={16} /> Start demo</button>
        <a className="btn btn-ghost btn-sm" href={href('/messages')}>Project channels</a>
        <a className="btn btn-ghost btn-sm" href={href('/team-up')}>Back to Team Up</a>
      </header>
      <p className="composer-locked">Messages update automatically. Start demo joins a Supabase room; the shared problem opens when both accounts join.</p>
      {loading ? <p role="status">Loading conversation…</p> : isSelf ? <p className="composer-locked">This is your account. Choose someone else in Team Up.</p> : !recipient && <p className="composer-locked">This account is unavailable. Refresh the registered-user directory and try again.</p>}
      {(error || refreshError) && <p role="alert">{error || refreshError}</p>}
      <div className="teamup-request-actions"><button className="btn btn-ghost btn-sm" type="button" disabled={pending || loading} onClick={() => setRevision((value) => value + 1)}>Refresh messages</button></div>
      <div ref={log} className="channel-messages" role="log" aria-label={`Messages with ${person.name}`} onScroll={(event) => {
        const node = event.currentTarget;
        followLatest.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
      }}>
        {!loading && recipient && !messages.length && !isSelf && !error && !refreshError && <p className="channel-empty">No messages yet. Say hello to {person.name.split(' ')[0]}.</p>}
        {messages.map((message) => {
          const fromMe = message.author_id === account.id;
          const author = fromMe ? me : person;
          return (
            <div className="message" key={message.id}>
              <Avatar user={author} size={34} />
              <div className="message-body"><p className="message-head"><strong>{author.name} → {fromMe ? person.name : me.name}</strong><time className="muted small" dateTime={message.created_at}>{formatTime(message.created_at)}</time></p><p className="message-text">{message.content}</p></div>
            </div>
          );
        })}
      </div>
      <form className="composer" onSubmit={send}>
        <label className="visually-hidden" htmlFor={id}>Message {person.name}</label>
        <textarea id={id} className="composer-input" rows={2} maxLength={2000} required disabled={pending || loading || !recipient || isSelf} placeholder={`Message ${person.name.split(' ')[0]}…`} value={text} onChange={(event) => setText(event.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={pending || loading || !recipient || isSelf || !text.trim()}><Icon name="send" size={18} />{pending ? 'Sending…' : 'Send message'}</button>
      </form>
      {lobbyOpen && <DemoLobby me={me} person={person} onClose={() => setLobbyOpen(false)} />}
    </section>
  );
}
