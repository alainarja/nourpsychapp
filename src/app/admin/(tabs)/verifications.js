import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { VERIFICATION_LABEL } from '../../../components/admin/shared';
import { Avatar, Badge, Card, EmptyState, Header, Row, Screen, Segmented, styles } from '../../../components/ui';
import { useCollection } from '../../../db/db';

const TABS = ['pending', 'approved', 'rejected'];

export default function Verifications() {
  const { data: users } = useCollection('users');
  const [tab, setTab] = useState('pending');

  const pros = useMemo(() => users.filter((u) => u.role === 'pro'), [users]);
  const counts = Object.fromEntries(TABS.map((t) => [t, pros.filter((p) => (p.verificationStatus ?? 'not_submitted') === t).length]));
  const list = pros
    .filter((p) => (p.verificationStatus ?? 'not_submitted') === tab)
    .sort((a, b) => (b.verificationSubmittedAt ?? b.createdAt ?? '').localeCompare(a.verificationSubmittedAt ?? a.createdAt ?? ''));
  const notSubmitted = pros.filter((p) => (p.verificationStatus ?? 'not_submitted') === 'not_submitted').length;

  return (
    <Screen>
      <Header title="Verifications" subtitle="Review professional licenses before they can take clients." />
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 14 }}
        options={TABS.map((t) => ({ value: t, label: `${VERIFICATION_LABEL[t][0]} (${counts[t]})` }))}
      />
      {list.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title={tab === 'pending' ? 'All caught up' : 'Nothing here'} message={tab === 'pending' ? 'No documents waiting for review.' : undefined} />
      ) : list.map((p) => (
        <Card key={p.id} style={{ marginBottom: 10 }} onPress={() => router.push(`/admin/verification/${p.id}`)}>
          <Row gap={12}>
            <Avatar name={p.name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '700' }]}>{p.name}</Text>
              <Text style={styles.muted}>{p.title} · {p.proType === 'psychiatrist' ? 'Psychiatrist' : 'Psychologist'}</Text>
              <Text style={styles.muted}>License {p.license || '—'} · {(p.verificationDocs ?? []).length} documents</Text>
            </View>
            <Badge label={VERIFICATION_LABEL[tab][0]} tone={VERIFICATION_LABEL[tab][1]} />
          </Row>
        </Card>
      ))}
      {notSubmitted > 0 && <Text style={[styles.muted, { textAlign: 'center', marginTop: 8 }]}>{notSubmitted} professionals haven't submitted documents yet.</Text>}
    </Screen>
  );
}
