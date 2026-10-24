import { Page } from '../app/Page.jsx';
import { rankMissions } from '../discovery/score.js';
import { DIFFICULTIES, DOER_ROLES } from '../shared/contracts.js';
import { formatMinutes } from '../shared/format.js';
import { DIFFICULTY_META, ROLE_META } from '../shared/labels.js';
import { updateQuery, useRoute } from '../shared/router.js';
import { getProfile, openMissions } from '../shared/selectors.js';
import { useData, useMe } from '../shared/store.js';
import { EmptyState } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { SelectFilter } from '../shared/ui/SelectFilter.jsx';
import { MissionCard } from './MissionCard.jsx';

const TIMES = [null, 15, 30, 45, 60, 120];

export function MissionsPage() {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const minutes = Number(query.get('time')) || null;
  const role = query.get('role');
  const difficulty = query.get('level');
  const skill = query.get('skill');
  const text = query.get('q') ?? '';
  const filtered = Boolean(minutes || role || difficulty || skill || text);

  const results = rankMissions(data, me.id, { minutes, role, difficulty, skill, text });
  const skills = [...new Set(openMissions(data).flatMap((t) => t.required_skills))].sort();
  const profile = getProfile(data, me.id);
  const isStudent = me.type === 'student';
  const clearAll = () => updateQuery({ time: null, role: null, level: null, skill: null, q: null });

  return (
    <Page title="Bridge Missions" subtitle="Small, real tasks from Ohio State student, faculty and Columbus industry projects. Most take under an hour.">
      <section className="fit-bar" aria-label="Find a mission that fits">
        <div className="fit-row">
          <div className="fit-group">
            <span className="fit-label" id="fit-time">
              Time I have
            </span>
            <div className="segmented" role="group" aria-labelledby="fit-time">
              {TIMES.map((t) => (
                <button key={t ?? 'any'} type="button" aria-pressed={minutes === t} onClick={() => updateQuery({ time: t })}>
                  {t ? formatMinutes(t) : 'Any'}
                </button>
              ))}
            </div>
          </div>
          <label className="search-field">
            <Icon name="search" size={18} />
            <span className="visually-hidden">Search missions</span>
            <input type="search" placeholder="Search missions" value={text} onChange={(e) => updateQuery({ q: e.target.value })} />
          </label>
        </div>
        <div className="fit-row fit-row-selects">
          <SelectFilter label="Role" value={role} onChange={(v) => updateQuery({ role: v })} options={DOER_ROLES.map((r) => [r, ROLE_META[r].tag])} />
          <SelectFilter label="Level" value={difficulty} onChange={(v) => updateQuery({ level: v })} options={DIFFICULTIES.map((d) => [d, DIFFICULTY_META[d].label])} />
          <SelectFilter label="Skill" value={skill} onChange={(v) => updateQuery({ skill: v })} options={skills.map((s) => [s, s])} />
          {filtered && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
              Clear filters
            </button>
          )}
        </div>
        {isStudent && profile && (
          <p className="fit-profile">
            <span className="muted">Matching on your skills:</span> {profile.skills.join(', ') || 'none yet'}.{' '}
            <a className="text-link" href="#/profile">
              Edit skills
            </a>
          </p>
        )}
      </section>

      <p className="results-note" aria-live="polite">
        {results.length} open mission{results.length === 1 ? '' : 's'}
        {isStudent
          ? ', best match first. Ranked by simple rules comparing your skills and goals to each mission, not by AI.'
          : '. Students claim these; project leads and mentors review the work.'}
      </p>

      {results.length ? (
        <div className="mission-grid">
          {results.map((r, i) => (
            <MissionCard key={r.task.id} task={r.task} project={r.project} reasons={isStudent ? r.reasons : []} featured={i === 0 && isStudent && r.score >= 2} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="target"
          title="No missions fit these filters"
          action={
            <button type="button" className="btn btn-soft" onClick={clearAll}>
              Clear filters
            </button>
          }
        >
          Try allowing more time, or any role.
        </EmptyState>
      )}
    </Page>
  );
}
