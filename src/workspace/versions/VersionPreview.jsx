import { formatBytes, timeAgo } from '../../shared/format.js';
import { href } from '../../shared/router.js';
import { getFile, getUser, membershipOf, versionNumber } from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { diffLines, diffStats, isImageMime } from './diff.js';
import './versions.css';

function imageSource(version, blob) {
  if (!blob) return null;
  if (blob.kind === 'dataUrl') return blob.data;
  if (version.mime_type === 'image/svg+xml') return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(blob.data)}`;
  return null;
}

// Text shows as text, images as images (SVG goes through <img>, so it can't run scripts), and
// anything else shows its details instead of pretending to preview.
export function VersionPreview({ version }) {
  const blob = store.readBlob(version.storage_ref);
  if (!blob) {
    return (
      <div className="preview-empty">
        <Icon name="file" size={22} />
        <p>
          <strong>No preview for this sample file.</strong> The demo keeps only its details ({version.mime_type}, {formatBytes(version.size)}).
        </p>
      </div>
    );
  }
  if (isImageMime(version.mime_type)) {
    const src = imageSource(version, blob);
    if (src) {
      return (
        <div className="preview-image">
          <img src={src} alt={`Preview of version ${version.message ? `“${version.message}”` : ''}`} />
        </div>
      );
    }
  }
  if (blob.kind === 'text') return <pre className="preview-text">{blob.data}</pre>;
  return (
    <div className="preview-empty">
      <Icon name="file" size={22} />
      <p>
        <strong>No in-browser preview for {version.mime_type} files.</strong> Download it to open it.
      </p>
    </div>
  );
}

export function DownloadButton({ version, name, className = 'btn btn-quiet btn-sm' }) {
  const blob = store.readBlob(version.storage_ref);
  if (!blob) return null;

  async function download() {
    const file = blob.kind === 'text' ? new Blob([blob.data], { type: version.mime_type }) : await (await fetch(blob.data)).blob();
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button type="button" className={className} onClick={download}>
      <Icon name="download" size={16} />
      Download
    </button>
  );
}

export function VersionModal({ version, onClose }) {
  const data = useData();
  const me = useMe();
  const file = getFile(data, version.file_id);
  const author = getUser(data, version.author_id);
  const isMember = Boolean(membershipOf(data, me.id, file?.project_id));
  return (
    <Modal
      title={file?.name ?? 'File'}
      description={`Version ${versionNumber(data, version)} by ${author?.name}, ${timeAgo(version.created_at)}: “${version.message}”`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          {isMember && (
            <a className="btn btn-ghost" href={href(`/projects/${file.project_id}`, { tab: 'files', file: file.id })} onClick={onClose}>
              <Icon name="history" size={18} />
              Version history
            </a>
          )}
          <DownloadButton version={version} name={file?.name ?? 'download'} className="btn btn-quiet" />
        </>
      }
    >
      <VersionPreview version={version} />
    </Modal>
  );
}

function VersionFacts({ data, version }) {
  const author = getUser(data, version.author_id);
  return (
    <dl className="version-facts">
      <div>
        <dt>Author</dt>
        <dd>{author?.name}</dd>
      </div>
      <div>
        <dt>Saved</dt>
        <dd>{timeAgo(version.created_at)}</dd>
      </div>
      <div>
        <dt>Size</dt>
        <dd>{formatBytes(version.size)}</dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>{version.mime_type}</dd>
      </div>
    </dl>
  );
}

const SIGN = { add: '+', del: '−', same: ' ' };
const SPOKEN = { add: 'Added: ', del: 'Removed: ', same: '' };

export function CompareModal({ older, newer, onClose }) {
  const data = useData();
  const before = store.readBlob(older.storage_ref);
  const after = store.readBlob(newer.storage_ref);
  const a = versionNumber(data, older);
  const b = versionNumber(data, newer);
  const textual = before?.kind === 'text' && after?.kind === 'text' && !isImageMime(newer.mime_type);
  const ops = textual ? diffLines(before.data, after.data) : null;
  const stats = ops && diffStats(ops);

  return (
    <Modal title={`Changes from v${a} to v${b}`} description={`“${newer.message}”`} size="lg" onClose={onClose}>
      {textual && ops && (
        <div className="diff">
          <p className="diff-stats">
            <span className="diff-count-add">+{stats.added}</span> <span className="diff-count-del">−{stats.removed}</span> lines
          </p>
          <div className="diff-body">
            {ops.map((op, i) => (
              <div key={i} className={`diff-line diff-${op.type}`}>
                <span className="diff-num" aria-hidden="true">
                  {op.oldLine ?? ''}
                </span>
                <span className="diff-num" aria-hidden="true">
                  {op.newLine ?? ''}
                </span>
                <span className="diff-sign" aria-hidden="true">
                  {SIGN[op.type]}
                </span>
                <code>
                  <span className="visually-hidden">{SPOKEN[op.type]}</span>
                  {op.text || ' '}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
      {textual && !ops && <p className="muted">These versions are too large to compare in the browser.</p>}
      {!textual && (
        <div className="compare-side">
          {[
            [older, a],
            [newer, b],
          ].map(([version, n]) => (
            <figure key={version.id} className="compare-pane">
              <figcaption>
                v{n}: {version.message}
              </figcaption>
              <VersionPreview version={version} />
              <VersionFacts data={data} version={version} />
            </figure>
          ))}
        </div>
      )}
    </Modal>
  );
}
