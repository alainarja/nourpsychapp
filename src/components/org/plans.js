// Organization plan tiers (prices are placeholders until billing is connected).
export const PLANS = [
  { id: 'starter', name: 'Starter', pricePerSeat: 8, maxSeats: 25, sessionsPerMember: 3, features: ['Mirror AI & self-help tools', '3 therapy sessions / member / year', 'Monthly usage report'] },
  { id: 'growth', name: 'Growth', pricePerSeat: 14, maxSeats: 250, sessionsPerMember: 6, features: ['Everything in Starter', '6 sessions / member / year', 'Workshops for your team', 'Choose your provider network'] },
  { id: 'enterprise', name: 'Enterprise', pricePerSeat: null, maxSeats: null, sessionsPerMember: 12, features: ['Everything in Growth', 'Unlimited seats', 'Psychiatry access', 'SSO & dedicated success manager'] },
];

export const planById = (id) => PLANS.find((p) => p.id === id) ?? PLANS[0];
