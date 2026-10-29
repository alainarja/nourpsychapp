// Turns appointments and orders into receipt rows for the current user.
// Clients see what they paid for; professionals see what they earned ("sales receipts").
export function buildReceipts({ user, appointments, orders, products, users }) {
  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown';
  const rows = [];

  for (const a of appointments) {
    const asClient = user.role === 'client' && a.clientId === user.id && a.payment;
    const asPro = user.role === 'pro' && a.proId === user.id && a.status === 'completed';
    if (!asClient && !asPro) continue;
    rows.push({
      id: a.id, kind: 'session', source: a,
      title: a.type ?? 'Therapy session',
      counterparty: asClient ? nameOf(a.proId) : nameOf(a.clientId),
      billedTo: nameOf(a.clientId), provider: nameOf(a.proId),
      amount: a.payment ? a.payment.amount : a.price ?? 0,
      listPrice: a.price ?? 0,
      date: a.createdAt,
      status: a.status === 'cancelled' ? 'Refund pending' : 'Paid',
      payment: a.payment ?? null,
    });
  }

  for (const o of orders) {
    const asClient = o.buyerId === user.id;
    const asPro = user.role === 'pro' && o.sellerId === user.id;
    if (!asClient && !asPro) continue;
    const product = products.find((p) => p.id === o.productId);
    rows.push({
      id: o.id, kind: 'order', source: o,
      title: product?.title ?? 'Marketplace item',
      counterparty: asClient ? nameOf(o.sellerId) : nameOf(o.buyerId),
      billedTo: nameOf(o.buyerId), provider: nameOf(o.sellerId),
      amount: o.payment ? o.payment.amount : o.price,
      listPrice: o.price,
      date: o.createdAt,
      status: 'Paid',
      payment: o.payment ?? null,
    });
  }

  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export const formatMoney = (n) => `$${Number(n ?? 0).toFixed(Number(n) % 1 ? 2 : 0)}`;
export const receiptNumber = (id) => `ST-${id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`;
