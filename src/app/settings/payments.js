import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SettingsSection } from '../../components/settings';
import { Badge, Button, Card, ChipGroup, EmptyState, Header, Input, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { db, useCollection } from '../../db/db';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { confirm } from '../../utils/alert';
import { cardBrand, cvcValid, expiryValid, formatCardNumber, formatExpiry, luhnValid } from '../../utils/card';

const COUNTRIES = ['Lebanon', 'UAE', 'Saudi Arabia', 'Jordan', 'Egypt', 'Other'].map((c) => ({ value: c, label: c }));
const BRAND_ICON = { Visa: 'card', Mastercard: 'card', Amex: 'card', Card: 'card-outline' };

const EMPTY_FORM = { holder: '', number: '', expiry: '', cvc: '', country: 'Lebanon' };

export default function PaymentMethods() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data } = useCollection('paymentMethods');
  const cards = useMemo(() => data.filter((c) => c.userId === user.id), [data, user.id]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const set = (k, fmt) => (v) => setForm((f) => ({ ...f, [k]: fmt ? fmt(v) : v }));
  const brand = cardBrand(form.number);

  const setDefault = async (id) => {
    for (const c of cards) if (c.isDefault !== (c.id === id)) await db.update('paymentMethods', c.id, { isDefault: c.id === id });
  };

  const remove = (card) =>
    confirm(`Remove ${card.brand} •••• ${card.last4}?`, '', async () => {
      await db.remove('paymentMethods', card.id);
      const rest = cards.filter((c) => c.id !== card.id);
      if (card.isDefault && rest.length) await db.update('paymentMethods', rest[0].id, { isDefault: true });
    }, t('common.remove'), true);

  const save = async () => {
    setError('');
    if (!form.holder.trim()) return setError(t('payments.err.holder'));
    if (!luhnValid(form.number)) return setError(t('payments.err.number'));
    if (!expiryValid(form.expiry)) return setError(t('payments.err.expiry'));
    if (!cvcValid(form.cvc, brand)) return setError(t('payments.err.cvc'));
    const digits = form.number.replace(/\D/g, '');
    // Only non-sensitive display fields are kept; number and CVC are discarded here.
    await db.insert('paymentMethods', {
      userId: user.id, brand, last4: digits.slice(-4), expiry: form.expiry, holder: form.holder.trim(),
      country: form.country, isDefault: cards.length === 0,
    });
    setForm(EMPTY_FORM);
    setAdding(false);
  };

  return (
    <Screen>
      <Header title={t('payments.title')} subtitle={t('payments.subtitle')} back />

      {cards.length === 0 && !adding && <EmptyState icon="card-outline" title={t('payments.empty')} action={t('payments.add')} onAction={() => setAdding(true)} />}

      {cards.map((c) => (
        <Card key={c.id} style={{ marginBottom: 10 }}>
          <Row gap={12}>
            <View style={{ width: 48, height: 34, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={BRAND_ICON[c.brand] ?? 'card'} size={18} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '700' }]}>{c.brand} •••• {c.last4}</Text>
              <Text style={styles.muted}>{c.holder} · {t('payments.expires', undefined, { date: c.expiry })}</Text>
            </View>
            {c.isDefault && <Badge label={t('payments.default')} tone="success" />}
          </Row>
          <Row style={{ marginTop: 12 }}>
            {!c.isDefault && <Button small variant="secondary" title={t('payments.setDefault')} style={{ flex: 1 }} onPress={() => setDefault(c.id)} />}
            <Button small variant="danger" title={t('common.remove')} style={{ flex: 1 }} onPress={() => remove(c)} />
          </Row>
        </Card>
      ))}

      {adding ? (
        <SettingsSection title={t('payments.add')}>
          <Card>
            <Input placeholder={t('payments.holder')} value={form.holder} onChangeText={set('holder')} autoCapitalize="words" />
            <Input icon="card-outline" placeholder={t('payments.number')} value={form.number} onChangeText={set('number', formatCardNumber)} keyboardType="number-pad" autoComplete="cc-number" />
            {form.number.length > 0 && <Text style={[styles.muted, { marginTop: -6, marginBottom: 10 }]}>{brand}</Text>}
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Input placeholder={t('payments.expiry')} value={form.expiry} onChangeText={set('expiry', formatExpiry)} keyboardType="number-pad" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <Input placeholder={t('payments.cvc')} value={form.cvc} onChangeText={set('cvc', (v) => v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secure />
              </View>
            </Row>
            <Text style={styles.label}>{t('payments.country')}</Text>
            <ChipGroup small options={COUNTRIES} value={form.country} onChange={set('country')} />
            {!!error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}
            <Row style={{ marginTop: 14 }}>
              <Button small variant="outline" title={t('common.cancel')} style={{ flex: 1 }} onPress={() => { setAdding(false); setError(''); setForm(EMPTY_FORM); }} />
              <Button small title={t('payments.save')} style={{ flex: 1 }} onPress={save} />
            </Row>
          </Card>
        </SettingsSection>
      ) : (
        cards.length > 0 && <Button title={t('payments.add')} icon="add" variant="outline" style={{ marginTop: 6 }} onPress={() => setAdding(true)} />
      )}

      <Row style={{ marginTop: 20, alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.muted} style={{ marginTop: 2 }} />
        <Text style={[styles.muted, { flex: 1 }]}>{t('payments.simulated')}</Text>
      </Row>
    </Screen>
  );
}
