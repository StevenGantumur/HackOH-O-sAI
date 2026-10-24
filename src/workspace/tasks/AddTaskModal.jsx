import { useState } from 'react';
import { DIFFICULTIES, DOER_ROLES } from '../../shared/contracts.js';
import { dateInputToIso } from '../../shared/format.js';
import { DIFFICULTY_META, ROLE_META } from '../../shared/labels.js';
import { getProject, getUser, membersOf, membershipsOf } from '../../shared/selectors.js';
import { store, useData, useMe } from '../../shared/store.js';
import { useAction } from '../../shared/useAction.js';
import { Spinner } from '../../shared/ui/bits.jsx';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { Field, FormError } from '../../shared/ui/Field.jsx';

// Only a project's leader adds tasks. The leader's coach suggests tasks but never creates
// them (AGENTS.md §6.4); this form is the human doing it.
export function AddTaskModal({ onClose, projectId }) {
  const data = useData();
  const me = useMe();
  const led = membershipsOf(data, me.id)
    .filter((m) => m.role === 'LEADER')
    .map((m) => getProject(data, m.project_id))
    .filter(Boolean);
  if (!led.length) return <NotALeader name={me.name} onClose={onClose} />;
  return <AddTaskForm led={led} preferredProjectId={projectId} onClose={onClose} />;
}

function NotALeader({ name, onClose }) {
  return (
    <Modal
      title="Only project leaders add tasks"
      size="sm"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Got it
        </button>
      }
    >
      <p>
        {name} doesn’t lead a project yet. Leaders split the work into tasks, and members claim them or get them assigned.
      </p>
      <p className="muted">To try it, switch to a leader such as Leila Haddad from the avatar menu.</p>
    </Modal>
  );
}

const lines = (text) => text.split('\n');
const commas = (text) => text.split(',');

function AddTaskForm({ led, preferredProjectId, onClose }) {
  const data = useData();
  const me = useMe();
  const [form, setForm] = useState(() => ({
    projectId: led.some((p) => p.id === preferredProjectId) ? preferredProjectId : led[0].id,
    title: '',
    description: '',
    role: '',
    ownerId: '',
    deadline: '',
    asMission: false,
    minutes: '30',
    difficulty: 'beginner',
    skills: '',
    deliverable: '',
    criteria: '',
  }));
  const [errors, setErrors] = useState({});
  const project = getProject(data, form.projectId);
  const members = membersOf(data, form.projectId).filter((m) => m.role !== 'MENTOR');

  const update = (field) => (event) => {
    const { type, checked, value } = event.target;
    setForm((f) => ({ ...f, [field]: type === 'checkbox' ? checked : value }));
  };

  const create = useAction(
    () =>
      store.createTask({
        userId: me.id,
        projectId: form.projectId,
        title: form.title,
        description: form.description,
        role: form.role,
        ownerId: form.asMission ? null : form.ownerId || null,
        deadline: dateInputToIso(form.deadline),
        mission: form.asMission
          ? {
              estimated_minutes: Number(form.minutes),
              difficulty: form.difficulty,
              required_skills: commas(form.skills),
              deliverable_instructions: form.deliverable,
              review_criteria: lines(form.criteria),
            }
          : null,
      }),
    { success: form.asMission ? `Mission posted to ${project?.title}` : 'Task added', toastErrors: false },
  );

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = 'Give the task a title.';
    if (!form.role) next.role = 'Pick the role this task needs.';
    if (form.asMission) {
      const minutes = Number(form.minutes);
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) next.minutes = 'Use a whole number from 5 to 480.';
      if (!form.deliverable.trim()) next.deliverable = 'Say what the student should hand in.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    const result = await create.run();
    if (result.ok) onClose();
  }

  return (
    <Modal
      title={form.asMission ? 'Post a Bridge Mission' : 'Add a task'}
      description="Small tasks with one owner and a deadline get finished. Post one as a Bridge Mission to open it to students outside the team."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-task-form" className="btn btn-primary" disabled={create.pending}>
            {create.pending ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : form.asMission ? (
              'Post mission'
            ) : (
              'Add task'
            )}
          </button>
        </>
      }
    >
      <form id="add-task-form" className="form" onSubmit={onSubmit} noValidate>
        <div className="field-row">
          {led.length > 1 ? (
            <Field label="Project">
              <select className="select" value={form.projectId} onChange={update('projectId')}>
                {led.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="field">
              <span className="field-label">Project</span>
              <p className="static-value">{project?.title}</p>
            </div>
          )}
          <Field label="Role it needs" error={errors.role}>
            <select className="select" value={form.role} onChange={update('role')}>
              <option value="">Choose a role</option>
              {DOER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_META[role].tag}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Title" error={errors.title}>
          <input className="input" value={form.title} onChange={update('title')} maxLength={120} placeholder="Start with a verb: “Sketch three bin labels”" />
        </Field>
        <Field label="Description" optional>
          <textarea className="textarea" value={form.description} onChange={update('description')} placeholder="Why it matters, and any context a newcomer needs." />
        </Field>

        <div className="field-row">
          <Field label="Deadline" optional>
            <input type="date" className="input" value={form.deadline} onChange={update('deadline')} />
          </Field>
          {!form.asMission && (
            <Field label="Owner" optional>
              <select className="select" value={form.ownerId} onChange={update('ownerId')}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {getUser(data, m.user_id)?.name} ({ROLE_META[m.role].label})
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <label className="toggle-row">
          <input type="checkbox" checked={form.asMission} onChange={update('asMission')} />
          <span>
            <strong>Post as a Bridge Mission</strong>
            <span className="toggle-row-hint">Any student can claim it. It needs a time estimate, a deliverable and review criteria.</span>
          </span>
        </label>

        {form.asMission && (
          <div className="mission-fields">
            <div className="field-row">
              <Field label="Minutes it takes" error={errors.minutes}>
                <input type="number" min={5} max={480} step={5} className="input" value={form.minutes} onChange={update('minutes')} />
              </Field>
              <Field label="Difficulty">
                <select className="select" value={form.difficulty} onChange={update('difficulty')}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_META[d].label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Skills it uses" optional hint="Separate skills with commas. Students who list them see this mission first.">
              <input className="input" value={form.skills} onChange={update('skills')} placeholder="Copywriting, Canva" />
            </Field>
            <Field label="What to hand in" error={errors.deliverable}>
              <textarea className="textarea" value={form.deliverable} onChange={update('deliverable')} placeholder="One image or PDF showing three concepts side by side." />
            </Field>
            <Field label="How it’s reviewed" optional hint="One criterion per line. Reviewers rate each one.">
              <textarea className="textarea" value={form.criteria} onChange={update('criteria')} placeholder={'Readable from 2 meters away\nWorks in grayscale'} />
            </Field>
          </div>
        )}
        <FormError>{create.error}</FormError>
      </form>
    </Modal>
  );
}
