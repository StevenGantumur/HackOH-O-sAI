import { useId, useState } from 'react';
import { store, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { Spinner } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useAccountDirectory } from '../auth/AccountDirectoryProvider.jsx';

// Skills or goals, editable by their owner. Matching on the Missions and Projects pages uses
// these, so editing them changes recommendations right away.
export function TagSection({ title, field, values, editable, hint, suggestions = [], userId }) {
  const me = useMe();
  const { profile } = useAuth();
  const directory = useAccountDirectory();
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values);
  const [input, setInput] = useState('');
  const save = useAction(() => (userId ?? me.id) === profile.id
    ? directory.updateDetails({ [field]: draft })
    : store.updateProfile({ userId: userId ?? me.id, [field]: draft }), { success: `${title} saved` });

  const has = (value) => draft.some((v) => v.toLowerCase() === value.toLowerCase());
  const add = (value) => {
    const clean = value.trim().replace(/,$/, '');
    if (clean && !has(clean)) setDraft((d) => [...d, clean]);
    setInput('');
  };
  const remove = (value) => setDraft((d) => d.filter((v) => v !== value));
  const open = suggestions.filter((s) => !has(s)).slice(0, 8);

  if (!editing) {
    return (
      <section className="card side-card" aria-labelledby={`${inputId}-title`}>
        <div className="section-head">
          <h2 className="section-title" id={`${inputId}-title`}>
            {title}
          </h2>
          {editable && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDraft(values);
                setEditing(true);
              }}
            >
              Edit
            </button>
          )}
        </div>
        {values.length ? (
          <div className="tags">
            {values.map((value) => (
              <span key={value} className="tag">
                {value}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">None listed yet.</p>
        )}
        {hint && <p className="muted small">{hint}</p>}
      </section>
    );
  }

  async function onSave() {
    const result = await save.run();
    if (result.ok) setEditing(false);
  }

  return (
    <section className="card side-card tag-editor" aria-labelledby={`${inputId}-title`}>
      <h2 className="section-title" id={`${inputId}-title`}>
        Edit {title.toLowerCase()}
      </h2>
      <div className="tags">
        {draft.map((value) => (
          <span key={value} className="tag tag-removable">
            {value}
            <button type="button" onClick={() => remove(value)} aria-label={`Remove ${value}`}>
              <Icon name="x" size={12} strokeWidth={2.4} />
            </button>
          </span>
        ))}
      </div>
      <label className="visually-hidden" htmlFor={inputId}>
        Add to {title.toLowerCase()}
      </label>
      <input
        id={inputId}
        className="input"
        value={input}
        placeholder="Type and press Enter"
        maxLength={60}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setInput(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(input);
          }
        }}
      />
      {open.length > 0 && (
        <div className="tag-suggestions">
          <span className="muted small">Popular in projects:</span>
          {open.map((s) => (
            <button key={s} type="button" className="tag-suggestion" onClick={() => add(s)}>
              <Icon name="plus" size={12} strokeWidth={2.4} />
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="tag-editor-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={save.pending}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={save.pending}>
          {save.pending ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </section>
  );
}
