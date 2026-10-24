import { NotFoundPage } from '../app/NotFoundPage.jsx';
import { Page } from '../app/Page.jsx';
import { evidenceFor } from '../growth/evidence.js';
import { EvidenceCard } from '../growth/EvidenceCard.jsx';
import { firstName, timeAgo } from '../shared/format.js';
import { projectArt } from '../shared/labels.js';
import { profileHeadline } from '../shared/people.js';
import { href, taskHref } from '../shared/router.js';
import { getFile, getProfile, getProject, getTask, getUser, membershipsOf, projectIdsOf, versionNumber, versionsByAuthor } from '../shared/selectors.js';
import { store, useData, useMe } from '../shared/store.js';
import { Avatar } from '../shared/ui/Avatar.jsx';
import { EmptyState, RoleBadge, SampleBadge, UserTypeBadge } from '../shared/ui/bits.jsx';
import { TagSection } from './TagSection.jsx';
import '../workspace/workspace.css';
import './profiles.css';
import { useAuth } from '../auth/AuthProvider.jsx';
import { isSamplePerson } from '../shared/accountPeople.js';
import { AccountProfileEditor } from './AccountProfileEditor.jsx';
import { useAccountDirectory } from '../auth/AccountDirectoryProvider.jsx';

export function ProfilePage({ userId }) {
  const data = useData();
  const me = useMe();
  const auth = useAuth();
  const directory = useAccountDirectory();
  const user = getUser(data, userId ?? auth.profile.id);
  if (!user) return directory.status === 'loading' ? <Page title="Profile"><p role="status">Loading profile…</p></Page> : <NotFoundPage />;

  const isOwner = user.id === auth.profile.id;
  const isMe = isOwner || (isSamplePerson(user) && user.id === me.id);
  const name = isMe ? 'You' : firstName(user.name);
  const profile = getProfile(data, user.id) ?? { skills: [], goals: [], resume: { education: [], experience: [], projects: [] } };
  const evidence = evidenceFor(data, user.id, store.isSeeded);
  const memberships = membershipsOf(data, user.id);
  // Other people only see file history from projects they share with this person.
  const visibleProjects = isMe ? null : projectIdsOf(data, me.id);
  const versions = versionsByAuthor(data, user.id).filter((v) => !visibleProjects || visibleProjects.has(getFile(data, v.file_id)?.project_id));
  const skillPool = [...new Set([...data.projects.flatMap((p) => p.needed_skills), ...data.tasks.flatMap((t) => t.required_skills)])];
  const goalPool = [...new Set(data.projects.flatMap((p) => p.tags))];
  const { education = [], experience = [], projects: pastProjects = [] } = profile.resume ?? {};

  return (
    <Page title={isMe ? 'Your profile' : user.name} documentTitle={user.name}>
      <div className="profile-layout">
        <div className="profile-main">
          <section className="card profile-card">
            <Avatar user={user} size={76} />
            <div className="profile-id">
              <h2 className="profile-name">{user.name}</h2>
              <p className="muted">{profileHeadline(profile, user)}</p>
              <div className="profile-badges">
                <UserTypeBadge type={user.type} />
                {isSamplePerson(user) ? <SampleBadge>Sample person</SampleBadge> : <span className="tag">Registered account</span>}
              </div>
            </div>
            <dl className="profile-stats">
              <div>
                <dt>Projects</dt>
                <dd>{memberships.length}</dd>
              </div>
              <div>
                <dt>Reviewed work</dt>
                <dd>{evidence.length}</dd>
              </div>
              <div>
                <dt>File versions</dt>
                <dd>{versionsByAuthor(data, user.id).length}</dd>
              </div>
            </dl>
          </section>

          {isOwner && (directory.status === 'ready' ? <AccountProfileEditor /> : <p role={directory.error ? 'alert' : 'status'}>{directory.error || 'Loading account details…'}{directory.error && <button className="btn btn-ghost btn-sm" type="button" onClick={directory.reload}>Retry</button>}</p>)}

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Proof of work</h2>
              <span className="section-note">Each card links a real task, the work that was handed in, and a reviewer’s feedback.</span>
            </div>
            {evidence.length ? (
              <div className="evidence-grid">
                {evidence.map((item) => (
                  <EvidenceCard key={item.id} item={item} viewerId={me.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="award"
                title={isMe ? 'No reviewed work yet' : `${name} has no reviewed work yet`}
                action={
                  isMe && (
                    <a className="btn btn-primary" href="#/missions">
                      Find a mission
                    </a>
                  )
                }
              >
                {isMe ? 'When a mentor approves something you submitted, it shows up here with their feedback.' : 'Approved contributions appear here.'}
              </EmptyState>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Contribution history</h2>
              <span className="section-note">Every file version {isMe ? 'you' : name} saved{isMe ? '' : ' in projects you share'}, newest first.</span>
            </div>
            {versions.length ? (
              <ul className="history-list">
                {versions.map((version) => {
                  const file = getFile(data, version.file_id);
                  const project = getProject(data, file?.project_id);
                  const task = version.task_id ? getTask(data, version.task_id) : null;
                  return (
                    <li key={version.id} className="history-item">
                      <span className="history-num">v{versionNumber(data, version)}</span>
                      <div className="history-main">
                        <p className="history-msg">
                          <a className="text-link" href={href(`/projects/${project?.id}`, { tab: 'files', file: file?.id })}>
                            {file?.name}
                          </a>
                          <span className="muted">: {version.message}</span>
                        </p>
                        <p className="history-meta">
                          {project?.title}, {timeAgo(version.created_at)}
                          {task && (
                            <>
                              , for{' '}
                              <a className="text-link" href={taskHref(task.id)}>
                                {task.title}
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">No file versions yet.</p>
            )}
          </section>
        </div>

        <aside className="profile-side">
          <TagSection
            key={`skills-${user.id}`}
            title="Skills"
            field="skills"
            values={profile.skills}
            userId={user.id}
            editable={isMe}
            hint={isMe ? 'Missions and projects that need these are matched to you first.' : undefined}
            suggestions={skillPool}
          />
          <TagSection
            key={`goals-${user.id}`}
            title="Goals"
            field="goals"
            values={profile.goals}
            userId={user.id}
            editable={isMe}
            hint={isMe ? 'Matched against project tags.' : undefined}
            suggestions={goalPool}
          />

          <section className="card side-card">
            <h2 className="section-title">Projects</h2>
            {memberships.length ? (
              <ul className="profile-projects">
                {memberships.map((m) => {
                  const project = getProject(data, m.project_id);
                  const art = projectArt(project);
                  return (
                    <li key={m.project_id}>
                      <span className="project-emoji" style={{ background: art.bg }} aria-hidden="true">
                        {art.emoji}
                      </span>
                      <a className="profile-project-link" href={href(`/projects/${m.project_id}`)}>
                        {project?.title}
                      </a>
                      <RoleBadge role={m.role} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Not on a project yet.</p>
            )}
          </section>

          <section className="card side-card">
            <h2 className="section-title">Résumé</h2>
            {education.length + experience.length + pastProjects.length === 0 && <p className="muted">Nothing added yet.</p>}
            {education.length > 0 && (
              <div className="resume-block">
                <h3 className="resume-heading">Education</h3>
                {education.map((e) => (
                  <p key={e.degree}>
                    <strong>{e.degree}</strong>
                    <span className="muted small resume-sub">
                      {e.school}, {e.years}
                    </span>
                  </p>
                ))}
              </div>
            )}
            {experience.length > 0 && (
              <div className="resume-block">
                <h3 className="resume-heading">Experience</h3>
                {experience.map((e) => (
                  <p key={e.title}>
                    <strong>{e.title}</strong>
                    <span className="muted small resume-sub">
                      {e.org}, {e.years}
                    </span>
                  </p>
                ))}
              </div>
            )}
            {pastProjects.length > 0 && (
              <div className="resume-block">
                <h3 className="resume-heading">Projects</h3>
                {pastProjects.map((p) => (
                  <p key={p.name}>
                    <strong>{p.name}</strong>
                    <span className="muted small resume-sub">{p.summary}</span>
                  </p>
                ))}
              </div>
            )}
            <p className="muted small">Stored as structured fields. Résumé upload and parsing are not part of the demo.</p>
          </section>
        </aside>
      </div>
    </Page>
  );
}
