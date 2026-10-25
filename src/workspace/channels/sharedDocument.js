// Local demo text model. Character IDs let concurrent inserts merge without
// replacing a partner's entire document. Deletions remain as tombstones.
export function createDocument(replica) {
  return { replica, clock: 0, nodes: new Map(), deleted: new Set() };
}

export function mergeDocument(document, patch) {
  if (!patch || !Array.isArray(patch.nodes) || !Array.isArray(patch.deleted)) return;
  for (const node of patch.nodes) {
    if (!node || typeof node.id !== 'string' || typeof node.after !== 'string' || typeof node.value !== 'string' || node.value.length !== 1 || !Number.isSafeInteger(node.clock) || node.clock < 1) continue;
    if (!document.nodes.has(node.id)) document.nodes.set(node.id, node);
    document.clock = Math.max(document.clock, node.clock);
  }
  for (const id of patch.deleted) if (typeof id === 'string') document.deleted.add(id);
}

export function visibleNodes(document) {
  const children = new Map();
  for (const node of document.nodes.values()) {
    if (!children.has(node.after)) children.set(node.after, []);
    children.get(node.after).push(node);
  }
  for (const siblings of children.values()) siblings.sort((a, b) => b.clock - a.clock || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  const result = [];
  const stack = [...(children.get('') ?? [])].reverse();
  const seen = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    if (!document.deleted.has(node.id)) result.push(node);
    const descendants = children.get(node.id) ?? [];
    for (let i = descendants.length - 1; i >= 0; i -= 1) stack.push(descendants[i]);
  }
  return result;
}

export const documentText = (document) => visibleNodes(document).map((node) => node.value).join('');
export const documentSnapshot = (document) => ({ nodes: [...document.nodes.values()], deleted: [...document.deleted] });

export function editDocument(document, nextText) {
  const current = visibleNodes(document);
  const previous = current.map((node) => node.value).join('');
  let start = 0;
  while (start < previous.length && start < nextText.length && previous[start] === nextText[start]) start += 1;
  let end = 0;
  while (end < previous.length - start && end < nextText.length - start && previous[previous.length - end - 1] === nextText[nextText.length - end - 1]) end += 1;
  const patch = { nodes: [], deleted: current.slice(start, current.length - end).map((node) => node.id) };
  let after = current[start - 1]?.id ?? '';
  // Use UTF-16 units to match textarea selection offsets, including emoji.
  const inserted = nextText.slice(start, nextText.length - end);
  for (let i = 0; i < inserted.length; i += 1) {
    const clock = ++document.clock;
    const node = { id: `${clock}:${document.replica}`, clock, after, value: inserted[i] };
    patch.nodes.push(node);
    after = node.id;
  }
  mergeDocument(document, patch);
  return patch;
}
