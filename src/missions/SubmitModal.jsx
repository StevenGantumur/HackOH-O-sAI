import { useState } from 'react';
import { formatBytes } from '../shared/format.js';
import { store, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { Spinner } from '../shared/ui/bits.jsx';
import { Modal } from '../shared/ui/Dialog.jsx';
import { Field, FormError } from '../shared/ui/Field.jsx';
import { readUpload } from '../workspace/versions/readUpload.js';

export function SubmitModal({ task, onClose }) {
  const me = useMe();
  const [kind, setKind] = useState('link');
  const [url, setUrl] = useState('');
  const [upload, setUpload] = useState(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  const submit = useAction(
    () =>
      store.submitWork({
        userId: me.id,
        taskId: task.id,
        externalUrl: kind === 'link' ? url : null,
        upload: kind === 'file' ? upload : null,
        note,
      }),
    { success: 'Submitted for review', toastErrors: false },
  );

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUpload(await readUpload(file));
      setErrors((e) => ({ ...e, file: null }));
    } catch (err) {
      setUpload(null);
      setErrors((e) => ({ ...e, file: err.message }));
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (kind === 'link' && !url.trim()) next.url = 'Paste a link your reviewer can open.';
    else if (kind === 'link' && !/^https?:\/\//i.test(url.trim())) next.url = 'Links need to start with http:// or https://.';
    if (kind === 'file' && !upload) next.file = errors.file ?? 'Choose a file to upload.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const result = await submit.run();
    if (result.ok) onClose();
  }

  return (
    <Modal
      title="Submit your work"
      description={`For “${task.title}”. Your reviewer sees the link or file and your note.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="submit-work-form" className="btn btn-primary" disabled={submit.pending}>
            {submit.pending ? (
              <>
                <Spinner />
                Submitting…
              </>
            ) : (
              'Submit for review'
            )}
          </button>
        </>
      }
    >
      <form id="submit-work-form" className="form" onSubmit={onSubmit} noValidate>
        <fieldset className="field">
          <legend className="field-label">What are you sharing?</legend>
          <div className="segmented">
            {[
              ['link', 'A link'],
              ['file', 'A file'],
            ].map(([value, label]) => (
              <label key={value}>
                <input className="visually-hidden" type="radio" name="submit-kind" value={value} checked={kind === value} onChange={() => setKind(value)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {kind === 'link' ? (
          <Field label="Link" hint="A Google Doc, Figma file, GitHub branch: anything your reviewer can open." error={errors.url}>
            <input
              className="input"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrors((prev) => ({ ...prev, url: null }));
              }}
              data-autofocus
            />
          </Field>
        ) : (
          <Field
            label="File"
            hint={upload ? `${upload.name}, ${formatBytes(upload.size)}. Saved as a new version in the project’s files.` : 'Up to 2 MB. The demo keeps files in this browser.'}
            error={errors.file}
          >
            <input className="input" type="file" onChange={onFileChange} />
          </Field>
        )}

        <Field label="Note for your reviewer" optional hint="What did you do, and what should they look at first?">
          <textarea className="textarea" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <FormError>{submit.error}</FormError>
      </form>
    </Modal>
  );
}
