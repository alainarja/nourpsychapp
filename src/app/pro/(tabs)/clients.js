import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useProData } from '../../../components/pro/useProData';
import { Avatar, Card, EmptyState, Header, Input, Row, Screen, Segmented, styles } from '../../../components/ui';
import { colors } from '../../../theme';
import { shortDate } from '../../../utils/date';

export default function Clients() {
  const { clients } = useProData();
  const [tab, setTab] = useState('active');
  const [query, setQuery] = useState('');

  const active = clients.filter((c) => c.active);
  const past = clients.filter((c) => !c.active);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tab === 'active' ? active : past).filter((c) => !q || c.user.name.toLowerCase().includes(q) || c.user.concern?.toLowerCase().includes(q));
  }, [tab, query, active, past]);

  return (
    <Screen>
      <Header title="My Clients" subtitle="Manage and support your clients." />
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 12 }}
        options={[{ value: 'active', label: `Active (${active.length})` }, { value: 'past', label: `Past (${past.length})` }]}
      />
      <Input icon="search-outline" placeholder="Search clients..." value={query} onChangeText={setQuery} />

      {list.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={query ? 'No matches' : tab === 'active' ? 'No active clients yet' : 'No past clients'}
          message={query ? 'Try a different name.' : 'Clients appear here once they book a session with you.'}
        />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {list.map((c, i) => (
            <Pressable key={c.id} onPress={() => router.push(`/pro/client/${c.id}`)}>
              <Row gap={12} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                <Avatar name={c.user.name} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '700', color: colors.primary }]}>{c.user.name}</Text>
                  {!!c.user.concern && <Text style={styles.muted}>{[c.user.concern, c.user.approach].filter(Boolean).join(' - ')}</Text>}
                  <Text style={[styles.muted, { fontSize: 12 }]}>
                    {c.last ? `Last session: ${shortDate(c.last.date)}` : 'No sessions yet'}
                    {c.next ? ` · Next: ${shortDate(c.next.date)}` : ''}
                  </Text>
                </View>
              </Row>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}
