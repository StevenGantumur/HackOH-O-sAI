# Direct messages and account profiles — approved implementation

Work remains on `30-minute-demo`. Arnav requested real registered identities alongside the fictional sample cast.

## Identity and profile schema

Supabase Auth manages credentials. `account_profiles` stores the Auth UUID, username, and private email. Only the owner can read the private profile. `account_directory` exposes the UUID, username, major, skills, and goals to signed-in users; it contains no email or passwords. A private trigger keeps usernames synchronized. Owners can edit only their own public profile details. The invoker-security `update_my_account_profile` RPC commits username and major edits atomically under RLS.

`direct_messages.author_id` and `recipient_id` reference `account_profiles.id`. Message rows and participant UUIDs were preserved when the foreign keys were migrated away from `teamup_accounts`. That legacy table is retained; the UI no longer claims fictional personas and new browser inserts into it are disabled.

## User flow

The default display identity is the logged-in username and UUID. Team Up search and the Messages people list show registered accounts first, alongside labeled fictional students. Other registered accounts can be viewed or messaged, never impersonated through the sample switcher. Use my account returns from a sample project persona to the signed-in identity.

Registered chat: Send message → validate draft → verify Auth → POST /rest/v1/direct_messages → await confirmed row → append and clear draft. A failed write preserves the draft. Both participant IDs and server timestamps appear with usernames resolved from the public directory. Replies load using Refresh messages; latest 100 messages are displayed.

Fictional chat: SampleConversation uses only tab-local preview history, labeled not delivered. Incoming request examples remain fictional; no requests are fabricated for registered users.

## Implementation and verification

SQL: `src/auth/account-directory-schema.sql` and `src/auth/account-profile-update.sql`, layered on the previous schema files. `AccountDirectoryProvider.jsx` mirrors public account fields into the sample workspace; it never mirrors email. Real profiles save through Supabase, while sample profiles and projects retain their local demo behavior.

Database transaction tests verify automatic directory entries, private email isolation, real messaging without persona links, participant-only reads, blocked sender spoofing, owner-only profile edits, and atomic rollback for invalid edits. Test fixtures are rolled back. Complete browser signup/sign-in and a two-user exchange still require the users' confirmed accounts.

Existing Supabase advisory: leaked-password protection is disabled. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. No Auth security settings were changed by this feature.
