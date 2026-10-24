// Line diff between two text versions (AGENTS.md §6.1), using a longest-common-subsequence
// table. Binary files never come here; they get metadata and a side-by-side preview instead.

export const MAX_DIFF_CELLS = 4_000_000;

const TEXT_MIME = /^(text\/|application\/(json|xml|javascript))/;
export const isTextMime = (mime = '') => TEXT_MIME.test(mime);
export const isImageMime = (mime = '') => mime.startsWith('image/');

// Returns [{ type: 'same' | 'add' | 'del', text, oldLine?, newLine? }], or null when the files
// are too large to compare in the browser.
export function diffLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');

  // Trim the shared head and tail so the table only covers the changed middle.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const n = midA.length;
  const m = midB.length;
  if ((n + 1) * (m + 1) > MAX_DIFF_CELLS) return null;

  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] = midA[i] === midB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const ops = [];
  for (let k = 0; k < start; k += 1) ops.push({ type: 'same', text: a[k], oldLine: k + 1, newLine: k + 1 });
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && midA[i] === midB[j]) {
      ops.push({ type: 'same', text: midA[i], oldLine: start + i + 1, newLine: start + j + 1 });
      i += 1;
      j += 1;
    } else if (j >= m || (i < n && lcs[i + 1][j] >= lcs[i][j + 1])) {
      ops.push({ type: 'del', text: midA[i], oldLine: start + i + 1 });
      i += 1;
    } else {
      ops.push({ type: 'add', text: midB[j], newLine: start + j + 1 });
      j += 1;
    }
  }
  for (let k = 0; k < a.length - endA; k += 1) {
    ops.push({ type: 'same', text: a[endA + k], oldLine: endA + k + 1, newLine: endB + k + 1 });
  }
  return ops;
}

export function diffStats(ops) {
  return {
    added: ops.filter((op) => op.type === 'add').length,
    removed: ops.filter((op) => op.type === 'del').length,
  };
}
