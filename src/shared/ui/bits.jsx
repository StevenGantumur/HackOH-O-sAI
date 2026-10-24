import { DIFFICULTY_META, ROLE_META, STATUS_META, SUBMISSION_META, USER_TYPE_META } from '../labels.js';
import { formatDate, formatMinutes } from '../format.js';
import { Icon } from './Icon.jsx';

export function RoleLabel({ role, className = '' }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  return (
    <span className={`role-label ${className}`} style={{ color: meta.color }}>
      {meta.tag}
    </span>
  );
}

export function RoleBadge({ role }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  return (
    <span className="role-badge" style={{ color: meta.color, background: meta.soft }}>
      <span className="role-badge-dot" style={{ background: meta.dot }} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function UserTypeBadge({ type }) {
  const meta = USER_TYPE_META[type];
  if (!meta) return null;
  return (
    <span className="type-badge" style={{ color: meta.color }}>
      {meta.label}
    </span>
  );
}

export function DifficultyChip({ value }) {
  const meta = DIFFICULTY_META[value];
  if (!meta) return null;
  return (
    <span className={`chip tone-${meta.tone}`}>
      <Icon name="flag" size={15} />
      <span className="visually-hidden">Difficulty: </span>
      {meta.label}
    </span>
  );
}

export function TimeChip({ minutes }) {
  if (minutes == null) return null;
  return (
    <span className="chip chip-neutral">
      <Icon name="timer" size={15} />
      <span className="visually-hidden">Takes about </span>
      {formatMinutes(minutes)}
    </span>
  );
}

export function DueChip({ iso, overdue = false }) {
  if (!iso) return null;
  return (
    <span className={`chip ${overdue ? 'tone-hard' : 'chip-neutral'}`}>
      <Icon name={overdue ? 'alert' : 'clock'} size={15} />
      <span className="visually-hidden">{overdue ? 'Overdue, was due ' : 'Due '}</span>
      {formatDate(iso)}
    </span>
  );
}

export function StatusPill({ status }) {
  const meta = STATUS_META[status];
  return <span className={`pill tone-${meta.tone}`}>{meta.label}</span>;
}

export function SubmissionPill({ status }) {
  const meta = SUBMISSION_META[status];
  return <span className={`pill tone-${meta.tone}`}>{meta.label}</span>;
}

// Seeded records must be visibly marked as sample data (AGENTS.md §5.3, §6.3).
export function SampleBadge({ children = 'Sample data' }) {
  return (
    <span className="sample-badge" title="Seeded for the demo, not a real record">
      {children}
    </span>
  );
}

export function Tag({ children, active = false }) {
  return <span className={`tag ${active ? 'is-active' : ''}`}>{children}</span>;
}

export function EmptyState({ icon = 'info', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <span className="spinner" role={label ? 'status' : undefined} aria-label={label}>
      <span aria-hidden="true" />
    </span>
  );
}
