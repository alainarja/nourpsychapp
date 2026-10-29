import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, EmptyState, Header, ProductCover, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { notify } from '../../../utils/alert';

const CATEGORY_LABEL = { guides: 'Guide', cards: 'Cards', workshops: 'Recorded workshop' };

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: products, loading } = useCollection('products');
  const { data: users } = useCollection('users');
  const { data: orders } = useCollection('orders');

  const product = products.find((p) => p.id === id);
  const seller = users.find((u) => u.id === product?.sellerId);
  const owned = useMemo(() => orders.some((o) => o.productId === id && o.buyerId === user.id), [orders, id, user.id]);

  if (!product) {
    return (
      <Screen>
        <Header title="Product" back />
        {!loading && <EmptyState title="Product not found" />}
      </Screen>
    );
  }

  const buy = () => router.push({ pathname: '/checkout', params: { type: 'product', productId: product.id } });

  return (
    <Screen
      footer={
        <View style={{ padding: 16, paddingBottom: 24 }}>
          {owned ? (
            <Button title="Open" icon="book-outline" onPress={() => notify('Coming soon', 'Downloading and reading content will be available once the backend is connected.')} />
          ) : (
            <Button title={`Buy for ${product.price}`} onPress={buy} />
          )}
        </View>
      }
    >
      <Header title="" back />
      <ProductCover title={product.title} category={product.category} height={240} />
      <Row style={{ marginTop: 16, justifyContent: 'space-between' }}>
        <Badge label={CATEGORY_LABEL[product.category] ?? product.category} tone="tan" />
        {owned && <Badge label="Owned" tone="success" />}
      </Row>
      <Text style={[styles.h1, { marginTop: 8 }]}>{product.title}</Text>
      {!!product.subtitle && <Text style={styles.subtitle}>{product.subtitle}</Text>}
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary, marginTop: 10 }}>${product.price}</Text>
      <Text style={[styles.body, { marginTop: 12 }]}>{product.description}</Text>

      {seller && (
        <Card style={{ marginTop: 20 }} onPress={seller.role === 'pro' ? () => router.push(`/client/therapist/${seller.id}`) : undefined}>
          <Row gap={12}>
            <Avatar name={seller.name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.muted}>Created by</Text>
              <Text style={styles.h3}>{seller.name}</Text>
              {!!seller.title && <Text style={styles.muted}>{seller.title}</Text>}
            </View>
          </Row>
        </Card>
      )}
    </Screen>
  );
}
