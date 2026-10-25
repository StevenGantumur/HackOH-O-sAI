# AGENTS.md: Bridge Builder / Bridge Missions — Coding Rules & Technical Context

> **For every AI coding assistant on this team, from any vendor.** Read this whole file before writing code, and follow it over your own defaults. If a human's request conflicts with this file, say so before you proceed.
>
> **Humans:** if your tool doesn't load this file automatically, see §9.
>
> Items marked **(proposed)** are not confirmed yet. Items marked **TBD** are still open. If you're unsure what one of them should be, ask your human; don't decide it yourself.

**Hard deadline:** 10:00 AM Sun Oct 25, 2026 (EDT, per event brief). **Code freeze:** TBD.

**Open problems:** read §10 before starting new work. It lists what is still missing or broken before judging.

**Project direction:** Merge the existing cross-disciplinary project collaboration platform with **Bridge Missions**: small, accessible contributions to larger projects, human feedback, and evidence-based growth. Bridge Missions is an extension of the existing project/task model, not a replacement.

**User-confirmed matching direction (Arnav):** **“Try working together” before joining a team.** Two students try a 30-minute collaborative challenge related to an actual project, exchange specific peer feedback, and then choose whether to continue together as a project team. Compatibility comes from the shared experience rather than listed-skill matching. Beginners can contribute through testing, design, research, or communication as well as code. This confirms product direction; new persistence contracts remain proposed until team sign-off under rule 2.

**User-confirmed stack:** React frontend, JavaScript (including UI event handlers and app logic), Supabase backend (Postgres, Storage, and optional Auth/Edge Functions). Tooling, bundler, styling system, and LLM provider are still TBD.

**Contract warning:** New mission-specific columns/entities below are explicitly **(proposed)**. Do not implement schema or API changes until the team confirms them under rule 2.

---

## 0. Hard rules (every agent, every session)

1. **Stay in your lane.** Only edit files in the module your human owns (§4), unless they explicitly ask you to edit something else. If a change is needed somewhere else, describe it; don't make it.
2. **Don't break shared contracts.** Never change any of these without your human confirming it with the team:
   - the data model
   - the roles enum
   - the seed data shape
   - the API routes
   - the AI wrapper interface (§5)

   When a contract does change, update this file in the same commit.
3. **No secrets in the repo.**
   - API keys go in `.env`, which is gitignored.
   - Add each variable *name* to `.env.example`.
   - Never print keys in logs or commit them.
4. **Sample data only.** No real people, real resumes, or real contact info.
5. **No new dependencies without asking.** Prefer what's already installed. If you must add one, say why.
6. **No destructive commands without explicit approval.** This includes:
   - `git push --force`
   - `git reset --hard`
   - deleting branches or files
   - dropping or resetting the database
7. **Small, focused changes.** No drive-by refactors, renames, or reformatting of code you weren't asked to touch.
8. **Don't claim it works unless you ran it.** If you can't execute code, say so, and give the exact commands the human should run to verify.
9. **Label mocks.** Mark anything fake with a `// MOCK:` (or `# MOCK:`) comment. Never leave a silent stub that looks finished.
10. **Simple and demoable beats robust.**
    - Mock auth, email/notifications, real resume parsing, and anything else the demo won't show.
    - Hardcode where it saves time, then label it per rule 9.
11. **State your assumptions** before you build on them.
12. **Explain non-obvious choices** in 1–2 sentences, so your human can explain them to others.
13. **Never weaken the in-product agent rules (§6.3).** Don't add a "just give me the answer" mode, even as a debug shortcut that might ship.

---

## 1. What we're building (technical summary)

A web app where students, industry partners, and faculty create cross-disciplinary projects; students can start with approachable **Bridge Missions** (short project tasks), collaborate with others, receive real human feedback, and build evidence-backed profiles. Existing project collaboration remains core. It has five modules:

| Module | What it does |
|---|---|
| **Profiles** | Users (student / industry / faculty) with skills, goals, and resume stored as structured metadata. |
| **Discovery** | Project recommendations based on skills and goals, plus search. |
| **Try Working Together / Matching** | Project-linked 30-minute challenges for two students to experience collaboration, exchange peer feedback, and optionally form a team (§6.8). |
| **Workspace** | Per-project space with version control for **any file type** (not just code), tasks with owners and deadlines, Slack-style channels, and fixed roles assigned to members. |
| **Role Agents** | An AI agent per member, configured by role, that **coaches instead of completing the work**. |
| **Bridge Missions & Growth** (proposed module) | Browse small beginner-friendly contributions to projects; claim tasks, submit artifacts, receive human review, and display verifiable contribution evidence. |

**Suggested demo flow (proposed; team approval required):** A student chooses skills and time available → discovers a recommended project / short Bridge Mission → joins the project and claims a task → submits an artifact or link → a seeded mentor/teammate gives structured feedback → the student sees an evidence card linked to the actual work. Each transition shown as real should persist in Supabase. If review is simulated, label it clearly as seeded/sample feedback.

**North-star product principle:** Small contributions. Real connections. Proven growth. Prioritize one reliable end-to-end flow over broad functionality.

---

## 2. Stack & setup

**Stack:**
- **Frontend (confirmed):** React, with **JavaScript** (`.js` / `.jsx`) for components, application logic, and event handlers. Do not switch to TypeScript or Next.js without team approval.
- **Backend (confirmed):** Supabase. Use its Postgres database, Storage for project artifacts, and optionally Auth / Edge Functions where needed.
- **Database / file storage (confirmed):** Supabase Postgres + Supabase Storage.
- **Client integration (proposed):** `@supabase/supabase-js` through one shared client module; request dependency approval if it is not already installed.
- **Styling / build tool / hosting:** TBD; use whatever the existing repo has. Do not assume Tailwind, shadcn/ui, Vite, or Vercel are installed.
- **LLM provider(s) for role agents:** TBD. Must sit behind the single wrapper (§5.4) and execute server-side, never with a provider secret in the browser.

**Setup:**
- **Repo:** TBD
- **Install:** `TBD`
- **Run dev server:** `TBD`
- **Seed database:** `TBD`
- **Required env vars:** see `.env.example`
- **Proposed public client variables:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` **only if using Vite**; adjust prefix to the actual bundler after confirmation. Supabase publishable/anon keys may appear in the client **only with correctly enforced RLS**. Never expose the service-role key.
- **LLM secrets:** keep only in server-side secrets / Supabase Edge Functions. Never use a frontend `VITE_` variable for LLM API keys.

---

## 3. Repo structure (proposed; finalize once the stack is picked)

```
/
├── AGENTS.md            ← this file
├── .env.example
├── seed/                ← shared sample data (single source for everyone)
├── src/
│   ├── profiles/
│   ├── discovery/
│   ├── workspace/
│   │   ├── versions/    ← file versioning
│   │   ├── tasks/
│   │   └── channels/
│   ├── missions/          ← (proposed) mission discovery, claim, submit, review
│   ├── growth/            ← (proposed) evidence cards derived from reviewed work
│   ├── agents/
│   │   ├── llm.*        ← the ONLY place that calls an LLM provider
│   │   └── prompts/     ← one system prompt file per role
│   └── shared/          ← data contracts, Supabase client, shared utilities
└── DECISIONS.md         ← short log of notable decisions & pivots
```

---

## 4. Ownership

| Module | Owner | Notes |
|---|---|---|
| Profiles | TBD | |
| Discovery | TBD | |
| Try Working Together / Matching | Arnav | Feature scope: §6.8; coordinate with Discovery, Workspace, Profiles, and shared-data owners before cross-module or contract changes. File ownership boundaries remain TBD. |
| Workspace | TBD | |
| Role Agents | TBD | |
| Missions & Growth (proposed) | TBD | Coordinates with Workspace + Profiles owners; needs contract sign-off |
| `shared/` + `seed/` | TBD | Changes need team sign-off (rule 2) |

---

## 5. Shared contracts

### 5.1 Data model (proposed)

```
User          id, name, type: "student" | "industry" | "faculty"
Profile       user_id, major, skills: string[], goals: string[], resume: { education[], experience[], projects[] }
Project       id, owner_id, title, description, tags: string[], needed_roles: Role[], needed_skills: string[], status
Membership    user_id, project_id, role: Role, joined_at
Task          id, project_id, title, description, owner_id, deadline, status: "todo" | "in_progress" | "review" | "done"
File          id, project_id, name, current_version_id
Version       id, file_id, parent_version_id?, author_id, task_id?, message, storage_ref, mime_type, size, created_at
Channel       id, project_id, name
Message       id, channel_id, author_id, content, created_at
AgentMessage  id, project_id, user_id, role: Role, sender: "user" | "agent", content, created_at

# Proposed Bridge Missions extensions — DO NOT APPLY UNTIL TEAM CONFIRMS:
# Prefer extending Task over creating a separate duplicate Mission table.
Task (add)    estimated_minutes?, difficulty?, required_skills?: string[], deliverable_instructions?, claimed_at?
Submission    id, task_id, author_id, file_id?, version_id?, external_url?, note?, created_at, status
Feedback      id, submission_id, reviewer_id, comments, rubric?: object, created_at
# Evidence cards should preferably be derived from Task + Submission + Feedback + Version.
# A separately stored EvidenceCard is optional and requires explicit contract approval.
```

**Try Working Together contract boundary (§6.8):** Challenge definitions, temporary participant access, a shared attempt/artifact, peer feedback, continuation decisions, and team conversion need a team-approved persistence design. Their entity names, fields, statuses, operations, and access policies are **proposed / TBD**, not approved by this document. Reuse existing Project, Task, Version, and Membership records where appropriate; do not silently treat a trial participant as a committed project member or repurpose mentor-review Feedback as peer feedback. No schema, seed-shape, role, or API changes until rule 2 sign-off.

**Approved direct messaging (2026-10-24, updated at Arnav's request):** `direct_messages(id: generated UUID, author_id: UUID → account_profiles, recipient_id: UUID → account_profiles, content: text[1–2000], created_at: server timestamp)` stores private direct chats separately from project-channel Message records. Senders always come from verified Supabase Auth; names come from the registered username directory. Participant-only SELECT and authenticated-author INSERT policies remain enforced. No anonymous access, updates, or deletes; client message IDs/timestamps cannot be supplied. The former `teamup_accounts` persona links are retained as legacy data but no longer used or insertable from the browser. Existing message participant IDs and rows are preserved. SQL sources: `src/teamup/direct-message-schema.sql` and `src/auth/account-directory-schema.sql`.

**Approved account profile and site authentication (2026-10-24, Arnav's request):** `account_profiles(id: UUID → auth.users, username: unique lowercase text, email: text)` is separate from the sample academic Profile model. Passwords and password hashes belong only to Supabase Auth, never to this table. A private Auth trigger creates the row on signup and synchronizes verified Auth email changes. Existing accounts may have a null username until profile setup; complete accounts require a 3–24 character username starting with a letter and containing letters, digits, or underscores. Profile RLS allows only self reads and self username updates; email/ID writes and all anonymous access are denied. SQL: `src/auth/profile-schema.sql`.

**Approved project/mission database extension (2026-10-24, Arnav's request):** Supabase now has `projects`, `project_memberships`, `tasks`, and `task_contributors`, plus read-only `missions`, `project_team`, and `mission_team` views. `projects.owner_id` is the single required leader and an implicit member; no second LEADER membership is stored. Projects also have description (bio), tags, needed_roles/skills, status draft|active|completed|archived, visibility public|private, optional starts_at/deadline, and server timestamps. Memberships use existing non-leader roles and a composite project/user primary key. Tasks retain the existing shared task model plus required `leader_id`, optional claimant `owner_id`, role, mission time/difficulty/skills/deliverable/review criteria, and timestamps. Mission leaders/owners/contributors must be working members of the same project. Many contributors are stored in task_contributors; one required leader is derived from tasks.leader_id. Missions are tasks with estimated_minutes, not a duplicate entity. These table fields supersede the earlier proposed status of their matching Task fields above; Submission/Feedback persistence remains proposed. See `src/workspace/PROJECT_MISSION_SCHEMA.md` and its companion SQL for exact fields, grants, constraints, and tested access behavior. Existing frontend project/mission data remains mocked until its adapter is migrated.

### 5.2 Roles enum

- **`LEADER`** (confirmed): the project creator by default.
- **Proposed:** `RESEARCHER`, `DESIGNER`, `BUILDER`, `ANALYST`, `COMMUNICATIONS`, `MENTOR`.

Roles are **hardcoded**. Users pick from this list; they can't create their own.

### 5.3 Seed data

- **Path:** `seed/` (format TBD)
- **Contents:**
  - 8–12 students across varied majors, not only CS
  - 3–5 projects, posted by at least one student, one industry user, and one faculty user
  - 1–2 mentors
  - existing memberships, tasks, and a few versions, so the workspace isn't empty in the demo
  - **(proposed)** 4–8 micro-missions across different disciplines (design, research, analysis, engineering, communication); include time estimate, beginner-friendly context, expected deliverable and review criteria
  - **(proposed)** at least one sample submission and human feedback record for the demonstration; make seeded/sample status visible in UI

Every module reads from the same seed data. Don't create a private copy.

### 5.4 AI wrapper interface

Teammates may use different LLM providers, so **all model calls go through one function**:

```
generateAgentReply({ role, userId, projectId, messages, context }) -> { content }
```

- The provider and model are chosen by env vars (e.g. `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`). No provider SDK calls anywhere else.
- `context` includes:
  - the user's role
  - their current task and its deadline
  - for `LEADER`: the project's unassigned and overdue tasks
- Provide a `// MOCK:` mode that returns canned coaching replies when no API key is set, so the demo never dies on a rate limit.

### 5.5 API routes / Supabase operations

**TBD.** Do not invent REST endpoints unless the selected architecture requires them. React can use approved Supabase client queries under RLS, while operations involving privileged actions or LLM keys must run server-side (e.g., Edge Functions). List approved database operations or `METHOD /path → purpose` here as built. No unapproved table writes or policies.

**Implemented connection check (2026-10-24):** The frontend route `#/team-up/supabase` calls Supabase's existing public `GET /auth/v1/settings` endpoint to verify browser-key connectivity and display email/sign-up availability. `src/api/client.js` centralizes configuration and a lazy `supabase-js` client. It uses `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred) or `VITE_SUPABASE_ANON_KEY` (legacy), saved locally in gitignored `.env`. This check creates no schema, writes no data, performs no login, and does not certify RLS. Other features remain mock-backed except the approved direct messaging integration below.

**Approved and implemented messaging operations:** Supabase Auth signup/sign-in/verification/sign-out; participant-filtered `SELECT direct_messages` (latest 100) and Auth-author `INSERT direct_messages`, returning the server row. `MessagingAuth.jsx` passes the authenticated account profile directly; no fictional persona claim is required. `LiveConversation.jsx` disables pending submits, preserves failed drafts, and polls for replies every three seconds while visible, with manual refresh retained. `LiveChatList.jsx` resolves people through `account_directory`. Auth sessions remain per tab. Fictional people use explicitly labeled local-only `SampleConversation.jsx` previews, never a real Supabase insert. Invitations, lobby presence, project channels, and progress remain mocked/local. No Realtime message delivery is claimed.

**Global authentication:** `src/auth/AuthProvider.jsx` verifies users through Supabase Auth and loads their private account profile. Every application page, sidebar, search palette, and task drawer renders only after verification, email confirmation, and username setup. Signed-out visitors see `AuthPage.jsx`; signup collects email, username, and password, while login uses email and password. Sign-out unmounts the protected app. `UserMenu.jsx` identifies the real username separately from its sample-persona switcher. `MessagingAuth.jsx` reuses the verified account directly; it does not implement a second login or require a sample identity. Preserve the requested hash route through sign-in. Frontend gating supplements database RLS; sample academic/workspace data is still mock-backed.

### 5.6 Supabase safety and data access

- Enable and verify **Row Level Security** for every browser-accessed table. Default to least privilege.
- Restrict who can claim tasks, create submissions, upload files, post feedback, and see private project content. Reviewers must be authorized members/mentors, not arbitrary users.
- Use Supabase Storage buckets and policies appropriate to sample project artifacts; never treat the public anon key as authorization.
- Do not send service-role keys or LLM API keys to React. Use backend functions for privileged work.
- Handle async UI actions with loading, success, error, and disabled states; do not show completion until Supabase confirms the write.
- Avoid duplicate claims using database constraints / transactional server logic once the exact claim contract is agreed.
- For mock login, prominently label demo-user switching and do not imply it provides real access control.

---

**Registered accounts alongside samples (2026-10-24, Arnav's request):** `account_directory(id: UUID → account_profiles, username: unique text, major: text, skills: text[], goals: text[], created_at)` exposes only public profile fields to authenticated users; it contains no email or credentials. A private trigger synchronizes usernames from account_profiles. Owners can update only their own major, skills, and goals. The invoker-security RPC `update_my_account_profile(new_username, new_major)` updates both fields atomically under RLS. Private account_profiles email/ID protections stay unchanged. `AccountDirectoryProvider.jsx` mirrors public account names/skills into the existing mock workspace without touching fictional seed records. The default active identity is the logged-in account; explicit sample-persona switching remains available for project walkthroughs. Viewing another registered profile never switches Auth identity. Real profile tags save to Supabase; fictional profile edits remain local. Resetting sample work preserves registered identities.

## 6. Feature implementation specs

### 6.1 Version control (any file type)

- **Uploads:** every upload creates a new `Version` with an author, a message, and a parent version. History is **append-only**; never delete or overwrite versions.
- **Rollback:** creates a *new* version that copies the old content. Never rewind history.
- **Text files:** show a line diff between versions.
- **Binary files** (images, PDFs, CAD, etc.): show metadata and a side-by-side preview where possible. No diff is required.
- **Contribution history:** every version is attributed to its author. Contribution history is queried from `Version` + `Task`, not stored separately.

### 6.2 Discovery

**Recommendations:**
- Score each project by its overlap with the user:
  - the user's `skills` vs. the project's `needed_skills`
  - the user's `goals` vs. the project's `tags`
- Return the top N, each with a human-readable **"why recommended"** reason (e.g. "Needs CAD; you listed SolidWorks").
- No model training. Embeddings are optional and only if time allows.

**Search:**
- Filter by text, skill, role needed, and poster type (student / industry / faculty).

**Matching distinction:** The existing skill/goal score recommends projects and missions. Arnav's user-to-user matching feature uses a shared 30-minute challenge (§6.8); listed skills must not be presented as proof of interpersonal compatibility. Existing project discovery remains available alongside the trial flow.

### 6.3 Bridge Missions and human-reviewed proof (proposed)

**Student journey:** discover → evaluate fit → join project/claim a small task → submit work → receive human feedback → see a contribution/evidence card.

**Discovery and fit:** Keep existing project matching. Mission filters can add estimated time, difficulty, skills and role (all **proposed** until schema confirmed). Show a plain-language recommendation reason. Never imply ranking uses trained AI if it is just a rules-based score.

**Task claiming:** If a mission is a Task, integrate with existing membership, owner, and status fields rather than create parallel ownership state. Require a confirmed persistence step and reflect conflicts accurately.

**Submission:** Store file artifacts in Supabase Storage and append a Version, linked back to the Task where possible. For links or notes, get team approval for the Submission contract first. Clearly distinguish `submitted`, `under review`, and `reviewed` from `done`.

**Review:** Feedback must come from an actual human action (or be clearly labeled seeded/demo feedback). Show who reviewed, what they commented on, and what needs improvement. **Never let AI fabricate mentor endorsements or certify work automatically.**

**Evidence-backed growth:** Display a shareable-looking card with project name, task title, student contribution, artifact, author and human feedback (as available). Show provenance and sample/demo labels. Derive evidence from existing records rather than award meaningless gamification points. Public sharing is a stretch feature; do not leak private artifacts.

**Future / stretch:** Human-approved AI Mission Architect that suggests small tasks from a larger project; office hours; notifications; external portfolio export. None should block the demo flow. Experience-based teammate matching is now a separately scoped feature (§6.8), rather than only a stretch idea.

### 6.4 Role agents (in-product behavior: must hold in code and prompts)

**Core rule:** agents **coach; they don't complete assigned work.**

**Help ladder.** The agent escalates only as far as needed:
1. Ask a clarifying or guiding question.
2. Point to the relevant concept or resource.
3. Give a hint or partial example.
4. Review the user's attempt and give specific feedback.
5. Show a worked example of a *similar* problem, never the assigned one.

**If the user asks it to "just do it":**
- the agent declines briefly
- then offers the next step on the ladder

**Leader agent:**
- prompts the leader to break the work into tasks with owners and deadlines
- flags unassigned and overdue tasks
- reminds the leader to review submitted versions
- suggests actions, but **never** creates or assigns tasks itself

**Where prompts live:**
- one file per role in `src/agents/prompts/`
- a shared base prompt that holds the coaching rules
- role files only *add* to the base prompt; they never override it

**Logging:** log every exchange to `AgentMessage`.

---

### 6.5 React / JavaScript implementation rules

- Use functional React components and hooks, following conventions already in the repository.
- Use JavaScript event handlers (`onClick`, `onChange`, `onSubmit`) for UI interactions; avoid direct DOM mutation when React state can manage it.
- Always `preventDefault()` on forms where submission would otherwise reload the page. Validate required fields and show user-facing errors.
- Centralize Supabase client setup; avoid creating clients inside render functions. Keep read/write logic understandable and avoid duplicating queries across views.
- Provide explicit empty, loading, error, success, and permission-denied states for real flows.
- Use accessible labels, keyboard-operable controls, appropriate contrast, and mobile-friendly layouts.
- Do not imply a decorative button or inactive control is functional. Either wire it up or visibly mark it a demo/placeholder.
- Do not add dependencies, change bundlers, or introduce a second backend without permission.

### 6.6 Optional vibe-coding helpers (not runtime dependencies)

- **Frontend design guidance:** improve visual hierarchy, responsive behavior and accessibility without changing the agreed functionality.
- **React best-practices guidance:** help review component state, effects and performance; verify relevance to the selected React tooling.
- **Playwright / browser testing agent:** click through the real demo journey, inspect errors, and test mobile viewport; use only if installed/approved.
- **Supabase MCP / Context7 / GitHub MCP (optional):** helpful for schema inspection, documentation, and repository workflows, but require permission and least-privilege credentials. Never give agents production service-role secrets.
- **Agent work split:** Product/architecture defines contracts; Frontend builds approved UI; Backend/Supabase implements approved access and persistence; QA checks the end-to-end demo. Respect module ownership.

### 6.7 MVP acceptance test (proposed)

1. A seeded demo student opens a recommended project and sees a short task and the reason it fits.
2. The student joins/claims the task; the update persists to Supabase.
3. The student submits a link or file and sees the task move to review; the artifact can be reopened.
4. A seeded mentor/teammate uses the UI to post feedback (or the UI explicitly labels preseeded feedback as sample).
5. The student's profile displays a contribution card linked to the underlying task/artifact and feedback.
6. Page refresh does not silently erase real states; errors are visible and permission rules hold.

If time runs short, finish **one** of these flows end to end before adding extra features.

---

### 6.8 Try Working Together — experience-based teammate matching

**Owner:** Arnav. **Product direction:** user-confirmed. **New shared contracts / persistence implementation:** proposed, requires team sign-off.

**Purpose:** Let students discover how they work together before committing to a project team. Offer a **30-minute collaborative challenge related to an actual project**, followed by specific peer feedback and an optional decision to continue together. Do not infer compatibility solely from listed skills, award an unsupported compatibility score, or require coding to participate.

**Student journey:** choose a project-linked challenge → two students enter a temporary collaboration → work through the challenge for 30 minutes → record their contribution and exchange specific feedback → each chooses whether to continue → form/join the project team when both choose to continue and the project's membership permissions allow it.

**Example:** A nonprofit needs a volunteer scheduling tool. Before committing to six weeks of project work, two students try a small scheduling problem together. One may write code while the other identifies conflicting requirements or tests edge cases. Design sketches, research findings, and clear explanations are also valid contributions. Use a fictional nonprofit and fictional students in the demo.

**Challenge and collaboration requirements:**
- Show the linked project, the small problem, expected output, and the 30-minute timebox before starting. Keep the challenge achievable within that session rather than asking students to finish the full project.
- Give both students meaningful ways to contribute across coding, testing, design, research, and communication. Do not equate experience level or code volume with collaboration quality.
- Keep temporary participation distinct from joining the project team. The trial must not silently create a long-term Membership or expose unrelated private project content.
- Let students record or reopen the shared result and identify each person's contribution. Any timer, shared editing, or persistence behavior shown as real must work; visibly label simulated behavior.
- How students pair up, invitation/acceptance mechanics, timer expiry, and incomplete/abandoned sessions are **TBD**. Do not invent these contracts during implementation.

**Peer feedback:** Both participants give specific feedback grounded in the session: what the other person contributed, what helped the collaboration, and what could improve. Keep this separate from mentor approval of a Bridge Mission. AI must not fabricate peer comments, endorsements, or a compatibility verdict. Any seeded feedback must be visibly labeled sample/demo.

**Continue together:** Continuing is optional for each student. Convert the temporary collaboration into a project team only after both opt in, using approved membership operations and project permissions. A decline must not force either person onto a team. Preserve the challenge result and feedback according to the approved access policy; visibility, retention, and the exact conversion operation remain **TBD**.

**Demo moment / acceptance flow:**
1. Two fictional students open a challenge linked to the nonprofit's scheduling-tool project and see its 30-minute scope.
2. They collaborate on a small scheduling problem, with visible contributions such as code plus conflicting requirements or edge-case tests.
3. They complete the challenge and can reopen the result.
4. Each posts specific peer feedback through a human action; both can see the feedback they are authorized to view.
5. Both choose to keep working together and the temporary collaboration becomes a project team through the approved membership flow.
6. Real writes survive refresh and show pending, error, and success states. A walkthrough that shortens the 30-minute session or simulates a second participant must clearly label that behavior as a demo.

**Implementation boundary:** This section specifies the intended feature, not an existing implementation. Follow §0 ownership and shared-contract rules, §5.6 access requirements, and §6.5 React/accessibility rules. Keep the existing project/mission demo working while implementing this separate journey.

---

## 7. Git workflow

**Before you start:**
- pull `main`
- branch as `name/short-feature`, e.g. `sam/version-upload`

**Commits:**
- small and frequent
- message format: `area: what changed`, e.g. `workspace: add rollback endpoint`
- commit history is also our record of work done during the event, so commit often

**Merging:**
- merge to `main` often
- **`main` must always run**
- never force-push `main`

**Logging:**
- record notable decisions and pivots in `DECISIONS.md`, one line each with the time

---

## 8. Definition of done

A change is done only when:
- [ ] It runs locally without errors.
- [ ] It works against the shared seed data.
- [ ] It has no secrets or real personal data.
- [ ] Any mocks are labeled.
- [ ] Any contract changes are reflected in this file.
- [ ] The agent has told its human **what changed, which files changed, and how to test it.**
- [ ] React handlers provide correct pending/error states for asynchronous Supabase writes.
- [ ] Any exposed Supabase data is protected by appropriate RLS; no service-role or LLM secrets ship to the client.
- [ ] Seeded feedback and mock AI responses are visibly identified; real feedback is never fabricated.
- [ ] Mission/growth schema changes, if any, received team sign-off.

---

## 9. Rules by agent type

**Agentic tools that edit files and run commands** (e.g. Claude Code, OpenAI Codex, Cursor agent, GitHub Copilot agent, Gemini CLI):
- Follow §0 strictly, especially rules 1, 6, and 8.
- Run the app or tests before reporting success.
- Show a summary of changed files at the end of each task.

**Chat assistants with no repo access** (e.g. ChatGPT, Claude.ai, Gemini in the browser):
- You can't see the repo. Ask the human to paste the relevant files and this AGENTS.md. Never guess at file contents.
- Return **complete files or clearly marked diffs**, with the file path, so the human can apply them safely.
- Say plainly that you couldn't run the code (rule 8).

**Inline autocomplete** (e.g. Copilot completions):
- These tools won't read this file reliably.
- The human applying a suggestion is responsible for checking it against §0.

**Getting your tool to load this file:**
- Many coding agents read `AGENTS.md` at the repo root automatically.
- If yours doesn't, point its own instructions file at this one, e.g. `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, or `.cursor/rules`. Check your tool's docs for the exact name.
- Otherwise, paste this file at the start of each session.

---

## 10. Open problems before judging (audit, 2026-10-24 18:40 EDT)

Checked against the Honda Bridge Builder brief, the HackOHI/O judging guide, and §6.7 / §6.8 of this file. On `main` at `e83eb2b`, the 34 unit tests, the build, and a 20-step browser click-through of the §6.7 flow all pass with no console errors. Everything below is still open. Delete an item when it's fixed.

**Submission (blocking)**
- No video yet. It's due **10:00 AM EDT Sun Oct 25** through the Discord form: MP4, 500 MB max, about 3 minutes, showing the key features and the technical challenges we overcame.
- No hosted demo link. Honda asks for a link to the demo or the code. The repo is public, but nothing is deployed. The app runs fully in the browser, so the `npm run build` output (`dist/`) can go on any static host.
- HackOHI/O scores 1–5 on Innovation, Curiosity, Communication, Breadth & Complexity, Impact and Challenge Navigation. Honda also judges Problem Solving, Creativity, Clarity and Completeness.

**Gaps a judge will hit**
- **Team Up (second sidebar item) is a design preview only.** None of §6.8 steps 2–6 exist: no timer, shared work, recorded contributions, peer feedback or "continue together". "Accept preview" saves nothing, the lobby says the challenge isn't connected yet, and the chart shows sample numbers. Finish a minimal loop or hide it from the nav before recording. Honda: "One complete flow beats five half-built features."
- **No real multi-user.** All project data lives in one browser's localStorage, and the demo's "two people" are one person switching personas. §6.7 step 2 ("persists to Supabase") fails.
- **Trust hole.** The persona switcher lets anyone act as Grace and approve their own work. The store blocks self-review, but nothing proves who you are. Sign-in on `30-minute-demo` doesn't fix this, because the switcher still controls reviews.
- **The coach is canned replies, not AI** (`AGENT_MODE = 'mock'` in `src/agents/llm.js`). Either pitch it honestly as coaching rules that are ready for a model behind `generateAgentReply`, or wire a real model server-side (§2, §5.4). Don't call the current version AI.
- The README says Try Working Together "is not implemented yet" while Team Up is in the nav. Make them agree.

**Honda ladder coverage**
- Rung 1, Look around: partial. No showcase of finished work or "what other students learned".
- Rung 2, Show up: **missing.** No public questions, topic groups or office hours. Channels are members-only.
- Rung 3, Try something small: half. Missions work, but peers can't give feedback; only LEADER and MENTOR members can review.
- Rung 4, Join a project: done.
- Rung 5, Give back: weak. Help given (reviews written) never shows on any profile. `feedbackGivenBy` exists, but only the Reviews page uses it. There's no path from student to reviewer or mentor.
- Empty room: no product answer; the sample data hides the problem. Have a pitch answer ready.
- Mentor time: students see mission minutes, but mentors get no time estimate for a review and no hour-long format such as office hours.
- Momentum: the Home walkthrough just ends after the evidence card. Nothing suggests the next step.
- "What one group learns helps the next": nothing covers this.

**Branch `30-minute-demo`: do not merge as is**
- Commit `ddc24c1` ("premerge") contains unresolved conflict markers in `src/profiles/ProfilePage.jsx` (line 74) and `DECISIONS.md`, so `npm run build` fails. Its 54 unit tests pass.
- It commits `playwright-report/index.html` and `.serena/cache/*.pkl`, and adds the `supabase` CLI as a runtime dependency (rule 5; it belongs in devDependencies, if anywhere).
- It puts every page behind a confirmed-email sign-up, so a judge opening a link hits a sign-up wall. Keep a demo path that needs no sign-in.

**Suggested order with the time left**
1. Script and record the video around one flow: claim a mission → submit → human review → evidence card, with the coach as the learning moment. Upload well before 10:00.
2. Hide or finish Team Up.
3. Deploy `dist/` and put the link in the README and the video.
4. Fix `30-minute-demo` before any merge.
5. If time allows: show help given on profiles, add a next-step card after the evidence card, and prepare Q&A answers (Is it real AI? Can two laptops use it? What stops self-approval? Why would the first 50 students come? How does it scale?).

**API organization (user-requested):** All frontend Supabase SDK calls and the Auth settings request live under `src/api/`. React components/providers call these helpers; keep local mock operations in `src/shared/mockDb.js`. See `src/api/README.md`. This reorganization does not change database contracts or connect the unfinished project/mission Join buttons.

**Shared demo document (user-requested):** When the existing browser-local lobby detects both participants, it replaces the waiting view with a shared plain-text editor. Edits merge through BroadcastChannel; disconnect pauses editing and rejoin recovers a draft from the remaining tab. This is a labeled same-browser preview, not Google Docs or Supabase persistence. See `src/workspace/channels/SHARED_DEMO_DOCUMENT.md`.
