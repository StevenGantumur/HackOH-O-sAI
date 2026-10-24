import { useEffect, useId, useRef, useState } from 'react';

// A button that toggles a small panel. Closes on outside click and Escape, then returns focus
// to the button.
//
//   <Popover label="Filter" align="end" trigger={(props) => <button {...props}>Filter</button>}>
//     {(close) => <div>…</div>}
//   </Popover>
export function Popover({ trigger, children, align = 'start', label, panelClassName = '', onOpenChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  function setOpenState(next) {
    setOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpenState(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  });

  const close = () => {
    setOpenState(false);
    buttonRef.current?.focus();
  };

  function onKeyDown(event) {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }

  return (
    <div className="popover-root" ref={rootRef} onKeyDown={onKeyDown}>
      {trigger({
        ref: buttonRef,
        type: 'button',
        'aria-expanded': open,
        'aria-controls': panelId,
        'aria-haspopup': 'dialog',
        onClick: () => setOpenState(!open),
      })}
      {open && (
        <div id={panelId} className={`popover popover-${align} ${panelClassName}`} role="dialog" aria-label={label}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
