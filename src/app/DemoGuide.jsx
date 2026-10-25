import { useState } from 'react';
import { firstName } from '../shared/format.js';
import { navigate, taskHref } from '../shared/router.js';
import { getUser, isMission, reviewersOf } from '../shared/selectors.js';
import { DEFAULT_USER_ID, switchDemoUser } from '../shared/session.js';
import { useData, useMe } from '../shared/store.js';
import { Icon } from '../shared/ui/Icon.jsx';

export function demoProgress(data, studentId) {
  const since = Date.parse(data.meta.seededAt);
  const isNew = (iso) => Boolean(iso) && Date.parse(iso) >= since;
  const mission = data.tasks.filter((task) => task.owner_id === studentId && isMission(task) && isNew(task.claimed_at)).at(-1) ?? null;
  const submissions = data.submissions.filter((submission) => submission.author_id === studentId && isNew(submission.created_at));
  const feedback = data.feedback.filter((item) => submissions.some((submission) => submission.id === item.submission_id));
  const reviewers = mission ? reviewersOf(data, mission.project_id) : [];
  const reviewerId = (reviewers.find((membership) => membership.role === 'MENTOR') ?? reviewers[0])?.user_id ?? 'u-grace';
  return {
    mission,
    reviewer: getUser(data, reviewerId),
    claimed: Boolean(mission),
    submitted: submissions.length > 0,
    reviewed: feedback.length > 0,
    approved: feedback.some((item) => item.rubric?.outcome === 'approved'),
  };
}

function switchTo(userId, path) {
  switchDemoUser(userId);
  navigate(path);
}

export function DemoGuide({ onHide }) {
  const data = useData();
  const me = useMe();
  const [expanded, setExpanded] = useState(false);
  const student = getUser(data, DEFAULT_USER_ID);
  const progress = demoProgress(data, student.id);
  const { reviewer, mission } = progress;
  const isStudent = me.id === student.id;
  const studentName = firstName(student.name);
  const backToStudent = (path) => (
    <button type="button" className="btn btn-soft btn-sm" onClick={() => switchTo(student.id, path)}>
      <Icon name="swap" size={16} />
      Switch to {studentName}
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
      text: `Approved work becomes a card on ${studentName}’s profile, linked to the task, file and feedback.`,
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
  const completed = steps.filter((step) => step.done).length;
  const currentStep = current === -1 ? null : steps[current];

  return (
    <section className={`guide ${expanded ? 'is-expanded' : ''}`} aria-labelledby="guide-title">
      <div className="guide-summary">
        <span className="guide-progress" aria-label={`${completed} of ${steps.length} walkthrough steps complete`}>
          {completed}/{steps.length}
        </span>
        <div className="guide-copy">
          <p className="guide-label">Demo walkthrough</p>
          <h2 id="guide-title" className="guide-title">
            {currentStep ? currentStep.title : 'Contribution loop complete'}
          </h2>
          <p className="guide-sub">
            {currentStep ? currentStep.text : `You completed ${studentName}’s first contribution from claim to evidence.`}
          </p>
        </div>
        <div className="guide-actions">
          {currentStep?.action}
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            aria-expanded={expanded}
            aria-controls="demo-checklist"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Hide checklist' : 'View checklist'}
            <Icon name="chevronDown" size={15} className={expanded ? 'is-rotated' : undefined} />
          </button>
          <button type="button" className="icon-btn icon-btn-sm" onClick={onHide} aria-label="Dismiss the demo walkthrough">
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>
      {expanded && (
        <ol className="guide-steps" id="demo-checklist">
          {steps.map((step, index) => (
            <li key={step.title} className={`guide-step ${step.done ? 'is-done' : ''} ${index === current ? 'is-current' : ''}`} aria-current={index === current ? 'step' : undefined}>
              <span className="guide-num" aria-hidden="true">
                {step.done ? <Icon name="check" size={14} strokeWidth={2.4} /> : index + 1}
              </span>
              <span>
                <span className="guide-step-title">{step.title}</span>
                <span className="guide-step-text">{step.done && step.doneText ? step.doneText : step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
