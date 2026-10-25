import { useEffect, useRef, useState } from 'react';
import { Page } from '../app/Page.jsx';
import { DOER_ROLES, USER_TYPES } from '../shared/contracts.js';
import { ROLE_META, USER_TYPE_META } from '../shared/labels.js';
import { updateQuery, useRoute } from '../shared/router.js';
import { useData, useMe } from '../shared/store.js';
import { EmptyState } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { SelectFilter } from '../shared/ui/SelectFilter.jsx';
import '../missions/missions.css';
import { ProjectCard, ProjectRow } from './ProjectCard.jsx';
import { projectCollections, readProjectPreference, saveProjectPreference } from './explorer.js';

const TAB_KEY = 'bridge-builder:projects-tab';
const VIEW_KEY = 'bridge-builder:projects-view';
const TABS = ['discover', 'mine'];
const VIEWS = ['grid', 'list'];

function projectStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ProjectsPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const [tab, setTab] = useState(() => readProjectPreference(projectStorage(), TAB_KEY, TABS, 'discover'));
  const [view, setView] = useState(() => readProjectPreference(projectStorage(), VIEW_KEY, VIEWS, 'grid'));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const tabButtons = useRef({});
  const text = query.get('q') ?? '';
  const skill = query.get('skill');
  const role = query.get('role');
  const poster = query.get('poster');
  const filtered = Boolean(text || skill || role || poster);
  const filterCount = [text, skill, role, poster].filter(Boolean).length;
  const collections = projectCollections(data, me.id, { text, skill, role, poster });
  const results = collections[tab];
  const skills = [...new Set(data.projects.flatMap((p) => p.needed_skills))].sort();
  const clearAll = () => updateQuery({ q: null, skill: null, role: null, poster: null });

  useEffect(() => saveProjectPreference(projectStorage(), TAB_KEY, tab), [tab]);
  useEffect(() => saveProjectPreference(projectStorage(), VIEW_KEY, view), [view]);

  function handleTabKeyDown(event) {
    const next = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!next && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (TABS.indexOf(tab) + next + TABS.length) % TABS.length;
    setTab(TABS[index]);
    tabButtons.current[TABS[index]]?.focus();
  }

  return (
    <Page title="Projects" subtitle="Cross-disciplinary projects posted by Ohio State students, faculty and Columbus industry partners.">
      <section className="projects-explorer" aria-label="Project explorer">
        <div className="projects-tabs" role="tablist" aria-label="Project collection">
          {TABS.map((value) => (
            <button
              key={value}
              id={`projects-tab-${value}`}
              ref={(element) => { tabButtons.current[value] = element; }}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls="projects-panel"
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={handleTabKeyDown}
            >
              {value === 'discover' ? 'Discover' : 'My Projects'}
              <span className="projects-tab-count">{collections.counts[value]}</span>
            </button>
          ))}
        </div>

        <div className="projects-toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <span className="visually-hidden">Search projects</span>
            <input type="search" placeholder="Search projects" value={text} onChange={(e) => updateQuery({ q: e.target.value })} />
          </label>
          <div className="projects-toolbar-actions">
            <button
              type="button"
              className={`projects-filter-button${filtersOpen ? ' is-open' : ''}`}
              aria-expanded={filtersOpen}
              aria-controls="projects-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Icon name="filter" size={16} /> Filters
              {filterCount > 0 && <span className="projects-filter-count">{filterCount}</span>}
            </button>
            <div className="segmented projects-view-switch" role="group" aria-label="Project layout">
              {VIEWS.map((value) => (
                <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>
                  <Icon name={value === 'grid' ? 'board' : 'table'} size={16} /> {value === 'grid' ? 'Grid' : 'List'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="projects-filters" id="projects-filters" hidden={!filtersOpen}>
          <div className="projects-poster-filter">
            <span className="projects-filter-label">Posted by</span>
            <div className="segmented" role="group" aria-label="Posted by">
              {[null, ...USER_TYPES].map((type) => (
                <button key={type ?? 'any'} type="button" aria-pressed={poster === type} onClick={() => updateQuery({ poster: type })}>
                  {type ? USER_TYPE_META[type].label : 'Anyone'}
                </button>
              ))}
            </div>
          </div>
          <SelectFilter label="Skill" value={skill} onChange={(value) => updateQuery({ skill: value })} options={skills.map((value) => [value, value])} />
          <SelectFilter label="Role needed" value={role} onChange={(value) => updateQuery({ role: value })} options={DOER_ROLES.map((value) => [value, ROLE_META[value].tag])} />
          {filtered && <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>Clear all</button>}
        </div>

        {filtered && (
          <div className="projects-active-filters" aria-label="Active filters">
            {poster && <button type="button" onClick={() => updateQuery({ poster: null })}>{USER_TYPE_META[poster]?.label ?? poster} <span aria-hidden="true">×</span><span className="visually-hidden">Remove poster filter</span></button>}
            {skill && <button type="button" onClick={() => updateQuery({ skill: null })}>{skill} <span aria-hidden="true">×</span><span className="visually-hidden">Remove skill filter</span></button>}
            {role && <button type="button" onClick={() => updateQuery({ role: null })}>{ROLE_META[role]?.tag ?? role} <span aria-hidden="true">×</span><span className="visually-hidden">Remove role filter</span></button>}
            <button type="button" className="projects-clear-filters" onClick={clearAll}>Clear all</button>
          </div>
        )}

        <div className="projects-result-heading" aria-live="polite">
          <span>{results.length} project{results.length === 1 ? '' : 's'}{filtered ? ' match' : ''}</span>
          {tab === 'discover' && <span>Best match first · Ranked by your skills and goals using simple rules. No AI.</span>}
        </div>

        <div id="projects-panel" role="tabpanel" aria-labelledby={`projects-tab-${tab}`} tabIndex={0}>
          {results.length ? (
            view === 'grid' ? (
              <div className="project-grid">
                {results.map(({ project, reasons }) => <ProjectCard key={project.id} project={project} reasons={reasons} mode={tab} />)}
              </div>
            ) : (
              <div className="project-list" aria-label={tab === 'mine' ? 'My projects' : 'Discover projects'}>
                <div className="project-list-header" aria-hidden="true">
                  <span>Project</span><span>Posted by</span><span>Roles needed</span><span>Open missions</span><span>{tab === 'mine' ? 'Your role · team' : 'Why it fits'}</span><span />
                </div>
                {results.map(({ project, reasons }) => <ProjectRow key={project.id} project={project} reasons={reasons} mode={tab} />)}
              </div>
            )
          ) : (
            <EmptyState
              icon="folder"
              title={filtered ? 'No projects match these filters' : tab === 'mine' ? 'You haven’t joined a project yet' : 'No projects to discover'}
              action={filtered
                ? <button type="button" className="btn btn-soft" onClick={clearAll}>Clear filters</button>
                : tab === 'mine' && <button type="button" className="btn btn-soft" onClick={() => setTab('discover')}>Discover projects</button>}
            >
              {filtered ? 'Try a different search, skill, role, or poster type.' : tab === 'mine' ? 'Find a project and join its team to see it here.' : 'New projects will appear here when a team posts one.'}
            </EmptyState>
          )}
        </div>
      </section>
    </Page>
  );
}
