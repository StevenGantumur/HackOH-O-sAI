import { firstName } from '../shared/format.js';
import { navigate, taskHref } from '../shared/router.js';
import { getUser, isMission, reviewersOf } from '../shared/selectors.js';
import { DEFAULT_USER_ID, switchDemoUser } from '../shared/session.js';
import { useData, useMe } from '../shared/store.js';
import { Icon } from '../shared/ui/Icon.jsx';

// Tracks the MVP acceptance flow (AGENTS.md §6.7) for the demo student, using only records
// created since the demo data was loaded.
export function demoProgress(data, studentId) {
  const since = Date.parse(data.meta.seededAt);
  const isNew = (iso) => Boolean(iso) && Date.parse(iso) >= since;
  const mission = data.tasks.filter((t) => t.owner_id === studentId && isMission(t) && isNew(t.claimed_at)).at(-1) ?? null;
  const submissions = data.submissions.filter((s) => s.author_id === studentId && isNew(s.created_at));
  const feedback = data.feedback.filter((f) => submissions.some((s) => s.id === f.submission_id));
  const reviewers = mission ? reviewersOf(data, mission.project_id) : [];
  const reviewerId = (reviewers.find((m) => m.role === 'MENTOR') ?? reviewers[0])?.user_id ?? 'u-grace';
  return {
    mission,
    reviewer: getUser(data, reviewerId),
    claimed: Boolean(mission),
    submitted: submissions.length > 0,
    reviewed: feedback.length > 0,
    approved: feedback.some((f) => f.rubric?.outcome === 'approved'),
  };
}

function switchTo(userId, path) {
  switchDemoUser(userId);
  navigate(path);
}

export function DemoGuide({ onHide }) {
  const data = useData();
  const me = useMe();
  const student = getUser(data, DEFAULT_USER_ID);
  const progress = demoProgress(data, student.id);
  const { reviewer, mission } = progress;
  const isStudent = me.id === student.id;
  const studentName = firstName(student.name);
  const backToStudent = (path) => (
    <button type="button" className="btn btn-soft btn-sm" onClick={() => switchTo(student.id, path)}>
      <Icon name="swap" size={16} />
      Switch back to {studentName}
    </button>
  );

  const steps = [
    {
      title: 'Claim a mission',
      text: 'Pick a short task that fits your skills and the time you have.',
      doneText: mission && `Claimed “${mission.title}”.`,
      done: progress.claimed,
      action: isStudent ? (
        <a className="btn btn-primary btn-sm" href="#/missions">
          Browse missions
        </a>
      ) : (
        backToStudent('/missions')
      ),
    },
    {
      title: 'Submit the work',
      text: 'Add a link or a file and send it for review.',
      doneText: 'Submitted for review.',
      done: progress.submitted,
      action: isStudent ? (
        mission && (
          <a className="btn btn-primary btn-sm" href={taskHref(mission.id)}>
            Open the mission
          </a>
        )
      ) : (
        backToStudent('/tasks')
      ),
    },
    {
      title: `Review it as ${firstName(reviewer.name)}`,
      text: `Switch to ${reviewer.name}, who reviews work on that project, and post feedback.`,
      doneText: `${reviewer.name} posted feedback.`,
      done: progress.reviewed,
      action:
        me.id === reviewer.id ? (
          <a className="btn btn-primary btn-sm" href="#/reviews">
            Open reviews
          </a>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => switchTo(reviewer.id, '/reviews')}>
            <Icon name="swap" size={16} />
            Switch to {firstName(reviewer.name)}
          </button>
        ),
    },
    {
      title: 'See the evidence card',
      text: `Approved work becomes a card on ${studentName}’s profile, linked to the real task, file and feedback.`,
      doneText: `It’s on ${studentName}’s profile.`,
      done: progress.approved,
      action: isStudent ? (
        <a className="btn btn-primary btn-sm" href="#/profile">
          Open profile
        </a>
      ) : (
        backToStudent('/profile')
      ),
    },
  ];
  const current = steps.findIndex((step) => !step.done);

  return (
    <section className="guide" aria-labelledby="guide-title">
      <div className="guide-head">
        <div>
          <h2 id="guide-title" className="guide-title">
            {current === -1 ? 'That’s the whole loop. Reset the demo data to run it again.' : `Demo walkthrough: ${studentName}’s first contribution`}
          </h2>
          <p className="guide-sub">Each step is saved in this browser, so you can refresh at any point.</p>
        </div>
        <button type="button" className="icon-btn" onClick={onHide} aria-label="Hide the walkthrough">
          <Icon name="x" />
        </button>
      </div>
      <ol className="guide-steps">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className={`guide-step ${step.done ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="guide-num" aria-hidden="true">
              {step.done ? <Icon name="check" size={16} strokeWidth={2.4} /> : i + 1}
            </span>
            <div className="guide-copy">
              <p className="guide-step-title">
                {step.title}
                {step.done && <span className="visually-hidden"> (done)</span>}
              </p>
              <p className="guide-step-text">{step.done && step.doneText ? step.doneText : step.text}</p>
              {i === current && step.action && <div className="guide-action">{step.action}</div>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
