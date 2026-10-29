import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { inMonth, money, orderRevenue, useProData } from '../../components/pro/useProData';
import { Card, Header, Rating, Row, Screen, SectionTitle, StatCard, styles } from '../../components/ui';
import { apptDateTime } from '../../db/actions';
import { colors, radius } from '../../theme';
import { MONTHS } from '../../utils/date';

const TIPS = [
  'Complete every section of your profile — clients filter by specialty and language.',
  'Keep at least 10 open slots per week so you show up in "available soon" results.',
  'Publish a free resource in the Marketplace to introduce your approach.',
  'Host a live workshop; attendees often book a first session afterwards.',
];

export default function Growth() {
  const { user, myAppts, clients, myOrders } = useProData();

  const data = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const offset = i - 5;
      const range = inMonth(offset);
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return { label: MONTHS[d.getMonth()].slice(0, 3), count: myAppts.filter((a) => a.status !== 'cancelled' && range(apptDateTime(a))).length };
    });
    const thisMonth = inMonth(0);
    const newClients = clients.filter((c) => c.appointments[0] && thisMonth(apptDateTime(c.appointments[0]))).length;
    const cancelled = myAppts.filter((a) => a.status === 'cancelled').length;
    return {
      months,
      max: Math.max(1, ...months.map((m) => m.count)),
      newClients,
      sales: myOrders.length,
      revenue: orderRevenue(myOrders),
      cancelRate: myAppts.length ? Math.round((cancelled / myAppts.length) * 100) : 0,
    };
  }, [myAppts, clients, myOrders]);

  return (
    <Screen>
      <Header title="Practice Growth" subtitle="Analytics and visibility." back />
      <Row gap={10}>
        <StatCard value={data.newClients} label="New clients this month" />
        <StatCard value={`${data.cancelRate}%`} label="Cancellation rate" />
      </Row>
      <Row gap={10} style={{ marginTop: 10 }}>
        <StatCard value={data.sales} label="Product sales" />
        <StatCard value={money(data.revenue)} label="Product revenue" />
      </Row>

      <SectionTitle>Sessions per month</SectionTitle>
      <Card>
        {data.months.map((m) => (
          <Row key={m.label} gap={10} style={{ marginVertical: 5 }}>
            <Text style={[styles.muted, { width: 32 }]}>{m.label}</Text>
            <View style={{ flex: 1, height: 14, backgroundColor: colors.tanSoft, borderRadius: radius.pill, overflow: 'hidden' }}>
              <View style={{ width: `${(m.count / data.max) * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill }} />
            </View>
            <Text style={{ width: 24, textAlign: 'right', fontWeight: '700', color: colors.primary }}>{m.count}</Text>
          </Row>
        ))}
      </Card>

      <SectionTitle>Reputation</SectionTitle>
      <Card>
        <Rating value={user?.rating} count={user?.reviews} size={16} />
        <Text style={[styles.muted, { marginTop: 6 }]}>Client reviews after sessions arrive with the backend.</Text>
      </Card>

      <SectionTitle>Boost your visibility</SectionTitle>
      <Card>
        {TIPS.map((t) => (
          <Row key={t} style={{ alignItems: 'flex-start', marginBottom: 10 }}>
            <Ionicons name="leaf-outline" size={16} color={colors.tan} style={{ marginTop: 3 }} />
            <Text style={[styles.body, { flex: 1, fontSize: 14 }]}>{t}</Text>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
