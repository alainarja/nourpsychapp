import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { money, orderRevenue, useProData } from '../../components/pro/useProData';
import { Badge, Button, Card, ChipGroup, EmptyState, Header, Input, MenuRow, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { notifyUser } from '../../db/actions';
import { db, useCollection } from '../../db/db';
import { colors } from '../../theme';
import { comingSoon, confirm, notify } from '../../utils/alert';
import { isValidIban } from '../../utils/iban';

const MIN_PAYOUT = 50;
const SCHEDULES = [{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }];
const STATUS_TONE = { paid: 'success', processing: 'primary', failed: 'danger' };

export default function Payouts() {
  const { updateProfile } = useAuth();
  const { me, user, myAppts, myOrders } = useProData();
  const { data: payouts } = useCollection('payouts');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ holder: '', bank: '', iban: '' });
  const [error, setError] = useState('');

  const history = useMemo(
    () => payouts.filter((p) => p.proId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [payouts, me],
  );

  // Only completed sessions are payable; booked ones are still pending.
  const balance = useMemo(() => {
    const earned = myAppts.filter((a) => a.status === 'completed').reduce((s, a) => s + (a.price ?? 0), 0) + orderRevenue(myOrders);
    const paidOut = history.filter((p) => p.status !== 'failed').reduce((s, p) => s + p.amount, 0);
    return Math.max(0, earned - paidOut);
  }, [myAppts, myOrders, history]);

  if (!user) return null;
  const method = user.payoutMethod;

  const startEdit = () => {
    setForm({ holder: method?.holder ?? user.name, bank: method?.bank ?? '', iban: '' });
    setError('');
    setEditing(true);
  };

  const saveMethod = async () => {
    if (!form.holder.trim() || !form.bank.trim()) return setError('Account holder and bank name are required.');
    if (!isValidIban(form.iban)) return setError('That IBAN does not look valid. Check the country code and digits.');
    const iban = form.iban.replace(/\s+/g, '').toUpperCase();
    // Only the last 4 digits are kept on device; the full IBAN will go straight to the payment provider.
    await updateProfile({ payoutMethod: { holder: form.holder.trim(), bank: form.bank.trim(), ibanLast4: iban.slice(-4), country: iban.slice(0, 2) } });
    setEditing(false);
    notify('Payout method saved');
  };

  const requestPayout = () => {
    if (!method) return notify('Add a payout method', 'Add your bank details before requesting a payout.');
    if (balance < MIN_PAYOUT) return notify('Balance too low', `The minimum payout is ${money(MIN_PAYOUT)}.`);
    confirm('Request payout?', `${money(balance)} to ${method.bank} ••${method.ibanLast4}`, async () => {
      await db.insert('payouts', { proId: me, amount: balance, status: 'processing' });
      await notifyUser(me, { title: 'Payout requested', body: `${money(balance)} is on its way to ${method.bank} ••${method.ibanLast4}.`, type: 'system', link: '/pro/payouts' });
      notify('Payout requested', 'Simulated — usually arrives in 2–3 business days.');
    }, 'Request');
  };

  return (
    <Screen>
      <Header title="Payouts" subtitle="Get paid for your sessions and products." back />

      <Card style={{ alignItems: 'center', paddingVertical: 22, marginBottom: 14 }}>
        <Text style={styles.muted}>Available balance</Text>
        <Text style={{ fontSize: 38, fontWeight: '700', color: colors.primary, marginVertical: 4 }}>{money(balance)}</Text>
        <Text style={styles.muted}>Completed sessions + product sales, minus payouts</Text>
        <Button title="Request payout" icon="arrow-down-circle-outline" style={{ marginTop: 14, alignSelf: 'stretch' }} onPress={requestPayout} />
      </Card>

      <SectionTitle action={!editing ? (method ? 'Change' : 'Add') : null} onAction={startEdit}>Payout method</SectionTitle>
      {editing ? (
        <Card>
          <Input label="Account holder" value={form.holder} onChangeText={(v) => setForm((f) => ({ ...f, holder: v }))} />
          <Input label="Bank name" placeholder="e.g. Bank Audi" value={form.bank} onChangeText={(v) => setForm((f) => ({ ...f, bank: v }))} />
          <Input label="IBAN" placeholder="LB62 0999 0000 0001 0019 0122 9114" autoCapitalize="characters" value={form.iban} onChangeText={(v) => setForm((f) => ({ ...f, iban: v }))} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Row>
            <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setEditing(false)} />
            <Button small title="Save" style={{ flex: 1 }} onPress={saveMethod} />
          </Row>
        </Card>
      ) : method ? (
        <Card>
          <Row gap={12}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="business-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '700' }]}>{method.bank}</Text>
              <Text style={styles.muted}>{method.holder} · IBAN {method.country} •••• {method.ibanLast4}</Text>
            </View>
          </Row>
        </Card>
      ) : (
        <EmptyState icon="card-outline" title="No payout method" message="Add a bank account to receive your earnings." action="Add bank account" onAction={startEdit} />
      )}

      <SectionTitle>Payout schedule</SectionTitle>
      <ChipGroup options={SCHEDULES} value={user.payoutSchedule ?? 'monthly'} onChange={(v) => updateProfile({ payoutSchedule: v })} />
      <Text style={[styles.muted, { marginTop: 6 }]}>Automatic payouts start once a payment provider is connected. Until then, request payouts manually.</Text>

      <SectionTitle>History</SectionTitle>
      {history.length === 0 ? (
        <EmptyState icon="time-outline" title="No payouts yet" />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {history.map((p, i) => (
            <Row key={p.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, justifyContent: 'space-between' }}>
              <View>
                <Text style={[styles.body, { fontWeight: '700' }]}>{money(p.amount)}</Text>
                <Text style={styles.muted}>{new Date(p.createdAt).toLocaleDateString()}</Text>
              </View>
              <Badge label={p.status} tone={STATUS_TONE[p.status] ?? 'muted'} />
            </Row>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="document-text-outline" title="Tax information" subtitle="Tax forms and annual statements" onPress={() => comingSoon('Tax documents')} />
      </Card>
    </Screen>
  );
}
