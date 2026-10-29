// PHQ-9 and GAD-7 are public-domain screening tools (Pfizer). Scores are screening aids, not diagnoses.
const FREQUENCY = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

export const ASSESSMENTS = {
  'phq-9': {
    id: 'phq-9',
    name: 'PHQ-9',
    title: 'Mood check (PHQ-9)',
    description: 'A 9-question screen for symptoms of depression.',
    prompt: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    options: FREQUENCY,
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading the newspaper or watching television',
      'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
      'Thoughts that you would be better off dead or of hurting yourself in some way',
    ],
    // Item 9 > 0 must always surface crisis resources.
    riskItem: 8,
    bands: [
      { max: 4, label: 'Minimal', tone: 'success' },
      { max: 9, label: 'Mild', tone: 'primary' },
      { max: 14, label: 'Moderate', tone: 'tan' },
      { max: 19, label: 'Moderately severe', tone: 'danger' },
      { max: 27, label: 'Severe', tone: 'danger' },
    ],
  },
  'gad-7': {
    id: 'gad-7',
    name: 'GAD-7',
    title: 'Anxiety check (GAD-7)',
    description: 'A 7-question screen for symptoms of anxiety.',
    prompt: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    options: FREQUENCY,
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid, as if something awful might happen',
    ],
    bands: [
      { max: 4, label: 'Minimal', tone: 'success' },
      { max: 9, label: 'Mild', tone: 'primary' },
      { max: 14, label: 'Moderate', tone: 'tan' },
      { max: 21, label: 'Severe', tone: 'danger' },
    ],
  },
};

export const bandFor = (assessment, score) => assessment.bands.find((b) => score <= b.max) ?? assessment.bands.at(-1);
