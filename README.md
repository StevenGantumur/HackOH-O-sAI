# HackOH-O-sAI
Real team projects for OSU students, with corporate-style roles, version history for any kind of work, and AI coaches that help you learn rather than do it for you. HackOHI/O 2026.

## Bridge Builder, by team sAI

Ohio State students find small, real tasks ("Bridge Missions") on cross-disciplinary projects, do the work, get feedback from a real mentor, and collect evidence of what they did. Project rules and contracts live in [`Bridge_Builder_AGENTS_merged.md`](Bridge_Builder_AGENTS_merged.md); notable choices are logged in [`DECISIONS.md`](DECISIONS.md).

The app uses Ohio State Scarlet (`#BA0C2F`) and Gray (`#A7B1B7`). The "sAI" wordmark is set in [Alfa Slab One](src/shared/ui/fonts/OFL.txt), which is self-hosted so it renders offline. This is a HackOHI/O student project, not an official Ohio State service, and it uses no Ohio State logos.

### Run it

Needs Node 20.19+ (or 22.12+).

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the store, matching, diff and coach rules (node --test)
npm run build    # static site in dist/
```

### Demo in five minutes

The Home page has a walkthrough that tracks these steps live.

1. As **Riley Nguyen** (Environmental Science student, the default user), open **Missions**. The top match is "Draft an interview guide…", with the reasons it fits.
2. Open it, choose **Claim mission**, and confirm. Riley joins Accessible Bus Stop Finder as a Researcher, and the task moves to In Progress.
3. Choose **Submit work**, paste any `https://` link, and submit. The task moves to In Review.
4. Open the avatar menu and switch to **Grace Liu**, who leads that project. In **Reviews**, open the submission, choose **Start review**, rate the criteria, write feedback and approve it.
5. Switch back to Riley and open **Profile**. The new evidence card links the task, the work and Grace's feedback.

Other things to show:
- **Tasks**: the Board, Table and Calendar views, plus Filter and Sort. Sidebar labels filter by discipline.
- A project's **Files** tab: version history, line diffs between text versions, and restore.
- **Coach**: everyone gets a coach for their role, like a software engineering coach for the builder on the bus-stop app. All coaches on a project share the board, the channels and a one-line note about each person, but never the chats themselves. Hints unlock only after you share an attempt. Try "Just do it for me", then "Here’s my attempt…".
- Switch to **Leila Haddad** to add tasks or post missions, and to see the leader coach flag unassigned and overdue work.

### Try working together before joining a team (planned — Arnav)

The matching feature lets two students discover compatibility through a **30-minute collaborative challenge linked to an actual project**, then decide whether to keep working together. It goes beyond matching listed skills: beginners can contribute through testing, design, research, or communication as well as code.

For example, a fictional nonprofit needs a volunteer scheduling tool. Before committing to six weeks, two students work through a small scheduling problem together: one writes code while the other identifies conflicting requirements or tests edge cases.

**Planned demo:** Two students complete the challenge, give each other specific feedback, and both opt to turn their temporary collaboration into a project team. Participation in the trial does not itself join either student to the team. Peer feedback is separate from mentor review of mission work.

This flow is specified in [§6.8 of the project rules](Bridge_Builder_AGENTS_merged.md#68-try-working-together--experience-based-teammate-matching); it is not implemented yet. Existing matching in `src/discovery/score.js` ranks projects and missions by skills and goals. New challenge, feedback, and team-conversion persistence contracts still need team approval.

To play the student and the mentor at the same time, open two windows. The demo user is chosen per tab, and the data syncs between them. **Reset demo data** in the sidebar restores the sample data.

### What's real and what's mocked

**Project and mission database schema:** Supabase contains projects, project memberships, tasks, and task contributors, plus derived missions/team views. Each project and mission has one leader and supports multiple collaborators. Field details, permissions, and a rollback-safe SQL test are documented in [`src/workspace/PROJECT_MISSION_SCHEMA.md`](src/workspace/PROJECT_MISSION_SCHEMA.md). This is schema-only so far: the Projects, Tasks, and Missions UIs still use the sample browser store.

**Live Supabase connection check:** Open `#/team-up/supabase` (or the developer link at the bottom of Team Up). It calls the project's public `GET /auth/v1/settings` endpoint with the browser key and shows email/sign-up availability. This verifies the live Auth connection; it does not sign in, persist app data, or test database policies.

**Site authentication:** Every app page requires a verified Supabase account, confirmed email, and completed username. Signed-out visitors see the sign-in screen, including when opening a deep link. Choose **Create an account** for email, username, and password fields; confirm the email and return to sign in. Passwords are handled only by Supabase Auth. `account_profiles` stores the matching Auth ID, username, and email, with owner-only access. Existing accounts without a username finish setup before entering. The account menu provides Sign out; switching sample personas does not change your real account. Authentication is per browser tab.

**Real accounts alongside fictional students:** The app defaults to your registered username. Team Up and Messages show other registered users alongside clearly labeled fictional samples. Your account menu includes **Use my account** plus sample-persona switching for project demos; it never signs you in as another registered person. Your Profile page shows your own username, private email, major, skills, and goals. Username/major edits and skill/goal changes save to Supabase. Other users see public profile fields only; email remains owner-only.

**Live direct messages:** In Team Up, choose **Find a demo partner**, then **Chat** beside a registered username. Messages reference `account_profiles` directly; no sample-persona linking is required. **Send message** waits for Supabase to confirm the save, then displays it. Refresh loads replies and the latest 100 messages. Fictional students open a labeled local conversation preview; their messages are not delivered. Existing legacy persona links and message data are retained. Project channels, requests, graph data, and lobby presence still use their labeled mocks.

For local setup, copy `.env.example` to `.env`, set `VITE_SUPABASE_URL` to the project API origin (`https://<project-ref>.supabase.co`), and set `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred) or `VITE_SUPABASE_ANON_KEY` (legacy). Restart `npm run dev` after changing environment variables. `src/api/client.js` validates the config, provides a single lazy Supabase client, while `src/api/connection.js` performs the read-only check. No secret/service-role key belongs in these variables.

| Area | Status |
|---|---|
| UI, routing, permissions, async pending and error states | Built |
| Data | Direct chats use `direct_messages` linked to `account_profiles`; public people use `account_directory`, all under RLS. Project data remains in the `// MOCK:` browser store |
| Sign-in | All pages require Supabase Auth and username setup. The sample-persona switcher controls only mock project views |
| Role coaches | Canned replies (`src/agents/mockCoach.js`) that follow the help ladder and read your attempts with simple checks. Team notes are written from the board and your task, never from what you typed. No model is called |
| File storage | Uploads up to 2 MB are kept in the browser |
| Notifications | In-app only, derived from activity. No email or push |
| People, projects, feedback | Fictional sample data, labelled as sample in the UI |

### Code map

```
seed/seed.js            shared sample data (single source)
src/shared/             contracts, mock store, selectors, router, UI kit
src/app/                shell: sidebar, header, home, search, notifications, demo-user menu
src/discovery/          rules-based matching (score.js), Projects page
src/missions/           Missions page, claim / submit / review, Reviews queue
src/workspace/          project page; tasks/ (board, table, calendar, drawer), versions/ (files, diff), channels/
src/growth/             evidence cards derived from reviewed work
src/profiles/           profile, skills and goals
src/agents/             llm.js (the only model entry point), prompts/, mock coach, Coach page
```

Moving to Supabase means re-implementing the functions in `src/shared/mockDb.js` with supabase-js (or Edge Functions for privileged steps) and loading the snapshot from the database. Components call `store.claimTask(...)` and similar, so they don't need to change.

Supabase request code lives in `src/api/`; see [the API helper guide](src/api/README.md) for the files and their callers. Components and providers import these helpers instead of making direct SDK requests.
