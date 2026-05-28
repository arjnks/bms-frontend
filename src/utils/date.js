/**
 * Date/time utilities — always display in IST (Asia/Kolkata)
 * regardless of the browser's local timezone.
 */
const IST = 'Asia/Kolkata';

/**
 * Format a timestamp string as date + time in IST.
 * e.g. "28/5/2026, 3:11:39 pm"
 */
export const fmtDateTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-IN', { timeZone: IST });
};

/**
 * Format a date-only string as a readable date in IST.
 * e.g. "28 May 2026"
 */
export const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
