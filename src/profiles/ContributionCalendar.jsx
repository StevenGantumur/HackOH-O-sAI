import { useEffect, useId, useRef, useState } from 'react';
import { href, taskHref } from '../shared/router.js';
import { getProject } from '../shared/selectors.js';
import { store } from '../shared/store.js';
import { SampleBadge } from '../shared/ui/bits.jsx';
import { Icon } from '../shared/ui/Icon.jsx';
import { activityDateLabel, buildContributionCalendar, contributionEvents, localTimeZone } from './contributionActivity.js';
import './contribution-calendar.css';

const KIND_LABEL = { version: 'File version', submission: 'Work submitted', review: 'Review given' };
const level = (count) => Math.min(count, 4);
const describe = (day) => `${day.events.length} contribution${day.events.length === 1 ? '' : 's'} on ${activityDateLabel(day.date)}`;

export function ContributionCalendar({ data, user, viewerId }) {
  const id = useId();
  const timeZone = localTimeZone();
  const calendar = buildContributionCalendar(contributionEvents(data, user.id, viewerId), { timeZone });
  const latestActive = calendar.days.findLastIndex((day) => day.events.length > 0);
  const initialIndex = latestActive < 0 ? 364 : latestActive;
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const buttons = useRef([]);
  const scroll = useRef(null);
  useEffect(() => {
    // Start at recent activity when a narrow screen cannot fit the whole year.
    scroll.current.scrollLeft = scroll.current.scrollWidth;
  }, []);
  const selected = calendar.days.find((day) => day.date === selectedDate);
  const inspected = calendar.days.find((day) => day.date === hoveredDate) ?? calendar.days[focusedIndex];
  const hasSamples = calendar.days.some((day) => day.events.some((event) => store.isSeeded(event.sourceId)));
  const isMe = user.id === viewerId;
  const months = [];
  let lastMonth;
  for (let column = 0; column < calendar.columns; column += 1) {
    const first = calendar.cells.slice(column * 7, column * 7 + 7).find(Boolean);
    const month = first?.date.slice(0, 7);
    if (month && month !== lastMonth) {
      // Avoid overlapping partial-month labels at either edge.
      if (months.length && column - months.at(-1).column < 3) months.pop();
      months.push({ column, label: activityDateLabel(first.date, { month: 'short', day: undefined, year: undefined }) });
      lastMonth = month;
    }
  }

  function moveFocus(event, index) {
    const weekday = new Date(`${calendar.days[index].date}T00:00:00Z`).getUTCDay();
    const targets = {
      ArrowLeft: index - 7, ArrowRight: index + 7,
      ArrowUp: index - 1, ArrowDown: index + 1,
      Home: event.ctrlKey ? 0 : index - weekday,
      End: event.ctrlKey ? 364 : index + 6 - weekday,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(364, targets[event.key]));
    setFocusedIndex(next);
    buttons.current[next]?.focus();
  }

  return (
    <section className="contribution-section" aria-labelledby={`${id}-title`}>
      <header className="contribution-heading">
        <div>
          <h2 id={`${id}-title`} className="section-title">Contribution Activity</h2>
          <p>{isMe ? 'Your' : `${user.name}’s`} contributions across projects and missions.</p>
        </div>
        {hasSamples && <SampleBadge>Includes sample activity</SampleBadge>}
      </header>
      <div className="contribution-summary">
        <p><strong>{calendar.total}</strong> contribution{calendar.total === 1 ? '' : 's'} in the past year</p>
        <span>{activityDateLabel(calendar.start, { month: 'short' })} – {activityDateLabel(calendar.end, { month: 'short' })}</span>
      </div>
      <p id={`${id}-help`} className="visually-hidden">Use arrow keys to explore days, left and right to move a week, and Enter or Space to show activities for a day. Home and End move within a week; Control Home and Control End move to the first and last day.</p>
      <div ref={scroll} className="contribution-scroll" role="group" aria-label="Contribution calendar for the past year" aria-describedby={`${id}-help`}>
        <div className="contribution-calendar" style={{ '--weeks': calendar.columns }}>
          <div className="contribution-months" aria-hidden="true">
            {months.map((month) => <span key={month.column} style={{ gridColumn: month.column + 1 }}>{month.label}</span>)}
          </div>
          <div className="contribution-weekdays" aria-hidden="true">
            <span style={{ gridRow: 2 }}>Mon</span><span style={{ gridRow: 4 }}>Wed</span><span style={{ gridRow: 6 }}>Fri</span>
          </div>
          <div className="contribution-days">
            {calendar.cells.map((day, index) => day ? (
              <button
                key={day.date}
                ref={(node) => { buttons.current[day.index] = node; }}
                type="button"
                className={`contribution-day activity-level-${level(day.events.length)}`}
                data-date={day.date}
                data-count={day.events.length}
                aria-label={describe(day)}
                title={describe(day)}
                aria-pressed={selectedDate === day.date}
                aria-controls={`${id}-details`}
                tabIndex={focusedIndex === day.index ? 0 : -1}
                onKeyDown={(event) => moveFocus(event, day.index)}
                onFocus={() => { setFocusedIndex(day.index); setHoveredDate(null); }}
                onMouseEnter={() => setHoveredDate(day.date)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => setSelectedDate(day.date)}
              />
            ) : <span key={`blank-${index}`} className="contribution-padding" aria-hidden="true" />)}
          </div>
        </div>
      </div>
      <div className="contribution-calendar-footer">
        <span className="contribution-inspection" aria-live="polite">{describe(inspected)}</span>
        <div className="contribution-legend" aria-label="Activity intensity: no contributions, 1, 2, 3, 4 or more">
          <span>Less</span>{[0, 1, 2, 3, 4].map((value) => <span key={value} className={`contribution-swatch activity-level-${value}`} aria-hidden="true" />)}<span>More</span>
        </div>
      </div>
      <p className="contribution-visibility">{isMe ? 'Activity in your accessible projects.' : 'Only activity in projects you can access is shown.'} Dates use {timeZone.replaceAll('_', ' ')} time.</p>
      {calendar.total === 0 && <p className="contribution-empty">No recorded contributions in this period. Dated work will appear here as it is saved.</p>}
      <div id={`${id}-details`} className="contribution-details" aria-live="polite">
        {selected ? (
          <>
            <div className="contribution-details-heading">
              <h3>{activityDateLabel(selected.date)}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}>Close day</button>
            </div>
            {selected.events.length ? (
              <ul className="contribution-events">
                {selected.events.map((event) => (
                  <li key={event.id}>
                    <Icon name={event.kind === 'version' ? 'file' : event.kind === 'review' ? 'checkCircle' : 'upload'} size={17} />
                    <div>
                      <span className="contribution-event-kind">{KIND_LABEL[event.kind]}</span>
                      <a href={event.kind === 'version' ? href(`/projects/${event.projectId}`, { tab: 'files', file: event.fileId, version: event.versionId }) : taskHref(event.taskId)}>{event.title}</a>
                      <p>{getProject(data, event.projectId)?.title}{event.message ? ` · ${event.message}` : ''}</p>
                    </div>
                    {store.isSeeded(event.sourceId) && <SampleBadge>Sample</SampleBadge>}
                  </li>
                ))}
              </ul>
            ) : <p className="muted small">No recorded contributions on this day.</p>}
          </>
        ) : <p className="contribution-prompt">Select a day to explore the work behind it.</p>}
      </div>
      <details className="contribution-method">
        <summary>What counts as a contribution?</summary>
        <p>Each saved file version, work submission, and review given counts once. A submission and its attached upload count together on the submission date. Task completion, evidence cards, messages, and Team Up previews add no extra activity.</p>
        <p>Counts come from dated records in the shared app store. Missing dates and inaccessible project activity are excluded.</p>
      </details>
    </section>
  );
}
