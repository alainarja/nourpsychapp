import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Card, EmptyState, Header, ProductCover, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../db/db';
import { colors } from '../../theme';
import { dateKey, shortDate } from '../../utils/date';

export default function Purchases() {
  const { user } = useAuth();
  const { data: orders } = useCollection('orders');
  const { data: products } = useCollection('products');

  const mine = useMemo(
    () => orders.filter((o) => o.buyerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, user.id],
  );

  return (
    <Screen>
      <Header title="My Purchases" subtitle="Your guides, tools and recordings." back />
      {mine.length === 0 ? (
        <EmptyState icon="bag-handle-outline" title="No purchases yet" action="Browse Marketplace" onAction={() => router.push('/client/explore')} />
      ) : (
        <View style={{ gap: 12 }}>
          {mine.map((o) => {
            const p = products.find((x) => x.id === o.productId);
            return (
              <Card key={o.id} onPress={p ? () => router.push(`/client/product/${p.id}`) : undefined}>
                <Row gap={12}>
                  <View style={{ width: 64 }}><ProductCover title={p?.title ?? ''} category={p?.category} height={72} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>{p?.title ?? 'Removed product'}</Text>
                    <Text style={styles.muted}>Purchased {shortDate(dateKey(new Date(o.createdAt)))}</Text>
                  </View>
                  <Text style={{ fontWeight: '700', color: colors.primary }}>${o.price}</Text>
                </Row>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
