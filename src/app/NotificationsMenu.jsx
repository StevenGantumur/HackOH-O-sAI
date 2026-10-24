import { useMemo, useState } from 'react';
import { timeAgo } from '../shared/format.js';
import { taskHref } from '../shared/router.js';
import { useData, useMe } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { Popover } from '../shared/ui/Popover.jsx';
import { deriveNotifications } from './notifications.js';

function readLocal(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* read state is a convenience */
  }
}

// "Read up to" timestamp per demo user. Sample activity from the seed starts out read.
function useReadMarker(userId, seededAt) {
  const key = `bridge-builder:notifications-read:${userId}`;
  const [state, setState] = useState(() => ({ key, value: readLocal(key) }));
  const stored = state.key === key ? state.value : readLocal(key);
  if (state.key !== key) setState({ key, value: stored });
  const effective = stored && Date.parse(stored) > Date.parse(seededAt) ? stored : seededAt;
  const markRead = () => {
    const now = new Date().toISOString();
    writeLocal(key, now);
    setState({ key, value: now });
  };
  return [effective, markRead];
}

export function NotificationsMenu() {
  const data = useData();
  const me = useMe();
  const items = useMemo(() => deriveNotifications(data, me.id), [data, me.id]);
  const [readAt, markRead] = useReadMarker(me.id, data.meta.seededAt);
  const isUnread = (item) => Date.parse(item.at) > Date.parse(readAt);
  const unread = items.filter(isUnread).length;

  return (
    <Popover
      align="end"
      label="Notifications"
      panelClassName="notif-panel"
      onOpenChange={(open) => {
        if (!open && unread) markRead();
      }}
      trigger={(props) => (
        <button {...props} className="icon-btn bell-btn" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
          <Icon name="bell" size={23} />
          {unread > 0 && <span className="bell-dot" aria-hidden="true" />}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="notif-head">
            <p className="notif-title">Notifications</p>
            {unread > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={markRead}>
                Mark all read
              </button>
            )}
          </div>
          {items.length ? (
            <ul className="notif-list">
              {items.map((item) => (
                <li key={item.id}>
                  <a className={`notif-item ${isUnread(item) ? 'is-unread' : ''}`} href={item.taskId ? taskHref(item.taskId) : '#/'} onClick={close}>
                    <Avatar user={item.actor} size={32} />
                    <span className="notif-copy">
                      <span className="notif-text">{item.text}</span>
                      <span className="notif-time">
                        {isUnread(item) && <span className="visually-hidden">Unread. </span>}
                        {timeAgo(item.at)}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notif-empty">Nothing yet. Claims, submissions and feedback on your work show up here.</p>
          )}
          <p className="notif-foot">In-app only. Email and push notifications aren’t part of the demo.</p>
        </>
      )}
    </Popover>
  );
}
