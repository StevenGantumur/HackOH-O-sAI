import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (callback) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', callback);
      return () => list.removeEventListener('change', callback);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
