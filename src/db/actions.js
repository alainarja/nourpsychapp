// Domain operations shared by client and professional screens.
// When a backend exists, these become API calls; screens keep calling the same functions.
import { db } from './db';
import { isPastSlot, parseKey, shortDate, timeLabel } from '../utils/date';

export const MOODS = [
  { value: 'good', label: 'Good', emoji: '😊', color: '#F6D58E' },
  { value: 'calm', label: 'Calm', emoji: '😌', color: '#BFD8C6' },
  { value: 'stressed', label: 'Stressed', emoji: '😣', color: '#F2B9A6' },
  { value: 'anxious', label: 'Anxious', emoji: '😟', color: '#C9C2E3' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#B9CDE6' },
];

export const SPECIALTIES = ['Anxiety', 'Depression', 'Relationships', 'Stress', 'Self-esteem', 'Trauma', 'Family', 'Adolescents', 'Grief', 'ADHD', 'CBT', 'EMDR', 'Life Transitions', 'Medication'];
export const LANGUAGES = ['English', 'Arabic', 'French', 'Spanish'];

// Times a professional is free on a date, excluding booked slots and past times.
export function availableSlots(pro, key, appointments) {
  const weekday = parseKey(key).getDay();
  const base = pro.availability?.[weekday] ?? [];
  const blocked = new Set(pro.blockedDates ?? []);
  if (blocked.has(key)) return [];
  const taken = new Set(appointments.filter((a) => a.proId === pro.id && a.date === key && a.status !== 'cancelled').map((a) => a.time));
  return base.filter((t) => !taken.has(t) && !isPastSlot(key, t));
}

// ---------- Notifications ----------
// type: booking | cancellation | reminder | message | order | workshop | review | verification | system
export function notifyUser(userId, { title, body = '', type = 'system', link = null }) {
  return db.insert('notifications', { userId, title, body, type, link, read: false });
}

export const markNotificationRead = (id) => db.update('notifications', id, { read: true });

export async function markAllNotificationsRead(userId) {
  for (const n of await db.where('notifications', (r) => r.userId === userId && !r.read)) await markNotificationRead(n.id);
}

const nameOf = async (id) => (await db.get('users', id))?.name ?? 'Someone';

// ---------- Appointments ----------

// `payment` is { methodId, brand, last4 } from checkout (simulated until a payment provider is wired in).
export async function bookAppointment({ pro, clientId, date, time, mode, payment = null }) {
  const clash = await db.where('appointments', (a) => a.proId === pro.id && a.date === date && a.time === time && a.status !== 'cancelled');
  if (clash.length) throw new Error('That time was just taken. Please pick another.');
  const appt = await db.insert('appointments', {
    proId: pro.id, clientId, date, time, mode, status: 'booked', price: pro.price ?? 60, type: 'Individual Therapy',
    paymentStatus: payment ? 'paid' : 'unpaid', payment,
  });
  const when = `${shortDate(date)} at ${timeLabel(time)}`;
  await notifyUser(pro.id, { title: 'New booking', body: `${await nameOf(clientId)} booked ${when} (${mode}).`, type: 'booking', link: `/pro/client/${clientId}` });
  await notifyUser(clientId, { title: 'Session confirmed', body: `${pro.name} · ${when}`, type: 'booking', link: '/client/therapy' });
  return appt;
}

export async function cancelAppointment(id, by) {
  const appt = await db.update('appointments', id, { status: 'cancelled', cancelledBy: by });
  if (appt) {
    const [actorId, otherId, link] = by === 'pro' ? [appt.proId, appt.clientId, '/client/therapy'] : [appt.clientId, appt.proId, '/pro/calendar'];
    await notifyUser(otherId, {
      title: 'Session cancelled',
      body: `${await nameOf(actorId)} cancelled the session on ${shortDate(appt.date)} at ${timeLabel(appt.time)}.`,
      type: 'cancellation', link,
    });
  }
  return appt;
}

export const completeAppointment = (id) => db.update('appointments', id, { status: 'completed' });

// Whether cancelling now is inside the professional's free-cancellation window.
export function isLateCancellation(appt, pro) {
  const hours = pro?.cancellationHours ?? 24;
  return apptDateTime(appt) - new Date() < hours * 3600 * 1000;
}

// ---------- Messaging ----------

export const threadKey = (a, b) => [a, b].sort().join('__');

export async function sendMessage(fromId, toId, text) {
  const msg = await db.insert('messages', { threadId: threadKey(fromId, toId), fromId, toId, text: text.trim(), read: false });
  await notifyUser(toId, { title: `Message from ${await nameOf(fromId)}`, body: text.trim().slice(0, 80), type: 'message', link: `/messages/${fromId}` });
  return msg;
}

export async function markThreadRead(meId, otherId) {
  for (const m of await db.where('messages', (r) => r.fromId === otherId && r.toId === meId && !r.read)) await db.update('messages', m.id, { read: true });
}

// ---------- Reviews ----------

export async function submitReview({ appointment, clientId, rating, text, anonymous }) {
  const review = await db.insert('reviews', { appointmentId: appointment.id, proId: appointment.proId, clientId, rating, text: text.trim(), anonymous });
  const pro = await db.get('users', appointment.proId);
  const count = (pro.reviews ?? 0) + 1;
  const avg = ((pro.rating ?? rating) * (count - 1) + rating) / count;
  await db.update('users', pro.id, { rating: Math.round(avg * 10) / 10, reviews: count });
  await db.update('appointments', appointment.id, { reviewed: true });
  await notifyUser(pro.id, { title: 'New review', body: `${rating}★ — ${text.trim().slice(0, 60) || 'No comment'}`, type: 'review', link: '/pro/profile' });
  return review;
}

export const apptDateTime = (a) => {
  const d = parseKey(a.date);
  const [h, m] = a.time.split(':').map(Number);
  d.setHours(h, m);
  return d;
};

export const sortByDateTime = (list, dir = 1) => [...list].sort((a, b) => dir * (apptDateTime(a) - apptDateTime(b)));

export async function purchaseProduct(product, buyerId, payment = null) {
  const order = await db.insert('orders', { productId: product.id, buyerId, sellerId: product.sellerId, price: product.price, payment });
  await notifyUser(product.sellerId, { title: 'New order', body: `${await nameOf(buyerId)} bought ${product.title} ($${product.price}).`, type: 'order', link: '/pro/marketplace' });
  return order;
}

export async function registerWorkshop(workshop, userId) {
  const existing = await db.where('registrations', (r) => r.workshopId === workshop.id && r.userId === userId);
  if (existing.length) return existing[0];
  const reg = await db.insert('registrations', { workshopId: workshop.id, userId });
  await notifyUser(workshop.hostId, { title: 'Workshop registration', body: `${await nameOf(userId)} registered for ${workshop.title}.`, type: 'workshop', link: '/pro/workshops' });
  return reg;
}

export const unregisterWorkshop = (id) => db.remove('registrations', id);
