import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { buildReceipts, formatMoney } from '../../components/receipts';
import { Badge, Card, EmptyState, Header, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../db/db';
import { colors } from '../../theme';
import { shortDate, dateKey } from '../../utils/date';

export default function Receipts() {
  const { user } = useAuth();
  const { data: appointments } = useCollection('appointments');
  const { data: orders } = useCollection('orders');
  const { data: products } = useCollection('products');
  const { data: users } = useCollection('users');

  const rows = useMemo(() => buildReceipts({ user, appointments, orders, products, users }), [user, appointments, orders, products, users]);
  const isPro = user.role === 'pro';
  const total = rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <Screen>
      <Header title={isPro ? 'Sales receipts' : 'Receipts'} subtitle={isPro ? 'Completed sessions and marketplace sales.' : 'Payments for sessions and purchases.'} back />

      {rows.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.muted}>{isPro ? 'Total earned' : 'Total paid'}</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{formatMoney(total)}</Text>
          <Text style={styles.muted}>{rows.length} receipt{rows.length === 1 ? '' : 's'}</Text>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No receipts yet" message={isPro ? 'Receipts appear after completed sessions and sales.' : 'Receipts appear after you pay for a session or a product.'} />
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map((r) => (
            <Card key={r.id} onPress={() => router.push(`/receipts/${r.id}`)} style={{ paddingVertical: 12 }}>
              <Row gap={12}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={r.kind === 'session' ? 'videocam-outline' : 'bag-handle-outline'} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3} numberOfLines={1}>{r.title}</Text>
                  <Text style={styles.muted}>{r.counterparty} · {shortDate(dateKey(new Date(r.date)))}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.h3}>{formatMoney(r.amount)}</Text>
                  {r.payment?.coveredBy ? <Badge label="Covered" tone="success" /> : r.status !== 'Paid' && <Badge label={r.status} tone="tan" />}
                </View>
              </Row>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
