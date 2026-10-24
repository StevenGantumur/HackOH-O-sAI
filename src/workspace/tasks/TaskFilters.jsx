import { DOER_ROLES } from '../../shared/contracts.js';
import { ROLE_META } from '../../shared/labels.js';
import { updateQuery } from '../../shared/router.js';
import { Icon } from '../../shared/ui/Icon.jsx';
import { Popover } from '../../shared/ui/Popover.jsx';
import { SORTS, activeFilterCount } from './taskQuery.js';

const toggle = (values, value) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

export const clearFilters = () => updateQuery({ label: null, project: null, mine: null, missions: null });

export function FilterMenu({ filters, projects }) {
  const count = activeFilterCount(filters);
  return (
    <Popover
      align="end"
      label="Filter tasks"
      panelClassName="filter-panel"
      trigger={(props) => (
        <button {...props} className="tool-btn">
          <Icon name="filter" size={18} />
          Filter
          {count > 0 && (
            <span className="tool-count">
              {count}
              <span className="visually-hidden"> active</span>
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="filter-body">
          <fieldset className="filter-group">
            <legend>Label</legend>
            {DOER_ROLES.map((role) => (
              <label key={role} className="check">
                <input type="checkbox" checked={filters.labels.includes(role)} onChange={() => updateQuery({ label: toggle(filters.labels, role) })} />
                <span className="label-dot" style={{ background: ROLE_META[role].dot }} aria-hidden="true" />
                {ROLE_META[role].tag}
              </label>
            ))}
          </fieldset>
          {projects.length > 1 && (
            <fieldset className="filter-group">
              <legend>Project</legend>
              {projects.map((project) => (
                <label key={project.id} className="check">
                  <input
                    type="checkbox"
                    checked={filters.projects.includes(project.id)}
                    onChange={() => updateQuery({ project: toggle(filters.projects, project.id) })}
                  />
                  {project.title}
                </label>
              ))}
            </fieldset>
          )}
          <fieldset className="filter-group">
            <legend>Show only</legend>
            <label className="check">
              <input type="checkbox" checked={filters.mine} onChange={() => updateQuery({ mine: filters.mine ? null : '1' })} />
              Tasks assigned to me
            </label>
            <label className="check">
              <input type="checkbox" checked={filters.missions} onChange={() => updateQuery({ missions: filters.missions ? null : '1' })} />
              Bridge Missions
            </label>
          </fieldset>
          <div className="filter-foot">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters} disabled={!count}>
              Clear all
            </button>
            <button type="button" className="btn btn-soft btn-sm" onClick={close}>
              Done
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

export function SortMenu({ sort }) {
  return (
    <Popover
      align="end"
      label="Sort tasks"
      panelClassName="sort-panel"
      trigger={(props) => (
        <button {...props} className="tool-btn">
          <Icon name="sort" size={18} />
          Sort
        </button>
      )}
    >
      {(close) => (
        <fieldset className="filter-group">
          <legend>Sort by</legend>
          {SORTS.map((option) => (
            <label key={option.id} className="check">
              <input
                type="radio"
                name="task-sort"
                checked={sort === option.id}
                onChange={() => {
                  updateQuery({ sort: option.id === 'deadline' ? null : option.id });
                  close();
                }}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      )}
    </Popover>
  );
}

export function ActiveFilters({ filters, projects }) {
  const chips = [
    ...filters.labels.map((role) => ({ key: `l-${role}`, text: ROLE_META[role]?.tag, remove: () => updateQuery({ label: toggle(filters.labels, role) }) })),
    ...filters.projects.map((id) => ({
      key: `p-${id}`,
      text: projects.find((p) => p.id === id)?.title ?? 'Project',
      remove: () => updateQuery({ project: toggle(filters.projects, id) }),
    })),
    ...(filters.mine ? [{ key: 'mine', text: 'Assigned to me', remove: () => updateQuery({ mine: null }) }] : []),
    ...(filters.missions ? [{ key: 'missions', text: 'Bridge Missions', remove: () => updateQuery({ missions: null }) }] : []),
  ];
  if (!chips.length) return null;
  return (
    <div className="active-filters" aria-label="Active filters">
      {chips.map((chip) => (
        <button key={chip.key} type="button" className="filter-chip" onClick={chip.remove} aria-label={`Remove filter: ${chip.text}`}>
          {chip.text}
          <Icon name="x" size={14} strokeWidth={2.2} />
        </button>
      ))}
      <button type="button" className="text-link" onClick={clearFilters}>
        Clear all
      </button>
    </div>
  );
}
