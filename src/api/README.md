# Supabase API helpers

Put frontend code that directly contacts Supabase in this folder. Components and
providers import these functions and manage loading, errors, and screen state.
This is a client request layer; Supabase hosts the actual HTTP endpoints.

- `client.js`: environment validation and the shared Supabase client.
- `auth.js`: sign in, sign up, sign out, current user, and auth subscriptions.
- `profiles.js`: account profiles, account directory, username setup, and profile updates.
- `directMessages.js`: send messages, load conversation history, and load the chat list.
- `projectMissionApi.js`: fetch projects and missions, create records, and call join RPCs.
- `connection.js`: the read-only Auth settings connection check.

For example, the Send message form in `src/teamup/LiveConversation.jsx` calls
`sendDirectMessage()` here. That helper verifies the current user through
`auth.js`, inserts into `direct_messages`, and returns the saved database row.
The component then displays the confirmed message or an error.

Authentication forms call `auth.js`; profile forms call `profiles.js`.
Providers call the same helpers for automatic reads and expose the results to
React. Sample accounts and sample workspace actions continue to use the mock store.

Registered conversations and chat lists use `src/shared/autoRefresh.js` to call
their read helpers automatically, three seconds after each request completes.
Reads pause in hidden tabs and resume on focus, visibility, or network recovery.
Manual Refresh remains available. This is polling in React, not a Turbo Drive
integration or a Supabase Realtime subscription. Effects stop delivery of stale
results after navigation; background reads preserve confirmed sent messages.

The project and mission join helpers are available through `WorkspaceProvider`,
but their Join buttons still use the local mock store. Moving these helpers does
not complete that button integration.

Keep SQL schema definitions in the owning feature folder. API tests live beside
their helpers. Browser requests use the publishable key and signed-in session;
database policies remain responsible for enforcing access.
