// Loads the demo data in ./seed-data on first launch (or when SEED_VERSION changes).
// Demo logins (password demo123): bella@demo.com (client), nour@demo.com (psychologist),
// karim.h@demo.com (psychiatrist), hr@acme.demo (organization), admin@demo.com (admin).
// Verification / reset / 2FA codes are always 123456 in offline mode.
import { db } from './db';
import seedData from './seed-data';
import { addDays, dateKey } from '../utils/date';
import { hashPassword } from '../utils/hash';

const SEED_VERSION = 5;

// Seed files keep dates relative to "today" so the demo never goes stale:
//   "@day:-3"        -> date key 3 days ago        ('YYYY-MM-DD')
//   "@iso:-2:10:00"  -> ISO timestamp 2 days ago at 10:00 local time
//   "@hash:demo123"  -> placeholder password hash of "demo123"
export function resolveTokens(value, today = new Date()) {
  if (Array.isArray(value)) return value.map((v) => resolveTokens(v, today));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveTokens(v, today)]));
  }
  if (typeof value !== 'string' || value[0] !== '@') return value;

  const [kind, ...rest] = value.slice(1).split(':');
  if (kind === 'day') return dateKey(addDays(today, Number(rest[0])));
  if (kind === 'iso') {
    const d = addDays(today, Number(rest[0]));
    d.setHours(Number(rest[1] ?? 0), Number(rest[2] ?? 0), 0, 0);
    return d.toISOString();
  }
  if (kind === 'hash') return hashPassword(rest.join(':'));
  return value;
}

export async function seedIfNeeded() {
  if ((await db.getMeta('seedVersion')) === SEED_VERSION) return;
  await db.reset();
  const today = new Date();
  for (const [name, rows] of Object.entries(seedData)) {
    await db.insertMany(name, resolveTokens(rows, today));
  }
  await db.setMeta('seedVersion', SEED_VERSION);
}
