import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { useProData } from '../../components/pro/useProData';
import { Button, Card, ChipGroup, Header, MenuRow, Screen, SectionTitle, styles } from '../../components/ui';
import { ASSESSMENTS } from '../../data/assessments';
import { comingSoon } from '../../utils/alert';

const WORKSHEETS = [
  { icon: 'git-branch-outline', title: 'Thought record', subtitle: 'Identify and challenge unhelpful thoughts' },
  { icon: 'walk-outline', title: 'Behavioural activation', subtitle: 'Plan valued and pleasant activities' },
  { icon: 'shield-outline', title: 'Safety plan', subtitle: 'Warning signs, coping steps and contacts' },
  { icon: 'moon-outline', title: 'Sleep diary', subtitle: 'Track sleep patterns over two weeks' },
];

export default function ClinicalTools() {
  const { clients } = useProData();
  const [picking, setPicking] = useState(null);
  const [clientId, setClientId] = useState(null);

  return (
    <Screen>
      <Header title="Clinical Tools" subtitle="Forms, assessments and worksheets." back />
      <SectionTitle>Standardised assessments</SectionTitle>
      {Object.values(ASSESSMENTS).map((a) => (
        <Card key={a.id} style={{ marginBottom: 10 }}>
          <Text style={styles.h3}>{a.name}</Text>
          <Text style={styles.muted}>{a.description} {a.questions.length} items, scored 0–{a.questions.length * 3}.</Text>
          {picking === a.id ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Choose client</Text>
              {clients.length ? (
                <ChipGroup small scroll options={clients.map((c) => ({ value: c.id, label: c.user.name }))} value={clientId} onChange={setClientId} />
              ) : (
                <Text style={styles.muted}>No clients yet.</Text>
              )}
              <Button
                small
                title="Start"
                disabled={!clientId}
                style={{ marginTop: 10 }}
                onPress={() => { setPicking(null); router.push(`/assessment/${a.id}?clientId=${clientId}`); }}
              />
            </>
          ) : (
            <Button small variant="secondary" title="Administer to client" style={{ marginTop: 12 }} onPress={() => setPicking(a.id)} />
          )}
        </Card>
      ))}

      <SectionTitle>Worksheet library</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {WORKSHEETS.map((w) => <MenuRow key={w.title} icon={w.icon} title={w.title} subtitle={w.subtitle} onPress={() => comingSoon('Shareable worksheets')} />)}
      </Card>
    </Screen>
  );
}
