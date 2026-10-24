import { useState } from 'react';
import { timeAgo } from '../shared/format.js';
import { OUTCOME_META, RATING_META, ROLE_META } from '../shared/labels.js';
import { feedbackFor, getFile, getTask, getUser, getVersion, isReviewerIn, membershipOf, versionNumber } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { SampleBadge, SubmissionPill } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { VersionModal } from '../workspace/versions/VersionPreview.jsx';
import { ReviewPanel } from './ReviewPanel.jsx';

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ArtifactLinks({ submission }) {
  const data = useData();
  const [open, setOpen] = useState(false);
  const version = submission.version_id ? getVersion(data, submission.version_id) : null;
  const file = version ? getFile(data, version.file_id) : null;
  return (
    <div className="artifacts">
      {submission.external_url && (
        <a className="artifact" href={submission.external_url} target="_blank" rel="noopener noreferrer">
          <Icon name="link" size={16} />
          {hostname(submission.external_url)}
          <Icon name="external" size={14} />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      )}
      {version && (
        <button type="button" className="artifact" onClick={() => setOpen(true)}>
          <Icon name={version.mime_type.startsWith('image/') ? 'image' : 'file'} size={16} />
          {file?.name}
          <span className="artifact-version">v{versionNumber(data, version)}</span>
        </button>
      )}
      {open && version && <VersionModal version={version} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function FeedbackBlock({ feedback }) {
  const data = useData();
  const reviewer = getUser(data, feedback.reviewer_id);
  const task = getTask(data, data.submissions.find((s) => s.id === feedback.submission_id)?.task_id);
  const role = task ? membershipOf(data, reviewer?.id, task.project_id)?.role : null;
  const outcome = OUTCOME_META[feedback.rubric?.outcome];
  const criteria = feedback.rubric?.criteria ?? [];
  return (
    <div className="feedback">
      <div className="feedback-head">
        <Avatar user={reviewer} size={30} />
        <div className="feedback-who">
          <p>
            <strong>{reviewer?.name}</strong>
            {role && <span className="muted"> {ROLE_META[role].label.toLowerCase()}</span>}
          </p>
          <p className="muted small">Reviewed {timeAgo(feedback.created_at)}</p>
        </div>
        <div className="feedback-badges">
          {outcome && <span className={`pill tone-${outcome.tone}`}>{outcome.label}</span>}
          {store.isSeeded(feedback.id) && <SampleBadge>Sample feedback</SampleBadge>}
        </div>
      </div>
      <p className="feedback-comments">{feedback.comments}</p>
      {criteria.length > 0 && (
        <ul className="rubric">
          {criteria.map((c) => (
            <li key={c.label}>
              <span className={`rating tone-${RATING_META[c.rating]?.tone}`}>{RATING_META[c.rating]?.label}</span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
      {feedback.rubric?.improve && (
        <div className="improve">
          <p className="improve-title">To improve</p>
          <p>{feedback.rubric.improve}</p>
        </div>
      )}
    </div>
  );
}

export function SubmissionCard({ submission, task }) {
  const data = useData();
  const me = useMe();
  const author = getUser(data, submission.author_id);
  const feedback = feedbackFor(data, submission.id);
  const canReview = isReviewerIn(data, me.id, task.project_id) && submission.author_id !== me.id;

  return (
    <article className="submission">
      <header className="submission-head">
        <Avatar user={author} size={32} />
        <div className="submission-who">
          <p className="submission-author">{author?.name}</p>
          <p className="muted small">Submitted {timeAgo(submission.created_at)}</p>
        </div>
        <div className="feedback-badges">
          <SubmissionPill status={submission.status} />
          {store.isSeeded(submission.id) && <SampleBadge>Sample</SampleBadge>}
        </div>
      </header>
      <ArtifactLinks submission={submission} />
      {submission.note && <p className="submission-note">{submission.note}</p>}
      {feedback.map((f) => (
        <FeedbackBlock key={f.id} feedback={f} />
      ))}
      {canReview && submission.status !== 'reviewed' && <ReviewPanel submission={submission} task={task} />}
    </article>
  );
}
