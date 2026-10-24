import { useEffect, useRef, useState } from 'react';
import { formatMinutes, joinList } from '../shared/format.js';
import { ROLE_META } from '../shared/labels.js';
import { getUser, isMission, isReviewerIn, latestSubmission, reviewersOf } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { Spinner } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { SubmitModal } from './SubmitModal.jsx';

function Notice({ icon, tone, children }) {
  return (
    <div className={`notice ${tone ? `tone-${tone}` : ''}`}>
      <Icon name={icon} size={18} />
      <div>{children}</div>
    </div>
  );
}

// The one next step for this person on this task. Each step is a confirmed store write, so
// nothing shows as claimed, submitted or done until it has saved (AGENTS.md §6.3).
export function TaskActions({ task, project, membership }) {
  const data = useData();
  const me = useMe();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const confirmRef = useRef(null);

  const claim = useAction(() => store.claimTask({ userId: me.id, taskId: task.id }), {
    success: ({ joined }) => (joined ? `You joined ${project.title} and claimed the mission` : 'Claimed. It’s in your In Progress column.'),
  });
  const start = useAction(() => store.startTask({ userId: me.id, taskId: task.id }), { success: 'Task started' });

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const mission = isMission(task);
  const isOwner = task.owner_id === me.id;
  const reviewerNames = reviewersOf(data, project.id)
    .map((m) => getUser(data, m.user_id)?.name)
    .filter(Boolean);

  if (task.status === 'todo' && !task.owner_id) {
    if (membership?.role === 'MENTOR') return <Notice icon="lock">You mentor this project, so you review its missions instead of claiming them.</Notice>;
    if (!membership && !mission) return <Notice icon="lock">Join {project.title} to claim its tasks.</Notice>;
    if (!membership && me.type !== 'student') {
      return <Notice icon="lock">Bridge Missions are open to students. Switch to a student from the avatar menu to try claiming one.</Notice>;
    }
    const joiningAs = membership ? null : ROLE_META[task.role]?.label;

    if (!confirming) {
      return (
        <div className="action-panel">
          <div>
            <p className="action-title">{mission ? 'Want to take this on?' : 'This task is open'}</p>
            <p className="action-text">
              {mission
                ? `About ${formatMinutes(task.estimated_minutes)} of work. Your coach can help you get unstuck; the work and the credit stay yours.`
                : 'Claim it to become the owner.'}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setConfirming(true)}>
            {mission ? 'Claim mission' : 'Claim task'}
          </button>
        </div>
      );
    }

    return (
      <div className="action-panel is-confirming" role="group" aria-labelledby="claim-title">
        <div>
          <p className="action-title" id="claim-title">
            Confirm your claim
          </p>
          <p className="action-text">
            {joiningAs ? `You’ll join ${project.title} as ${joiningAs} and own this mission.` : 'You’ll own this task.'} It moves to In Progress.
          </p>
        </div>
        <div className="action-buttons">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={claim.pending}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="btn btn-primary"
            disabled={claim.pending}
            onClick={async () => {
              const result = await claim.run();
              if (!result.ok) setConfirming(false);
            }}
          >
            {claim.pending ? (
              <>
                <Spinner />
                Claiming…
              </>
            ) : (
              'Yes, claim it'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (task.status === 'todo' && isOwner) {
    return (
      <div className="action-panel">
        <div>
          <p className="action-title">Assigned to you</p>
          <p className="action-text">Start it when you begin, so your team can see it moving.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={start.run} disabled={start.pending}>
          {start.pending ? (
            <>
              <Spinner />
              Starting…
            </>
          ) : (
            'Start task'
          )}
        </button>
      </div>
    );
  }

  if (task.status === 'in_progress' && isOwner) {
    const resubmitting = Boolean(latestSubmission(data, task.id));
    return (
      <>
        <div className="action-panel">
          <div>
            <p className="action-title">{resubmitting ? 'Ready to resubmit?' : 'Finished your part?'}</p>
            <p className="action-text">
              {resubmitting
                ? 'Work through the feedback below, then submit the new version.'
                : `Submit a link or a file.${reviewerNames.length ? ` ${joinList(reviewerNames)} will review it.` : ''}`}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setSubmitting(true)}>
            <Icon name="upload" size={18} />
            Submit work
          </button>
        </div>
        {submitting && <SubmitModal task={task} onClose={() => setSubmitting(false)} />}
      </>
    );
  }

  if (task.status === 'review' && isOwner) {
    const status = latestSubmission(data, task.id)?.status;
    return (
      <Notice icon="clock" tone="review">
        {status === 'under_review' ? 'A reviewer is reading your submission now.' : 'Submitted. It’s waiting for a reviewer to pick it up.'}
      </Notice>
    );
  }

  if (task.status === 'review' && isReviewerIn(data, me.id, project.id)) {
    return <Notice icon="inbox">This is waiting on a lead or mentor like you. The review form is under the submission.</Notice>;
  }

  if (task.status === 'done') {
    return (
      <Notice icon="checkCircle" tone="done">
        {isOwner && mission ? (
          <>
            Approved by a reviewer and done.{' '}
            <a className="text-link" href="#/profile">
              See your evidence card
            </a>
          </>
        ) : (
          'This task is done.'
        )}
      </Notice>
    );
  }

  return null;
}
