import { useId, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { formatTime } from '../shared/format.js';
import { useDemoChats, addDemoMessage } from './demoChats.js';
import { DemoLobby } from '../workspace/channels/DemoLobby.jsx';

// MOCK: Fictional people have no Supabase account. Drafts stay in this browser tab.
export function SampleConversation({ person }) {
  const { profile } = useAuth();
  const id = useId();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const me = { id: profile.id, name: profile.username };
  const chat = useDemoChats().find((entry) => entry.participants.includes(me.id) && entry.participants.includes(person.id));
  function preview(event) {
    event.preventDefault();
    try { addDemoMessage(me.id, person.id, text); setText(''); setError(''); }
    catch (error) { setError(error.message); }
  }
  return (
    <section className="channel teamup-live-channel" aria-labelledby={`${id}-title`}>
      <header className="channel-head teamup-chat-head">
        <Avatar user={person} size={36} /><h2 className="channel-title" id={`${id}-title`}>{person.name} · Sample</h2>
        <button className="btn btn-outline btn-sm teamup-start-demo" type="button" onClick={() => setLobbyOpen(true)}>Preview demo lobby</button>
      </header>
      <p className="composer-locked">Fictional student · messages are local previews, not delivered. Registered accounts can receive real messages.</p>
      <div className="channel-messages" role="log" aria-label={`Sample chat with ${person.name}`}>
        {!chat?.messages.length && <p className="channel-empty">Practice a conversation as {me.name}.</p>}
        {chat?.messages.map((message, index) => <div className="message" key={index}><Avatar user={me} size={34} /><div className="message-body"><p className="message-head"><strong>{me.name} → {person.name}</strong><time className="muted small" dateTime={message.createdAt}>{formatTime(message.createdAt)} · Not sent</time></p><p className="message-text">{message.content}</p></div></div>)}
      </div>
      {error && <p role="alert">{error}</p>}
      <form className="composer" onSubmit={preview}>
        <label className="visually-hidden" htmlFor={id}>Preview message to {person.name}</label>
        <textarea id={id} className="composer-input" rows={2} required maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a sample message…" />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>Preview message</button>
      </form>
      {lobbyOpen && <DemoLobby me={me} person={person} onClose={() => setLobbyOpen(false)} />}
    </section>
  );
}
