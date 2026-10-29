import { MONTHS, WEEKDAYS, dateKey } from './date';

const yesterdayKey = () => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return dateKey(y);
};

export const clockTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Thread list: "2:05 PM" today, "Yesterday", or "12 Oct".
export function messageTime(iso) {
  const d = new Date(iso);
  const key = dateKey(d);
  if (key === dateKey()) return clockTime(iso);
  if (key === yesterdayKey()) return 'Yesterday';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

// Day separator inside a thread: "Today", "Yesterday", "Mon, 12 Oct".
export function dayLabel(iso) {
  const d = new Date(iso);
  const key = dateKey(d);
  if (key === dateKey()) return 'Today';
  if (key === yesterdayKey()) return 'Yesterday';
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
