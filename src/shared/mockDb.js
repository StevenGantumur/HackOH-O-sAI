// MOCK: in-browser stand-in for Supabase Postgres + Storage (AGENTS.md rule 9).
//
// - Reads are synchronous snapshots. Writes are async with simulated latency, so the UI has
//   real pending, success and error states to handle (§5.6).
// - Every write re-checks the rules Postgres RLS will have to enforce for real: who can claim,
//   submit, review, upload and post. Running in the browser, this is NOT security.
// - Data persists to the injected storage (localStorage in the app), so a refresh keeps state.
//
// To move to Supabase, re-implement these functions with supabase-js queries (or Edge Functions
// for privileged steps) behind the same names, and hydrate the snapshot from the database.

import { DIFFICULTIES, DOER_ROLES, REVIEWER_ROLES, REVIEW_OUTCOMES, RUBRIC_RATINGS, AGENT_SENDERS } from './contracts.js';
import { versionsForFile } from './selectors.js';

export const TABLES = [
  'users',
  'profiles',
  'projects',
  'memberships',
  'tasks',
  'files',
  'versions',
  'channels',
  'messages',
  'agentMessages',
  'teamNotes',
  'submissions',
  'feedback',
];

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export class StoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'StoreError';
    this.code = code; // 'invalid' | 'forbidden' | 'conflict' | 'not_found' | 'storage'
  }
}

function fail(code, message) {
  throw new StoreError(code, message);
}

const DATE_FIELD = /(_at|^deadline)$/;

function shiftDates(row, shiftMs) {
  const out = { ...row };
  for (const [field, value] of Object.entries(row)) {
    if (typeof value === 'string' && DATE_FIELD.test(field)) {
      out[field] = new Date(Date.parse(value) + shiftMs).toISOString();
    }
  }
  return out;
}

function cleanList(values, max) {
  const seen = new Set();
  const out = [];
  for (const raw of values ?? []) {
    const value = String(raw).trim().slice(0, 60);
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out.slice(0, max);
}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function defaultId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// A Storage-shaped Map, for tests and for browsers that block localStorage.
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

export function createMockDb({
  seed,
  storage = null,
  key = 'bridge-builder:mock-db',
  latency = [300, 700],
  now = () => Date.now(),
  newId = defaultId,
} = {}) {
  const seedIds = new Set(TABLES.flatMap((table) => (seed[table] ?? []).map((row) => row.id).filter(Boolean)));
  const listeners = new Set();
  const blobKey = (ref) => `${key}:blob:${ref}`;
  let data = load();

  // ---- storage plumbing -----------------------------------------------------------------

  function read(k) {
    try {
      return storage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  }

  function write(k, value) {
    if (!storage) return;
    try {
      storage.setItem(k, value);
    } catch {
      fail('storage', 'Demo storage in this browser is full. Reset the demo data or try a smaller file.');
    }
  }

  function remove(k) {
    try {
      storage?.removeItem(k);
    } catch {
      /* nothing to clean up */
    }
  }

  function fresh() {
    const shift = now() - Date.parse(seed.anchor);
    const tables = Object.fromEntries(TABLES.map((table) => [table, (seed[table] ?? []).map((row) => shiftDates(row, shift))]));
    return { ...tables, meta: { seedVersion: seed.version, seededAt: new Date(now()).toISOString() } };
  }

  function parse(raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.meta?.seedVersion === seed.version ? parsed : null;
    } catch {
      return null;
    }
  }

  function load() {
    const saved = parse(read(key));
    if (saved) return saved;
    const initial = fresh();
    try {
      write(key, JSON.stringify(initial));
    } catch {
      /* storage unavailable: run in memory */
    }
    return initial;
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  // Persist first, then swap the snapshot, so a full disk never leaves memory and storage disagreeing.
  function commit(changes) {
    const next = { ...data, ...changes };
    write(key, JSON.stringify(next));
    data = next;
    emit();
  }

  const pause = () => {
    const [min, max] = latency;
    const ms = min + Math.random() * (max - min);
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // ---- lookups (always against the latest snapshot, after the pause) ---------------------

  const nowIso = () => new Date(now()).toISOString();
  const row = (table, id) => data[table].find((r) => r.id === id) ?? null;
  const patchRow = (table, id, patch) => data[table].map((r) => (r.id === id ? { ...r, ...patch } : r));
  const membershipOf = (userId, projectId) => data.memberships.find((m) => m.user_id === userId && m.project_id === projectId) ?? null;
  const nameOf = (userId) => row('users', userId)?.name ?? 'Someone';

  function requireUser(userId) {
    return row('users', userId) ?? fail('forbidden', 'Pick a demo user first.');
  }

  function requireMember(userId, projectId, doing) {
    return membershipOf(userId, projectId) ?? fail('forbidden', `Join this project to ${doing}.`);
  }

  function requireReviewer(userId, projectId) {
    const membership = membershipOf(userId, projectId);
    if (!membership || !REVIEWER_ROLES.includes(membership.role)) {
      fail('forbidden', 'Only this project’s leader and mentors can review work.');
    }
    return membership;
  }

  function requireTask(taskId) {
    return row('tasks', taskId) ?? fail('not_found', 'That task no longer exists.');
  }

  function validateUpload(upload) {
    if (!upload?.name?.trim()) fail('invalid', 'Choose a file to upload.');
    if (upload.name.length > 120) fail('invalid', 'Rename the file to under 120 characters.');
    if (!(upload.size >= 0)) fail('invalid', 'That file could not be read.');
    if (upload.size > MAX_UPLOAD_BYTES) fail('invalid', 'Demo storage takes files up to 2 MB.');
    if (!['text', 'dataUrl'].includes(upload.kind) || typeof upload.data !== 'string') fail('invalid', 'That file could not be read.');
  }

  // Builds a new Version (and its File on first upload) without committing it. History is
  // append-only: nothing here edits or deletes an existing version (§6.1).
  function stageVersion({ userId, projectId, fileId = null, upload, message, taskId = null }) {
    validateUpload(upload);
    const text = (message ?? '').trim();
    if (!text) fail('invalid', 'Describe what changed in this version.');
    if (text.length > 200) fail('invalid', 'Keep the version note under 200 characters.');

    let file = fileId ? row('files', fileId) : data.files.find((f) => f.project_id === projectId && f.name === upload.name.trim()) ?? null;
    if (fileId && (!file || file.project_id !== projectId)) fail('not_found', 'That file no longer exists.');

    const versionId = newId();
    const ref = `local/${versionId}`;
    const isNewFile = !file;
    if (isNewFile) file = { id: newId(), project_id: projectId, name: upload.name.trim(), current_version_id: versionId };

    const version = {
      id: versionId,
      file_id: file.id,
      parent_version_id: isNewFile ? null : file.current_version_id,
      author_id: userId,
      task_id: taskId,
      message: text,
      storage_ref: ref,
      mime_type: upload.mime || 'application/octet-stream',
      size: upload.size,
      created_at: nowIso(),
    };
    const files = isNewFile ? [...data.files, file] : patchRow('files', file.id, { current_version_id: versionId });
    return { file, version, ref, blob: { kind: upload.kind, data: upload.data }, changes: { files, versions: [...data.versions, version] } };
  }

  // Blob goes to "storage" first; if the row write then fails, drop the orphaned blob.
  function commitWithBlob(staged, extraChanges = {}) {
    write(blobKey(staged.ref), JSON.stringify(staged.blob));
    try {
      commit({ ...staged.changes, ...extraChanges });
    } catch (error) {
      remove(blobKey(staged.ref));
      throw error;
    }
  }

  // ---- public API -------------------------------------------------------------------------

  return {
    key,
    persistent: Boolean(storage),
    getSnapshot: () => data,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // Seeded records are sample data; the UI must label them (AGENTS.md §5.3).
    isSeeded: (id) => seedIds.has(id),

    readBlob(ref) {
      if (seed.blobs && ref in seed.blobs) return { kind: 'text', data: seed.blobs[ref] };
      const raw = read(blobKey(ref));
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    reset() {
      if (storage) {
        const ours = [];
        for (let i = 0; i < storage.length; i += 1) {
          const k = storage.key(i);
          if (k === key || k?.startsWith(`${key}:`)) ours.push(k);
        }
        ours.forEach(remove);
      }
      data = fresh();
      try {
        write(key, JSON.stringify(data));
      } catch {
        /* in-memory only */
      }
      emit();
    },

    // Another tab wrote new data (see the `storage` listener in store.js).
    reloadFromStorage() {
      const saved = parse(read(key));
      if (saved) {
        data = saved;
        emit();
      }
    },

    async joinProject({ userId, projectId, role }) {
      await pause();
      const user = requireUser(userId);
      const project = row('projects', projectId) ?? fail('not_found', 'That project no longer exists.');
      if (membershipOf(userId, projectId)) fail('conflict', `You are already on ${project.title}.`);
      const allowed = user.type === 'student' ? DOER_ROLES : [...DOER_ROLES, 'MENTOR'];
      if (!allowed.includes(role)) fail('invalid', 'Pick one of the listed roles.');
      const membership = { user_id: userId, project_id: projectId, role, joined_at: nowIso() };
      commit({ memberships: [...data.memberships, membership] });
      return membership;
    },

    // Claiming reuses Task.owner_id/status and Membership; no parallel ownership state (§6.3).
    async claimTask({ userId, taskId }) {
      await pause();
      const user = requireUser(userId);
      const task = requireTask(taskId);
      if (task.owner_id === userId) fail('conflict', 'You already own this task.');
      if (task.owner_id) fail('conflict', `${nameOf(task.owner_id)} claimed this first.`);
      if (task.status !== 'todo') fail('conflict', 'This task is no longer open.');

      const membership = membershipOf(userId, task.project_id);
      if (membership?.role === 'MENTOR') fail('forbidden', 'Mentors review work on this project, so they cannot claim tasks.');
      let joined = null;
      if (!membership) {
        if (task.estimated_minutes == null) fail('forbidden', 'Join the project to claim its tasks.');
        if (user.type !== 'student') fail('forbidden', 'Bridge Missions are open to students.');
        if (!DOER_ROLES.includes(task.role)) fail('invalid', 'This mission is missing the role to join as.');
        joined = { user_id: userId, project_id: task.project_id, role: task.role, joined_at: nowIso() };
      }

      const claimed = { ...task, owner_id: userId, status: 'in_progress', claimed_at: nowIso() };
      commit({
        memberships: joined ? [...data.memberships, joined] : data.memberships,
        tasks: patchRow('tasks', taskId, claimed),
      });
      return { task: claimed, joined };
    },

    async startTask({ userId, taskId }) {
      await pause();
      requireUser(userId);
      const task = requireTask(taskId);
      if (task.owner_id !== userId) fail('forbidden', 'Only the task owner can start it.');
      if (task.status !== 'todo') fail('conflict', 'This task has already started.');
      const started = { ...task, status: 'in_progress' };
      commit({ tasks: patchRow('tasks', taskId, started) });
      return started;
    },

    async createTask({ userId, projectId, title, description, role, ownerId = null, deadline = null, mission = null }) {
      await pause();
      requireUser(userId);
      row('projects', projectId) ?? fail('not_found', 'That project no longer exists.');
      if (membershipOf(userId, projectId)?.role !== 'LEADER') fail('forbidden', 'Only the project leader can add tasks.');

      const cleanTitle = (title ?? '').trim();
      if (!cleanTitle) fail('invalid', 'Give the task a title.');
      if (cleanTitle.length > 120) fail('invalid', 'Keep the title under 120 characters.');
      if (!DOER_ROLES.includes(role)) fail('invalid', 'Pick the role this task needs.');
      if (ownerId) {
        const ownerRole = membershipOf(ownerId, projectId)?.role;
        if (!ownerRole || ownerRole === 'MENTOR') fail('invalid', 'The owner must be a project member who does the work.');
      }
      if (deadline && Number.isNaN(Date.parse(deadline))) fail('invalid', 'That deadline is not a valid date.');

      let missionFields = {};
      if (mission) {
        const minutes = Number(mission.estimated_minutes);
        if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) fail('invalid', 'Missions should take between 5 and 480 minutes.');
        if (!DIFFICULTIES.includes(mission.difficulty)) fail('invalid', 'Pick a difficulty for the mission.');
        const deliverable = (mission.deliverable_instructions ?? '').trim();
        if (!deliverable) fail('invalid', 'Say what the student should hand in.');
        if (ownerId) fail('invalid', 'Leave missions unassigned so a student can claim them.');
        missionFields = {
          estimated_minutes: minutes,
          difficulty: mission.difficulty,
          required_skills: cleanList(mission.required_skills, 8),
          deliverable_instructions: deliverable,
          review_criteria: cleanList(mission.review_criteria, 6),
        };
      }

      const task = {
        id: newId(),
        project_id: projectId,
        title: cleanTitle,
        description: (description ?? '').trim(),
        owner_id: ownerId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'todo',
        estimated_minutes: null,
        difficulty: null,
        required_skills: [],
        deliverable_instructions: null,
        claimed_at: null,
        role,
        review_criteria: [],
        ...missionFields,
      };
      commit({ tasks: [...data.tasks, task] });
      return task;
    },

    async submitWork({ userId, taskId, externalUrl = null, upload = null, note = '' }) {
      await pause();
      requireUser(userId);
      const task = requireTask(taskId);
      if (task.owner_id !== userId) fail('forbidden', 'Only the task owner can submit work for it.');
      if (task.status === 'review') fail('conflict', 'This task is already waiting for review.');
      if (task.status !== 'in_progress') fail('conflict', 'Start the task before submitting work.');

      const url = externalUrl?.trim() || null;
      if (!url && !upload) fail('invalid', 'Add a link or a file for the reviewer to open.');
      if (url && !isHttpUrl(url)) fail('invalid', 'Links need to start with http:// or https://.');
      const cleanNote = (note ?? '').trim();
      if (cleanNote.length > 1000) fail('invalid', 'Keep the note under 1,000 characters.');

      const staged = upload
        ? stageVersion({ userId, projectId: task.project_id, upload, message: `Submitted for “${task.title}”`, taskId })
        : null;
      const submission = {
        id: newId(),
        task_id: taskId,
        author_id: userId,
        file_id: staged?.file.id ?? null,
        version_id: staged?.version.id ?? null,
        external_url: url,
        note: cleanNote || null,
        created_at: nowIso(),
        status: 'submitted',
      };
      const changes = { submissions: [...data.submissions, submission], tasks: patchRow('tasks', taskId, { status: 'review' }) };
      if (staged) commitWithBlob(staged, changes);
      else commit(changes);
      return submission;
    },

    async startReview({ userId, submissionId }) {
      await pause();
      const submission = row('submissions', submissionId) ?? fail('not_found', 'That submission no longer exists.');
      const task = requireTask(submission.task_id);
      requireReviewer(userId, task.project_id);
      if (submission.author_id === userId) fail('forbidden', 'You cannot review your own work.');
      if (submission.status === 'reviewed') fail('conflict', 'This submission has already been reviewed.');
      if (submission.status === 'under_review') return submission;
      const started = { ...submission, status: 'under_review' };
      commit({ submissions: patchRow('submissions', submissionId, started) });
      return started;
    },

    // Feedback only ever comes from a signed-in reviewer's action; nothing here generates it.
    async postFeedback({ userId, submissionId, comments, rubric }) {
      await pause();
      const submission = row('submissions', submissionId) ?? fail('not_found', 'That submission no longer exists.');
      const task = requireTask(submission.task_id);
      requireReviewer(userId, task.project_id);
      if (submission.author_id === userId) fail('forbidden', 'You cannot review your own work.');
      if (submission.status === 'reviewed') {
        const earlier = data.feedback.find((f) => f.submission_id === submissionId);
        fail('conflict', `${nameOf(earlier?.reviewer_id)} already reviewed this.`);
      }
      if (submission.status !== 'under_review') fail('conflict', 'Start the review before posting feedback.');

      const text = (comments ?? '').trim();
      if (text.length < 10) fail('invalid', 'Write at least a sentence about what works.');
      if (text.length > 2000) fail('invalid', 'Keep feedback under 2,000 characters.');
      const outcome = rubric?.outcome;
      if (!REVIEW_OUTCOMES.includes(outcome)) fail('invalid', 'Choose whether to approve the work or request changes.');
      const criteria = (rubric?.criteria ?? []).map((c) => ({ label: String(c.label), rating: c.rating }));
      if (criteria.some((c) => !RUBRIC_RATINGS.includes(c.rating))) fail('invalid', 'Rate every review criterion.');
      const improve = (rubric?.improve ?? '').trim();
      if (outcome === 'changes_requested' && !improve) fail('invalid', 'Say what needs to change before you can approve it.');

      const feedback = {
        id: newId(),
        submission_id: submissionId,
        reviewer_id: userId,
        comments: text,
        rubric: { criteria, improve: improve || null, outcome },
        created_at: nowIso(),
      };
      commit({
        feedback: [...data.feedback, feedback],
        submissions: patchRow('submissions', submissionId, { status: 'reviewed' }),
        tasks: patchRow('tasks', task.id, { status: outcome === 'approved' ? 'done' : 'in_progress' }),
      });
      return feedback;
    },

    async uploadVersion({ userId, projectId, fileId = null, upload, message, taskId = null }) {
      await pause();
      requireUser(userId);
      requireMember(userId, projectId, 'upload files');
      if (taskId && row('tasks', taskId)?.project_id !== projectId) fail('invalid', 'That task is not part of this project.');
      const staged = stageVersion({ userId, projectId, fileId, upload, message, taskId });
      commitWithBlob(staged);
      return staged.version;
    },

    // Rollback appends a copy of the old version; history is never rewound (§6.1).
    async restoreVersion({ userId, versionId }) {
      await pause();
      const version = row('versions', versionId) ?? fail('not_found', 'That version no longer exists.');
      const file = row('files', version.file_id) ?? fail('not_found', 'That file no longer exists.');
      requireMember(userId, file.project_id, 'restore versions');
      if (file.current_version_id === versionId) fail('conflict', 'That is already the current version.');
      const number = versionsForFile(data, file.id).findIndex((v) => v.id === versionId) + 1;
      const restored = {
        ...version,
        id: newId(),
        parent_version_id: file.current_version_id,
        author_id: userId,
        message: `Restore v${number}`,
        created_at: nowIso(),
      };
      commit({ versions: [...data.versions, restored], files: patchRow('files', file.id, { current_version_id: restored.id }) });
      return restored;
    },

    async postMessage({ userId, channelId, content }) {
      await pause();
      const channel = row('channels', channelId) ?? fail('not_found', 'That channel no longer exists.');
      requireMember(userId, channel.project_id, 'post in its channels');
      const text = (content ?? '').trim();
      if (!text) fail('invalid', 'Write a message first.');
      if (text.length > 2000) fail('invalid', 'Keep messages under 2,000 characters.');
      const message = { id: newId(), channel_id: channelId, author_id: userId, content: text, created_at: nowIso() };
      commit({ messages: [...data.messages, message] });
      return message;
    },

    async updateProfile({ userId, skills, goals }) {
      await pause();
      requireUser(userId);
      const current = data.profiles.find((p) => p.user_id === userId);
      const patch = {};
      if (skills) patch.skills = cleanList(skills, 20);
      if (goals) patch.goals = cleanList(goals, 12);
      const next = current
        ? { ...current, ...patch }
        : { user_id: userId, major: null, skills: [], goals: [], resume: { education: [], experience: [], projects: [] }, ...patch };
      commit({ profiles: current ? data.profiles.map((p) => (p.user_id === userId ? next : p)) : [...data.profiles, next] });
      return next;
    },

    // Every coach exchange is logged (§6.4). No latency: logging should not slow the chat.
    async logAgentMessage({ userId, projectId, role, sender, content }) {
      const membership = requireMember(userId, projectId, 'use its coach');
      if (membership.role !== role) fail('forbidden', 'Your coach matches your role on this project.');
      if (!AGENT_SENDERS.includes(sender)) fail('invalid', 'Unknown message sender.');
      const text = String(content ?? '').trim();
      if (!text) fail('invalid', 'Write a message first.');
      const message = { id: newId(), project_id: projectId, user_id: userId, role, sender, content: text.slice(0, 4000), created_at: nowIso() };
      commit({ agentMessages: [...data.agentMessages, message] });
      return message;
    },

    // PROPOSED TeamNote: each person's coach keeps one up-to-date line that every coach on the
    // project can read. Replacing it (new id) means a seeded note never keeps its "sample" label.
    async setTeamNote({ userId, projectId, role, content, agentMessageId = null }) {
      const membership = requireMember(userId, projectId, 'share notes with its coaches');
      if (membership.role !== role) fail('forbidden', 'Team notes follow your role on this project.');
      const text = String(content ?? '').trim();
      if (!text) fail('invalid', 'A team note needs some text.');
      const note = {
        id: newId(),
        project_id: projectId,
        author_id: userId,
        role,
        content: text.slice(0, 280),
        agent_message_id: agentMessageId,
        updated_at: nowIso(),
      };
      const others = data.teamNotes.filter((n) => !(n.project_id === projectId && n.author_id === userId));
      commit({ teamNotes: [...others, note] });
      return note;
    },

    // Only the person a note is about can remove it, so it is looked up by their own id.
    async removeTeamNote({ userId, projectId }) {
      await pause();
      const existing = data.teamNotes.find((n) => n.project_id === projectId && n.author_id === userId);
      if (!existing) fail('not_found', 'There is no team note to remove.');
      commit({ teamNotes: data.teamNotes.filter((n) => n.id !== existing.id) });
      return existing;
    },
  };
}
