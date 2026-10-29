import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PLANS, planById } from '../../../components/org/plans';
import { money } from '../../../components/pro/useProData';
import { Badge, Button, Card, ChipGroup, Header, MenuRow, Row, Screen, SectionTitle, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../db/db';
import { colors, radius } from '../../../theme';
import { MONTHS } from '../../../utils/date';
import { comingSoon, confirm, notify } from '../../../utils/alert';

const SESSION_OPTIONS = [3, 6, 9, 12].map((n) => ({ value: n, label: `${n}` }));
const SEAT_STEP = 5;

const monthlyCost = (plan, seats) => (plan.pricePerSeat == null ? null : plan.pricePerSeat * seats);

export default function Plan() {
  const { user: org, updateProfile } = useAuth();
  const { data: orgMembers } = useCollection('orgMembers');
  const [seats, setSeats] = useState(org?.seats ?? 10);

  const usedSeats = useMemo(() => orgMembers.filter((m) => m.orgId === org?.id).length, [orgMembers, org]);

  if (!org) return null;
  const current = planById(org.plan);
  const cost = monthlyCost(current, org.seats ?? 0);

  // Mock invoices for the last three months.
  const now = new Date();
  const invoices = [1, 2, 3].map((n) => {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
    return { id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, amount: cost ?? 0 };
  });

  const changePlan = (p) => {
    if (p.id === current.id) return;
    if (p.maxSeats && (org.seats ?? 0) > p.maxSeats) return notify('Too many seats', `${p.name} supports up to ${p.maxSeats} seats. Reduce seats first.`);
    if (p.id === 'enterprise') return notify('Talk to sales', 'Enterprise plans are set up with our team. We will contact your billing contact once the backend is connected.');
    confirm(`Switch to ${p.name}?`, `${money(monthlyCost(p, org.seats ?? 0))}/month for ${org.seats} seats, ${p.sessionsPerMember} sessions per member. Simulated — no charge is made.`, () =>
      updateProfile({ plan: p.id, sessionsPerMember: p.sessionsPerMember }), 'Switch');
  };

  const saveSeats = () => {
    if (seats < usedSeats) return notify('Seats in use', `${usedSeats} seats are taken by members and invitations.`);
    if (current.maxSeats && seats > current.maxSeats) return notify('Plan limit', `${current.name} supports up to ${current.maxSeats} seats. Upgrade to add more.`);
    updateProfile({ seats });
    notify('Seats updated', `${seats} seats · simulated billing`);
  };

  return (
    <Screen>
      <Header title="Plan & billing" subtitle="Simulated billing — no payments are taken in offline mode." />

      <Card style={{ marginBottom: 14, backgroundColor: colors.primary, borderColor: colors.primary }}>
        <Text style={{ color: colors.white, opacity: 0.8 }}>Current plan</Text>
        <Text style={{ color: colors.white, fontSize: 26, fontWeight: '700', marginVertical: 4 }}>{current.name}</Text>
        <Text style={{ color: colors.white }}>
          {org.seats} seats · {org.sessionsPerMember ?? current.sessionsPerMember} sessions / member · {cost == null ? 'Custom pricing' : `${money(cost)}/month`}
        </Text>
      </Card>

      <SectionTitle>Plans</SectionTitle>
      {PLANS.map((p) => {
        const active = p.id === current.id;
        return (
          <Pressable key={p.id} onPress={() => changePlan(p)}>
            <Card style={{ marginBottom: 10, borderColor: active ? colors.primary : colors.border, borderWidth: active ? 2 : 1 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={styles.h3}>{p.name}</Text>
                {active ? <Badge label="Current" tone="success" /> : <Text style={styles.link}>{p.id === 'enterprise' ? 'Contact us' : 'Switch'}</Text>}
              </Row>
              <Text style={[styles.muted, { marginBottom: 6 }]}>
                {p.pricePerSeat == null ? 'Custom pricing' : `${money(p.pricePerSeat)} per seat / month`}{p.maxSeats ? ` · up to ${p.maxSeats} seats` : ' · unlimited seats'}
              </Text>
              {p.features.map((f) => (
                <Row key={f} gap={6} style={{ marginTop: 3 }}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.body, { fontSize: 13, flex: 1 }]}>{f}</Text>
                </Row>
              ))}
            </Card>
          </Pressable>
        );
      })}

      <SectionTitle>Seats</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={() => setSeats((n) => Math.max(SEAT_STEP, n - SEAT_STEP))} style={stepper}>
            <Ionicons name="remove" size={20} color={colors.primary} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{seats}</Text>
            <Text style={styles.muted}>{usedSeats} in use</Text>
          </View>
          <Pressable onPress={() => setSeats((n) => n + SEAT_STEP)} style={stepper}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </Pressable>
        </Row>
        {seats !== org.seats && <Button small title={`Update to ${seats} seats`} style={{ marginTop: 12 }} onPress={saveSeats} />}
      </Card>

      <SectionTitle>Sessions per member / year</SectionTitle>
      <ChipGroup options={SESSION_OPTIONS} value={org.sessionsPerMember ?? current.sessionsPerMember} onChange={(v) => updateProfile({ sessionsPerMember: v })} />

      <SectionTitle>Invoices</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {invoices.map((inv, i) => (
          <Row key={inv.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, justifyContent: 'space-between' }}>
            <View>
              <Text style={[styles.body, { fontWeight: '600' }]}>{inv.label}</Text>
              <Text style={styles.muted}>{inv.id} · {money(inv.amount)}</Text>
            </View>
            <Row gap={10}>
              <Badge label="Paid" tone="success" />
              <Pressable hitSlop={8} onPress={() => comingSoon('Invoice downloads')}>
                <Ionicons name="download-outline" size={20} color={colors.primary} />
              </Pressable>
            </Row>
          </Row>
        ))}
      </Card>

      <Card style={{ marginTop: 14, paddingVertical: 4 }}>
        <MenuRow icon="person-circle-outline" title="Billing contact" subtitle={`${org.contactName ?? org.name} · ${org.email}`} onPress={() => comingSoon('Billing contact changes')} />
        <MenuRow icon="card-outline" title="Payment method" subtitle="Invoice / bank transfer" onPress={() => comingSoon('Organization payment methods')} />
      </Card>
    </Screen>
  );
}

const stepper = { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' };
