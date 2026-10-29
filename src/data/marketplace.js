// Marketplace catalogue rules shared by client and professional screens.
// A product is either a workshop (live or recorded) or a digital resource (guide, worksheets, cards…).
import { parseKey, shortDate, timeLabel, todayKey } from '../utils/date';

export const CATEGORIES = [
  { value: 'workshop', label: 'Workshops' },
  { value: 'resource', label: 'Digital Resources' },
];

export const RESOURCE_TYPES = [
  { value: 'guide', label: 'Guide' },
  { value: 'worksheets', label: 'Worksheets' },
  { value: 'cards', label: 'Cards' },
  { value: 'planner', label: 'Planner' },
  { value: 'other', label: 'Other' },
];

export const WORKSHOP_FORMATS = [
  { value: 'live', label: 'Live' },
  { value: 'recorded', label: 'Recorded' },
];

export const WORKSHOP_DURATIONS = [45, 60, 90, 120];

export const isWorkshop = (p) => p?.category === 'workshop';
export const isLive = (p) => isWorkshop(p) && p.format === 'live';

export function kindLabel(p) {
  if (isWorkshop(p)) return p.format === 'live' ? 'Live workshop' : 'Recorded workshop';
  return RESOURCE_TYPES.find((t) => t.value === p?.resourceType)?.label ?? 'Digital resource';
}

// A live workshop stays listed until its date has passed; everything else is always available.
export const isAvailable = (p) => !p.archived && (!isLive(p) || p.date >= todayKey());

export function workshopWhen(p) {
  if (!isWorkshop(p)) return '';
  if (p.format === 'live') return `${shortDate(p.date)} ${parseKey(p.date).getFullYear()} · ${timeLabel(p.time)}`;
  return `${p.duration ?? 60} min recording`;
}

export const seatsLeft = (p, orders) => (isLive(p) && p.seats ? Math.max(0, p.seats - orders.filter((o) => o.productId === p.id).length) : null);
