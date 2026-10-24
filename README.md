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
- **Coach**: try "Just do it for me".
- Switch to **Leila Haddad** to add tasks or post missions, and to see the leader coach flag unassigned and overdue work.

### Try working together before joining a team (planned — Arnav)

The matching feature lets two students discover compatibility through a **30-minute collaborative challenge linked to an actual project**, then decide whether to keep working together. It goes beyond matching listed skills: beginners can contribute through testing, design, research, or communication as well as code.

For example, a fictional nonprofit needs a volunteer scheduling tool. Before committing to six weeks, two students work through a small scheduling problem together: one writes code while the other identifies conflicting requirements or tests edge cases.

**Planned demo:** Two students complete the challenge, give each other specific feedback, and both opt to turn their temporary collaboration into a project team. Participation in the trial does not itself join either student to the team. Peer feedback is separate from mentor review of mission work.

This flow is specified in [§6.8 of the project rules](Bridge_Builder_AGENTS_merged.md#68-try-working-together--experience-based-teammate-matching); it is not implemented yet. Existing matching in `src/discovery/score.js` ranks projects and missions by skills and goals. New challenge, feedback, and team-conversion persistence contracts still need team approval.

To play the student and the mentor at the same time, open two windows. The demo user is chosen per tab, and the data syncs between them. **Reset demo data** in the sidebar restores the sample data.

### What's real and what's mocked

| Area | Status |
|---|---|
| UI, routing, permissions, async pending and error states | Built |
| Data | `// MOCK:` in-browser store (`src/shared/mockDb.js`), saved to localStorage. Not Supabase yet, because the schema still needs team approval |
| Sign-in | Demo-user switcher, clearly labelled. Not access control |
| Role coach | Canned replies (`src/agents/mockCoach.js`) that follow the help ladder. No model is called |
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
