import { useId, useState } from 'react';
import { href } from '../shared/router.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { addDemoMessage, useDemoChats } from './demoChats.js';
import { formatTime } from '../shared/format.js';
import { DemoLobby } from '../workspace/channels/DemoLobby.jsx';
import '../workspace/channels/channels.css';

// MOCK: Local conversation preview only. No delivery, replies, or database writes.
// Messages are saved per browser tab and attributed to the selected demo user.
export function DirectChatPreview({ person, me }) {
  const id = useId();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const chats = useDemoChats();
  const chat = chats.find((entry) => entry.participants.includes(me.id) && entry.participants.includes(person.id));
  const messages = chat?.messages ?? [];

  function addPreview(event) {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    try {
      addDemoMessage(me.id, person.id, content);
      setText('');
      setError('');
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <section className="channel" aria-labelledby={`${id}-title`}>
      <header className="channel-head teamup-chat-head">
        <Avatar user={person} size={36} />
        <h2 className="channel-title" id={`${id}-title`}>{chat ? `# demo-${chat.number} · ` : ''}{person.name}</h2>
        <button className="btn btn-primary btn-sm teamup-start-demo" type="button" onClick={() => setLobbyOpen(true)}>
          <Icon name="users" size={16} /> Start demo
        </button>
        <a className="btn btn-ghost btn-sm" href={href('/messages')}>Project channels</a>
        <a className="btn btn-ghost btn-sm" href={href('/team-up')}>Back to Team Up</a>
      </header>
      <p className="composer-locked">Demo chat · saved in this browser tab only, never delivered. Switch demo users in this tab to preview both sides.</p>
      <div className="channel-messages" role="log" aria-label={`Chat preview with ${person.name}`}>
        {!messages.length && <p className="channel-empty">Plan a 30-minute demo with {person.name.split(' ')[0]}. Try drafting a hello below.</p>}
        {messages.map((message, index) => (
          <div className="message" key={index}>
            <Avatar user={message.senderId === me.id ? me : person} size={34} />
            <div className="message-body">
              <p className="message-head"><strong>{message.senderId === me.id ? me.name : person.name} → {message.recipientId === me.id ? me.name : person.name}</strong><time className="muted small" dateTime={message.createdAt}>{formatTime(message.createdAt)} · Preview</time></p>
              <p className="message-text">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <form className="composer" onSubmit={addPreview}>
        <label className="visually-hidden" htmlFor={id}>Draft a message to {person.name}</label>
        <textarea id={id} className="composer-input" rows={2} maxLength={2000} placeholder={`Draft a message to ${person.name.split(' ')[0]}…`} value={text} onChange={(event) => setText(event.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}><Icon name="send" size={18} /> Preview message</button>
      </form>
      {lobbyOpen && <DemoLobby me={me} person={person} onClose={() => setLobbyOpen(false)} />}
    </section>
  );
}
