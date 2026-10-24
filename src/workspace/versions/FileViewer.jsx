import { useState } from 'react';
import { formatBytes, formatFullDate, formatTime, timeAgo } from '../../shared/format.js';
import { taskHref, updateQuery, useRoute } from '../../shared/router.js';
import { getTask, getUser } from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { useAction } from '../../shared/useAction.js';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { FormError } from '../../shared/ui/Field.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { CompareModal, DownloadButton, VersionPreview } from './VersionPreview.jsx';
import { fileIcon, filesHref, fileType } from './fileMetadata.js';

export function FileViewer({ project, file, versions, canEdit, onUpload }) {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const [compareId, setCompareId] = useState(null);
  const current = versions.find((version) => version.id === file.current_version_id) ?? versions.at(-1);
  const requested = query.get('version');
  const viewing = requested ? versions.find((version) => version.id === requested) : current;
  const history = query.get('fileView') === 'history';
  const restore = useAction((versionId) => store.restoreVersion({ userId: me.id, versionId }), {
    success: (version) => `${version.message}: saved as version ${versions.length + 1}`,
  });
  const link = (patch = {}) => filesHref(project.id, query, { file: file.id, ...patch });
  const comparison = versions.find((version) => version.id === compareId);
  const base = comparison && (versions.find((version) => version.id === comparison.parent_version_id) ?? versions[versions.indexOf(comparison) - 1]);
  const shown = history ? current : viewing;
  const author = shown && getUser(data, shown.author_id);

  return <div className="repo-viewer">
    <a className="repo-back" href={filesHref(project.id, query)}><Icon name="arrowLeft" size={15} />Back to files</a>
    <header className="repo-file-header">
      <div className="repo-file-heading"><span className="repo-file-symbol"><Icon name={fileIcon(fileType(file, shown))} size={24} /></span><div><h2>{file.name}</h2><p>{current ? `${formatBytes(current.size)} · ${current.mime_type} · Current version v${versions.indexOf(current) + 1}` : 'No versions yet'}</p></div></div>
      <div className="repo-file-actions">{shown && <DownloadButton version={shown} name={file.name} />}{canEdit && <button type="button" className="btn btn-primary btn-sm" onClick={onUpload}><Icon name="upload" size={16} />Upload new version</button>}</div>
    </header>
    <nav className="repo-view-tabs" aria-label="File views"><a href={link()} aria-current={!history ? 'page' : undefined}><Icon name="eye" size={16} />Preview</a><a href={link({ fileView: 'history' })} aria-current={history ? 'page' : undefined}><Icon name="history" size={16} />History <span className="repo-count">{versions.length}</span></a></nav>
    {history ? <section className="repo-history" aria-labelledby="repo-history-title">
      <div className="repo-history-heading"><h3 id="repo-history-title">Version history</h3><p>Every upload is preserved. Restoring an older version saves a new copy as the current version.</p></div>
      <FormError>{restore.error}</FormError>
      <ol className="repo-timeline">{[...versions].reverse().map((version) => {
        const number = versions.indexOf(version) + 1;
        const contributor = getUser(data, version.author_id);
        const task = version.task_id && getTask(data, version.task_id);
        const isCurrent = version.id === current?.id;
        return <li key={version.id} className={`repo-history-entry ${isCurrent ? 'is-current' : ''}`}>
          <span className="repo-history-number">v{number}</span>
          <div className="repo-history-content">
            <div className="repo-history-message"><h4>{version.message || 'No version message'}</h4>{isCurrent && <span className="pill tone-done">Current</span>}</div>
            <p className="repo-history-meta"><Avatar user={contributor} size={22} /><strong>{contributor?.name ?? 'Unknown contributor'}</strong><time dateTime={version.created_at}>{formatFullDate(version.created_at)} at {formatTime(version.created_at)}</time><span>{formatBytes(version.size)}</span></p>
            {task && <p className="repo-task">Linked to <a className="text-link" href={taskHref(task.id)}>{task.title}</a></p>}
            <div className="repo-history-actions"><a className="btn btn-quiet btn-sm" href={link({ version: version.id })} aria-label={`View version ${number}`}><Icon name="eye" size={15} />View version</a>{number > 1 && <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCompareId(version.id)} aria-label={`Compare version ${number} with previous version`}><Icon name="compare" size={15} />Compare changes</button>}{!isCurrent && canEdit && <button className="btn btn-ghost btn-sm repo-restore" type="button" disabled={restore.pending} aria-label={`Restore version ${number} as a new version`} onClick={async () => { const result = await restore.run(version.id); if (result.ok) updateQuery({ version: null }); }}><Icon name="history" size={15} />{restore.pending ? 'Restoring…' : 'Restore as new version'}</button>}</div>
          </div>
        </li>;
      })}</ol>
    </section> : !viewing ? <EmptyState icon="file" title="Version unavailable" action={<a className="btn btn-quiet" href={link()}>View current version</a>}>This version could not be found for this file.</EmptyState> : <>
      {viewing.id !== current.id && <div className="repo-old-version"><Icon name="history" size={17} /><span>You’re viewing version {versions.indexOf(viewing) + 1}. Current is v{versions.indexOf(current) + 1}.</span><a href={link()}>View current version</a></div>}
      <div className="repo-preview-shell">
        <div className="repo-preview-summary"><Avatar user={author} size={26} /><strong>{author?.name ?? 'Unknown contributor'}</strong><span>{viewing.message || 'No version message'}</span><time dateTime={viewing.created_at} title={`${formatFullDate(viewing.created_at)} at ${formatTime(viewing.created_at)}`}>{timeAgo(viewing.created_at)}</time></div>
        <div className="repo-preview-label"><span><Icon name={fileIcon(fileType(file, viewing))} size={15} />Version {versions.indexOf(viewing) + 1}{viewing.id === current.id ? ' · Current' : ''}</span><span>{formatBytes(viewing.size)} · {viewing.mime_type}</span></div>
        <VersionPreview version={viewing} />
      </div>
    </>}
    {comparison && base && <CompareModal older={base} newer={comparison} onClose={() => setCompareId(null)} />}
  </div>;
}
