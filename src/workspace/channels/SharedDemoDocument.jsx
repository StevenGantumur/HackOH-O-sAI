import { useId } from 'react';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';

export function SharedDemoDocument({ me, person, document, connected, onClose }) {
  const editorId = useId();
  return (
    <Modal title="Your shared demo document" description="Write notes, outline an approach, and work through the problem together." size="lg" onClose={onClose}
      footer={<button className="btn btn-outline" type="button" onClick={onClose}>Leave demo</button>}>
      <div className="demo-document-people">
        {[me, person].map((user) => <span key={user.id}><Avatar user={user} size={28} />{user.name}</span>)}
        <span role="status">{connected ? 'Both participants connected' : 'Partner disconnected · waiting to reconnect'}</span>
      </div>
      {document.error && <p className="demo-lobby-error" role="alert">{document.error}</p>}
      <label className="demo-document-label" htmlFor={editorId}>Shared working notes</label>
      <textarea id={editorId} className="demo-document-editor" value={document.text} onChange={(event) => document.updateText(event.target.value)}
        disabled={!connected || !document.ready || Boolean(document.error)} spellCheck placeholder="Start with the problem, your assumptions, and a plan…" />
      <p className="demo-lobby-help">Local demo: edits sync between tabs in this browser. This is an in-app document, not a Google Docs connection. Copy your notes before both participants leave; they are not saved to Supabase.</p>
    </Modal>
  );
}
