import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MARKETPLACE_COMMISSION_RATE, commissionOf, inMonth, money, orderRevenue, useProData } from '../../../components/pro/useProData';
import { Badge, Button, Card, EmptyState, Header, ProductCover, Row, Screen, Segmented, SectionTitle, StatCard, styles } from '../../../components/ui';
import { isLive, isWorkshop, kindLabel, workshopWhen } from '../../../data/marketplace';
import { db } from '../../../db/db';
import { colors } from '../../../theme';
import { confirm } from '../../../utils/alert';

function ProductRow({ product: p, sold, onEdit, onDelete }) {
  return (
    <Card style={{ marginBottom: 10, padding: 12 }}>
      <Row gap={12}>
        <View style={{ width: 72 }}><ProductCover product={p} height={80} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.body, { fontWeight: '700', color: colors.primary }]}>{p.title}</Text>
          <Text style={styles.muted}>{isWorkshop(p) ? workshopWhen(p) : p.subtitle}</Text>
          <Row gap={6} style={{ marginTop: 6, flexWrap: 'wrap' }}>
            <Badge label={kindLabel(p)} tone={isLive(p) ? 'primary' : 'tan'} />
            <Badge label={p.price ? `$${p.price}` : 'Free'} tone="muted" />
            {isLive(p) && <Badge label={`${sold}${p.seats ? ` / ${p.seats}` : ''} registered`} tone="success" />}
          </Row>
        </View>
        <View style={{ gap: 14 }}>
          <Pressable hitSlop={8} onPress={onEdit}><Ionicons name="create-outline" size={20} color={colors.primary} /></Pressable>
          <Pressable hitSlop={8} onPress={onDelete}><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>
        </View>
      </Row>
    </Card>
  );
}

function MoneyRow({ label, value, strong, tone = colors.text }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={[styles.body, strong && { fontWeight: '700' }]}>{label}</Text>
      <Text style={[styles.body, { fontWeight: strong ? '700' : '600', color: tone }]}>{value}</Text>
    </Row>
  );
}

export default function ProMarketplace() {
  const { myProducts, myOrders, productsById, usersById } = useProData();
  const [tab, setTab] = useState('products');

  const soldCount = useMemo(() => {
    const counts = {};
    myOrders.forEach((o) => (counts[o.productId] = (counts[o.productId] ?? 0) + 1));
    return counts;
  }, [myOrders]);
  const workshops = myProducts.filter(isWorkshop);
  const resources = myProducts.filter((p) => !isWorkshop(p));

  const gross = orderRevenue(myOrders);
  const grossMonth = orderRevenue(myOrders, inMonth(0));
  const rateLabel = MARKETPLACE_COMMISSION_RATE == null ? 'to be confirmed' : `${Math.round(MARKETPLACE_COMMISSION_RATE * 100)}%`;

  const remove = (p) => confirm('Delete product?', `"${p.title}" will be removed from the marketplace.`, () => db.remove('products', p.id), 'Delete', true);
  const row = (p) => (
    <ProductRow key={p.id} product={p} sold={soldCount[p.id] ?? 0} onEdit={() => router.push(`/pro/product-form?id=${p.id}`)} onDelete={() => remove(p)} />
  );

  return (
    <Screen>
      <Header title="Marketplace" subtitle="Share your knowledge." />
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 14 }}
        options={[{ value: 'products', label: 'My Products' }, { value: 'orders', label: 'Orders' }, { value: 'earnings', label: 'Earnings' }]}
      />

      {tab === 'products' && (
        <>
          <Button title="Add New Product" icon="add" onPress={() => router.push('/pro/product-form')} />
          {myProducts.length === 0 ? (
            <EmptyState icon="book-outline" title="No products yet" message="Host live or recorded workshops, or sell digital resources like guides and worksheets." />
          ) : (
            <>
              {workshops.length > 0 && <SectionTitle>Workshops</SectionTitle>}
              {workshops.map(row)}
              {resources.length > 0 && <SectionTitle>Digital Resources</SectionTitle>}
              {resources.map(row)}
            </>
          )}
        </>
      )}

      {tab === 'orders' && (myOrders.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {myOrders.map((o, i) => {
            const p = productsById[o.productId];
            return (
              <Row key={o.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{p?.title ?? 'Removed product'}</Text>
                  <Text style={styles.muted}>{p ? `${kindLabel(p)} · ` : ''}{usersById[o.buyerId]?.name ?? 'Customer'} · {new Date(o.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontWeight: '700', color: colors.success }}>{o.price ? `+$${o.price}` : 'Free'}</Text>
              </Row>
            );
          })}
        </Card>
      ))}

      {tab === 'earnings' && (
        <>
          <Row gap={10}>
            <StatCard value={money(grossMonth - commissionOf(grossMonth))} label="This month" />
            <StatCard value={money(gross - commissionOf(gross))} label="All time" />
            <StatCard value={myOrders.length} label="Orders" />
          </Row>
          <Card style={{ marginTop: 14, paddingVertical: 8 }}>
            <MoneyRow label="Gross sales" value={money(gross)} />
            <MoneyRow
              label={`Platform commission (${rateLabel})`}
              value={MARKETPLACE_COMMISSION_RATE == null ? '—' : `−${money(commissionOf(gross))}`}
              tone={colors.danger}
            />
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
            <MoneyRow label="Your earnings" value={money(gross - commissionOf(gross))} strong tone={colors.success} />
          </Card>
          <Text style={[styles.muted, { marginTop: 12 }]}>Payments are simulated in offline mode.</Text>
        </>
      )}
    </Screen>
  );
}
