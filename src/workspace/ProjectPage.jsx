import { useState } from 'react';
import { NotFoundPage } from '../app/NotFoundPage.jsx';
import { Page } from '../app/Page.jsx';
import { scoreMission, scoreProject } from '../discovery/score.js';
import { DOER_ROLES } from '../shared/contracts.js';
import { ROLE_META, projectArt } from '../shared/labels.js';
import { profileHeadline } from '../shared/people.js';
import { href, updateQuery, useRoute } from '../shared/router.js';
import { getProfile, getProject, getUser, isOpenMission, membersOf, membershipOf, tasksInProject } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { useAction } from '../shared/useAction.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { EmptyState, RoleBadge, Spinner, Tag, UserTypeBadge } from '../shared/ui/bits.jsx';
import { Modal } from '../shared/ui/Dialog.jsx';
import { Field, FormError } from '../shared/ui/Field.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { MissionCard } from '../missions/MissionCard.jsx';
import { TeamNotesList } from '../agents/TeamContext.jsx';
import { ProjectChannels } from './channels/ChannelsLayout.jsx';
import { AddTaskModal } from './tasks/AddTaskModal.jsx';
import { TaskBoard } from './tasks/TaskBoard.jsx';
import { FilesPanel } from './versions/FilesPanel.jsx';
import { TeamPanel } from './TeamPanel.jsx';
import '../discovery/discovery.css';
import './tasks/tasks.css';
import './workspace.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'board', label: 'Board', icon: 'board', membersOnly: true },
  { id: 'files', label: 'Files', icon: 'file', membersOnly: true },
  { id: 'channels', label: 'Channels', icon: 'hash', membersOnly: true },
  { id: 'team', label: 'Team', icon: 'users' },
];

export function ProjectPage({ projectId }) {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const [joining, setJoining] = useState(false);
  const [adding, setAdding] = useState(false);
  const project = getProject(data, projectId);
  if (!project) return <NotFoundPage />;

  const tab = TABS.find((t) => t.id === query.get('tab')) ?? TABS[0];
  const membership = membershipOf(data, me.id, project.id);
  const owner = getUser(data, project.owner_id);
  const art = projectArt(project);
  const locked = tab.membersOnly && !membership;

  let content;
  if (locked) {
    content = (
      <EmptyState
        icon="lock"
        title={`The ${tab.label.toLowerCase()} are for team members`}
        action={
          <button type="button" className="btn btn-primary" onClick={() => setJoining(true)}>
            Join this project
          </button>
        }
      >
        Join {project.title} to see its {tab.label.toLowerCase()}, or claim one of its open missions, which adds you to the team.
      </EmptyState>
    );
  } else if (tab.id === 'board') {
    content = <TaskBoard tasks={tasksInProject(data, project.id)} onAdd={membership?.role === 'LEADER' ? () => setAdding(true) : null} />;
  } else if (tab.id === 'files') {
    content = <FilesPanel project={project} />;
  } else if (tab.id === 'channels') {
    content = <ProjectChannels project={project} />;
  } else if (tab.id === 'team') {
    content = <TeamPanel project={project} />;
  } else {
    content = <ProjectOverview project={project} membership={membership} />;
  }

  return (
    <Page
      title={project.title}
      headerClassName="project-page-header"
      actions={
        membership ? (
          <span className="you-are">
            You’re the <RoleBadge role={membership.role} />
          </span>
        ) : (
          <button type="button" className="btn btn-outline btn-lg" onClick={() => setJoining(true)}>
            <Icon name="plus" size={18} strokeWidth={2.2} />
            <span className="btn-label">Join project</span>
          </button>
        )
      }
    >
      <div className={`project-hero ${tab.id !== 'overview' ? 'is-compact' : ''}`}>
        <div className="project-hero-art" style={{ background: art.bg }} aria-hidden="true">
          {art.emoji}
        </div>
        <div className="project-hero-text">
          <div className="project-top">
            <UserTypeBadge type={owner?.type} />
            {membership && <span className="project-hero-role"><RoleBadge role={membership.role} /></span>}
            <span className="muted small">{project.tags.join(', ')}</span>
          </div>
          <p className="project-hero-desc">{project.description}</p>
          <div className="person">
            <Avatar user={owner} size={28} />
            <span className="small">
              <a className="text-link" href={`#/people/${owner?.id}`}>
                {owner?.name}
              </a>
              <span className="muted">, {profileHeadline(getProfile(data, owner?.id), owner)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="view-bar">
        <div className="view-tabs" role="group" aria-label="Project sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`view-tab ${t.id === tab.id ? 'is-active' : ''}`}
              aria-pressed={t.id === tab.id}
              onClick={() => updateQuery({ tab: t.id === 'overview' ? null : t.id, file: null, channel: null })}
            >
              <Icon name={t.icon} size={18} />
              {t.label}
              {t.membersOnly && !membership && <Icon name="lock" size={14} label="members only" />}
            </button>
          ))}
        </div>
      </div>

      {content}
      {joining && <JoinProjectModal project={project} onClose={() => setJoining(false)} />}
      {adding && <AddTaskModal projectId={project.id} onClose={() => setAdding(false)} />}
    </Page>
  );
}

function ProjectOverview({ project, membership }) {
  const data = useData();
  const me = useMe();
  const profile = getProfile(data, me.id);
  const mySkills = new Set((profile?.skills ?? []).map((s) => s.toLowerCase()));
  const missions = tasksInProject(data, project.id).filter(isOpenMission);
  const fit = scoreProject(profile, project);
  const team = membersOf(data, project.id);

  return (
    <div className="overview-grid">
      <div className="overview-main">
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Open missions</h2>
            <span className="section-note">Short tasks anyone can claim. Claiming one adds you to the team.</span>
          </div>
          {missions.length ? (
            <div className="mission-grid">
              {missions.map((task) => (
                <MissionCard key={task.id} task={task} project={project} reasons={me.type === 'student' ? scoreMission(profile, task, project).reasons : []} />
              ))}
            </div>
          ) : (
            <EmptyState icon="target" title="No open missions right now">
              The team posts new missions as the project moves.
            </EmptyState>
          )}
        </section>
      </div>
      <aside className="overview-side">
        {!membership && fit.reasons.length > 0 && (
          <section className="why-box">
            <p className="why-title">Why it fits you</p>
            <ul>
              {fit.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="why-note">Rules-based match on your profile, not AI.</p>
          </section>
        )}
        <section className="card side-card">
          <h2 className="section-title">Roles needed</h2>
          <div className="tags">
            {project.needed_roles.map((role) => (
              <span key={role} className="tag" style={{ background: ROLE_META[role].soft, color: ROLE_META[role].color }}>
                {ROLE_META[role].tag}
              </span>
            ))}
          </div>
          <h2 className="section-title">Skills needed</h2>
          <div className="tags">
            {project.needed_skills.map((skill) => (
              <Tag key={skill} active={mySkills.has(skill.toLowerCase())}>
                {mySkills.has(skill.toLowerCase()) && <Icon name="check" size={13} strokeWidth={2.4} />}
                {skill}
              </Tag>
            ))}
          </div>
        </section>
        <section className="card side-card">
          <div className="section-head">
            <h2 className="section-title">Team</h2>
            <button type="button" className="text-link" onClick={() => updateQuery({ tab: 'team' })}>
              See all
            </button>
          </div>
          <ul className="mini-team">
            {team.map((m) => {
              const person = getUser(data, m.user_id);
              return (
                <li key={m.user_id}>
                  <Avatar user={person} size={30} />
                  <span className="mini-team-name">{person?.name}</span>
                  <span className="mini-team-role" style={{ color: ROLE_META[m.role].color }}>
                    {ROLE_META[m.role].label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        {membership && (
          <section className="card side-card">
            <div className="section-head">
              <h2 className="section-title">What the coaches know</h2>
              <a className="text-link" href={href('/coach', { project: project.id })}>
                Your coach
              </a>
            </div>
            <TeamNotesList projectId={project.id} allowRemove={false} />
          </section>
        )}
      </aside>
    </div>
  );
}

function JoinProjectModal({ project, onClose }) {
  const me = useMe();
  const roles = me.type === 'student' ? DOER_ROLES : [...DOER_ROLES, 'MENTOR'];
  const suggested = project.needed_roles.filter((r) => roles.includes(r));
  const [role, setRole] = useState(suggested[0] ?? roles[0]);
  const join = useAction(() => store.joinProject({ userId: me.id, projectId: project.id, role }), {
    success: `You joined ${project.title} as ${ROLE_META[role].label}`,
    toastErrors: false,
  });

  async function onSubmit(event) {
    event.preventDefault();
    const result = await join.run();
    if (result.ok) onClose();
  }

  return (
    <Modal
      title={`Join ${project.title}`}
      description="Roles are fixed: pick the one you’ll play. Your coach and your evidence cards follow this role."
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="join-form" className="btn btn-primary" disabled={join.pending}>
            {join.pending ? (
              <>
                <Spinner />
                Joining…
              </>
            ) : (
              `Join as ${ROLE_META[role].label}`
            )}
          </button>
        </>
      }
    >
      <form id="join-form" className="form" onSubmit={onSubmit}>
        <Field label="Your role" hint={suggested.length ? `This project is looking for: ${suggested.map((r) => ROLE_META[r].label).join(', ')}.` : undefined}>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
                {project.needed_roles.includes(r) ? ' (needed)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <FormError>{join.error}</FormError>
      </form>
    </Modal>
  );
}
