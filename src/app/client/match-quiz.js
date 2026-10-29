import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, ChipGroup, Header, Rating, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGES } from '../../db/actions';
import { useCollection } from '../../db/db';
import { colors, radius } from '../../theme';

const CONCERNS = ['Anxiety', 'Depression', 'Stress', 'Relationships', 'Self-esteem', 'Trauma', 'Family', 'Grief', 'ADHD', 'Life Transitions', 'Medication'];
const opts = (list) => list.map((v) => ({ value: v, label: v }));

const STEPS = [
  { key: 'concerns', title: 'What brings you here?', hint: 'Choose all that apply.', multi: true, options: opts(CONCERNS) },
  {
    key: 'type', title: 'What kind of support?', hint: 'Psychiatrists can prescribe medication; psychologists focus on talking therapy.',
    options: [{ value: 'psychologist', label: 'Talking therapy (psychologist)' }, { value: 'psychiatrist', label: 'Medication support (psychiatrist)' }, { value: 'any', label: "I'm not sure" }],
  },
  { key: 'mode', title: 'How would you like to meet?', options: [{ value: 'online', label: 'Online' }, { value: 'in-person', label: 'In-person' }, { value: 'any', label: 'Either' }] },
  { key: 'languages', title: 'Which languages are you comfortable in?', multi: true, options: opts(LANGUAGES) },
  { key: 'budget', title: "What's your budget per session?", options: [{ value: 50, label: 'Up to $50' }, { value: 75, label: 'Up to $75' }, { value: 100, label: 'Up to $100' }, { value: 0, label: 'Any' }] },
];

const DEFAULTS = { concerns: [], type: 'any', mode: 'any', languages: ['English'], budget: 0 };

// Weighted score out of 100 plus human-readable reasons.
function scorePro(pro, a) {
  const reasons = [];
  let score = 0;
  const specs = pro.specialties ?? [];

  const overlap = a.concerns.filter((c) => specs.includes(c));
  score += a.concerns.length ? (overlap.length / a.concerns.length) * 40 : 20;
  if (overlap.length) reasons.push(`helps with ${overlap.slice(0, 2).join(' & ')}`);

  if (a.type === 'any' || pro.proType === a.type) {
    score += 15;
    if (a.type !== 'any') reasons.push(a.type === 'psychiatrist' ? 'can prescribe' : 'talking therapy');
  }

  const modes = pro.sessionTypes ?? ['online'];
  if (a.mode === 'any' || modes.includes(a.mode)) {
    score += 15;
    if (a.mode !== 'any') reasons.push(a.mode === 'online' ? 'offers online' : 'offers in-person');
  }

  const langs = a.languages.filter((l) => pro.languages?.includes(l));
  if (!a.languages.length || langs.length) {
    score += 15;
    const nonEnglish = langs.filter((l) => l !== 'English');
    if (nonEnglish.length) reasons.push(`speaks ${nonEnglish.join(', ')}`);
  }

  if (!a.budget || (pro.price ?? 0) <= a.budget) {
    score += 10;
    if (a.budget) reasons.push(`within budget ($${pro.price})`);
  }

  score += ((pro.rating ?? 4) / 5) * 3 + (pro.verified ? 2 : 0);
  return { score: Math.round(Math.min(score, 100)), reasons };
}

export default function MatchQuiz() {
  const { user, updateProfile } = useAuth();
  const { data: users } = useCollection('users');
  const [answers, setAnswers] = useState({ ...DEFAULTS, ...(user.matchPrefs ?? {}) });
  const [step, setStep] = useState(0);
  const done = step >= STEPS.length;

  const results = useMemo(() => {
    if (!done) return [];
    return users
      .filter((u) => u.role === 'pro' && !u.suspended)
      .map((pro) => ({ pro, ...scorePro(pro, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [done, users, answers]);

  const current = STEPS[step];
  const canNext = !current?.multi || current.key !== 'concerns' || answers.concerns.length > 0;

  const next = async () => {
    if (step === STEPS.length - 1) await updateProfile({ matchPrefs: answers });
    setStep((s) => s + 1);
  };

  if (done) {
    return (
      <Screen>
        <Header title="Your matches" subtitle="Based on what you told us. You can always browse everyone." back />
        <View style={{ gap: 12 }}>
          {results.map(({ pro, score, reasons }, i) => (
            <Card key={pro.id} onPress={() => router.push(`/client/therapist/${pro.id}`)}>
              <Row gap={12}>
                <Avatar name={pro.name} size={52} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[styles.h3, { flexShrink: 1 }]}>{pro.name}</Text>
                    <Badge label={`${score}% match`} tone={i === 0 ? 'success' : 'primary'} />
                  </Row>
                  <Text style={styles.muted}>{pro.title} · ${pro.price}</Text>
                  <View style={{ marginTop: 4 }}><Rating value={pro.rating} count={pro.reviews} /></View>
                </View>
              </Row>
              {reasons.length > 0 && (
                <Row style={{ marginTop: 10, alignItems: 'flex-start' }} gap={6}>
                  <Ionicons name="sparkles-outline" size={14} color={colors.tan} style={{ marginTop: 2 }} />
                  <Text style={[styles.muted, { flex: 1 }]}>Why: {reasons.join(', ')}</Text>
                </Row>
              )}
            </Card>
          ))}
        </View>
        <Button title="Retake quiz" variant="outline" style={{ marginTop: 16 }} onPress={() => setStep(0)} />
        <Button title="Browse all professionals" variant="ghost" onPress={() => router.replace('/client/find-match')} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={{ padding: 16, paddingBottom: 24, flexDirection: 'row', gap: 10 }}>
          {step > 0 && <Button title="Back" variant="outline" style={{ flex: 1 }} onPress={() => setStep((s) => s - 1)} />}
          <Button title={step === STEPS.length - 1 ? 'See my matches' : 'Next'} style={{ flex: 2 }} disabled={!canNext} onPress={next} />
        </View>
      }
    >
      <Header title="Find your match" back />
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.tanSoft, overflow: 'hidden', marginBottom: 6 }}>
        <View style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
      </View>
      <Text style={styles.muted}>Step {step + 1} of {STEPS.length}</Text>

      <Text style={[styles.h2, { marginTop: 20 }]}>{current.title}</Text>
      {!!current.hint && <Text style={[styles.muted, { marginTop: 4 }]}>{current.hint}</Text>}
      <View style={{ marginTop: 18 }}>
        <ChipGroup
          multi={current.multi}
          options={current.options}
          value={answers[current.key]}
          onChange={(v) => setAnswers((a) => ({ ...a, [current.key]: v }))}
        />
      </View>
      <Text style={[styles.muted, { marginTop: 24 }]}>Your answers stay on this device and are only used to suggest professionals.</Text>
    </Screen>
  );
}
