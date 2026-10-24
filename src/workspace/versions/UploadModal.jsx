import { useRef, useState } from 'react';
import { formatBytes } from '../../shared/format.js';
import { updateQuery } from '../../shared/router.js';
import { getFile, tasksInProject } from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { useAction } from '../../shared/useAction.js';
import { Spinner } from '../../shared/ui/bits.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { Field, FormError } from '../../shared/ui/Field.jsx';
import { readUpload } from './readUpload.js';

export function UploadModal({ project, fileId, onClose }) {
  const data = useData();
  const me = useMe();
  const file = fileId ? getFile(data, fileId) : null;
  const tasks = tasksInProject(data, project.id).filter((t) => t.status !== 'done');
  const [upload, setUpload] = useState(null);
  const [reading, setReading] = useState(false);
  const selection = useRef(0);
  const [message, setMessage] = useState('');
  const [taskId, setTaskId] = useState('');
  const [errors, setErrors] = useState({});

  const save = useAction(() => store.uploadVersion({ userId: me.id, projectId: project.id, fileId, upload, message, taskId: taskId || null }), {
    success: file ? `New version of ${file.name} saved` : 'File uploaded',
    toastErrors: false,
  });

  async function onFileChange(event) {
    const picked = event.target.files?.[0];
    const request = ++selection.current;
    setUpload(null);
    setReading(Boolean(picked));
    if (!picked) return;
    try {
      const next = await readUpload(picked);
      if (request !== selection.current) return;
      setUpload(next);
      setErrors((e) => ({ ...e, file: null }));
    } catch (err) {
      if (request !== selection.current) return;
      setUpload(null);
      setErrors((e) => ({ ...e, file: err.message }));
    } finally {
      if (request === selection.current) setReading(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (reading || save.pending) return;
    const next = {};
    if (!upload) next.file = errors.file ?? 'Choose a file.';
    if (!message.trim()) next.message = 'Say what changed, so teammates can follow the history.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const result = await save.run();
    if (result.ok) {
      onClose();
      updateQuery({ file: result.result.file_id, fileView: null, version: null }, { replace: false });
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
          <button type="submit" form="upload-form" className="btn btn-primary" disabled={save.pending || reading}>
            {save.pending ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              reading ? 'Reading file…' : 'Save version'
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
