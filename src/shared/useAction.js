import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from './ui/Toast.jsx';

// Pending, success and error handling for async writes (AGENTS.md §5.6, §8). Nothing is shown
// as done until the store confirms it.
//
//   const claim = useAction(() => store.claimTask(...), { success: 'Mission claimed' });
//   <button disabled={claim.pending} onClick={claim.run}>
export function useAction(action, { success, toastErrors = true } = {}) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const latest = useRef(action);
  const alive = useRef(true);

  useEffect(() => {
    latest.current = action;
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      try {
        const result = await latest.current(...args);
        if (success) toast({ tone: 'success', title: typeof success === 'function' ? success(result) : success });
        return { ok: true, result };
      } catch (err) {
        const message = err?.message || 'Something went wrong. Try again.';
        if (alive.current) setError(message);
        if (toastErrors) toast({ tone: 'error', title: message });
        return { ok: false, error: message };
      } finally {
        if (alive.current) setPending(false);
      }
    },
    [toast, success, toastErrors],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
