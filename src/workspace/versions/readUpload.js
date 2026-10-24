// Reads a browser File into the shape the store expects. Text-like files stay as text so they
// can be diffed; everything else becomes a data URL (MOCK storage; Supabase Storage later).

import { MAX_UPLOAD_BYTES } from '../../shared/mockDb.js';
import { isTextMime } from './diff.js';

const BY_EXTENSION = {
  md: 'text/markdown',
  csv: 'text/csv',
  txt: 'text/plain',
  json: 'application/json',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  step: 'model/step',
  stl: 'model/stl',
};

function guessMime(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  return BY_EXTENSION[ext] ?? 'application/octet-stream';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export async function readUpload(file) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Demo storage takes files up to 2 MB. Try a smaller file or share a link instead.');
  const mime = file.type || guessMime(file.name);
  const asText = isTextMime(mime) || mime === 'image/svg+xml';
  const data = asText ? await file.text() : await readAsDataUrl(file);
  return { name: file.name, size: file.size, mime, kind: asText ? 'text' : 'dataUrl', data };
}
