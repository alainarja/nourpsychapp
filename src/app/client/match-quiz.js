import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, ChipGroup, Header, Input, Rating, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ANY, QUIZ, QUIZ_DEFAULTS, findMatches } from '../../data/matching';
import { useCollection } from '../../db/db';
import { colors, radius } from '../../theme';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const MAX_REASONS = 4;

// "Other / Not sure" is exclusive, and at most `max` concerns can be picked.
function nextConcerns(prev, next, max) {
  const added = next.find((v) => !prev.includes(v));
  if (added === ANY) return [ANY];
  const picked = next.filter((v) => v !== ANY);
  return picked.length > max ? prev : picked;
}

export default function MatchQuiz() {
  const { user, updateProfile } = useAuth();
  const { data: users } = useCollection('users');
  // Answers saved by the old 5-question quiz don't fit these questions, so they're ignored.
  const [answers, setAnswers] = useState(() => {
    const saved = user.matchPrefs?.version === 2 ? user.matchPrefs : {};
    const { version, ...rest } = saved;
    return { ...QUIZ_DEFAULTS, ...rest };
  });
  const [step, setStep] = useState(0);
  const done = step >= QUIZ.length;

  const { exact, results } = useMemo(() => {
    if (!done) return { exact: true, results: [] };
    return findMatches(users.filter((u) => u.role === 'pro' && !u.suspended), answers);
  }, [done, users, answers]);

  const current = QUIZ[step];
  const value = answers[current?.key];
  const canNext = current?.multi ? value.length > 0 : value != null;

  const change = (v) => setAnswers((a) => ({ ...a, [current.key]: current.multi ? nextConcerns(a[current.key], v, current.max) : v }));

  const next = async () => {
    if (step === QUIZ.length - 1) await updateProfile({ matchPrefs: { ...answers, version: 2 } });
    setStep((s) => s + 1);
  };

  if (done) {
    return (
      <Screen>
        <Header title="Your matches" subtitle="Based on what you told us. You can always browse everyone." back />
        {!exact && (
          <Card style={{ marginBottom: 12, backgroundColor: colors.tanSoft, borderColor: colors.tanSoft }}>
            <Text style={styles.body}>No one matches all of your answers yet. These are the closest professionals.</Text>
          </Card>
        )}
        <View style={{ gap: 12 }}>
          {results.map(({ pro, reasons }, i) => (
            <Card key={pro.id} onPress={() => router.push(`/client/therapist/${pro.id}`)}>
              <Row gap={12}>
                <Avatar name={pro.name} size={52} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[styles.h3, { flexShrink: 1 }]}>{pro.name}</Text>
                    {i === 0 && exact && <Badge label="Best match" tone="success" />}
                  </Row>
                  <Text style={styles.muted}>{pro.title} · ${pro.price}</Text>
                  <View style={{ marginTop: 4 }}><Rating value={pro.rating} count={pro.reviews} /></View>
                </View>
              </Row>
              {reasons.length > 0 && (
                <View style={{ marginTop: 10, gap: 4 }}>
                  {reasons.slice(0, MAX_REASONS).map((r) => (
                    <Row key={r} gap={6} style={{ alignItems: 'flex-start' }}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={colors.tan} style={{ marginTop: 2 }} />
                      <Text style={[styles.muted, { flex: 1 }]}>{capitalize(r)}</Text>
                    </Row>
                  ))}
                  {reasons.length > MAX_REASONS && <Text style={[styles.muted, { marginLeft: 20 }]}>+{reasons.length - MAX_REASONS} more</Text>}
                </View>
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
          <Button title={step === QUIZ.length - 1 ? 'See my matches' : 'Next'} style={{ flex: 2 }} disabled={!canNext} onPress={next} />
        </View>
      }
    >
      <Header title="Find your match" back />
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.tanSoft, overflow: 'hidden', marginBottom: 6 }}>
        <View style={{ width: `${((step + 1) / QUIZ.length) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
      </View>
      <Text style={styles.muted}>Step {step + 1} of {QUIZ.length}</Text>

      <Text style={[styles.h2, { marginTop: 20 }]}>{current.title}</Text>
      {!!current.hint && <Text style={[styles.muted, { marginTop: 4 }]}>{current.hint}</Text>}
      <View style={{ marginTop: 18 }}>
        <ChipGroup multi={current.multi} options={current.options} value={value} onChange={change} />
      </View>
      {current.key === 'mode' && answers.mode === 'in-person' && (
        <View style={{ marginTop: 18 }}>
          <Input
            label="Preferred city or area"
            icon="location-outline"
            placeholder="e.g. Beirut"
            value={answers.city}
            onChangeText={(city) => setAnswers((a) => ({ ...a, city }))}
          />
        </View>
      )}
      <Text style={[styles.muted, { marginTop: 24 }]}>Your answers stay on this device and are only used to suggest professionals.</Text>
    </Screen>
  );
}
