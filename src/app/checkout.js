import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Avatar, Button, Card, Divider, EmptyState, Header, ProductCover, Row, Screen, SectionTitle, styles } from '../components/ui';
import { onboardingRoute, useAuth } from '../context/AuthContext';
import { bookAppointment, purchaseProduct } from '../db/actions';
import { db, useCollection } from '../db/db';
import { colors, radius } from '../theme';
import { comingSoon, notify } from '../utils/alert';
import { longDate, timeLabel } from '../utils/date';

// Offline promo codes; the backend will validate these.
const PROMOS = { THRIVE10: 0.1 };
const PLATFORM_FEE = 0;
const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0)}`;

function Line({ label, value, bold, tone }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginVertical: 3 }}>
      <Text style={[bold ? styles.h3 : styles.body, tone && { color: tone }]}>{label}</Text>
      <Text style={[bold ? styles.h3 : styles.body, tone && { color: tone }]}>{value}</Text>
    </Row>
  );
}

export default function Checkout() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { data: users } = useCollection('users');
  const { data: products } = useCollection('products');
  const { data: cards } = useCollection('paymentMethods');
  const { data: orgMembers } = useCollection('orgMembers');

  const isSession = params.type === 'session';
  const pro = isSession ? users.find((u) => u.id === params.proId) : null;
  const product = !isSession ? products.find((p) => p.id === params.productId) : null;
  const seller = product && users.find((u) => u.id === product.sellerId);

  const myCards = useMemo(() => cards.filter((c) => c.userId === user?.id), [cards, user]);
  const [methodId, setMethodId] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [stage, setStage] = useState('review'); // review | processing | done
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!methodId && myCards.length) setMethodId((myCards.find((c) => c.isDefault) ?? myCards[0]).id);
  }, [myCards, methodId]);

  // Employer coverage: session with a provider in the org's network, while the member has sessions left.
  const coverage = useMemo(() => {
    if (!isSession || !user?.orgId || !pro) return null;
    const org = users.find((u) => u.id === user.orgId && u.role === 'org');
    const member = orgMembers.find((m) => m.orgId === user.orgId && m.userId === user.id);
    if (!org || !member || !org.proIds?.includes(pro.id)) return null;
    const remaining = (org.sessionsPerMember ?? 0) - (member.sessionsUsed ?? 0);
    return remaining > 0 ? { org, member, remaining } : null;
  }, [isSession, user, pro, users, orgMembers]);

  const gate = onboardingRoute(user);
  if (gate) return <Redirect href={gate} />;

  const item = isSession ? pro : product;
  if (!item || (isSession && (!params.date || !params.time))) {
    return (
      <Screen>
        <Header title="Checkout" back />
        <EmptyState title="Nothing to check out" message="This item is no longer available." />
      </Screen>
    );
  }

  const subtotal = isSession ? pro.price ?? 60 : product.price;
  const discount = coverage ? 0 : promo ? subtotal * PROMOS[promo] : 0;
  const covered = coverage ? subtotal : 0;
  const total = Math.max(0, subtotal - discount - covered + PLATFORM_FEE);
  const method = myCards.find((c) => c.id === methodId);
  const needsCard = total > 0;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMOS[code]) {
      setPromo(code);
      setPromoError('');
    } else {
      setPromo(null);
      setPromoError('That code isn’t valid.');
    }
  };

  const pay = async () => {
    setStage('processing');
    await new Promise((r) => setTimeout(r, 1200));
    const payment = {
      methodId: method?.id ?? null, brand: method?.brand ?? null, last4: method?.last4 ?? null,
      amount: total, discount, promo: coverage ? null : promo, coveredBy: coverage ? coverage.org.id : null,
    };
    try {
      if (isSession) {
        const appt = await bookAppointment({ pro, clientId: user.id, date: params.date, time: params.time, mode: params.mode ?? 'online', payment });
        if (coverage) await db.update('orgMembers', coverage.member.id, { sessionsUsed: (coverage.member.sessionsUsed ?? 0) + 1 });
        setResult({ id: appt.id });
      } else {
        const order = await purchaseProduct(product, user.id, payment);
        setResult({ id: order.id });
      }
      setStage('done');
    } catch (e) {
      setStage('review');
      notify('Payment not completed', e.message);
    }
  };

  if (stage === 'done') {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginTop: 48 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={46} color={colors.success} />
          </View>
          <Text style={[styles.h1, { marginTop: 18, textAlign: 'center' }]}>{isSession ? 'Session booked' : product.category === 'workshop' ? "You're registered" : 'Purchase complete'}</Text>
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 6 }]}>
            {isSession
              ? `${pro.name}\n${longDate(params.date)} at ${timeLabel(params.time)} · ${params.mode === 'in-person' ? 'In-person' : 'Online'}`
              : `${product.title} is now in My Purchases.`}
          </Text>
          <Text style={[styles.h3, { marginTop: 14 }]}>{total > 0 ? `${money(total)} paid` : coverage ? `Covered by ${coverage.org.name}` : 'Free'}</Text>
        </View>
        <Button title="View receipt" variant="outline" icon="receipt-outline" style={{ marginTop: 32 }} onPress={() => router.replace(`/receipts/${result.id}`)} />
        <Button title="Done" style={{ marginTop: 10 }} onPress={() => router.replace(isSession ? '/client/therapy' : '/client/purchases')} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={{ padding: 16, paddingBottom: 24, backgroundColor: colors.bg }}>
          <Button
            title={stage === 'processing' ? 'Processing…' : needsCard ? `Pay ${money(total)}` : 'Confirm'}
            icon={needsCard ? 'lock-closed' : 'checkmark'}
            loading={stage === 'processing'}
            disabled={needsCard && !method}
            onPress={pay}
          />
          {needsCard && !method && <Text style={[styles.muted, { textAlign: 'center', marginTop: 6 }]}>Add a payment method to continue.</Text>}
        </View>
      }
    >
      <Header title="Checkout" back />

      <Row style={{ backgroundColor: colors.tanSoft, padding: 10, borderRadius: radius.md, marginBottom: 14 }}>
        <Ionicons name="information-circle-outline" size={18} color={colors.tan} />
        <Text style={[styles.muted, { flex: 1 }]}>Payments are simulated in offline mode — no card is charged.</Text>
      </Row>

      <Card>
        {isSession ? (
          <Row gap={12}>
            <Avatar name={pro.name} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>{pro.name}</Text>
              <Text style={styles.muted}>{pro.title}</Text>
              <Text style={[styles.body, { marginTop: 4 }]}>{longDate(params.date)} · {timeLabel(params.time)}</Text>
              <Text style={styles.muted}>{params.mode === 'in-person' ? 'In-person' : 'Online video'} · {pro.sessionLength ?? 45} min</Text>
            </View>
          </Row>
        ) : (
          <Row gap={12}>
            <View style={{ width: 70 }}><ProductCover product={product} height={80} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>{product.title}</Text>
              {!!product.subtitle && <Text style={styles.muted}>{product.subtitle}</Text>}
              {seller && <Text style={[styles.muted, { marginTop: 4 }]}>by {seller.name}</Text>}
            </View>
          </Row>
        )}
      </Card>

      {coverage && (
        <Row style={{ marginTop: 12, backgroundColor: colors.successSoft, padding: 12, borderRadius: radius.md }}>
          <Ionicons name="business-outline" size={18} color={colors.success} />
          <Text style={[styles.body, { flex: 1, color: colors.success }]}>
            Covered by {coverage.org.name} — {coverage.remaining} session{coverage.remaining === 1 ? '' : 's'} left this year
          </Text>
        </Row>
      )}

      <SectionTitle>Price</SectionTitle>
      <Card>
        <Line label={isSession ? 'Session' : 'Item'} value={money(subtotal)} />
        <Line label="Platform fee" value={money(PLATFORM_FEE)} />
        {discount > 0 && <Line label={`Promo ${promo}`} value={`−${money(discount)}`} tone={colors.success} />}
        {covered > 0 && <Line label="Employer coverage" value={`−${money(covered)}`} tone={colors.success} />}
        <Divider />
        <Line label="Total" value={money(total)} bold />
      </Card>

      {!coverage && (
        <Row style={{ marginTop: 12 }}>
          <TextInput
            value={promoInput}
            onChangeText={(v) => { setPromoInput(v); setPromoError(''); }}
            placeholder="Promo code"
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            style={{ flex: 1, height: 44, borderWidth: 1, borderColor: promoError ? colors.danger : colors.border, borderRadius: radius.sm, paddingHorizontal: 12, backgroundColor: colors.surface, color: colors.text, outlineStyle: 'none' }}
          />
          <Button small variant="secondary" title={promo ? 'Applied' : 'Apply'} onPress={applyPromo} />
        </Row>
      )}
      {!!promoError && <Text style={{ color: colors.danger, marginTop: 4, fontSize: 13 }}>{promoError}</Text>}

      {needsCard && (
        <>
          <SectionTitle action="Add a card" onAction={() => router.push('/settings/payments')}>Pay with</SectionTitle>
          <View style={{ gap: 8 }}>
            {myCards.map((c) => {
              const active = c.id === methodId;
              return (
                <Pressable key={c.id} onPress={() => setMethodId(c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }}>
                  <Ionicons name="card-outline" size={22} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>{c.brand} •••• {c.last4}</Text>
                    <Text style={styles.muted}>Expires {c.expiry}{c.isDefault ? ' · Default' : ''}</Text>
                  </View>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.primary} />
                </Pressable>
              );
            })}
            {myCards.length === 0 && (
              <Button variant="outline" icon="add" title="Add a card" onPress={() => router.push('/settings/payments')} />
            )}
          </View>
          <Row style={{ marginTop: 10 }}>
            <Button small variant="outline" icon="logo-apple" title="Apple Pay" style={{ flex: 1 }} onPress={() => comingSoon('Apple Pay')} />
            <Button small variant="outline" icon="logo-google" title="Google Pay" style={{ flex: 1 }} onPress={() => comingSoon('Google Pay')} />
          </Row>
        </>
      )}

      {isSession && (
        <Row style={{ marginTop: 16, alignItems: 'flex-start' }}>
          <Ionicons name="time-outline" size={16} color={colors.muted} style={{ marginTop: 2 }} />
          <Text style={[styles.muted, { flex: 1 }]}>
            Free cancellation up to {pro.cancellationHours ?? 24}h before your session. Later cancellations may be charged in full.
          </Text>
        </Row>
      )}
    </Screen>
  );
}
