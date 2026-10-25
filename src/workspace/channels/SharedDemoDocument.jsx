import { useId } from 'react';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { prepProblems } from '../../teamup/prep/problems.js';

export function SharedDemoDocument({ me, person, document, connected, onClose, inline = false }) {
  const editorId = useId();
  const problem = prepProblems.find((item) => item.id === document.problemId) ?? prepProblems[0];
  const disabled = !connected || !document.ready || Boolean(document.error);
  const content = <>
      <div className="demo-document-people">
        {[me, person].map((user) => <span key={user.id}><Avatar user={user} size={28} />{user.name}</span>)}
        <span role="status">{connected ? 'Both participants connected' : 'Partner disconnected · waiting to reconnect'}</span>
      </div>
      {document.error && <p className="demo-lobby-error" role="alert">{document.error}</p>}
      <label className="demo-document-label" htmlFor={`${editorId}-problem`}>Practice problem</label>
      <select className="demo-problem-select" id={`${editorId}-problem`} value={problem.id} onChange={(event) => document.chooseProblem(event.target.value)} disabled={disabled}>
        {prepProblems.map((item) => <option key={item.id} value={item.id}>{item.title} · Easy</option>)}
      </select>
      <p className="muted small">Changing the problem keeps your shared notes.</p>
      <details className="demo-problem-prompt" open>
        <summary>{problem.title}</summary>
        <p>{problem.summary}</p>
        <pre>{problem.example.input}{'\n'}Expected: {problem.example.output}</pre>
        <h4>Cases to test</h4><ul>{problem.checks.map((check) => <li key={check}>{check}</li>)}</ul>
        <p>{problem.partnerExercise}</p>
        <a href={problem.sourceUrl} target="_blank" rel="noreferrer">Full question on FastPrep ↗</a>
      </details>
      <label className="demo-document-label" htmlFor={editorId}>Shared working notes</label>
      <textarea id={editorId} className="demo-document-editor" value={document.text} onChange={(event) => document.updateText(event.target.value)}
        disabled={disabled} spellCheck={false} placeholder="Write your approach, pseudocode, or code here…" />
      <p className="muted small" role="status">{document.text.length} characters · {connected ? 'Edits and problem selection sync live' : 'Editing paused'} · Code is not executed here</p>
      <p className="demo-lobby-help">Local demo: edits sync between tabs in this browser. This is an in-app document, not a Google Docs connection. Copy your notes before both participants leave; they are not saved to Supabase.</p>
    </>;
  if (inline) return <section className="demo-preview-editor" aria-label={`${me.name}'s editor`}>{content}</section>;
  return (
    <Modal title="Your shared demo document" description="Write notes, outline an approach, and work through the problem together." size="lg" onClose={onClose}
      footer={<button className="btn btn-outline" type="button" onClick={onClose}>Leave demo</button>}>
      {content}
    </Modal>
  );
}
