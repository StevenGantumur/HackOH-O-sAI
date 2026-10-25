import { useState } from 'react';
import { rankMissions, rankProjects } from '../discovery/score.js';
import { firstName } from '../shared/format.js';
import { OUTCOME_META } from '../shared/labels.js';
import { taskHref } from '../shared/router.js';
import {
  getProfile,
  getProject,
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
import { SampleBadge } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { ReviewRow } from '../missions/ReviewRow.jsx';
import { TaskRow } from '../workspace/tasks/TaskRow.jsx';
import { DemoGuide } from './DemoGuide.jsx';
import { HomeMissionCard, HomeProjectCard, HomeProjectRow } from './HomeCards.jsx';
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
    /* The walkthrough still works when browser storage is unavailable. */
  }
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function greetingName(name) {
  const value = firstName(name).split('_')[0] || 'there';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

const dueTime = (task) => (task.deadline ? Date.parse(task.deadline) : Number.MAX_SAFE_INTEGER);

function needsAttention(data, userId) {
  const led = membershipsOf(data, userId).filter((membership) => membership.role === 'LEADER');
  return led.flatMap((membership) =>
    tasksInProject(data, membership.project_id)
      .filter((task) => (!task.owner_id && !isMission(task) && task.status !== 'done') || isOverdue(task))
      .map((task) => ({
        task,
        note: isOverdue(task) ? `Overdue, owned by ${getUser(data, task.owner_id)?.name ?? 'nobody'}` : 'Needs an owner',
      })),
  );
}

function summaryLine({ reviews, tasks, projects }) {
  const parts = [];
  if (reviews) parts.push(`${reviews} review${reviews === 1 ? '' : 's'} waiting`);
  if (tasks) parts.push(`${tasks} active task${tasks === 1 ? '' : 's'}`);
  if (projects) parts.push(`${projects} project${projects === 1 ? '' : 's'}`);
  if (!parts.length) return 'Explore a mission or project that fits your skills and interests.';
  return `${parts.join(' · ')}.`;
}

export function HomePage() {
  const data = useData();
  const me = useMe();
  const [guideHidden, setGuideHidden] = useState(readHidden);

  const isStudent = me.type === 'student';
  const profile = getProfile(data, me.id);
  const hasProfileSignals = Boolean(profile?.skills?.length || profile?.goals?.length);
  const memberships = membershipsOf(data, me.id);
  const memberProjectIds = new Set(memberships.map((membership) => membership.project_id));
  const missions = rankMissions(data, me.id).slice(0, 3);
  const projects = rankProjects(data, me.id)
    .filter(({ project }) => !memberProjectIds.has(project.id))
    .slice(0, 3);
  const queue = reviewQueue(data, me.id);
  const attention = needsAttention(data, me.id);
  const myTasks = data.tasks.filter((task) => task.owner_id === me.id && task.status !== 'done').sort((a, b) => dueTime(a) - dueTime(b));
  const latestFeedback = data.feedback
    .filter((feedback) => getSubmission(data, feedback.submission_id)?.author_id === me.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

  const attentionIds = new Set(attention.map(({ task }) => task.id));
  const actionItems = [
    ...queue.map((submission) => ({ id: `review-${submission.id}`, type: 'review', submission })),
    ...attention.map(({ task, note }) => ({ id: `attention-${task.id}`, type: 'task', task, note })),
    ...myTasks.filter((task) => !attentionIds.has(task.id)).map((task) => ({ id: `task-${task.id}`, type: 'task', task })),
  ].slice(0, 4);
  const myProjects = memberships
    .map((membership) => ({ membership, project: getProject(data, membership.project_id) }))
    .filter(({ project }) => Boolean(project))
    .slice(0, 3);

  function setHidden(hidden) {
    saveHidden(hidden);
    setGuideHidden(hidden);
  }

  return (
    <Page
      title={`${greeting()}, ${greetingName(me.name)}`}
      documentTitle="Home"
      subtitle={summaryLine({ reviews: queue.length, tasks: myTasks.length + attention.length, projects: memberships.length })}
      headerClassName="home-page-header"
      bodyClassName="home-page-body"
      actions={
        <div className="home-quick-actions">
          {guideHidden && (
            <button type="button" className="btn btn-ghost btn-sm home-walkthrough-action" onClick={() => setHidden(false)}>
              <Icon name="target" size={16} />
              <span className="btn-label">Walkthrough</span>
            </button>
          )}
          <a className="btn btn-quiet btn-sm" href="#/missions">
            Find a mission
          </a>
          <a className="btn btn-primary btn-sm" href="#/projects">
            Browse projects
          </a>
        </div>
      }
    >
      <div className="home-dashboard">
        <nav className="home-mobile-actions" aria-label="Home quick actions">
          {guideHidden && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHidden(false)}>
              <Icon name="target" size={16} />
              Walkthrough
            </button>
          )}
          <a className="btn btn-quiet btn-sm" href="#/missions">
            Find a mission
          </a>
          <a className="btn btn-primary btn-sm" href="#/projects">
            Browse projects
          </a>
        </nav>
        {(actionItems.length > 0 || myProjects.length > 0) && (
          <section className="home-section" aria-labelledby="home-work-title">
            <div className="home-section-heading">
              <div>
                <h2 id="home-work-title">Continue working</h2>
                <p>Open the next item that needs you.</p>
              </div>
              {myTasks.length > 0 && (
                <a className="text-link" href="#/tasks?mine=1">
                  View your tasks
                </a>
              )}
            </div>
            <div className={`home-work-grid ${actionItems.length === 0 || myProjects.length === 0 ? 'is-single' : ''}`}>
              {actionItems.length > 0 && (
                <div className="home-panel">
                  <div className="home-panel-heading">
                    <h3>Next up</h3>
                    <span>{queue.length > 0 ? `${queue.length} review${queue.length === 1 ? '' : 's'} waiting` : `${myTasks.length + attention.length} active`}</span>
                  </div>
                  <ul className="row-list home-action-list">
                    {actionItems.map((item) =>
                      item.type === 'review' ? (
                        <ReviewRow key={item.id} submission={item.submission} />
                      ) : (
                        <TaskRow key={item.id} task={item.task} note={item.note} />
                      ),
                    )}
                  </ul>
                </div>
              )}
              {myProjects.length > 0 && (
                <div className="home-panel">
                  <div className="home-panel-heading">
                    <h3>Your projects</h3>
                    <a className="text-link" href="#/projects">
                      View all
                    </a>
                  </div>
                  <ul className="home-project-list">
                    {myProjects.map(({ project, membership }) => (
                      <HomeProjectRow
                        key={project.id}
                        project={project}
                        membership={membership}
                        activeTaskCount={myTasks.filter((task) => task.project_id === project.id).length}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {!guideHidden && <DemoGuide onHide={() => setHidden(true)} />}

        <section className="home-section" aria-labelledby="home-missions-title">
          <div className="home-section-heading">
            <div>
              <h2 id="home-missions-title">{isStudent ? 'Missions picked for you' : 'Open missions'}</h2>
              <p>
                {isStudent && hasProfileSignals
                  ? 'Ordered by a rules-based match to the skills and goals in your profile.'
                  : 'Short, focused contributions currently open across active projects.'}
              </p>
            </div>
            <a className="text-link" href="#/missions">
              View all missions
            </a>
          </div>
          {missions.length > 0 ? (
            <div className="home-card-grid">
              {missions.map((match, index) => (
                <HomeMissionCard key={match.task.id} match={match} bestMatch={index === 0 && isStudent && hasProfileSignals} />
              ))}
            </div>
          ) : (
            <p className="home-inline-empty">No missions are open right now. New opportunities will appear here when project leads post them.</p>
          )}
        </section>

        <section className="home-section" aria-labelledby="home-projects-title">
          <div className="home-section-heading">
            <div>
              <h2 id="home-projects-title">Projects picked for you</h2>
              <p>
                {hasProfileSignals
                  ? 'Ordered by the same skills-and-goals rules used in project discovery.'
                  : 'Active teams with open roles and missions you can explore.'}
              </p>
            </div>
            <a className="text-link" href="#/projects">
              View all projects
            </a>
          </div>
          {projects.length > 0 ? (
            <div className="home-card-grid">
              {projects.map((match) => (
                <HomeProjectCard key={match.project.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="home-inline-empty">You are already involved in every active project currently available.</p>
          )}
        </section>

        {latestFeedback && (
          <section className="home-section home-secondary" aria-labelledby="home-feedback-title">
            <div className="home-section-heading">
              <div>
                <h2 id="home-feedback-title">Latest feedback</h2>
                <p>Your most recent reviewed contribution.</p>
              </div>
            </div>
            <div className="home-panel home-feedback-panel">
              <FeedbackPreview feedback={latestFeedback} />
            </div>
          </section>
        )}
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
