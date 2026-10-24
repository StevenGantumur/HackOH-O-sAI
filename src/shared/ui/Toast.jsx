import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

const ToastContext = createContext(() => {});

const TONE_ICON = { success: 'checkCircle', error: 'alert', info: 'info' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (toast) => {
      counter.current += 1;
      const id = counter.current;
      const tone = toast.tone ?? 'success';
      setToasts((list) => [...list.slice(-2), { ...toast, id, tone }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="toasts" aria-live="polite" aria-relevant="additions">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.tone}`}>
              <Icon name={TONE_ICON[toast.tone]} className="toast-icon" />
              <div className="toast-text">
                <p className="toast-title">{toast.title}</p>
                {toast.body && <p className="toast-body">{toast.body}</p>}
              </div>
              {toast.action && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    toast.action.onClick();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
