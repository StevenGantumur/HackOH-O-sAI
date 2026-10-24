import { cloneElement, useId } from 'react';
import { Icon } from './Icon.jsx';

// Label, hint and error wired to the control with aria-describedby / aria-invalid.
export function Field({ label, hint, error, children, optional = false }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {optional && <span className="field-optional"> (optional)</span>}
      </label>
      {cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p className="form-error" role="alert">
      <Icon name="alert" size={16} />
      {children}
    </p>
  );
}
