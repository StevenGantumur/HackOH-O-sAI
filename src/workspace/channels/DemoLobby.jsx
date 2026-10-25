import { useEffect, useState } from 'react';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { SharedDemoDocument } from './SharedDemoDocument.jsx';
import { useSharedDemoDocument } from './useSharedDemoDocument.js';
import { useLiveDemo } from './useLiveDemo.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { isLiveId } from '../../shared/liveRecords.js';
import './demoLobby.css';

const HEARTBEAT_MS = 2000;
const DISCONNECTED_AFTER_MS = 7000;

// MOCK: Same-browser presence preview, not authenticated or backed by Supabase.
// Both users must open this lobby in separate tabs on the same origin/browser.
// No camera, microphone, or automatic claim that a partner has connected.
export function DemoLobby(props) {
  return isLiveId(props.me.id) && isLiveId(props.person.id)
    ? <LiveDemoLobby person={props.person} onClose={props.onClose} />
    : <LocalDemoLobby {...props} />;
}

function LiveDemoLobby({ person, onClose }) {
  const { client, profile } = useAuth();
  const document = useLiveDemo(person.id, client);
  const me = { id: profile.id, name: profile.username };
  if (document.connected && document.ready) return <SharedDemoDocument me={me} person={person} document={document} connected onClose={onClose} />;
  return <Modal title="Your 30-minute demo" description="Supabase checks both participants before opening the shared problem." size="lg" onClose={onClose}
    footer={<button className="btn btn-outline" type="button" onClick={onClose}>Leave demo</button>}>
    <div className="demo-lobby-status" role="status">{document.error ? 'Reconnecting to your demo…' : `Waiting for ${person.name} to join…`}</div>
    <div className="demo-lobby-participants">
      <section className="demo-lobby-participant"><Avatar user={me} size={112} /><h3>{me.name}</h3><span className="demo-lobby-person-status">{document.sessionId ? 'Joined this demo' : 'Connecting…'}</span></section>
      <section className="demo-lobby-participant is-waiting"><Avatar user={person} size={112} /><h3>{person.name}</h3><span className="demo-lobby-person-status">Waiting for server-confirmed presence</span></section>
    </div>
    {document.error && <p className="demo-lobby-error" role="alert">{document.error}</p>}
    <p className="demo-lobby-help">Ask {person.name} to open your conversation in Messages and click Start demo while signed in to their own account. This works across computers using the same Supabase project. The problem and shared document open when both are active. Inactive connections expire after 20 seconds.</p>
    {document.pending > 0 && <p role="status">{document.pending} local {document.pending === 1 ? 'edit is' : 'edits are'} waiting to save. Keep this popup open to retry.</p>}
  </Modal>;
}

function LocalDemoLobby({ me, person, onClose }) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [documentOpened, setDocumentOpened] = useState(false);
  const document = useSharedDemoDocument(me.id, person.id);

  useEffect(() => {
    setConnected(false);
    setDocumentOpened(false);
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
      if (peers.size > 0) setDocumentOpened(true);
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

  if (documentOpened) return <SharedDemoDocument me={me} person={person} document={document} connected={connected} onClose={onClose} />;

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
            ? 'Opening your shared working document…'
            : `In another tab in this browser, open Messages as ${person.name} with ${me.name} and click Start demo. Registered users must sign in to their own accounts in each tab. Sample conversations use the demo persona switcher.`}
        </p>
      )}
    </Modal>
  );
}
