import { useState } from 'react';
import { formatBytes, timeAgo } from '../../shared/format.js';
import { href, taskHref, updateQuery, useRoute } from '../../shared/router.js';
import { filesInProject, getFile, getTask, getUser, membershipOf, tasksInProject, versionsForFile } from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { useAction } from '../../shared/useAction.js';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { EmptyState, Spinner } from '../../shared/ui/bits.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { Field, FormError } from '../../shared/ui/Field.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { readUpload } from './readUpload.js';
import { CompareModal, DownloadButton, VersionPreview } from './VersionPreview.jsx';
import './versions.css';

const latestTime = (versions) => Date.parse(versions.at(-1)?.created_at ?? 0);

// Version control for any file type (AGENTS.md §6.1): uploads append, restores append, nothing
// is overwritten or deleted.
export function FilesPanel({ project }) {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const [uploadFor, setUploadFor] = useState(null);
  const canEdit = Boolean(membershipOf(data, me.id, project.id));

  const files = filesInProject(data, project.id)
    .map((file) => ({ file, versions: versionsForFile(data, file.id) }))
    .sort((a, b) => latestTime(b.versions) - latestTime(a.versions));
  const selected = files.find((f) => f.file.id === query.get('file')) ?? files[0];

  return (
    <div className="files-layout">
      <aside className="files-list" aria-labelledby="files-title">
        <div className="files-list-head">
          <h2 className="section-title" id="files-title">
            Files
          </h2>
          {canEdit && (
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setUploadFor({ fileId: null })}>
              <Icon name="upload" size={16} />
              Upload
            </button>
          )}
        </div>
        <p className="files-note">Any file type. Each upload adds a version; nothing is overwritten.</p>
        {files.length > 0 && (
          <ul className="file-links">
            {files.map(({ file, versions }) => {
              const latest = versions.at(-1);
              const active = selected?.file.id === file.id;
              return (
                <li key={file.id}>
                  <a
                    className={`file-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'true' : undefined}
                    href={href(`/projects/${project.id}`, { tab: 'files', file: file.id })}
                  >
                    <span className="file-icon">
                      <Icon name={latest?.mime_type.startsWith('image/') ? 'image' : 'file'} size={18} />
                    </span>
                    <span className="file-link-text">
                      <span className="file-link-name">{file.name}</span>
                      <span className="file-link-meta">
                        v{versions.length}, {latest ? timeAgo(latest.created_at) : 'no versions'}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="file-detail">
        {selected ? (
          <FileDetail key={selected.file.id} file={selected.file} versions={selected.versions} canEdit={canEdit} onUpload={() => setUploadFor({ fileId: selected.file.id })} />
        ) : (
          <EmptyState
            icon="file"
            title="No files yet"
            action={
              canEdit && (
                <button type="button" className="btn btn-primary" onClick={() => setUploadFor({ fileId: null })}>
                  Upload a file
                </button>
              )
            }
          >
            Upload drafts, images, data or CAD files. Every version is kept.
          </EmptyState>
        )}
      </section>

      {uploadFor && <UploadModal project={project} fileId={uploadFor.fileId} onClose={() => setUploadFor(null)} />}
    </div>
  );
}

function FileDetail({ file, versions, canEdit, onUpload }) {
  const data = useData();
  const me = useMe();
  const [viewingId, setViewingId] = useState(null); // null follows the current version
  const [compareId, setCompareId] = useState(null);
  const current = versions.find((v) => v.id === file.current_version_id) ?? versions.at(-1);
  const viewing = versions.find((v) => v.id === viewingId) ?? current;
  const restore = useAction((versionId) => store.restoreVersion({ userId: me.id, versionId }), {
    success: (v) => `${v.message}: saved as version ${versions.length + 1}`,
  });

  const compareTarget = versions.find((v) => v.id === compareId);
  const compareBase = compareTarget && (versions.find((v) => v.id === compareTarget.parent_version_id) ?? versions[versions.indexOf(compareTarget) - 1]);

  return (
    <>
      <header className="file-head">
        <div className="file-head-text">
          <h3 className="file-title">{file.name}</h3>
          <p className="muted small">
            {versions.length} version{versions.length === 1 ? '' : 's'}, {formatBytes(current.size)}, {current.mime_type}
          </p>
        </div>
        <div className="file-actions">
          {canEdit && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={onUpload}>
              <Icon name="upload" size={16} />
              New version
            </button>
          )}
          <DownloadButton version={viewing} name={file.name} />
        </div>
      </header>

      <p className="viewing-note">
        {viewing.id === current.id ? 'Showing the current version.' : `Showing version ${versions.indexOf(viewing) + 1}, not the current one.`}
      </p>
      <VersionPreview version={viewing} />

      <section className="history" aria-labelledby="history-title">
        <h3 className="drawer-section-title" id="history-title">
          History
        </h3>
        <ol className="history-list">
          {[...versions].reverse().map((version) => {
            const n = versions.indexOf(version) + 1;
            const author = getUser(data, version.author_id);
            const task = version.task_id ? getTask(data, version.task_id) : null;
            const isCurrent = version.id === file.current_version_id;
            return (
              <li key={version.id} className={`history-item ${viewing.id === version.id ? 'is-viewing' : ''}`}>
                <span className="history-num">v{n}</span>
                <div className="history-main">
                  <p className="history-msg">{version.message}</p>
                  <p className="history-meta">
                    <Avatar user={author} size={18} />
                    {author?.name}, {timeAgo(version.created_at)}
                    {task && (
                      <>
                        {' '}
                        for{' '}
                        <a className="text-link" href={taskHref(task.id)}>
                          {task.title}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="history-actions">
                  {isCurrent && <span className="pill tone-done">Current</span>}
                  <button type="button" className="btn btn-ghost btn-sm" aria-pressed={viewing.id === version.id} onClick={() => setViewingId(version.id)}>
                    View
                  </button>
                  {n > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCompareId(version.id)}>
                      <Icon name="compare" size={15} />
                      Changes
                    </button>
                  )}
                  {!isCurrent && canEdit && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={restore.pending}
                      onClick={async () => {
                        const result = await restore.run(version.id);
                        if (result.ok) setViewingId(null);
                      }}
                      aria-label={`Restore version ${n} as a new version`}
                    >
                      <Icon name="history" size={15} />
                      Restore
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {compareTarget && compareBase && <CompareModal older={compareBase} newer={compareTarget} onClose={() => setCompareId(null)} />}
    </>
  );
}

function UploadModal({ project, fileId, onClose }) {
  const data = useData();
  const me = useMe();
  const file = fileId ? getFile(data, fileId) : null;
  const tasks = tasksInProject(data, project.id).filter((t) => t.status !== 'done');
  const [upload, setUpload] = useState(null);
  const [message, setMessage] = useState('');
  const [taskId, setTaskId] = useState('');
  const [errors, setErrors] = useState({});

  const save = useAction(() => store.uploadVersion({ userId: me.id, projectId: project.id, fileId, upload, message, taskId: taskId || null }), {
    success: file ? `New version of ${file.name} saved` : 'File uploaded',
    toastErrors: false,
  });

  async function onFileChange(event) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    try {
      setUpload(await readUpload(picked));
      setErrors((e) => ({ ...e, file: null }));
    } catch (err) {
      setUpload(null);
      setErrors((e) => ({ ...e, file: err.message }));
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!upload) next.file = errors.file ?? 'Choose a file.';
    if (!message.trim()) next.message = 'Say what changed, so teammates can follow the history.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const result = await save.run();
    if (result.ok) {
      onClose();
      updateQuery({ file: result.result.file_id });
    }
  }

  return (
    <Modal
      title={file ? `New version of ${file.name}` : 'Upload a file'}
      description="Versions are append-only: older versions stay in the history and can be restored."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="upload-form" className="btn btn-primary" disabled={save.pending}>
            {save.pending ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              'Save version'
            )}
          </button>
        </>
      }
    >
      <form id="upload-form" className="form" onSubmit={onSubmit} noValidate>
        <Field label="File" hint={upload ? `${upload.name}, ${formatBytes(upload.size)}` : 'Any type, up to 2 MB in the demo.'} error={errors.file}>
          <input className="input" type="file" onChange={onFileChange} />
        </Field>
        <Field label="What changed" error={errors.message}>
          <input className="input" value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} placeholder="Reworded question 3 after the pilot" />
        </Field>
        <Field label="Link to a task" optional hint="Linked versions count toward that task’s contribution history.">
          <select className="select" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">No task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
        <FormError>{save.error}</FormError>
      </form>
    </Modal>
  );
}
