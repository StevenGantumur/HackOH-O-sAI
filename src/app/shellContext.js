import { createContext, useContext } from 'react';

// Lets any page open the mobile navigation or the search palette.
export const ShellContext = createContext({ openNav() {}, openSearch() {} });

export const useShell = () => useContext(ShellContext);

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '');
