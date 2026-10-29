import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Button, Card, EmptyState, Header, Input, Rating, Row, Screen, SectionTitle, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { confirm } from '../../../utils/alert';

function ProRow({ pro, right }) {
  return (
    <Row gap={12} style={{ paddingVertical: 10 }}>
      <Avatar name={pro.name} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.body, { fontWeight: '600' }]}>{pro.name}</Text>
        <Text style={styles.muted} numberOfLines={1}>{pro.title} · {(pro.specialties ?? []).slice(0, 3).join(', ')}</Text>
        <Rating value={pro.rating} count={pro.reviews} size={12} />
      </View>
      {right}
    </Row>
  );
}

export default function Providers() {
  const { user: org, updateProfile } = useAuth();
  const { data: users } = useCollection('users');
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');

  const proIds = org?.proIds ?? [];
  const pros = useMemo(() => users.filter((u) => u.role === 'pro'), [users]);
  const affiliated = pros.filter((p) => proIds.includes(p.id));
  const term = q.trim().toLowerCase();
  const directory = pros
    .filter((p) => p.verified && !proIds.includes(p.id))
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.specialties ?? []).some((s) => s.toLowerCase().includes(term)));

  if (!org) return null;

  const add = (p) => updateProfile({ proIds: [...proIds, p.id] });
  const remove = (p) => confirm('Remove provider?', `${p.name} will no longer be part of ${org.name}'s network. Members keep any sessions already booked.`, () => updateProfile({ proIds: proIds.filter((id) => id !== p.id) }), 'Remove', true);

  return (
    <Screen>
      <Header title="Providers" subtitle="Professionals your members can book with sponsored sessions." />

      <SectionTitle>Your network ({affiliated.length})</SectionTitle>
      {affiliated.length === 0 ? (
        <EmptyState icon="medkit-outline" title="No providers yet" message="Add verified professionals from the directory." />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {affiliated.map((p, i) => (
            <View key={p.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <ProRow pro={p} right={
                <Pressable hitSlop={8} onPress={() => remove(p)}>
                  <Ionicons name="remove-circle-outline" size={22} color={colors.danger} />
                </Pressable>
              } />
            </View>
          ))}
        </Card>
      )}

      {adding ? (
        <>
          <SectionTitle action="Done" onAction={() => setAdding(false)}>Add from directory</SectionTitle>
          <Input icon="search-outline" placeholder="Search name or specialty" value={q} onChangeText={setQ} />
          {directory.length === 0 ? (
            <EmptyState icon="search-outline" title="No more verified professionals" />
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {directory.map((p, i) => (
                <View key={p.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                  <ProRow pro={p} right={<Button small variant="secondary" icon="add" title="Add" onPress={() => add(p)} />} />
                </View>
              ))}
            </Card>
          )}
          <Text style={[styles.muted, { marginTop: 8 }]}>Only verified professionals can join an organization network.</Text>
        </>
      ) : (
        <Button variant="secondary" icon="add" title="Add from directory" style={{ marginTop: 16 }} onPress={() => setAdding(true)} />
      )}
    </Screen>
  );
}
