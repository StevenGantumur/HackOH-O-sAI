import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../../../seed/seed.js';
import { diffLines, diffStats } from './diff.js';

test('identical text has no changes', () => {
  const ops = diffLines('a\nb\nc', 'a\nb\nc');
  assert.deepEqual(diffStats(ops), { added: 0, removed: 0 });
  assert.equal(ops.length, 3);
});

test('a replaced line shows as a deletion, then an addition', () => {
  const ops = diffLines('one\ntwo\nthree', 'one\n2\nthree');
  assert.deepEqual(
    ops.map((op) => `${op.type}:${op.text}`),
    ['same:one', 'del:two', 'add:2', 'same:three'],
  );
  assert.equal(ops.find((op) => op.type === 'add').newLine, 2);
});

test('appended lines keep their line numbers', () => {
  const ops = diffLines('a\nb', 'a\nb\nc\nd');
  assert.deepEqual(diffStats(ops), { added: 2, removed: 0 });
  assert.deepEqual(ops.filter((op) => op.type === 'add').map((op) => op.newLine), [3, 4]);
});

test('the seeded survey drafts differ in the title and all five questions', () => {
  const ops = diffLines(seed.blobs['seed/pickup-survey-v1.md'], seed.blobs['seed/pickup-survey-v2.md']);
  assert.deepEqual(diffStats(ops), { added: 6, removed: 6 });
});
