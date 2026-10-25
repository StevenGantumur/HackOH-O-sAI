import { useState } from 'react';
import { Page } from '../app/Page.jsx';
import { SharedDemoDocument } from '../workspace/channels/SharedDemoDocument.jsx';
import { useSharedDemoDocument } from '../workspace/channels/useSharedDemoDocument.js';
import '../workspace/channels/demoLobby.css';

// MOCK: Two fictional editors in one authenticated page for local interaction testing.
// They never represent real account presence, access messages, or record demo credit.
export function DemoPreviewPage() {
  const [room] = useState(() => crypto.randomUUID());
  const [connected, setConnected] = useState(true);
  const a = { id: `${room}:a`, name: 'Sample Alex' };
  const b = { id: `${room}:b`, name: 'Sample Blair' };
  return <Page title="Try the shared demo" subtitle="Local test · two sample participants, one shared problem and document.">
    <div className="demo-preview-toolbar">
      <a href="#/team-up" className="btn btn-outline btn-sm">Back to Team Up</a>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setConnected((value) => !value)}>{connected ? 'Simulate disconnect' : 'Reconnect sample participants'}</button>
    </div>
    <p className="demo-lobby-help">Choose one of the three Easy problems, then type in either editor. The other side updates live. These sample participants are simulated; real demos start from Messages after both people join.</p>
    <div className="demo-preview-grid">
      <PreviewSide me={a} person={b} connected={connected} />
      <PreviewSide me={b} person={a} connected={connected} />
    </div>
  </Page>;
}

function PreviewSide({ me, person, connected }) {
  const document = useSharedDemoDocument(me.id, person.id);
  return <SharedDemoDocument inline me={me} person={person} document={document} connected={connected} />;
}
