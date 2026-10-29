import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ROLE_LABEL, ROLE_TONE } from '../../../components/admin/shared';
import { Avatar, Badge, Card, ChipGroup, EmptyState, Header, Input, Row, Screen, styles } from '../../../components/ui';
import { useCollection } from '../../../db/db';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'client', label: 'Clients' },
  { value: 'pro', label: 'Professionals' },
  { value: 'org', label: 'Organizations' },
  { value: 'admin', label: 'Admins' },
  { value: 'suspended', label: 'Suspended' },
];

export default function AdminUsers() {
  const { data: users } = useCollection('users');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => (filter === 'all' ? true : filter === 'suspended' ? u.suspended : u.role === filter))
      .filter((u) => !term || u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, q, filter]);

  return (
    <Screen>
      <Header title="Users" subtitle={`${users.length} accounts`} />
      <Input icon="search-outline" placeholder="Search by name or email" value={q} onChangeText={setQ} autoCapitalize="none" />
      <View style={{ marginBottom: 12 }}>
        <ChipGroup scroll small options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      {list.length === 0 ? <EmptyState icon="search-outline" title="No users match" /> : list.map((u) => (
        <Card key={u.id} style={{ marginBottom: 8, paddingVertical: 12 }} onPress={() => router.push(`/admin/user/${u.id}`)}>
          <Row gap={12}>
            <Avatar name={u.name} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '600' }]} numberOfLines={1}>{u.name}</Text>
              <Text style={styles.muted} numberOfLines={1}>{u.email}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Badge label={ROLE_LABEL[u.role] ?? u.role} tone={ROLE_TONE[u.role] ?? 'muted'} />
              {u.suspended && <Badge label="Suspended" tone="danger" />}
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
