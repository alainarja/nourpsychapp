// Consent items per role; `label` is an i18n key and `${label}.sum` its summary. Required items gate onboarding.
export const CONSENT_ITEMS = [
  { key: 'terms', label: 'consent.terms', required: true, roles: ['client', 'pro', 'org', 'admin'] },
  { key: 'privacy', label: 'consent.privacy', required: true, roles: ['client', 'pro', 'org', 'admin'] },
  { key: 'dataProcessing', label: 'consent.health', required: true, roles: ['client', 'pro'] },
  { key: 'telehealth', label: 'consent.telehealth', required: true, roles: ['client', 'pro'] },
  { key: 'conduct', label: 'consent.conduct', required: true, roles: ['pro'] },
  { key: 'dpa', label: 'consent.dpa', required: true, roles: ['org'] },
  { key: 'marketing', label: 'consent.marketing', required: false, roles: ['client', 'pro', 'org'] },
  { key: 'research', label: 'consent.research', required: false, roles: ['client', 'pro'] },
];

export const consentItemsFor = (role) => CONSENT_ITEMS.filter((i) => i.roles.includes(role));
