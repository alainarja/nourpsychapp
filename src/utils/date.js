export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' in local time
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export const todayKey = () => dateKey(new Date());

// '14:00' -> '2:00 PM'
export function timeLabel(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${suffix}`;
}

// '2026-10-12' -> '12 Oct'
export function shortDate(key) {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

// '2026-10-12' -> 'Mon, 12 Oct 2026'
export function longDate(key) {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Weeks of the month as arrays of 7 Date|null cells, Sunday first.
export function monthMatrix(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))];
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function isPastSlot(key, time) {
  const [h, m] = time.split(':').map(Number);
  const d = parseKey(key);
  d.setHours(h, m);
  return d < new Date();
}

export function startOfWeek(d = new Date()) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - r.getDay());
  return r;
}

export const DEFAULT_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
