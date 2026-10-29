import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, ChipGroup, EmptyState, Header, ProductCover, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../db/db';
import { colors, radius, shadow } from '../../../theme';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'guides', label: 'Guides' },
  { value: 'workshops', label: 'Workshops' },
  { value: 'cards', label: 'Cards' },
];

export default function Explore() {
  const { user } = useAuth();
  const { data: products } = useCollection('products');
  const { data: orders } = useCollection('orders');
  const [category, setCategory] = useState('all');

  const owned = useMemo(() => new Set(orders.filter((o) => o.buyerId === user.id).map((o) => o.productId)), [orders, user.id]);
  const list = useMemo(
    () => products.filter((p) => !p.archived && (category === 'all' || p.category === category)),
    [products, category],
  );

  return (
    <Screen>
      <Header title="Marketplace" subtitle="Tools for a calmer, stronger you." />

      <Pressable
        onPress={() => router.push('/client/workshops')}
        style={({ pressed }) => [{ backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, ...shadow }, pressed && { opacity: 0.9 }]}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="easel-outline" size={22} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>Workshops</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Live and recorded events with our experts</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.white} />
      </Pressable>

      <ChipGroup options={CATEGORIES} value={category} onChange={setCategory} scroll />

      {list.length === 0 ? (
        <EmptyState icon="bag-handle-outline" title="Nothing here yet" message="Check back soon for new resources." />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
          {list.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/client/product/${p.id}`)}
              style={({ pressed }) => [{ width: '48%', flexGrow: 1, maxWidth: '50%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 10, borderWidth: 1, borderColor: colors.border, ...shadow }, pressed && { opacity: 0.85 }]}
            >
              <ProductCover title={p.title} category={p.category} />
              <Text style={[styles.body, { fontWeight: '700', marginTop: 8 }]} numberOfLines={2}>{p.title}</Text>
              <Text style={styles.muted} numberOfLines={1}>{p.subtitle}</Text>
              <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontWeight: '700', color: colors.primary, fontSize: 16 }}>${p.price}</Text>
                {owned.has(p.id) && <Badge label="Owned" tone="success" />}
              </Row>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
