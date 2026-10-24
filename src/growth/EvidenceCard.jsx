import { formatFullDate } from '../shared/format.js';
import { ROLE_META, USER_TYPE_META, projectArt } from '../shared/labels.js';
import { taskHref } from '../shared/router.js';
import { membershipOf } from '../shared/selectors.js';
import { useData } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { SampleBadge } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { ArtifactLinks } from '../missions/SubmissionCard.jsx';
import './growth.css';

// A shareable-looking record of one reviewed contribution, built from real records each time
// it renders. The artifact itself only opens for members of that project, so profiles never
// leak private work (AGENTS.md §6.3).
export function EvidenceCard({ item, viewerId }) {
  const data = useData();
  const { task, project, submission, feedback, reviewer, reviewerRole, contributorRole, version, file, versionNumber, sample } = item;
  const art = projectArt(project);
  const criteria = feedback.rubric?.criteria ?? [];
  const met = criteria.filter((c) => c.rating === 'meets').length;
  const viewerIsMember = Boolean(membershipOf(data, viewerId, project.id));

  return (
    <article className="evidence">
      <div className="evidence-band" style={{ background: art.bg }}>
        <span className="evidence-emoji" aria-hidden="true">
          {art.emoji}
        </span>
        <div className="evidence-project">
          <p className="evidence-project-name">{project.title}</p>
          <p className="evidence-project-role">{ROLE_META[contributorRole]?.label ?? 'Team'} contribution</p>
        </div>
        {sample && <SampleBadge>Sample</SampleBadge>}
      </div>

      <div className="evidence-body">
        <h3 className="evidence-title">
          {viewerIsMember ? (
            <a className="evidence-title-link" href={taskHref(task.id)}>
              {task.title}
            </a>
          ) : (
            task.title
          )}
        </h3>
        {submission.note && <p className="evidence-note">{submission.note}</p>}

        {viewerIsMember ? (
          <ArtifactLinks submission={submission} />
        ) : (
          <p className="evidence-private">
            <Icon name="lock" size={14} />
            The work itself is visible to {project.title} members.
          </p>
        )}

        <figure className="evidence-quote">
          <blockquote>{feedback.comments}</blockquote>
          <figcaption>
            <Avatar user={reviewer} size={30} />
            <span>
              <strong>{reviewer?.name}</strong>
              <span className="muted small">
                {reviewerRole ? ROLE_META[reviewerRole].label : 'Reviewer'}, {USER_TYPE_META[reviewer?.type]?.label.toLowerCase()}
              </span>
            </span>
          </figcaption>
        </figure>

        <div className="evidence-foot">
          <span className="evidence-stamp">
            <Icon name="checkCircle" size={16} />
            Reviewed by a person{criteria.length ? `, met ${met} of ${criteria.length} criteria` : ''}
          </span>
        </div>

        <details className="evidence-provenance">
          <summary>Where this comes from</summary>
          <dl>
            <div>
              <dt>Task</dt>
              <dd>
                {task.title} <span className="muted">({task.id})</span>
              </dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatFullDate(submission.created_at)}</dd>
            </div>
            <div>
              <dt>Reviewed</dt>
              <dd>
                {formatFullDate(feedback.created_at)} by {reviewer?.name}
              </dd>
            </div>
            {version && (
              <div>
                <dt>Artifact</dt>
                <dd>
                  {file?.name}, version {versionNumber}
                </dd>
              </div>
            )}
          </dl>
          <p className="muted small">Assembled from those records when this page loads. Nothing on this card is written by AI.</p>
        </details>
      </div>
    </article>
  );
}
