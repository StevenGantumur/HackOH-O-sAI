# Direct-message API — approved implementation

Arnav confirmed team approval before the schema was applied, on the local `30-minute-demo` branch.

## Database

`teamup_accounts` links a Supabase Auth UUID to one unique fictional persona and sample display name. It grants no project permissions. Authenticated users can read the sample directory and insert only their own account link. Links cannot be changed from the browser.

`direct_messages` stores a generated UUID, author and recipient account UUIDs, nonblank content up to 2,000 characters, and a server timestamp. Both participants can read; only the authenticated author can insert. No anonymous access, UPDATE, or DELETE is granted. Clients cannot insert generated message IDs or timestamps. SQL is saved in `direct-message-schema.sql` and applied as the remote `teamup_private_direct_messages` migration.

## Send flow

Send message → validate draft → verify Supabase Auth user → POST /rest/v1/direct_messages → await confirmed row → append message and clear draft. Errors preserve the draft. A pending state and submission guard prevent duplicate clicks.

`directMessages.js` implements inserts and recent-history reads. Global `src/auth/AuthProvider.jsx` and `AuthPage.jsx` handle signup, sign-in, email confirmation, username setup, and sign-out for the whole site. `MessagingAuth.jsx` links the sample persona after authentication. `LiveConversation.jsx` connects the composer. `LiveChatList.jsx` loads conversation participants under RLS. Auth sessions use sessionStorage so different tabs can sign in as different accounts. The global demo-user switcher is not authentication.

## Verification and limits

The build and unit tests are run locally. Database RLS tests insert temporary fixtures and roll back: author and recipient can read, a third user cannot, forged authors are blocked, and system fields cannot be supplied by the client. Supabase security advisors reported no notices.

Email confirmation is enabled. An end-to-end browser send requires two email-confirmed test accounts; no real emails are sent by the automated checks. Replies use Refresh messages; Realtime, challenge progress, invitations, and lobby presence are not migrated by this change. The live history displays the latest 100 messages; older-history pagination is not implemented.
