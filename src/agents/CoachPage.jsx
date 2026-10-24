import { useEffect, useId, useRef, useState } from 'react';
import { Page } from '../app/Page.jsx';
import { dueLabel } from '../shared/format.js';
import { ROLE_META, projectArt } from '../shared/labels.js';
import { href, taskHref, useRoute } from '../shared/router.js';
import { agentThread, getProject, membershipsOf } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { EmptyState } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { askCoach } from './coach.js';
import { buildAgentContext } from './context.js';
import { AGENT_MODE } from './llm.js';
import { getSystemPrompt } from './prompts/index.js';
import '../workspace/channels/channels.css';
import './agents.css';

const LADDER = [
  'Asks a question to get you thinking',
  'Points you to the idea or resource you need',
  'Gives a hint or a partial example',
  'Reviews your attempt with specific feedback',
  'Walks through a similar problem, never your actual task',
];

const STARTERS = {
  LEADER: ['What should I focus on this week?', 'How do I split this into tasks?', 'Review my plan for this week', 'Show me an example', 'Just assign the tasks for me'],
  MENTOR: ['How should I start this review?', 'What makes feedback useful?', 'Check my feedback draft', 'Show me an example', 'Just write the feedback for me'],
  DEFAULT: ['I’m stuck. Where do I start?', 'What should I read up on?', 'Can you review my draft?', 'Show me an example', 'Just do it for me'],
};

export function CoachPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const memberships = membershipsOf(data, me.id);

  if (!memberships.length) {
    return (
      <Page title="Coach">
        <EmptyState
          icon="sparkles"
          title="Join a project to get a coach"
          action={
            <a className="btn btn-primary" href="#/missions">
              Browse missions
            </a>
          }
        >
          Every project gives you a coach for your role. It asks questions and gives hints. It won’t do the work for you.
        </EmptyState>
      </Page>
    );
  }

  const active = memberships.find((m) => m.project_id === query.get('project')) ?? memberships[0];
  const focusTaskId = active.project_id === query.get('project') ? query.get('task') : null;

  return (
    <Page title="Coach" subtitle="A coach for your role on each project. It helps you get unstuck; it won’t do the work for you.">
      <div className="coach-layout">
        <aside className="coach-side">
          <section className="card side-card">
            <h2 className="section-title">Your coaches</h2>
            <ul className="coach-list">
              {memberships.map((m) => {
                const project = getProject(data, m.project_id);
                const art = projectArt(project);
                const isActive = m.project_id === active.project_id;
                return (
                  <li key={m.project_id}>
                    <a className={`coach-link ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined} href={href('/coach', { project: m.project_id })}>
                      <span className="project-emoji" style={{ background: art.bg }} aria-hidden="true">
                        {art.emoji}
                      </span>
                      <span className="coach-link-text">
                        <span className="coach-link-title">{project?.title}</span>
                        <span className="coach-link-role">{ROLE_META[m.role].label} coach</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
          <CoachContext userId={me.id} projectId={active.project_id} focusTaskId={focusTaskId} />
          <section className="card side-card">
            <h2 className="section-title">How your coach helps</h2>
            <ol className="ladder">
              {LADDER.map((step, i) => (
                <li key={step}>
                  <span className="ladder-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="muted small">It climbs only as far as you need. Ask it to do the work and it will say no, then offer the next step.</p>
            <details className="coach-rules">
              <summary>Read the coach’s rules</summary>
              <pre>{getSystemPrompt(active.role)}</pre>
            </details>
          </section>
        </aside>
        <CoachChat key={`${active.project_id}-${active.role}`} membership={active} focusTaskId={focusTaskId} />
      </div>
    </Page>
  );
}

function CoachContext({ userId, projectId, focusTaskId }) {
  const data = useData();
  const context = buildAgentContext(data, { userId, projectId, focusTaskId });
  const task = context.currentTask;
  return (
    <section className="card side-card">
      <h2 className="section-title">What your coach knows</h2>
      <dl className="coach-facts">
        <div>
          <dt>Your role</dt>
          <dd>{ROLE_META[context.role]?.label}</dd>
        </div>
        <div>
          <dt>Current task</dt>
          <dd>
            {task ? (
              <>
                <a className="text-link" href={taskHref(task.id)}>
                  {task.title}
                </a>
                {task.deadline && <span className="muted small coach-due">{dueLabel(task.deadline)}</span>}
              </>
            ) : (
              <span className="muted">None in progress</span>
            )}
          </dd>
        </div>
        {context.unassignedTasks && (
          <div>
            <dt>Without an owner</dt>
            <dd>{context.unassignedTasks.length ? context.unassignedTasks.map((t) => t.title).join(', ') : 'None'}</dd>
          </div>
        )}
        {context.overdueTasks && (
          <div>
            <dt>Overdue</dt>
            <dd>{context.overdueTasks.length ? context.overdueTasks.map((t) => t.title).join(', ') : 'None'}</dd>
          </div>
        )}
        {context.awaitingReview && (
          <div>
            <dt>Waiting for review</dt>
            <dd>{context.awaitingReview.length ? context.awaitingReview.map((s) => `${s.taskTitle} (${s.author})`).join(', ') : 'None'}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function CoachChat({ membership, focusTaskId }) {
  const data = useData();
  const me = useMe();
  const inputId = useId();
  const listRef = useRef(null);
  const [text, setText] = useState('');
  const project = getProject(data, membership.project_id);
  const roleLabel = ROLE_META[membership.role].label;
  const thread = agentThread(data, { userId: me.id, projectId: project.id, role: membership.role });
  const starters = STARTERS[membership.role] ?? STARTERS.DEFAULT;
  const ask = useAction((content) => askCoach({ userId: me.id, projectId: project.id, role: membership.role, text: content, focusTaskId }));

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [thread.length, ask.pending]);

  async function send(content) {
    const value = content.trim();
    if (!value || ask.pending) return;
    setText('');
    const result = await ask.run(value);
    if (!result.ok) setText(value);
  }

  return (
    <section className="coach-chat" aria-label={`${roleLabel} coach for ${project.title}`}>
      <header className="coach-chat-head">
        <span className="coach-avatar" aria-hidden="true">
          <Icon name="sparkles" size={20} />
        </span>
        <div className="coach-chat-who">
          <p className="coach-chat-title">{roleLabel} coach</p>
          <p className="muted small">{project.title}</p>
        </div>
        {AGENT_MODE === 'mock' && <span className="mock-badge">Demo replies. No AI model is connected.</span>}
      </header>

      <div className="coach-messages" ref={listRef} role="log" aria-live="polite" aria-label="Conversation with your coach">
        {thread.length === 0 && (
          <div className="coach-empty">
            <p className="coach-empty-title">Stuck, or not sure where to start?</p>
            <p className="muted">Your coach asks questions, points you to ideas and reviews your attempts. Pick a starter below or write your own.</p>
          </div>
        )}
        {thread.map((message) => (
          <div key={message.id} className={`bubble-row ${message.sender === 'user' ? 'is-user' : 'is-agent'}`}>
            {message.sender === 'agent' && (
              <span className="coach-avatar coach-avatar-sm" aria-hidden="true">
                <Icon name="sparkles" size={14} />
              </span>
            )}
            <p className="bubble">
              <span className="visually-hidden">{message.sender === 'user' ? 'You: ' : 'Coach: '}</span>
              {message.content}
            </p>
          </div>
        ))}
        {ask.pending && (
          <div className="bubble-row is-agent">
            <span className="coach-avatar coach-avatar-sm" aria-hidden="true">
              <Icon name="sparkles" size={14} />
            </span>
            <p className="bubble typing">
              <span className="visually-hidden">Coach is typing</span>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </p>
          </div>
        )}
      </div>

      <div className="coach-starters" aria-label="Conversation starters">
        {starters.map((starter) => (
          <button key={starter} type="button" className="starter" onClick={() => send(starter)} disabled={ask.pending}>
            {starter}
          </button>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <label htmlFor={inputId} className="visually-hidden">
          Message your coach
        </label>
        <textarea
          id={inputId}
          className="composer-input"
          rows={1}
          maxLength={2000}
          placeholder={`Ask your ${roleLabel.toLowerCase()} coach…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
        />
        <button type="submit" className="btn btn-primary composer-send" disabled={ask.pending || !text.trim()} aria-label="Send">
          <Icon name="send" size={18} />
        </button>
      </form>
    </section>
  );
}
