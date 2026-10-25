# Team Up live demo

For registered accounts: Messages → a registered person's conversation → Start
demo. Both users sign in to their own confirmed accounts and open the same
conversation from their respective sides. It works across devices using the
same Supabase project.

`DemoLobby.jsx` uses `useLiveDemo.js` for real account pairs. The hook calls
`src/api/demoSessions.js`; only that module contacts Supabase. It joins a room,
polls server presence and document events roughly every second, and renders the
problem/editor only after both participants are active and history has loaded.
A lost connection returns to the waiting view, keeps the local draft, and retries.
Closing calls Leave; crashed connections expire after 20 seconds.

## Schema and access

Applied from `src/teamup/demo-session-schema.sql`:

- `demo_sessions`: room UUID, canonical pair of account-profile UUIDs, revision,
  creation time. A pair reuses its room and saved document.
- `demo_presence`: session, per-tab connection UUID, authenticated user UUID,
  server heartbeat time. Two tabs of one account count as one participant.
- `demo_document_events`: session, revision, unique operation UUID, authenticated
  author, JSON edit payload, server timestamp.

RLS allows participants to read their room only. Direct browser writes are
revoked. Invoker RPCs `join_demo`, `sync_demo`, `write_demo_event`, `leave_demo`
delegate narrow operations to a private-schema definer. It checks the confirmed
Auth user; callers cannot choose another author or heartbeat timestamp. Both
participants must be active to edit. Room locks serialize revisions so readers
cannot skip late commits. Retried writes reuse operation UUIDs to avoid duplicates.

## Document

Character operations merge simultaneous edits without replacing entire drafts.
Saved events replay on rejoin, 100 at a time; editing waits until replay finishes.
Pending edits retry and remain labeled unsaved until acknowledged. Keep the
popup open while edits are pending. Input is capped at 10,000 characters. Event
history is not compacted yet, so long-lived rooms may take longer to reload.

The three Easy questions include summaries, original examples, test cases, and
FastPrep links. Selection syncs, while switching problems keeps the notes.
This plain-text editor does not execute code, connect to Google Docs, send
invitations, or record completion credit.

## Local previews

`#/team-up/demo-preview` stays an authenticated, labeled local test with fictional
participants and BroadcastChannel. Sample-person conversations stay local too;
neither writes to the live demo tables nor represents real account presence.

## Verification

`demo-session-schema.test.sql` creates confirmed fixtures, runs actual RPCs as
`authenticated`, then rolls back everything. It checks distinct-user presence,
private reads, identity protection, write gating, delivery, idempotency, cursor
reads, expiry, reconnect, leave, and anonymous ACLs. Client tests cover waiting,
retry IDs, and leaving during join. The real signed-in browser verified Join and
waiting; a full two-account browser edit needs the partner to join independently.
