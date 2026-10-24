// Date, time and size formatting. Day-month order matches the board design ("25 Oct").

const MINUTE = 6e4;
const HOUR = 36e5;
const DAY = 864e5;

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export const formatDate = (iso) => shortDate.format(new Date(iso));
export const formatDay = (iso) => longDate.format(new Date(iso));
export const formatFullDate = (iso) => fullDate.format(new Date(iso));
export const formatTime = (iso) => clock.format(new Date(iso));
export const formatMonth = (date) => monthYear.format(date);

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function daysUntil(iso, now = Date.now()) {
  return Math.round((startOfDay(Date.parse(iso)) - startOfDay(now)) / DAY);
}

export function timeAgo(iso, now = Date.now()) {
  const diff = now - Date.parse(iso);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

export function dueLabel(iso, now = Date.now()) {
  const days = daysUntil(iso, now);
  if (days < -1) return `Overdue by ${-days} days`;
  if (days === -1) return 'Was due yesterday';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

// <input type="date"> gives "YYYY-MM-DD"; treat it as the end of that local day, not UTC midnight
// (which shows up as the previous day in US timezones).
export function dateInputToIso(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59).toISOString();
}

export function isoToDateInput(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function firstName(name = '') {
  const parts = name.replace(/^(Dr\.|Prof\.)\s+/, '').split(' ');
  return parts[0] ?? name;
}
