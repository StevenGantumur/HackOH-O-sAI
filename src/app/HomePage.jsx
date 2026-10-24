import { useState } from 'react';
import { rankMissions } from '../discovery/score.js';
import { firstName } from '../shared/format.js';
import { OUTCOME_META } from '../shared/labels.js';
import { taskHref } from '../shared/router.js';
import {
  getSubmission,
  getTask,
  getUser,
  isMission,
  isOverdue,
  membershipsOf,
  reviewQueue,
  tasksInProject,
} from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { EmptyState, SampleBadge } from '../shared/ui/bits.jsx';
import { MissionCard } from '../missions/MissionCard.jsx';
import { ReviewRow } from '../missions/ReviewRow.jsx';
import { TaskRow } from '../workspace/tasks/TaskRow.jsx';
import { DemoGuide } from './DemoGuide.jsx';
import { Page } from './Page.jsx';

const HIDE_GUIDE = 'bridge-builder:hide-guide';

function readHidden() {
  try {
    return window.localStorage.getItem(HIDE_GUIDE) === '1';
  } catch {
    return false;
  }
}

function saveHidden(hidden) {
  try {
    if (hidden) window.localStorage.setItem(HIDE_GUIDE, '1');
    else window.localStorage.removeItem(HIDE_GUIDE);
  } catch {
    /* a convenience only */
  }
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const dueTime = (task) => (task.deadline ? Date.parse(task.deadline) : Number.MAX_SAFE_INTEGER);

// Unassigned and overdue tasks in projects this user leads.
function needsAttention(data, userId) {
  const led = membershipsOf(data, userId).filter((m) => m.role === 'LEADER');
  return led.flatMap((m) =>
    tasksInProject(data, m.project_id)
      .filter((t) => (!t.owner_id && !isMission(t) && t.status !== 'done') || isOverdue(t))
      .map((task) => ({ task, note: isOverdue(task) ? `Overdue, owned by ${getUser(data, task.owner_id)?.name ?? 'nobody'}` : 'Needs an owner' })),
  );
}

export function HomePage() {
  const data = useData();
  const me = useMe();
  const [guideHidden, setGuideHidden] = useState(readHidden);

  const isStudent = me.type === 'student';
  const missions = rankMissions(data, me.id).slice(0, 3);
  const queue = reviewQueue(data, me.id);
  const attention = needsAttention(data, me.id);
  const myTasks = data.tasks.filter((t) => t.owner_id === me.id && t.status !== 'done').sort((a, b) => dueTime(a) - dueTime(b));
  const latestFeedback = data.feedback
    .filter((f) => getSubmission(data, f.submission_id)?.author_id === me.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

  function setHidden(hidden) {
    saveHidden(hidden);
    setGuideHidden(hidden);
  }

  return (
    <Page title={`${greeting()}, ${firstName(me.name)}`} documentTitle="Home" subtitle="Small contributions. Real connections. Proven growth.">
      {!guideHidden && <DemoGuide onHide={() => setHidden(true)} />}

      <div className="home-grid">
        <div className="home-main">
          {queue.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Waiting for your review</h2>
                <a className="text-link" href="#/reviews">
                  Open reviews
                </a>
              </div>
              <ul className="row-list">
                {queue.slice(0, 4).map((submission) => (
                  <ReviewRow key={submission.id} submission={submission} />
                ))}
              </ul>
            </section>
          )}

          {attention.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Needs your attention</h2>
                <span className="section-note">From the projects you lead</span>
              </div>
              <ul className="row-list">
                {attention.map(({ task, note }) => (
                  <TaskRow key={task.id} task={task} note={note} />
                ))}
              </ul>
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">{isStudent ? 'Missions picked for you' : 'Open missions'}</h2>
              <a className="text-link" href="#/missions">
                See all missions
              </a>
            </div>
            <p className="section-note">
              {isStudent
                ? 'Matched on the skills and goals in your profile. The ranking is rules-based, not AI.'
                : 'Students claim these. Leads and mentors review what comes back.'}
            </p>
            {missions.length ? (
              <div className="mission-grid">
                {missions.map((m, i) => (
                  <MissionCard key={m.task.id} task={m.task} project={m.project} reasons={isStudent ? m.reasons : []} featured={i === 0 && isStudent} />
                ))}
              </div>
            ) : (
              <EmptyState icon="target" title="No open missions right now">
                New missions appear here when project leaders post them.
              </EmptyState>
            )}
          </section>
        </div>

        <aside className="home-side">
          <section className="card side-card" aria-labelledby="home-your-tasks">
            <div className="section-head">
              <h2 className="section-title" id="home-your-tasks">
                Your tasks
              </h2>
              <a className="text-link" href="#/tasks?mine=1">
                Board
              </a>
            </div>
            {myTasks.length ? (
              <ul className="row-list row-list-tight">
                {myTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            ) : (
              <p className="muted">Nothing is assigned to you yet. Claiming a mission is the quickest way in.</p>
            )}
          </section>

          <section className="card side-card" aria-labelledby="home-feedback">
            <h2 className="section-title" id="home-feedback">
              Latest feedback
            </h2>
            {latestFeedback ? <FeedbackPreview feedback={latestFeedback} /> : <p className="muted">When a mentor reviews your work, their feedback shows up here.</p>}
          </section>

          {guideHidden && (
            <button type="button" className="text-link guide-restore" onClick={() => setHidden(false)}>
              Show the demo walkthrough
            </button>
          )}
        </aside>
      </div>
    </Page>
  );
}

function FeedbackPreview({ feedback }) {
  const data = useData();
  const reviewer = getUser(data, feedback.reviewer_id);
  const task = getTask(data, getSubmission(data, feedback.submission_id)?.task_id);
  const outcome = OUTCOME_META[feedback.rubric?.outcome];
  return (
    <div className="feedback-preview">
      <div className="person">
        <Avatar user={reviewer} size={32} />
        <span>
          <strong>{reviewer?.name}</strong>
          <span className="muted small feedback-preview-task">on “{task?.title}”</span>
        </span>
      </div>
      <p className="feedback-preview-quote">{feedback.comments}</p>
      <div className="feedback-preview-foot">
        <span className="feedback-badges">
          {outcome && <span className={`pill tone-${outcome.tone}`}>{outcome.label}</span>}
          {store.isSeeded(feedback.id) && <SampleBadge>Sample</SampleBadge>}
        </span>
        {task && (
          <a className="text-link" href={taskHref(task.id)}>
            Read the full review
          </a>
        )}
      </div>
    </div>
  );
}
