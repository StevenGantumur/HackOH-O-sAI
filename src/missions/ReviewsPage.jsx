import { Page } from '../app/Page.jsx';
import { feedbackGivenBy, reviewQueue, reviewsAnywhere } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { EmptyState } from '../shared/ui/bits.jsx';
import { ReviewedRow, ReviewRow } from './ReviewRow.jsx';
import './missions.css';

export function ReviewsPage() {
  const data = useData();
  const me = useMe();

  if (!reviewsAnywhere(data, me.id)) {
    return (
      <Page title="Reviews">
        <EmptyState icon="lock" title="Reviews are for project leads and mentors">
          {me.name} doesn’t lead or mentor a project, so there’s nothing to review here. Switch to Grace Liu or Dr. Elena Varga from the avatar menu to see a review queue.
        </EmptyState>
      </Page>
    );
  }

  const queue = reviewQueue(data, me.id);
  const given = feedbackGivenBy(data, me.id);

  return (
    <Page title="Reviews" subtitle="Students are waiting on your feedback. Specific and kind beats long.">
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Waiting for review</h2>
          <span className="section-note">
            {queue.length} submission{queue.length === 1 ? '' : 's'}, oldest first
          </span>
        </div>
        {queue.length ? (
          <ul className="row-list">
            {queue.map((submission) => (
              <ReviewRow key={submission.id} submission={submission} />
            ))}
          </ul>
        ) : (
          <EmptyState icon="checkCircle" title="You’re all caught up">
            New submissions from the projects you lead or mentor show up here.
          </EmptyState>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">You reviewed</h2>
        </div>
        {given.length ? (
          <ul className="row-list">
            {given.map((feedback) => (
              <ReviewedRow key={feedback.id} feedback={feedback} />
            ))}
          </ul>
        ) : (
          <p className="muted">Feedback you post shows up here.</p>
        )}
      </section>
    </Page>
  );
}
