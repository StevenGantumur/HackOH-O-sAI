import { useId, useState } from 'react';
import './teamup.css';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateLabel = (date) => dateFormatter.format(new Date(`${date}T00:00:00Z`));
const fullDate = (date) => `${dateLabel(date)}, ${date.slice(0, 4)}`;

/**
 * Shows a user's completed 30-minute demos over time.
 *
 * @param {Object} props
 * @param {{ date: string, total: number }[]} [props.points=[]]
 *   Completion history, ordered by date from oldest to newest.
 *   - date: a valid calendar date in YYYY-MM-DD format, unique within the array.
 *     Horizontal spacing reflects the actual time between dates.
 *   - total: the cumulative number of completed demos as of that date, NOT the
 *     number completed on that day. Use nonnegative integers that never decrease.
 *     Repeat a total to show a period without additional completions.
 *   The last point supplies the headline demo count; collaboration minutes are
 *   calculated as that count × 30. Start with total: 0 to show a zero baseline.
 *   An empty array or a history with no completions displays a friendly face
 *   and a first-demo prompt instead of a chart.
 * @param {boolean} [props.sample=false]
 *   Set true for fictional data. Displays a sample-data badge and identifies the
 *   source as fictional in the caption and accessible chart description.
 *   This only labels the data; it does not generate sample points.
 *
 * Pass already-aggregated history for the intended user. This component does not
 * fetch, persist, validate, sort, or filter records by user or date range.
 *
 * @example
 * // MOCK: Fictional history for a preview.
 * const history = [
 *   { date: '2026-10-01', total: 0 },
 *   { date: '2026-10-08', total: 2 },
 *   { date: '2026-10-15', total: 2 },
 *   { date: '2026-10-24', total: 5 },
 * ];
 * // Renders 5 completed demos and 150 collaboration minutes.
 * <DemoProgress points={history} sample />
 */
export function DemoProgress({ points = [], sample = false }) {
  const id = useId();
  const [selectedDate, setSelectedDate] = useState(null);
  const selected = points.find((point) => point.date === selectedDate) ?? points.at(-1);
  const total = points.at(-1)?.total ?? 0;
  const max = points.reduce((highest, point) => Math.max(highest, point.total), 4);
  const ceiling = Math.ceil(max / 4) * 4;
  const start = points.length ? Date.parse(points[0].date) : 0;
  const duration = points.length ? Date.parse(points.at(-1).date) - start : 0;
  const x = (index) => 68 + ((Date.parse(points[index].date) - start) / Math.max(1, duration)) * 700;
  const y = (value) => 244 - (value / ceiling) * 200;
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.total)}`).join(' ');

  return (
    <section className="teamup-progress" aria-labelledby={`${id}-heading`}>
      <div className="teamup-progress-heading">
        <div>
          <p className="teamup-eyebrow">YOUR COLLABORATION JOURNEY</p>
          <h2 id={`${id}-heading`}>Small sessions. Real progress.</h2>
          <p className="teamup-muted">Completed 30-minute demos over time</p>
        </div>
        {sample && <span className="teamup-sample">Sample data · preview</span>}
      </div>
      <div className="teamup-stats">
        <div><strong>{total}</strong><span>demos completed</span></div>
        <div><strong>{total * 30}<small> min</small></strong><span>spent collaborating</span></div>
      </div>
      {total > 0 ? (
        <>
          <p className="teamup-inspection" aria-live="polite">
            {fullDate(selected.date)} · <strong>{selected.total} completed</strong>
            <span>Hover or focus a point to explore</span>
          </p>
          <div className="teamup-chart-scroll">
            <svg className="teamup-chart" viewBox="0 0 810 310" role="group" aria-labelledby={`${id}-title ${id}-desc`}>
              <title id={`${id}-title`}>Cumulative completed 30-minute demos</title>
              <desc id={`${id}-desc`}>{sample ? 'Fictional sample data. ' : ''}From {fullDate(points[0].date)} to {fullDate(points.at(-1).date)}. Total: {total} demos. Focus each point for its date and count.</desc>
              {[0, 1, 2, 3, 4].map((step) => {
                const value = (ceiling / 4) * step;
                return (
                  <g key={step}>
                    <line x1="68" x2="768" y1={y(value)} y2={y(value)} className="teamup-grid" />
                    <text x="50" y={y(value) + 4} textAnchor="end">{value}</text>
                  </g>
                );
              })}
              <text x="68" y="22">Completed demos (cumulative)</text>
              <path d={`${line} L ${x(points.length - 1)} 244 L 68 244 Z`} className="teamup-area" />
              <path d={line} className="teamup-line" />
              {points.map((point, index) => (
                <g key={point.date}>
                  <circle
                    cx={x(index)} cy={y(point.total)} r="7"
                    className="teamup-point" tabIndex={0} role="img"
                    aria-label={`${fullDate(point.date)}: ${point.total} completed demos`}
                    onMouseEnter={() => setSelectedDate(point.date)}
                    onFocus={() => setSelectedDate(point.date)}
                  >
                    <title>{fullDate(point.date)}: {point.total} completed demos</title>
                  </circle>
                  {(index === 0 || index === points.length - 1 || index % Math.max(1, Math.ceil(points.length / 6)) === 0) && (
                    <text x={x(index)} y="272" textAnchor="middle">{dateLabel(point.date)}</text>
                  )}
                </g>
              ))}
              <text x="418" y="301" textAnchor="middle">Date</text>
            </svg>
          </div>
          <p className="teamup-muted teamup-chart-caption">
            {sample ? 'Source: fictional preview data' : 'Source: supplied completion history'}
            {' · '}{fullDate(points[0].date)}–{fullDate(points.at(-1).date)} · Each demo represents 30 minutes.
          </p>
        </>
      ) : (
        <div className="teamup-progress-empty">
          <svg className="teamup-empty-face" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" className="teamup-empty-face-bg" />
            <circle cx="36" cy="43" r="3" />
            <circle cx="64" cy="43" r="3" />
            <path d="M 35 59 Q 50 74 65 59" className="teamup-empty-smile" />
          </svg>
          <h3>Your first demo starts the story</h3>
          <p>Complete a 30-minute challenge with a teammate to see your progress grow here.</p>
          <span>No demos completed yet</span>
        </div>
      )}
    </section>
  );
}
