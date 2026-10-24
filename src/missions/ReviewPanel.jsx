import { useId, useState } from 'react';
import { RUBRIC_RATINGS } from '../shared/contracts.js';
import { firstName } from '../shared/format.js';
import { RATING_META } from '../shared/labels.js';
import { getUser } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { Spinner } from '../shared/ui/bits.jsx';
import { Field, FormError } from '../shared/ui/Field.jsx';
import { Icon } from '../shared/ui/Icon.jsx';

// Feedback is written by a person and posted under their name. Nothing here drafts it, and the
// coach is not allowed to either (AGENTS.md §6.3, §6.4).
export function ReviewPanel({ submission, task }) {
  const data = useData();
  const me = useMe();
  const author = getUser(data, submission.author_id);
  const ids = useId();
  const criteria = task.review_criteria ?? [];
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState('');
  const [improve, setImprove] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [errors, setErrors] = useState({});

  const start = useAction(() => store.startReview({ userId: me.id, submissionId: submission.id }), {
    success: `Review started. ${firstName(author?.name)} can see someone is on it.`,
  });
  const post = useAction(
    () =>
      store.postFeedback({
        userId: me.id,
        submissionId: submission.id,
        comments,
        rubric: { criteria: criteria.map((label) => ({ label, rating: ratings[label] })), improve, outcome },
      }),
    {
      success: (fb) => (fb.rubric.outcome === 'approved' ? 'Feedback posted. The task is done.' : `Feedback posted. The task is back with ${firstName(author?.name)}.`),
      toastErrors: false,
    },
  );

  if (submission.status === 'submitted') {
    return (
      <div className="action-panel">
        <div>
          <p className="action-title">Ready to review?</p>
          <p className="action-text">Starting the review shows {firstName(author?.name)} that someone is on it.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={start.run} disabled={start.pending}>
          {start.pending ? (
            <>
              <Spinner />
              Starting…
            </>
          ) : (
            'Start review'
          )}
        </button>
      </div>
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (criteria.some((label) => !ratings[label])) next.criteria = 'Rate every criterion.';
    if (comments.trim().length < 10) next.comments = 'Write at least a sentence about what works.';
    if (!outcome) next.outcome = 'Choose approve or request changes.';
    if (outcome === 'changes_requested' && !improve.trim()) next.improve = 'Say what needs to change.';
    setErrors(next);
    if (Object.keys(next).length) return;
    await post.run();
  }

  return (
    <form className="review-form" onSubmit={onSubmit} noValidate aria-labelledby={`${ids}-title`}>
      <div>
        <p className="review-form-title" id={`${ids}-title`}>
          Your review
        </p>
        <p className="muted small">It’s posted under your name and shows on {firstName(author?.name)}’s evidence card if you approve.</p>
      </div>

      {criteria.length > 0 && (
        <div className="criteria-ratings">
          {criteria.map((label, i) => (
            <fieldset key={label} className="criterion">
              <legend>{label}</legend>
              <div className="segmented">
                {RUBRIC_RATINGS.map((rating) => (
                  <label key={rating}>
                    <input
                      className="visually-hidden"
                      type="radio"
                      name={`${ids}-criterion-${i}`}
                      value={rating}
                      checked={ratings[label] === rating}
                      onChange={() => setRatings((r) => ({ ...r, [label]: rating }))}
                    />
                    <span>{RATING_META[rating].label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {errors.criteria && (
            <p className="field-error">
              <Icon name="alert" size={14} />
              {errors.criteria}
            </p>
          )}
        </div>
      )}

      <Field label="What works" error={errors.comments}>
        <textarea className="textarea" value={comments} maxLength={2000} onChange={(e) => setComments(e.target.value)} placeholder="Be specific: quote a line or point at a detail." />
      </Field>
      <Field
        label="What to improve"
        optional={outcome !== 'changes_requested'}
        hint={outcome === 'changes_requested' ? 'Required when you request changes.' : 'One clear next step helps most.'}
        error={errors.improve}
      >
        <textarea className="textarea" value={improve} maxLength={2000} onChange={(e) => setImprove(e.target.value)} />
      </Field>

      <fieldset className="field">
        <legend className="field-label">Decision</legend>
        <div className="decision">
          {[
            ['approved', 'Approve', 'Marks the task done and adds it to their evidence.'],
            ['changes_requested', 'Request changes', 'Sends it back to them to revise and resubmit.'],
          ].map(([value, title, text]) => (
            <label key={value} className={`decision-option ${outcome === value ? 'is-selected' : ''}`}>
              <input type="radio" name={`${ids}-outcome`} value={value} checked={outcome === value} onChange={() => setOutcome(value)} />
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.outcome && (
          <p className="field-error">
            <Icon name="alert" size={14} />
            {errors.outcome}
          </p>
        )}
      </fieldset>

      <FormError>{post.error}</FormError>
      <div className="review-actions">
        <button type="submit" className="btn btn-primary" disabled={post.pending}>
          {post.pending ? (
            <>
              <Spinner />
              Posting…
            </>
          ) : (
            'Post feedback'
          )}
        </button>
      </div>
    </form>
  );
}
