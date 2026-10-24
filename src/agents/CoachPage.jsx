import { useEffect, useId, useRef, useState } from 'react';
import { Page } from '../app/Page.jsx';
import { dueLabel, firstName } from '../shared/format.js';
import { ROLE_META, projectArt } from '../shared/labels.js';
import { href, taskHref, useRoute } from '../shared/router.js';
import { agentThread, getProject, getUser, membersOf, membershipsOf, teamNoteOf } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { AvatarStack } from '../shared/ui/Avatar.jsx';
import { EmptyState } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { askCoach } from './coach.js';
import { buildAgentContext } from './context.js';
import { AGENT_MODE } from './llm.js';
import { coachState } from './mockCoach.js';
import { coachProfile } from './persona.js';
import { getSystemPrompt } from './prompts/index.js';
import { TeamContext } from './TeamContext.jsx';
import '../workspace/channels/channels.css';
import './agents.css';

const LADDER = [
  { text: 'Asks a question to get you thinking' },
  { text: 'Points you to the idea or resource you need' },
  { text: 'Gives a hint or a partial example', unlock: 'hintsUnlocked', lockText: 'Unlocks after your first attempt' },
  { text: 'Reviews your attempt with specific feedback' },
  { text: 'Walks through a similar problem, never your actual task', unlock: 'exampleUnlocked', lockText: 'Unlocks after two attempts' },
];

// Starters with `prefill` put words in the box and wait for the person to finish the thought.
const STARTERS = {
  LEADER: [
    { label: 'What should I focus on this week?' },
    { label: 'Here’s my plan…', prefill: 'Here’s my plan for this week: ' },
    { label: 'Who should own the open tasks?' },
    { label: 'Just assign the tasks for me' },
  ],
  MENTOR: [
    { label: 'Who is waiting on feedback?' },
    { label: 'Here’s my feedback draft…', prefill: 'Here’s my feedback draft: ' },
    { label: 'What makes feedback useful?' },
    { label: 'Just write the feedback for me' },
  ],
  DEFAULT: [
    { label: 'Here’s my attempt…', prefill: 'Here’s my attempt: ' },
    { label: 'I’m stuck on…', prefill: 'I’m stuck on ' },
    { label: 'What should I focus on?' },
    { label: 'Who on my team can help?' },
    { label: 'Explain the key idea' },
    { label: 'Show me a similar example' },
    { label: 'Just do it for me' },
  ],
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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
          Everyone on a project gets a coach for their role. It asks questions and gives hints once you’ve tried. It won’t do the work for you.
        </EmptyState>
      </Page>
    );
  }

  const active = memberships.find((m) => m.project_id === query.get('project')) ?? memberships[0];
  const focusTaskId = active.project_id === query.get('project') ? query.get('task') : null;

  return (
    <Page title="Coach" subtitle="Everyone on a team gets a coach for their role. The coaches share the team’s context, and they make you do the thinking.">
      <div className="coach-layout">
        <CoachChat key={`${active.project_id}-${active.role}`} membership={active} focusTaskId={focusTaskId} />
        <aside className="coach-rail" aria-label="Coach details">
          <CoachSwitcher memberships={memberships} activeProjectId={active.project_id} />
          <TeamContext projectId={active.project_id} />
          <HowItWorks membership={active} />
        </aside>
      </div>
    </Page>
  );
}

function CoachSwitcher({ memberships, activeProjectId }) {
  const data = useData();
  return (
    <section className="card side-card">
      <h2 className="section-title">Your coaches</h2>
      <ul className="coach-list">
        {memberships.map((m) => {
          const project = getProject(data, m.project_id);
          const art = projectArt(project);
          const isActive = m.project_id === activeProjectId;
          return (
            <li key={m.project_id}>
              <a className={`coach-link ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined} href={href('/coach', { project: m.project_id })}>
                <span className="project-emoji" style={{ background: art.bg }} aria-hidden="true">
                  {art.emoji}
                </span>
                <span className="coach-link-text">
                  <span className="coach-link-title">{coachProfile(m.role, project).title}</span>
                  <span className="coach-link-role">{project?.title}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HowItWorks({ membership }) {
  const data = useData();
  const me = useMe();
  const state = coachState(agentThread(data, { userId: me.id, projectId: membership.project_id, role: membership.role }));
  return (
    <section className="card side-card">
      <h2 className="section-title">How your coach works</h2>
      <p className="muted small">It climbs only as far as you need, and it waits for your own thinking before it gives hints.</p>
      <ol className="ladder">
        {LADDER.map((step, i) => {
          const locked = step.unlock && !state[step.unlock];
          return (
            <li key={step.text} className={locked ? 'is-locked' : ''}>
              <span className="ladder-num" aria-hidden="true">
                {locked ? <Icon name="lock" size={11} strokeWidth={2.4} /> : i + 1}
              </span>
              <span>
                {step.text}
                {locked && <span className="ladder-lock">{step.lockText}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="ladder-progress">{state.attempts ? `You’ve shared ${plural(state.attempts, 'attempt')} in this chat.` : 'Share an attempt to unlock hints.'}</p>
      <details className="coach-rules">
        <summary>Read the coach’s rules</summary>
        <pre>{getSystemPrompt(membership.role)}</pre>
      </details>
    </section>
  );
}

// Paragraphs as written by the coach, with the closing "Your turn" line made to stand out.
function BubbleText({ content }) {
  return content.split('\n\n').map((paragraph, i) =>
    paragraph.startsWith('Your turn: ') ? (
      <p key={i} className="bubble-turn">
        <strong>Your turn:</strong> {paragraph.slice('Your turn: '.length)}
      </p>
    ) : (
      <p key={i}>{paragraph}</p>
    ),
  );
}

function FocusStrip({ membership, context }) {
  const task = context.currentTask;
  if (task) {
    return (
      <p className="coach-focus">
        <Icon name="target" size={16} />
        <span>
          Working on{' '}
          <a className="text-link" href={taskHref(task.id)}>
            {task.title}
          </a>
          {task.deadline && task.status !== 'done' && <span className="muted">, {dueLabel(task.deadline).toLowerCase()}</span>}
        </span>
      </p>
    );
  }
  if (membership.role === 'LEADER') {
    return (
      <p className="coach-focus">
        <Icon name="board" size={16} />
        <span>
          Watching {plural(context.unassignedTasks?.length ?? 0, 'task')} without an owner, {context.overdueTasks?.length ?? 0} overdue and{' '}
          {context.awaitingReview?.length ?? 0} waiting for review
        </span>
      </p>
    );
  }
  if (membership.role === 'MENTOR') {
    return (
      <p className="coach-focus">
        <Icon name="inbox" size={16} />
        <span>{plural(context.awaitingReview?.length ?? 0, 'submission')} waiting for review on this project</span>
      </p>
    );
  }
  return (
    <p className="coach-focus muted">
      <Icon name="target" size={16} />
      No task in progress on this project yet.
    </p>
  );
}

function CoachChat({ membership, focusTaskId }) {
  const data = useData();
  const me = useMe();
  const inputId = useId();
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const project = getProject(data, membership.project_id);
  const profile = coachProfile(membership.role, project);
  const thread = agentThread(data, { userId: me.id, projectId: project.id, role: membership.role });
  const myNote = teamNoteOf(data, me.id, project.id);
  const context = buildAgentContext(data, { userId: me.id, projectId: project.id, focusTaskId });
  const teammates = membersOf(data, project.id)
    .filter((m) => m.user_id !== me.id)
    .map((m) => getUser(data, m.user_id))
    .filter(Boolean);
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

  function prefill(value) {
    setText(value);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      input?.focus();
      input?.setSelectionRange(value.length, value.length);
    });
  }

  return (
    <section className="coach-chat" aria-label={`${profile.title} for ${firstName(me.name)} on ${project.title}`}>
      <header className="coach-chat-head">
        <span className="coach-avatar" style={{ background: ROLE_META[membership.role].color }} aria-hidden="true">
          <Icon name="sparkles" size={20} />
        </span>
        <div className="coach-chat-who">
          <p className="coach-chat-title">{profile.title}</p>
          <p className="muted small">
            {firstName(me.name)}’s coach on {project.title}
          </p>
        </div>
        {teammates.length > 0 && (
          <div className="coach-links" title="These teammates’ coaches share this project’s context">
            <AvatarStack users={teammates} size={26} max={4} />
            <span className="muted small">
              Connected to {teammates.length === 1 ? '1 teammate’s coach' : `${teammates.length} teammates’ coaches`}
            </span>
          </div>
        )}
        {AGENT_MODE === 'mock' && <span className="mock-badge">Demo replies, no AI model</span>}
      </header>
      <FocusStrip membership={membership} context={context} />

      <div className="coach-messages" ref={listRef} role="log" aria-live="polite" aria-label="Conversation with your coach">
        {thread.length === 0 && (
          <div className="coach-empty">
            <p className="coach-empty-title">Think out loud</p>
            <p className="muted">
              Share your attempt, your plan, or exactly where you’re stuck. Your coach knows what your teammates are working on and will point you to them, but it
              won’t do the work for you.
            </p>
          </div>
        )}
        {thread.map((message) => (
          <div key={message.id} className="bubble-group">
            <div className={`bubble-row ${message.sender === 'user' ? 'is-user' : 'is-agent'}`}>
              {message.sender === 'agent' && (
                <span className="coach-avatar coach-avatar-sm" style={{ background: ROLE_META[membership.role].color }} aria-hidden="true">
                  <Icon name="sparkles" size={14} />
                </span>
              )}
              <div className="bubble">
                <span className="visually-hidden">{message.sender === 'user' ? 'You: ' : 'Coach: '}</span>
                <BubbleText content={message.content} />
              </div>
            </div>
            {message.sender === 'agent' && myNote?.agent_message_id === message.id && (
              <p className="note-shared">
                <Icon name="users" size={14} />
                <span>
                  <span className="note-shared-label">Shared with your team:</span> {myNote.content}
                </span>
              </p>
            )}
          </div>
        ))}
        {ask.pending && (
          <div className="bubble-row is-agent">
            <span className="coach-avatar coach-avatar-sm" style={{ background: ROLE_META[membership.role].color }} aria-hidden="true">
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
          <button
            key={starter.label}
            type="button"
            className={`starter ${starter.prefill ? 'is-prefill' : ''}`}
            onClick={() => (starter.prefill ? prefill(starter.prefill) : send(starter.label))}
            disabled={ask.pending}
          >
            {starter.label}
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
          ref={inputRef}
          className="composer-input"
          rows={1}
          maxLength={2000}
          placeholder="Think out loud: your attempt, your plan, or where you’re stuck…"
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
