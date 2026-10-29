import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apptDateTime, sortByDateTime } from '../../db/actions';
import { useCollection } from '../../db/db';
import { addDays } from '../../utils/date';

export const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

// Everything a professional's screens need, derived from the live collections.
export function useProData() {
  const { user } = useAuth();
  const { data: appointments } = useCollection('appointments');
  const { data: users } = useCollection('users');
  const { data: orders } = useCollection('orders');
  const { data: products } = useCollection('products');

  return useMemo(() => {
    const me = user?.id;
    const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
    const myAppts = sortByDateTime(appointments.filter((a) => a.proId === me));
    const liveAppts = myAppts.filter((a) => a.status !== 'cancelled');
    const now = new Date();
    const activeCutoff = addDays(now, -60);

    const byClient = {};
    liveAppts.forEach((a) => (byClient[a.clientId] ??= []).push(a));

    const clients = Object.entries(byClient).map(([id, list]) => {
      const past = list.filter((a) => apptDateTime(a) <= now);
      const upcoming = list.filter((a) => apptDateTime(a) > now && a.status === 'booked');
      const last = past.at(-1) ?? null;
      const active = upcoming.length > 0 || list.some((a) => apptDateTime(a) >= activeCutoff);
      return { id, user: usersById[id] ?? { id, name: 'Unknown client' }, appointments: list, last, next: upcoming[0] ?? null, active };
    }).sort((a, b) => a.user.name.localeCompare(b.user.name));

    const myProducts = products.filter((p) => p.sellerId === me);
    const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
    const myOrders = orders.filter((o) => o.sellerId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return { me, user, usersById, myAppts, liveAppts, clients, myProducts, productsById, myOrders };
  }, [user, appointments, users, orders, products]);
}

// Session revenue counts completed + booked (not cancelled) appointments.
export const sessionRevenue = (appts, inRange = () => true) =>
  appts.filter((a) => a.status !== 'cancelled' && inRange(apptDateTime(a))).reduce((s, a) => s + (a.price ?? 0), 0);

export const orderRevenue = (orders, inRange = () => true) =>
  orders.filter((o) => inRange(new Date(o.createdAt))).reduce((s, o) => s + (o.price ?? 0), 0);

export const inMonth = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return (d) => d >= start && d < end;
};
