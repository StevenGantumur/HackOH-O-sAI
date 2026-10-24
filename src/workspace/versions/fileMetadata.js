import { href } from '../../shared/router.js';

export const FILE_TYPES = { image: 'Images', text: 'Text & code', data: 'Spreadsheets & data', pdf: 'PDFs', other: 'Other files' };

export function fileType(file, version) {
  const extension = file.name.split('.').at(-1).toLowerCase();
  const mime = version?.mime_type ?? '';
  if (mime.startsWith('image/') || /^(svg|png|jpg|jpeg|gif|webp|avif)$/.test(extension)) return 'image';
  if (/^(csv|tsv|xls|xlsx|ods)$/.test(extension) || /csv|spreadsheet/.test(mime)) return 'data';
  if (extension === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/') || /^(md|txt|js|jsx|ts|tsx|py|json|html|css|xml|yaml|yml|r)$/.test(extension)) return 'text';
  return 'other';
}

export const fileIcon = (type) => type === 'image' ? 'image' : type === 'data' ? 'table' : 'file';

// Keep list filters when navigating into a file, without carrying task drawers along.
export function filesHref(projectId, query, patch = {}) {
  return href(`/projects/${projectId}`, {
    tab: 'files', fileq: query.get('fileq'), filetype: query.get('filetype'), ...patch,
  });
}
