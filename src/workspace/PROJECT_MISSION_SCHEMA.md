# Projects and collaborative missions

Applied to Supabase at Arnav's request. SQL source: `project-mission-schema.sql`.

This adds the database schema only. Existing Projects, Tasks, and Missions screens still use the labeled local mock store; no frontend database adapter or sample-data migration is included.

## Projects

`projects` stores:

- `id`: generated UUID primary key.
- `owner_id`: required account_profiles UUID; the one project leader, defaulting to the authenticated creator.
- `title`: required, 1–120 nonblank characters.
- `description`: the project's bio/overview, up to 20,000 characters. Reuses the existing description field rather than storing a duplicate bio.
- `tags`: discovery topics, up to 20.
- `needed_roles`: fixed existing roles, excluding LEADER because the project already has one.
- `needed_skills`: up to 30 skill labels.
- `status`: draft, active (default), completed, or archived.
- `visibility`: public (default; signed-in discovery only) or private (project team only).
- `starts_at`, `deadline`: optional timestamps; the start cannot come after the deadline.
- `created_at`, `updated_at`: server timestamps; updated_at is maintained by a trigger.

## Project team

`project_memberships` connects many registered people to many projects:

- `project_id`: projects UUID.
- `user_id`: account_profiles UUID.
- `role`: RESEARCHER, DESIGNER, BUILDER, ANALYST, COMMUNICATIONS, or MENTOR.
- `joined_at`: server timestamp.
- Primary key: project_id + user_id, preventing duplicate memberships.

The leader is implicitly a team member through projects.owner_id, so a second leader row cannot be inserted. The read-only `project_team` view combines that single LEADER with all contributor/mentor rows. The creator remains the leader until an explicit, separately implemented leadership-transfer operation is added.

## Tasks and missions

`tasks` remains the shared task/mission entity. A task with estimated_minutes is a Bridge Mission; `missions` is an RLS-preserving read-only view of those rows.

- `id`: generated UUID primary key.
- `project_id`: required parent projects UUID.
- `leader_id`: one required account_profiles UUID. Defaults to the creator; must be the project leader or a non-mentor project member. The project leader can delegate this field.
- `owner_id`: optional single responsible claimant, separate from the leader and the full contributor list. Must belong to the same project and not be a mentor.
- `title`, `description`: required title plus bio/problem context, with the same size limits as projects.
- `role`: the task's needed discipline, using the existing five working roles.
- `deadline`: optional timestamp.
- `status`: todo, in_progress, review, or done; default todo.
- `estimated_minutes`: null for a regular task, otherwise 5–480 minutes. A 30-minute challenge uses 30.
- `difficulty`: beginner, intermediate, or advanced; required for missions.
- `required_skills`: up to eight skill labels.
- `deliverable_instructions`: expected output, up to 10,000 characters; nonblank for missions.
- `review_criteria`: up to six criteria.
- `claimed_at`: optional timestamp; requires an owner when present.
- `created_at`, `updated_at`: server timestamps.

## Mission contributors

`task_contributors` allows multiple people on a task or mission:

- `task_id`: tasks UUID.
- `user_id`: account_profiles UUID.
- `role`: one of the five working roles.
- `joined_at`: server timestamp.
- Primary key: task_id + user_id.

Every contributor must already belong to the task's parent project and cannot be a mentor. An assigned owner is automatically included as a contributor unless they are the leader. The `mission_team` view includes the single mission leader plus contributor rows, without repeating the leader. Team size is derived from these rows instead of stored as a drift-prone count.

## Access and integrity

- Anonymous users have no access.
- Signed-in users can discover active/completed/archived public projects and their tasks/teams. Drafts and private projects are limited to the leader and members.
- Creators can create projects only as themselves. Only the project leader edits project metadata, adds project members, creates tasks, or edits task metadata.
- A project or mission leader can add task contributors, subject to same-project membership checks.
- Identity, parent project, server timestamps, and task completion cannot be spoofed through browser column writes.
- No browser DELETE grants are provided. Archiving is available for projects.
- Claims, submissions, human review, status transitions, leaving teams, and leadership transfer need explicit operations before their UIs are migrated. In particular, an ordinary metadata update cannot set a task to done.
- Leaders are canonical scalar account references. LEADER is derived in team views, not separately assignable in contributor tables.
- All team/missions views use security_invoker so base-table RLS stays active.

## Verification

`project-mission-schema.test.sql` runs in the Supabase SQL editor as an administrator. It creates temporary fictional accounts/projects, checks multi-person teams and permission failures, then rolls back every fixture. Verified: owner can create/read a new project, public discovery works, private projects/missions are hidden from outsiders, contributor/leader parent membership is enforced, a mission can have three team members but only one leader, a delegated mission leader can add contributors, and an ordinary client cannot bypass human review by setting done.

Supabase advisors found no new security issues. Existing leaked-password protection advisory: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. The new indexes may appear as unused until real application queries use these tables: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.
