import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument, documentSnapshot, documentText, editDocument, mergeDocument } from './sharedDocument.js';

test('simultaneous typing in an empty document retains both edits and converges', () => {
  const a = createDocument('a');
  const b = createDocument('b');
  const first = editDocument(a, 'Hello');
  const second = editDocument(b, 'World');
  mergeDocument(a, second); mergeDocument(b, first);
  assert.equal(documentText(a), documentText(b));
  assert.ok(documentText(a).includes('Hello'));
  assert.ok(documentText(a).includes('World'));
});

test('replacement, emoji, insertion and deletion reproduce the local textarea', () => {
  const document = createDocument('a');
  for (const text of ['hello', 'hey', '👋 hey', '👋 hey!', '', 'new draft']) {
    editDocument(document, text);
    assert.equal(documentText(document), text);
  }
});

test('concurrent deletion and insertion merge and duplicate delivery is harmless', () => {
  const a = createDocument('a');
  const b = createDocument('b');
  mergeDocument(b, editDocument(a, 'abc'));
  const deletion = editDocument(a, 'ac');
  const insertion = editDocument(b, 'abXc');
  mergeDocument(a, insertion); mergeDocument(b, deletion); mergeDocument(b, deletion);
  assert.equal(documentText(a), 'aXc');
  assert.equal(documentText(b), 'aXc');
});

test('late join snapshots preserve deleted characters and accept new edits', () => {
  const a = createDocument('a');
  editDocument(a, 'draft'); editDocument(a, 'dft');
  const b = createDocument('b');
  mergeDocument(b, documentSnapshot(a));
  mergeDocument(a, editDocument(b, 'dft notes'));
  assert.equal(documentText(a), 'dft notes');
  assert.equal(documentText(a), documentText(b));
});
