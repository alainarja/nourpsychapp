import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Card, ChipGroup, EmptyState, Header, Input, Rating, Row, Screen, Segmented, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { db, useCollection } from '../../db/db';
import { colors } from '../../theme';

const FILTERS = ['All', 'Favorites', 'Anxiety', 'Depression', 'Relationships', 'Stress', 'Trauma', 'Family', 'Adolescents', 'ADHD'].map((v) => ({ value: v, label: v }));

export default function FindMatch() {
  const { user } = useAuth();
  const { data: users } = useCollection('users');
  const { data: favorites } = useCollection('favorites');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [type, setType] = useState('all');

  const favSet = useMemo(() => new Set(favorites.filter((f) => f.userId === user.id).map((f) => f.proId)), [favorites, user.id]);

  const pros = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.role === 'pro')
      .filter((u) => type === 'all' || u.proType === type)
      .filter((u) => filter === 'All' || (filter === 'Favorites' ? favSet.has(u.id) : u.specialties?.includes(filter)))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.specialties?.some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [users, query, filter, type, favSet]);

  const toggleFav = async (proId) => {
    const existing = favorites.find((f) => f.userId === user.id && f.proId === proId);
    if (existing) await db.remove('favorites', existing.id);
    else await db.insert('favorites', { userId: user.id, proId });
  };

  return (
    <Screen>
      <Header title="Find My Match" subtitle="Personalized support for your needs." back />
      <Card onPress={() => router.push('/client/match-quiz')} style={{ marginBottom: 12, paddingVertical: 12, backgroundColor: colors.primary, borderColor: colors.primary }}>
        <Row gap={10}>
          <Ionicons name="sparkles" size={20} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 15 }}>Take the match quiz</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>5 quick questions to find your best fit</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </Row>
      </Card>
      <Input icon="search-outline" placeholder="Search by name or specialty" value={query} onChangeText={setQuery} />
      <Segmented
        value={type}
        onChange={setType}
        style={{ marginBottom: 10 }}
        options={[{ value: 'all', label: 'All' }, { value: 'psychologist', label: 'Psychologists' }, { value: 'psychiatrist', label: 'Psychiatrists' }]}
      />
      <ChipGroup scroll small options={FILTERS} value={filter} onChange={setFilter} />

      <View style={{ gap: 12, marginTop: 14 }}>
        {pros.length === 0 && <EmptyState icon="search-outline" title="No matches" message="Try another filter or search term." />}
        {pros.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/client/therapist/${p.id}`)}>
            <Row gap={12} style={{ alignItems: 'flex-start' }}>
              <Avatar name={p.name} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>{p.name}</Text>
                <Text style={styles.muted}>{p.title}</Text>
                {!!p.specialties?.length && <Text style={[styles.muted, { marginTop: 2 }]} numberOfLines={1}>{p.specialties.join(', ')}</Text>}
                <Row style={{ marginTop: 6 }} gap={10}>
                  <Rating value={p.rating} count={p.reviews} />
                  <Text style={styles.muted}>${p.price}/session</Text>
                </Row>
              </View>
              <Pressable onPress={() => toggleFav(p.id)} hitSlop={10}>
                <Ionicons name={favSet.has(p.id) ? 'heart' : 'heart-outline'} size={22} color={favSet.has(p.id) ? colors.danger : colors.primary} />
              </Pressable>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
