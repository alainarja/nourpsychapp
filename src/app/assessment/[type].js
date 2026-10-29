import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, Header, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ASSESSMENTS, bandFor } from '../../data/assessments';
import { db } from '../../db/db';
import { colors, radius } from '../../theme';

// Self-assessment for clients, or in-session scoring by a professional (?clientId=...).
export default function Assessment() {
  const { type, clientId } = useLocalSearchParams();
  const { user } = useAuth();
  const a = ASSESSMENTS[type];
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  if (!a) return <Screen><Header title="Assessment" back /><EmptyState title="Assessment not found" /></Screen>;

  const done = Object.keys(answers).length === a.questions.length;

  const submit = async () => {
    const score = Object.values(answers).reduce((s, v) => s + v, 0);
    const band = bandFor(a, score);
    const risk = a.riskItem != null && answers[a.riskItem] > 0;
    await db.insert('assessments', {
      type: a.id, score, band: band.label, risk,
      answers: a.questions.map((_, i) => answers[i]),
      userId: clientId ?? user.id,
      administeredBy: clientId ? user.id : null,
    });
    setResult({ score, band, risk });
  };

  if (result) {
    const max = a.questions.length * 3;
    return (
      <Screen>
        <Header title={a.title} back />
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={styles.muted}>Total score</Text>
          <Text style={{ fontSize: 48, fontWeight: '700', color: colors.primary }}>{result.score}<Text style={{ fontSize: 20, color: colors.muted }}> / {max}</Text></Text>
          <Badge label={result.band.label} tone={result.band.tone} />
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 14 }]}>
            This is a screening tool, not a diagnosis. {clientId ? 'Result saved to the client record.' : 'Consider sharing your result with your therapist.'}
          </Text>
        </Card>
        {result.risk && (
          <Card style={{ marginTop: 16, backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft }}>
            <Text style={[styles.h3, { color: colors.danger }]}>{clientId ? 'Risk item endorsed' : "You don't have to face this alone"}</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>
              {clientId
                ? 'The client endorsed thoughts of self-harm (item 9). Complete a risk assessment and safety plan.'
                : 'You mentioned thoughts of hurting yourself. Please reach out for support right now.'}
            </Text>
            {!clientId && <Button title="Get help now" icon="call" style={{ marginTop: 12, backgroundColor: colors.danger }} onPress={() => router.push('/crisis')} />}
          </Card>
        )}
        <Button title="Done" style={{ marginTop: 20 }} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen footer={<View style={{ padding: 16, paddingBottom: 24 }}><Button title="See my result" disabled={!done} onPress={submit} /></View>}>
      <Header title={a.title} subtitle={a.prompt} back />
      {a.questions.map((q, i) => (
        <Card key={i} style={{ marginBottom: 12 }}>
          <Text style={[styles.body, { fontWeight: '600', marginBottom: 10 }]}>{i + 1}. {q}</Text>
          <View style={{ gap: 6 }}>
            {a.options.map((o) => {
              const active = answers[i] === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => setAnswers((s) => ({ ...s, [i]: o.value }))}
                  style={{ padding: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.card }}
                >
                  <Text style={{ color: active ? colors.primary : colors.text, fontWeight: active ? '700' : '400' }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
