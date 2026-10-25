import { useEffect, useRef, useState } from 'react';
import { createDocument, documentSnapshot, documentText, editDocument, mergeDocument } from './sharedDocument.js';

// MOCK: Local shared editor using the same browser-only transport as the lobby.
// Keep this separate from Supabase calls in src/api. Nothing is saved remotely.
export function useSharedDemoDocument(meId, partnerId) {
  const model = useRef(null);
  const channel = useRef(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const document = createDocument(crypto.randomUUID());
    model.current = document;
    setText(''); setError(''); setReady(false);
    let transport;
    try {
      transport = new BroadcastChannel(`bridge-builder:demo-document:${JSON.stringify([meId, partnerId].sort())}`);
      channel.current = transport;
      const send = (kind, patch) => transport.postMessage({ kind, patch, userId: meId, replica: document.replica });
      transport.onmessage = ({ data }) => {
        if (!data || data.replica === document.replica || ![meId, partnerId].includes(data.userId)) return;
        if (data.kind === 'request') send('snapshot', documentSnapshot(document));
        if (data.kind === 'snapshot' || data.kind === 'edit') {
          mergeDocument(document, data.patch);
          setText(documentText(document));
        }
      };
      send('request');
      // Periodic merge repairs missed messages and supports a rejoining tab.
      const heartbeat = window.setInterval(() => send('snapshot', documentSnapshot(document)), 3000);
      setReady(true);
      return () => { window.clearInterval(heartbeat); channel.current = null; transport.close(); };
    } catch {
      transport?.close(); channel.current = null;
      setError('Shared editing is unavailable in this browser. Leave and reopen the demo to retry.');
    }
  }, [meId, partnerId]);

  function updateText(value) {
    if (!channel.current || !model.current) return;
    // Keep a rollback snapshot if the browser rejects the edit message.
    const before = documentSnapshot(model.current);
    const patch = editDocument(model.current, value);
    try {
      channel.current.postMessage({ kind: 'edit', patch, userId: meId, replica: model.current.replica });
      setText(documentText(model.current));
    } catch {
      const restored = createDocument(model.current.replica);
      mergeDocument(restored, before);
      // Never reuse an operation ID from a failed edit.
      restored.clock = Math.max(restored.clock, model.current.clock);
      model.current.nodes = restored.nodes;
      model.current.deleted = restored.deleted;
      model.current.clock = restored.clock;
      setError('Your last edit could not be shared. Copy your draft before leaving.');
    }
  }

  return { text, updateText, error, ready };
}
