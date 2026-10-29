import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Badge, ChipGroup, EmptyState, Header, ProductCover, Row, Screen, Segmented, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { CATEGORIES, RESOURCE_TYPES, WORKSHOP_FORMATS, isAvailable, workshopWhen } from '../../../data/marketplace';
import { useCollection } from '../../../db/db';
import { colors, radius, shadow } from '../../../theme';

const RESOURCE_FILTERS = [{ value: 'all', label: 'All' }, ...RESOURCE_TYPES.filter((t) => t.value !== 'other')];
const WORKSHOP_FILTERS = [{ value: 'all', label: 'All' }, ...WORKSHOP_FORMATS];

const byDate = (a, b) => (a.format === 'live' ? a.date + a.time : 'z').localeCompare(b.format === 'live' ? b.date + b.time : 'z');

export default function Marketplace() {
  const { section: initialSection } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: products } = useCollection('products');
  const { data: orders } = useCollection('orders');
  const { data: users } = useCollection('users');
  const [section, setSection] = useState(initialSection === 'resource' ? 'resource' : 'workshop');
  const [filter, setFilter] = useState('all');

  const owned = useMemo(() => new Set(orders.filter((o) => o.buyerId === user.id).map((o) => o.productId)), [orders, user.id]);
  const list = useMemo(() => {
    const key = section === 'workshop' ? 'format' : 'resourceType';
    const items = products.filter((p) => p.category === section && isAvailable(p) && (filter === 'all' || p[key] === filter));
    return section === 'workshop' ? items.sort(byDate) : items;
  }, [products, section, filter]);

  const changeSection = (s) => {
    setSection(s);
    setFilter('all');
  };

  return (
    <Screen>
      <Header title="Marketplace" subtitle="Workshops and resources for a calmer, stronger you." />
      <Segmented options={CATEGORIES} value={section} onChange={changeSection} style={{ marginBottom: 12 }} />
      <ChipGroup options={section === 'workshop' ? WORKSHOP_FILTERS : RESOURCE_FILTERS} value={filter} onChange={setFilter} scroll small />

      {list.length === 0 ? (
        <EmptyState icon={section === 'workshop' ? 'easel-outline' : 'book-outline'} title="Nothing here yet" message="New workshops and resources are added regularly." />
      ) : section === 'workshop' ? (
        <View style={{ gap: 12, marginTop: 14 }}>
          {list.map((p) => {
            const host = users.find((u) => u.id === p.sellerId);
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/client/product/${p.id}`)}
                style={({ pressed }) => [{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow }, pressed && { opacity: 0.85 }]}
              >
                <Row gap={12} style={{ alignItems: 'flex-start' }}>
                  <Avatar name={host?.name ?? 'Shift Thrive'} size={56} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>{p.title}</Text>
                    <Text style={styles.muted}>{host?.name}</Text>
                    <Row gap={6} style={{ marginTop: 4 }}>
                      <Ionicons name={p.format === 'live' ? 'calendar-outline' : 'play-circle-outline'} size={14} color={colors.muted} />
                      <Text style={styles.muted}>{workshopWhen(p)}{p.format === 'live' ? ` · ${p.mode === 'in-person' ? 'In-person' : 'Online'}` : ''}</Text>
                    </Row>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge label={p.format === 'live' ? 'Live' : 'Recorded'} tone={p.format === 'live' ? 'primary' : 'tan'} />
                    {owned.has(p.id) ? <Badge label={p.format === 'live' ? 'Registered' : 'Owned'} tone="success" /> : <Text style={{ fontWeight: '700', color: colors.primary }}>{p.price ? `$${p.price}` : 'Free'}</Text>}
                  </View>
                </Row>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
          {list.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/client/product/${p.id}`)}
              style={({ pressed }) => [{ width: '48%', flexGrow: 1, maxWidth: '50%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 10, borderWidth: 1, borderColor: colors.border, ...shadow }, pressed && { opacity: 0.85 }]}
            >
              <ProductCover product={p} />
              <Text style={[styles.body, { fontWeight: '700', marginTop: 8 }]} numberOfLines={2}>{p.title}</Text>
              <Text style={styles.muted} numberOfLines={1}>{p.subtitle}</Text>
              <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontWeight: '700', color: colors.primary, fontSize: 16 }}>{p.price ? `$${p.price}` : 'Free'}</Text>
                {owned.has(p.id) && <Badge label="Owned" tone="success" />}
              </Row>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
