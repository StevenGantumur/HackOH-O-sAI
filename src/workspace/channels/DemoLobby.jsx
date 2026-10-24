import { useEffect, useState } from 'react';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';
import './demoLobby.css';

const HEARTBEAT_MS = 2000;
const DISCONNECTED_AFTER_MS = 7000;

// MOCK: Same-browser presence preview, not authenticated or backed by Supabase.
// Both users must open this lobby in separate tabs on the same origin/browser.
// No camera, microphone, or automatic claim that a partner has connected.
export function DemoLobby({ me, person, onClose }) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setConnected(false);
    setError('');
    if (typeof BroadcastChannel === 'undefined') {
      setError('This browser does not support the local connection preview. Try a browser with BroadcastChannel support.');
      return;
    }

    let channel;
    try {
      const room = JSON.stringify([me.id, person.id].sort());
      channel = new BroadcastChannel(`bridge-builder:demo-lobby:${room}`);
    } catch {
      setError('Could not open the local connection. Close this popup and try again.');
      return;
    }

    const tabId = crypto.randomUUID();
    const peers = new Map();
    const send = (kind) => channel.postMessage({ kind, userId: me.id, tabId });
    function refreshPresence() {
      const now = Date.now();
      for (const [peerId, seenAt] of peers) {
        if (now - seenAt > DISCONNECTED_AFTER_MS) peers.delete(peerId);
      }
      setConnected(peers.size > 0);
    }

    channel.onmessage = ({ data }) => {
      if (!data || data.userId !== person.id || typeof data.tabId !== 'string') return;
      if (data.kind === 'leave') peers.delete(data.tabId);
      else if (data.kind === 'hello' || data.kind === 'present') peers.set(data.tabId, Date.now());
      else return;
      refreshPresence();
      if (data.kind === 'hello') send('present');
    };
    send('hello');
    const interval = window.setInterval(() => {
      send('present');
      refreshPresence();
    }, HEARTBEAT_MS);
    const leave = () => send('leave');
    window.addEventListener('pagehide', leave);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pagehide', leave);
      leave();
      channel.close();
    };
  }, [me.id, person.id]);

  return (
    <Modal
      title="Your 30-minute demo"
      description="Local connection preview · join from two tabs in the same browser. No video or audio is shared."
      size="lg"
      onClose={onClose}
      footer={<button className="btn btn-outline" type="button" onClick={onClose}>Leave demo</button>}
    >
      <div className="demo-lobby-status" role="status">
        <span className={`demo-lobby-dot ${connected ? 'is-connected' : ''}`} aria-hidden="true" />
        {error ? 'Connection unavailable' : connected ? 'You’re both connected' : `Waiting for ${person.name.split(' ')[0]} to connect…`}
      </div>
      <div className="demo-lobby-participants">
        <section className="demo-lobby-participant" aria-label="Your side">
          <Avatar user={me} size={112} />
          <h3>{me.name}</h3>
          <span className="demo-lobby-person-status">You · Lobby open</span>
        </section>
        <section className={`demo-lobby-participant ${connected ? '' : 'is-waiting'}`} aria-label="Your partner’s side">
          <Avatar user={person} size={112} />
          <h3>{person.name}</h3>
          <span className="demo-lobby-person-status">{connected ? 'Connected in another tab' : 'Waiting to join'}</span>
        </section>
      </div>
      {error ? <p className="demo-lobby-error" role="alert">{error}</p> : (
        <p className="demo-lobby-help">
          {connected
            ? 'Both participants have opened the lobby. Your connection is local to this browser; the challenge and completion tracking are not connected yet.'
            : `To try it: open the app in another tab, switch the demo user to ${person.name}, open Messages with ${me.name}, and click Start demo. This popup will update when they join.`}
        </p>
      )}
    </Modal>
  );
}
