import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { buildReceipts, formatMoney, receiptNumber } from '../../components/receipts';
import { Badge, Button, Card, Divider, EmptyState, Header, Logo, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../db/db';
import { colors } from '../../theme';
import { comingSoon } from '../../utils/alert';
import { dateKey, longDate, timeLabel } from '../../utils/date';

function Field({ label, value }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.muted, { fontSize: 12 }]}>{label}</Text>
      <Text style={[styles.body, { fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

function Line({ label, value, bold, tone }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginVertical: 3 }}>
      <Text style={[bold ? styles.h3 : styles.body, tone && { color: tone }, { flex: 1 }]}>{label}</Text>
      <Text style={[bold ? styles.h3 : styles.body, tone && { color: tone }]}>{value}</Text>
    </Row>
  );
}

export default function Receipt() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: appointments } = useCollection('appointments');
  const { data: orders } = useCollection('orders');
  const { data: products } = useCollection('products');
  const { data: users } = useCollection('users');

  const r = useMemo(
    () => buildReceipts({ user, appointments, orders, products, users }).find((x) => x.id === id),
    [user, appointments, orders, products, users, id],
  );

  if (!r) {
    return (
      <Screen>
        <Header title="Receipt" back />
        <EmptyState icon="receipt-outline" title="Receipt not found" />
      </Screen>
    );
  }

  const p = r.payment;
  const discount = p?.discount ?? 0;
  const covered = p?.coveredBy ? r.listPrice : 0;
  const coveredBy = p?.coveredBy && users.find((u) => u.id === p.coveredBy)?.name;
  const appt = r.kind === 'session' ? r.source : null;

  return (
    <Screen>
      <Header title="Receipt" back />
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Logo size={22} tagline={false} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.muted, { fontSize: 12 }]}>Receipt no.</Text>
            <Text style={[styles.body, { fontWeight: '700' }]}>{receiptNumber(r.id)}</Text>
            <View style={{ marginTop: 6 }}><Badge label={r.status} tone={r.status === 'Paid' ? 'success' : 'tan'} /></View>
          </View>
        </Row>
        <Divider />
        <Row gap={12}>
          <Field label="Date" value={longDate(dateKey(new Date(r.date)))} />
          <Field label="Billed to" value={r.billedTo} />
        </Row>
        <Row gap={12} style={{ marginTop: 10 }}>
          <Field label="Provider" value={r.provider} />
          <Field label="Type" value={r.kind === 'session' ? 'Therapy session' : 'Marketplace'} />
        </Row>
        <Divider />
        <Line
          label={appt ? `${r.title}\n${longDate(appt.date)} · ${timeLabel(appt.time)} · ${appt.mode === 'online' ? 'Online' : 'In-person'}` : r.title}
          value={formatMoney(r.listPrice)}
        />
        {discount > 0 && <Line label={`Promo ${p.promo ?? ''}`} value={`−${formatMoney(discount)}`} tone={colors.success} />}
        {covered > 0 && <Line label={`Covered by ${coveredBy ?? 'employer'}`} value={`−${formatMoney(covered)}`} tone={colors.success} />}
        <Line label="Platform fee" value={formatMoney(0)} />
        <Divider />
        <Line label="Total" value={formatMoney(r.amount)} bold />
        <Text style={[styles.muted, { marginTop: 10 }]}>
          {p?.last4 ? `Paid with ${p.brand} •••• ${p.last4}` : p?.coveredBy ? 'No payment required' : 'Payment recorded'}
        </Text>
      </Card>

      <Text style={[styles.muted, { marginTop: 12, textAlign: 'center' }]}>Offline preview — this receipt is for demonstration and is not a tax invoice.</Text>
      <Row style={{ marginTop: 16 }}>
        <Button variant="outline" icon="download-outline" title="Download PDF" style={{ flex: 1 }} onPress={() => comingSoon('PDF receipts')} />
        <Button variant="outline" icon="mail-outline" title="Email receipt" style={{ flex: 1 }} onPress={() => comingSoon('Emailed receipts')} />
      </Row>
    </Screen>
  );
}
