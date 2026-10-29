import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { inMonth, money, orderRevenue, useProData } from '../../components/pro/useProData';
import { Button, Card, EmptyState, Header, ProductCover, Row, Screen, Segmented, StatCard, styles } from '../../components/ui';
import { db } from '../../db/db';
import { colors } from '../../theme';
import { confirm } from '../../utils/alert';

export default function ProMarketplace() {
  const { myProducts, myOrders, productsById, usersById } = useProData();
  const [tab, setTab] = useState('products');

  const remove = (p) => confirm('Delete product?', `"${p.title}" will be removed from the marketplace.`, () => db.remove('products', p.id), 'Delete', true);

  return (
    <Screen>
      <Header title="Marketplace" subtitle="Share your knowledge." back />
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 14 }}
        options={[{ value: 'products', label: 'My Products' }, { value: 'orders', label: 'Orders' }, { value: 'earnings', label: 'Earnings' }]}
      />

      {tab === 'products' && (
        <>
          {myProducts.length === 0 ? (
            <EmptyState icon="book-outline" title="No products yet" message="Sell guides, worksheets, cards or recorded workshops." />
          ) : (
            myProducts.map((p) => (
              <Card key={p.id} style={{ marginBottom: 10, padding: 12 }}>
                <Row gap={12}>
                  <View style={{ width: 72 }}><ProductCover title={p.title} category={p.category} height={80} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.body, { fontWeight: '700', color: colors.primary }]}>{p.title}</Text>
                    {!!p.subtitle && <Text style={styles.muted}>{p.subtitle}</Text>}
                    <Text style={[styles.body, { fontWeight: '700', marginTop: 4 }]}>${p.price}</Text>
                  </View>
                  <View style={{ gap: 14 }}>
                    <Pressable hitSlop={8} onPress={() => router.push(`/pro/product-form?id=${p.id}`)}>
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => remove(p)}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                </Row>
              </Card>
            ))
          )}
          <Button title="Add New Product" icon="add" onPress={() => router.push('/pro/product-form')} style={{ marginTop: 8 }} />
        </>
      )}

      {tab === 'orders' && (myOrders.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {myOrders.map((o, i) => (
            <Row key={o.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '600' }]}>{productsById[o.productId]?.title ?? 'Removed product'}</Text>
                <Text style={styles.muted}>{usersById[o.buyerId]?.name ?? 'Customer'} · {new Date(o.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={{ fontWeight: '700', color: colors.success }}>+${o.price}</Text>
            </Row>
          ))}
        </Card>
      ))}

      {tab === 'earnings' && (
        <>
          <Row gap={10}>
            <StatCard value={money(orderRevenue(myOrders, inMonth(0)))} label="This month" />
            <StatCard value={money(orderRevenue(myOrders))} label="All time" />
            <StatCard value={myOrders.length} label="Orders" />
          </Row>
          <Text style={[styles.muted, { marginTop: 12 }]}>Payments are simulated in offline mode.</Text>
        </>
      )}
    </Screen>
  );
}
