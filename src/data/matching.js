// Find My Match vocabulary. Each quiz question maps to one therapist profile field,
// so the client's answers and the therapist's profile use the same values.
//   specialization → specialties   therapy type → services   gender → gender
//   age group → ageGroups          language → languages      format → sessionTypes + location
//   budget → price                 approach → modalities

export const SPECIALTIES = [
  'Anxiety, stress & worry', 'Depression & low mood', 'Trauma & PTSD', 'Relationships & attachment',
  'Self-esteem & confidence', 'Emotional regulation & anger', 'Grief & loss', 'Eating disorders & body image',
  'OCD & intrusive thoughts', 'ADHD & attention difficulties', 'Family & parenting', 'Life transitions & personal growth',
];

export const SERVICES = [
  'Individual therapy', 'Couples therapy', 'Family therapy', 'Child or adolescent therapy',
  'Psychological assessment', 'Psychiatric consultation',
];

export const GENDERS = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }];

export const AGE_GROUPS = [
  { value: 'children', label: 'Children (under 12)' },
  { value: 'adolescents', label: 'Adolescents (12–17)' },
  { value: 'young-adults', label: 'Young adults (18–25)' },
  { value: 'adults', label: 'Adults (26–59)' },
  { value: 'older-adults', label: 'Older adults (60+)' },
];

export const MODALITIES = [
  { value: 'CBT', label: 'CBT', detail: 'Structured, practical tools and exercises' },
  { value: 'Psychodynamic', label: 'Psychodynamic', detail: 'Exploring emotions and past experiences' },
  { value: 'ACT', label: 'ACT', detail: 'Acceptance, values and psychological flexibility' },
  { value: 'DBT', label: 'DBT', detail: 'Emotional regulation and coping skills' },
  { value: 'Integrative', label: 'Integrative', detail: 'Combining different therapeutic approaches' },
];

// [min, max) in USD per session.
export const BUDGETS = [
  { value: 'u30', label: 'Under $30', range: [0, 30] },
  { value: '30-50', label: '$30–$50', range: [30, 50] },
  { value: '50-70', label: '$50–$70', range: [50, 70] },
  { value: '70-100', label: '$70–$100', range: [70, 100] },
  { value: 'o100', label: 'Above $100', range: [100, Infinity] },
];

export const ANY = 'any';
const opts = (list) => list.map((v) => ({ value: v, label: v }));

export const QUIZ = [
  {
    key: 'concerns', title: 'What would you like support with?', hint: 'Select up to 3.', multi: true, max: 3,
    options: [...opts(SPECIALTIES), { value: ANY, label: 'Other / Not sure' }],
  },
  {
    key: 'service', title: 'What type of therapy or support are you looking for?',
    options: [...opts(SERVICES), { value: ANY, label: 'Not sure yet' }],
  },
  { key: 'gender', title: 'Do you have a preferred therapist gender?', options: [...GENDERS, { value: ANY, label: 'No preference' }] },
  { key: 'ageGroup', title: 'What age group is therapy for?', options: AGE_GROUPS },
  {
    key: 'language', title: 'Which language would you prefer for your sessions?',
    options: [...opts(['Arabic', 'English', 'French']), { value: ANY, label: 'Other' }],
  },
  {
    key: 'mode', title: 'How would you prefer to attend your sessions?',
    options: [{ value: 'online', label: 'Online' }, { value: 'in-person', label: 'In person' }, { value: ANY, label: 'Both / No preference' }],
  },
  { key: 'budget', title: 'What is your budget per session?', options: [...BUDGETS, { value: ANY, label: 'Flexible / No preference' }] },
  {
    key: 'approach', title: 'What therapeutic approach would you prefer?',
    options: [...MODALITIES.map((m) => ({ value: m.value, label: `${m.label} – ${m.detail}` })), { value: ANY, label: 'Not sure – Recommend what is suitable for me' }],
  },
];

export const QUIZ_DEFAULTS = {
  concerns: [], service: null, gender: null, ageGroup: null, language: null, mode: null, city: '', budget: null, approach: null,
};

const sameCity = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
// 'a', 'a and b', 'a, b and c'
const listOf = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0]);
const labelOf = (list, value) => list.find((o) => o.value === value)?.label ?? value;

// Splits the answers into requirements (clinical suitability, per the questionnaire's matching note)
// and preferences (used for ranking). Each check returns a reason when it holds.
function checks(pro, a) {
  const required = [];
  const preferred = [];
  let overlap = [];

  // Unverified professionals are never recommended.
  required.push(pro.verified ? '' : null);

  if (a.ageGroup) required.push((pro.ageGroups ?? []).includes(a.ageGroup) ? `works with ${labelOf(AGE_GROUPS, a.ageGroup).toLowerCase()}` : null);
  if (a.service && a.service !== ANY) required.push((pro.services ?? []).includes(a.service) ? `offers ${a.service.toLowerCase()}` : null);

  const concerns = a.concerns.filter((c) => c !== ANY);
  if (concerns.length) {
    overlap = concerns.filter((c) => (pro.specialties ?? []).includes(c));
    required.push(overlap.length ? `specialises in ${listOf(overlap)}` : null);
  }

  if (a.gender && a.gender !== ANY) preferred.push(pro.gender === a.gender ? `${a.gender} therapist` : null);
  if (a.language && a.language !== ANY) preferred.push((pro.languages ?? []).includes(a.language) ? `sessions in ${a.language}` : null);

  if (a.mode && a.mode !== ANY) {
    const modes = pro.sessionTypes ?? ['online'];
    if (a.mode === 'online') preferred.push(modes.includes('online') ? 'offers online sessions' : null);
    else {
      const inPerson = modes.includes('in-person');
      const local = inPerson && sameCity(pro.location, a.city);
      preferred.push(inPerson ? (local ? `in-person sessions in ${pro.location}` : 'offers in-person sessions') : null);
      if (a.city?.trim()) preferred.push(local ? '' : null);
    }
  }

  if (a.budget && a.budget !== ANY) {
    const [, max] = BUDGETS.find((b) => b.value === a.budget)?.range ?? [0, Infinity];
    preferred.push((pro.price ?? 0) < max ? `$${pro.price} per session, within your budget` : null);
  }

  if (a.approach && a.approach !== ANY) preferred.push((pro.modalities ?? []).includes(a.approach) ? `uses ${a.approach}` : null);

  return { required, preferred, overlap: overlap.length };
}

// Professionals who meet every requirement, ranked by how many preferences they meet.
// If nobody meets them all, falls back to the closest professionals and flags `exact: false`.
// Results carry reasons for the match instead of a compatibility percentage.
export function findMatches(pros, answers, limit = 5) {
  const scored = pros.map((pro) => {
    const { required, preferred, overlap } = checks(pro, answers);
    const metReq = required.filter((r) => r !== null);
    const metPref = preferred.filter((r) => r !== null);
    return {
      pro,
      exact: metReq.length === required.length,
      // A missed requirement outweighs any number of preferences.
      // Covering more of the client's chosen concerns counts like an extra preference.
      rank: metReq.length * 100 + (metPref.length + Math.max(overlap - 1, 0)) * 10 + (pro.rating ?? 0),
      reasons: [...metReq, ...metPref].filter(Boolean),
    };
  });
  const exact = scored.filter((s) => s.exact);
  const pool = exact.length ? exact : scored.filter((s) => s.pro.verified);
  return {
    exact: exact.length > 0,
    results: pool.sort((a, b) => b.rank - a.rank).slice(0, limit),
  };
}
