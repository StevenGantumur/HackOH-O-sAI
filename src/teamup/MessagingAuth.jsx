import { useAuth } from '../auth/AuthProvider.jsx';

// Real messages always use the verified Auth profile, regardless of the sample-persona menu.
export function MessagingAuth({ children }) {
  const { profile, client } = useAuth();
  return children({ account: profile, client });
}
