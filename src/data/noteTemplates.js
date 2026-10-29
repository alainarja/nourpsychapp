// Documentation templates used by client notes and the offline drafting assistant.
// `build(f)` turns the assistant's short fields into a structured draft.
const line = (v, fallback = '…') => (v && v.trim() ? v.trim() : fallback);

export const NOTE_TEMPLATES = [
  {
    id: 'soap', label: 'SOAP',
    skeleton: 'S (Subjective):\n\nO (Objective):\n\nA (Assessment):\n\nP (Plan):\n',
    build: (f) => `SOAP note — ${f.clientName} — ${f.date}\n\nS (Subjective): ${line(f.observations)}\n\nO (Objective): Client presented as engaged; affect and presentation to be reviewed.\n\nA (Assessment): ${line(f.interventions, 'Progress toward treatment goals reviewed.')}\n\nP (Plan): ${line(f.plan)}`,
  },
  {
    id: 'dap', label: 'DAP',
    skeleton: 'D (Data):\n\nA (Assessment):\n\nP (Plan):\n',
    build: (f) => `DAP note — ${f.clientName} — ${f.date}\n\nD (Data): ${line(f.observations)}\nInterventions: ${line(f.interventions)}\n\nA (Assessment): Client's response to interventions and progress toward goals.\n\nP (Plan): ${line(f.plan)}`,
  },
  {
    id: 'birp', label: 'BIRP',
    skeleton: 'B (Behavior):\n\nI (Intervention):\n\nR (Response):\n\nP (Plan):\n',
    build: (f) => `BIRP note — ${f.clientName} — ${f.date}\n\nB (Behavior): ${line(f.observations)}\n\nI (Intervention): ${line(f.interventions)}\n\nR (Response): Client's response to the intervention.\n\nP (Plan): ${line(f.plan)}`,
  },
];

export const DRAFT_TEMPLATES = [
  ...NOTE_TEMPLATES,
  {
    id: 'progress', label: 'Progress summary',
    build: (f) => `Progress summary — ${f.clientName}\nPrepared ${f.date}\n\nPresenting concerns and current status:\n${line(f.observations)}\n\nInterventions used to date:\n${line(f.interventions)}\n\nProgress toward goals:\n…\n\nRecommendations / next steps:\n${line(f.plan)}`,
  },
  {
    id: 'treatment', label: 'Treatment plan',
    build: (f) => `Treatment plan outline — ${f.clientName}\n${f.date}\n\n1. Presenting problem:\n${line(f.observations)}\n\n2. Goals (SMART):\n- …\n- …\n\n3. Planned interventions:\n${line(f.interventions)}\n\n4. Frequency & duration:\nWeekly sessions, review in 8 weeks.\n\n5. Measures:\nPHQ-9 / GAD-7 at baseline and every 4 weeks.\n\n6. Plan:\n${line(f.plan)}`,
  },
  {
    id: 'referral', label: 'Referral letter',
    build: (f) => `${f.date}\n\nDear colleague,\n\nI am writing to refer ${f.clientName}, whom I have been seeing for psychological support.\n\nReason for referral:\n${line(f.observations)}\n\nWork completed so far:\n${line(f.interventions)}\n\nRequested support:\n${line(f.plan)}\n\nThe client has consented to this referral. Please don't hesitate to contact me.\n\nKind regards,\n${f.proName}`,
  },
  {
    id: 'reminder', label: 'Reminder message',
    build: (f) => `Hi ${f.clientName.split(' ')[0]},\n\nThis is a friendly reminder of your upcoming session${f.nextSession ? ` on ${f.nextSession}` : ''}. ${line(f.plan, 'Please let me know if you need to reschedule at least 24 hours in advance.')}\n\nWarm regards,\n${f.proName}`,
  },
];
