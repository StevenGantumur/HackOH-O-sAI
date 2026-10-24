import { useEffect, useId, useRef, useState } from 'react';
import { formatDay, formatTime } from '../../shared/format.js';
import { getUser, membershipOf, messagesIn } from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { useAction } from '../../shared/useAction.js';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { Spinner } from '../../shared/ui/bits.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';

const dayOf = (iso) => new Date(iso).toDateString();

export function ChannelView({ channel, project }) {
  const data = useData();
  const me = useMe();
  const inputId = useId();
  const listRef = useRef(null);
  const [text, setText] = useState('');
  const isMember = Boolean(membershipOf(data, me.id, project.id));
  const messages = messagesIn(data, channel.id);
  const post = useAction((content) => store.postMessage({ userId: me.id, channelId: channel.id, content }));

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  async function send() {
    const value = text.trim();
    if (!value || post.pending) return;
    const result = await post.run(value);
    if (result.ok) setText('');
  }

  return (
    <section className="channel" aria-labelledby={`${inputId}-title`}>
      <header className="channel-head">
        <Icon name="hash" size={18} />
        <h2 className="channel-title" id={`${inputId}-title`}>
          {channel.name}
        </h2>
        <span className="muted small">{project.title}</span>
      </header>

      <div className="channel-messages" ref={listRef} role="log" aria-label={`Messages in ${channel.name}`}>
        {messages.length === 0 && <p className="channel-empty">No messages yet. Say hello to the team.</p>}
        {messages.map((message, i) => {
          const author = getUser(data, message.author_id);
          const newDay = i === 0 || dayOf(messages[i - 1].created_at) !== dayOf(message.created_at);
          return (
            <div key={message.id}>
              {newDay && (
                <p className="day-sep">
                  <span>{formatDay(message.created_at)}</span>
                </p>
              )}
              <div className="message">
                <Avatar user={author} size={34} />
                <div className="message-body">
                  <p className="message-head">
                    <strong>{author?.name}</strong>
                    <time className="muted small" dateTime={message.created_at}>
                      {formatTime(message.created_at)}
                    </time>
                  </p>
                  <p className="message-text">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isMember ? (
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor={inputId} className="visually-hidden">
            Message #{channel.name}
          </label>
          <textarea
            id={inputId}
            className="composer-input"
            rows={1}
            maxLength={2000}
            placeholder={`Message #${channel.name}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" className="btn btn-primary composer-send" disabled={post.pending || !text.trim()} aria-label="Send message">
            {post.pending ? <Spinner /> : <Icon name="send" size={18} />}
          </button>
        </form>
      ) : (
        <p className="composer-locked">
          <Icon name="lock" size={16} />
          Join {project.title} to post here.
        </p>
      )}
    </section>
  );
}
