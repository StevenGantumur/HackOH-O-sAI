# Shared demo document

`DemoLobby.jsx` keeps its existing browser-local presence connection open. When
it detects the selected partner, it conditionally renders `SharedDemoDocument`
in place of the waiting modal. Both users get the same transition automatically.

`useSharedDemoDocument.js` maintains the draft throughout that lobby session.
Its separate BroadcastChannel is scoped to the sorted participant IDs. It sends
edit operations immediately, exchanges a snapshot when another tab joins, and
merges snapshots periodically. `sharedDocument.js` uses unique character IDs and
deletion tombstones so simultaneous insertions do not overwrite an entire draft.
This is a plain-text editor, not a Google Docs integration or rich-text editor.

The editor also displays the three Easy practice questions with summaries,
original examples, cases to test, and source links. Problem selection syncs
between participants with a revision counter and deterministic tie-breaking.
Changing a problem keeps the shared notes. The editor does not execute code.

For a single-person interaction test, open `#/team-up/demo-preview` or choose
**Test the shared problem editor** on Team Up. This authenticated route renders
two clearly labeled fictional participants in one page. Each uses an independent
channel connection; typing or selecting a problem on one side updates the other.
The disconnect control pauses both editors without deleting the draft. Each
page gets a fresh random room, so different preview visits cannot mix drafts.

If the partner leaves, the document remains visible but editing pauses. A
returning partner receives the draft from the remaining tab. If all participants
close the lobby, the draft is lost. There is no Supabase storage, cross-device
transport, authentication on BroadcastChannel messages, timer, completion credit,
or invitation delivery. Browser-local presence and editing remain labeled demos.

Verified in an isolated two-tab browser check: waiting until the second user
arrives, automatic editor transition, text in both directions, disabled editing
after departure, and draft recovery after rejoining. Text-model unit tests cover
concurrent edits, replacement, emoji, deletions, repeat delivery, and snapshots.
