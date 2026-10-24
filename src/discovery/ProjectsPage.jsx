import { Page } from '../app/Page.jsx';
import { DOER_ROLES, USER_TYPES } from '../shared/contracts.js';
import { ROLE_META, USER_TYPE_META } from '../shared/labels.js';
import { updateQuery, useRoute } from '../shared/router.js';
import { getProject, membershipsOf } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { EmptyState } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { SelectFilter } from '../shared/ui/SelectFilter.jsx';
import '../missions/missions.css';
import { ProjectCard } from './ProjectCard.jsx';
import { rankProjects } from './score.js';

export function ProjectsPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const text = query.get('q') ?? '';
  const skill = query.get('skill');
  const role = query.get('role');
  const poster = query.get('poster');
  const filtered = Boolean(text || skill || role || poster);

  const mine = membershipsOf(data, me.id)
    .map((m) => getProject(data, m.project_id))
    .filter(Boolean);
  const mineIds = new Set(mine.map((p) => p.id));
  const ranked = rankProjects(data, me.id, { text, skill, role, poster }).filter(({ project }) => filtered || !mineIds.has(project.id));
  const skills = [...new Set(data.projects.flatMap((p) => p.needed_skills))].sort();
  const clearAll = () => updateQuery({ q: null, skill: null, role: null, poster: null });

  return (
    <Page title="Projects" subtitle="Cross-disciplinary projects posted by Ohio State students, faculty and Columbus industry partners.">
      {mine.length > 0 && !filtered && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Your projects</h2>
          </div>
          <div className="project-grid">
            {mine.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{filtered ? 'Matching projects' : 'Discover projects'}</h2>
          <span className="section-note">Best match first, ranked by simple rules on your skills and goals. No AI.</span>
        </div>
        <div className="filter-bar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <span className="visually-hidden">Search projects</span>
            <input type="search" placeholder="Search projects" value={text} onChange={(e) => updateQuery({ q: e.target.value })} />
          </label>
          <div className="segmented" role="group" aria-label="Posted by">
            {[null, ...USER_TYPES].map((type) => (
              <button key={type ?? 'any'} type="button" aria-pressed={poster === type} onClick={() => updateQuery({ poster: type })}>
                {type ? USER_TYPE_META[type].label : 'Anyone'}
              </button>
            ))}
          </div>
          <SelectFilter label="Skill" value={skill} onChange={(v) => updateQuery({ skill: v })} options={skills.map((s) => [s, s])} />
          <SelectFilter label="Role needed" value={role} onChange={(v) => updateQuery({ role: v })} options={DOER_ROLES.map((r) => [r, ROLE_META[r].tag])} />
          {filtered && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
              Clear filters
            </button>
          )}
        </div>
        {ranked.length ? (
          <div className="project-grid">
            {ranked.map(({ project, reasons }) => (
              <ProjectCard key={project.id} project={project} reasons={reasons} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="folder"
            title={filtered ? 'No projects match these filters' : 'You’re on every project'}
            action={
              filtered && (
                <button type="button" className="btn btn-soft" onClick={clearAll}>
                  Clear filters
                </button>
              )
            }
          >
            {filtered ? 'Try a different skill or role.' : 'New projects show up here when someone posts one.'}
          </EmptyState>
        )}
      </section>
    </Page>
  );
}
