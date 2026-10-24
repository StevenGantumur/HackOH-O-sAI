import { useState } from 'react';
import { formatDay, formatMonth } from '../../shared/format.js';
import { ROLE_META } from '../../shared/labels.js';
import { taskHref } from '../../shared/router.js';
import { isOverdue } from '../../shared/selectors.js';
import { useMediaQuery } from '../../shared/useMediaQuery.js';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_DAY = 3;

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function monthDays(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const length = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + length) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => new Date(year, month, 1 - offset + i));
}

function Event({ task }) {
  const meta = ROLE_META[task.role];
  const late = isOverdue(task);
  return (
    <a
      className={`cal-event ${task.status === 'done' ? 'is-done' : ''} ${late ? 'is-late' : ''}`}
      href={taskHref(task.id)}
      style={{ background: meta?.soft, color: meta?.color }}
      title={task.title}
    >
      {late && <span className="visually-hidden">Overdue: </span>}
      {task.status === 'done' && <span className="visually-hidden">Done: </span>}
      {task.title}
    </a>
  );
}

export function TaskCalendar({ tasks }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const narrow = useMediaQuery('(max-width: 720px)');
  const todayKey = dayKey(new Date());

  const byDay = new Map();
  for (const task of tasks) {
    if (!task.deadline) continue;
    const key = dayKey(new Date(task.deadline));
    byDay.set(key, [...(byDay.get(key) ?? []), task]);
  }
  const days = monthDays(cursor);
  const month = cursor.getMonth();
  const shift = (delta) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const inMonth = days.filter((d) => d.getMonth() === month && byDay.has(dayKey(d)));

  return (
    <section className="calendar" aria-labelledby="cal-title">
      <header className="cal-head">
        <h2 className="cal-title" id="cal-title" aria-live="polite">
          {formatMonth(cursor)}
        </h2>
        <div className="cal-nav">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Today
          </button>
          <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month">
            <Icon name="chevronRight" />
          </button>
        </div>
      </header>

      {narrow ? (
        inMonth.length ? (
          <ol className="agenda">
            {inMonth.map((day) => (
              <li key={dayKey(day)} className="agenda-day">
                <p className="agenda-date">{formatDay(day.toISOString())}</p>
                <div className="agenda-events">
                  {byDay.get(dayKey(day)).map((task) => (
                    <Event key={task.id} task={task} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="agenda-empty">
            <EmptyState icon="calendar" title="Nothing due this month" />
          </div>
        )
      ) : (
        <div className="cal-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-dow" aria-hidden="true">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const key = dayKey(day);
            const items = byDay.get(key) ?? [];
            const classes = ['cal-cell', day.getMonth() !== month && 'is-outside', key === todayKey && 'is-today'].filter(Boolean).join(' ');
            return (
              <div key={key} className={classes}>
                <span className="cal-date" aria-hidden="true">
                  {day.getDate()}
                </span>
                {items.length > 0 && <span className="visually-hidden">Due {formatDay(day.toISOString())}:</span>}
                {items.slice(0, MAX_PER_DAY).map((task) => (
                  <Event key={task.id} task={task} />
                ))}
                {items.length > MAX_PER_DAY && <span className="cal-more">+{items.length - MAX_PER_DAY} more</span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
