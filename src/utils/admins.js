import { notifyUser } from '../db/actions';
import { db } from '../db/db';

// Fan a notification out to every admin account (verification requests, reports…).
export async function notifyAdmins(payload) {
  for (const a of await db.where('users', (u) => u.role === 'admin')) await notifyUser(a.id, payload);
}
