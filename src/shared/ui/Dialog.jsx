import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last. When an action removes the focused button (posting a review,
// confirming a claim), focus falls back to <body>, outside every dialog; this listener keeps
// Escape and Tab working for the top dialog in that case.
const openDialogs = [];

function onStrayKeyDown(event) {
  const top = openDialogs.at(-1);
  if (!top?.ref.current || top.ref.current.contains(document.activeElement)) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    top.onCloseRef.current();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    (top.ref.current.querySelector(FOCUSABLE) ?? top.ref.current).focus();
  }
}

// Focus moves into the dialog on open and back to the trigger on close; Tab stays inside;
// Escape closes. Keyboard handling uses React events so nested dialogs and popovers can stop
// propagation before an outer dialog sees the key.
function useDialog(onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement;
    const entry = { ref, onCloseRef };
    openDialogs.push(entry);
    if (openDialogs.length === 1) document.addEventListener('keydown', onStrayKeyDown);
    const first = node.querySelector('[data-autofocus]') ?? node.querySelector(FOCUSABLE) ?? node;
    first.focus({ preventScroll: true });
    return () => {
      openDialogs.splice(openDialogs.indexOf(entry), 1);
      if (openDialogs.length === 0) document.removeEventListener('keydown', onStrayKeyDown);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (event.key !== 'Tab') return;
    event.stopPropagation();
    const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { ref, onKeyDown };
}

function closeOnBackdrop(onClose) {
  return (event) => {
    if (event.target === event.currentTarget) onClose();
  };
}

export function Modal({ title, description, onClose, children, footer, size = 'md' }) {
  const { ref, onKeyDown } = useDialog(onClose);
  const titleId = useId();
  const descId = useId();
  return createPortal(
    <div className="overlay overlay-center" onMouseDown={closeOnBackdrop(onClose)}>
      <div
        ref={ref}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <header className="modal-head">
          <div>
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="modal-desc">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        {children != null && <div className="modal-body">{children}</div>}
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ label, onClose, children }) {
  const { ref, onKeyDown } = useDialog(onClose);
  return createPortal(
    <div className="overlay overlay-side" onMouseDown={closeOnBackdrop(onClose)}>
      <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={onKeyDown}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
