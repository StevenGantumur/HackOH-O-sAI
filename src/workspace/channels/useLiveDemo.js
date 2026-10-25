import { useEffect, useRef, useState } from 'react';
import { connectLiveDemo } from '../../api/demoSessions.js';
import { createDocument, documentText, editDocument, mergeDocument } from './sharedDocument.js';
import { prepProblems } from '../../teamup/prep/problems.js';

export function useLiveDemo(partnerId, client) {
  const model = useRef(null);
  const transport = useRef(null);
  const selection = useRef({ id: prepProblems[0].id, clock: 0, replica: '' });
  const eligible = useRef(false);
  const [state, setState] = useState({ connected: false, ready: false });
  const [text, setText] = useState('');
  const [problemId, setProblemId] = useState(prepProblems[0].id);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const document = createDocument(crypto.randomUUID());
    model.current = document;
    selection.current = { id: prepProblems[0].id, clock: 0, replica: '' };
    eligible.current = false;
    setText(''); setProblemId(prepProblems[0].id); setError(''); setPending(0);
    setState({ connected: false, ready: false });
    const connection = connectLiveDemo(partnerId, {
      onState(value) { eligible.current = value.connected; setState(value); },
      onError: setError,
      onPending: setPending,
      onEvents(events) {
        for (const { payload } of events) {
          if (payload.kind === 'edit') mergeDocument(document, payload.patch);
          const next = payload.problem;
          const current = selection.current;
          if (next && prepProblems.some((item) => item.id === next.id) && Number.isSafeInteger(next.clock) && next.clock >= 0 && typeof next.replica === 'string' &&
            (next.clock > current.clock || (next.clock === current.clock && next.replica > current.replica))) {
            selection.current = next; setProblemId(next.id);
          }
        }
        setText(documentText(document));
      },
    }, client);
    transport.current = connection;
    // Unload delivery is best-effort; the server also expires missed heartbeats.
    const onPageHide = () => connection.stop();
    const onPageShow = (event) => { if (event.persisted) window.location.reload(); };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      eligible.current = false; transport.current = null; connection.stop();
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [partnerId, client]);

  function updateText(value) {
    if (!eligible.current || !model.current || value.length > 10000) return;
    const patch = editDocument(model.current, value);
    setText(documentText(model.current));
    transport.current.send({ kind: 'edit', patch });
  }
  function chooseProblem(id) {
    if (!eligible.current || !model.current || !prepProblems.some((item) => item.id === id)) return;
    const next = { id, clock: selection.current.clock + 1, replica: model.current.replica };
    selection.current = next; setProblemId(id);
    transport.current.send({ kind: 'problem', problem: next });
  }
  return { ...state, text, updateText, problemId, chooseProblem, error, pending, live: true };
}
