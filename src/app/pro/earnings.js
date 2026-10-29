import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { inMonth, money, orderRevenue, sessionRevenue, useProData } from '../../components/pro/useProData';
import { Button, Card, EmptyState, Header, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { apptDateTime } from '../../db/actions';
import { colors } from '../../theme';
import { comingSoon } from '../../utils/alert';
import { shortDate } from '../../utils/date';

export default function Earnings() {
  const { liveAppts, myOrders, productsById, usersById } = useProData();

  const { periods, transactions } = useMemo(() => {
    const period = (label, range) => ({ label, sessions: sessionRevenue(liveAppts, range), products: orderRevenue(myOrders, range) });
    const tx = [
      ...liveAppts.filter((a) => a.status === 'completed').map((a) => ({
        id: a.id, when: apptDateTime(a), title: `Session · ${usersById[a.clientId]?.name ?? 'Client'}`, sub: shortDate(a.date), amount: a.price,
      })),
      ...myOrders.map((o) => ({
        id: o.id, when: new Date(o.createdAt), title: productsById[o.productId]?.title ?? 'Product sale', sub: `Product · ${new Date(o.createdAt).toLocaleDateString()}`, amount: o.price,
      })),
    ].sort((a, b) => b.when - a.when).slice(0, 30);
    return { periods: [period('This month', inMonth(0)), period('Last month', inMonth(-1)), period('All time', undefined)], transactions: tx };
  }, [liveAppts, myOrders, productsById, usersById]);

  return (
    <Screen>
      <Header title="Earnings" subtitle="Track your income." back />
      {periods.map((p) => (
        <Card key={p.label} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.label}>{p.label}</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>{money(p.sessions + p.products)}</Text>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={styles.muted}>Sessions {money(p.sessions)}</Text>
            <Text style={styles.muted}>Products {money(p.products)}</Text>
          </Row>
        </Card>
      ))}
      <Text style={[styles.muted, { marginTop: 4 }]}>Session earnings count completed and upcoming booked sessions; payments are simulated offline.</Text>
      <Button title="Payout settings" icon="card-outline" variant="outline" style={{ marginTop: 14 }} onPress={() => comingSoon('Payouts')} />

      <SectionTitle>Recent transactions</SectionTitle>
      {transactions.length === 0 ? <EmptyState icon="wallet-outline" title="No transactions yet" /> : (
        <Card style={{ paddingVertical: 4 }}>
          {transactions.map((t, i) => (
            <Row key={t.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '600' }]}>{t.title}</Text>
                <Text style={styles.muted}>{t.sub}</Text>
              </View>
              <Text style={{ fontWeight: '700', color: colors.success }}>+${t.amount}</Text>
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}
