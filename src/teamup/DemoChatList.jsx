import { href } from '../shared/router.js';
import { getUser } from '../shared/selectors.js';
import { useDemoChats } from './demoChats.js';
import './teamup.css';

export function DemoChatList({ data, me, activePersonId }) {
  const chats = useDemoChats().filter((chat) => chat.participants.includes(me.id));
  return (
    <nav className="teamup-demo-chats" aria-label="Demo conversations">
      <h2>Demo chats <span>Saved in this tab · sample only</span></h2>
      {!chats.length && <p>Your demo chats will appear here after you preview a message.</p>}
      {chats.map((chat) => {
        const otherId = chat.participants.find((participant) => participant !== me.id);
        const other = getUser(data, otherId);
        const last = chat.messages.at(-1);
        return (
          <a key={chat.key} href={href('/messages', { person: otherId })} aria-current={activePersonId === otherId ? 'page' : undefined}>
            <strong># demo-{chat.number} · {other?.name ?? 'Unknown student'}</strong>
            <span>{me.name} ↔ {other?.name ?? 'Unknown student'}</span>
            {last && <span>Last: {getUser(data, last.senderId)?.name ?? 'Unknown student'} → {getUser(data, last.recipientId)?.name ?? 'Unknown student'} · {chat.messages.length} preview message{chat.messages.length === 1 ? '' : 's'}</span>}
          </a>
        );
      })}
    </nav>
  );
}
