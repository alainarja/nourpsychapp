import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Header, Row, Screen, styles } from '../../components/ui';
import { HOME_BY_ROLE, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { consentItemsFor } from '../../data/consents';
import { colors } from '../../theme';

function ConsentRow({ item, checked, onToggle }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ marginBottom: 10 }}>
      <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
        <Row style={{ alignItems: 'flex-start' }} gap={10}>
          <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { fontWeight: '700' }]}>{t(item.label)}</Text>
            <View style={{ marginTop: 4 }}>
              <Badge label={item.required ? t('common.required') : t('common.optional')} tone={item.required ? 'primary' : 'muted'} />
            </View>
          </View>
        </Row>
      </Pressable>
      <Pressable onPress={() => setOpen((o) => !o)} hitSlop={6} style={{ marginTop: 10, marginLeft: 32 }}>
        <Text style={[styles.link, { fontSize: 13 }]}>{open ? t('consent.hide') : t('consent.readMore')}</Text>
      </Pressable>
      {open && <Text style={[styles.muted, { marginTop: 6, marginLeft: 32 }]}>{t(`${item.label}.sum`)}</Text>}
    </Card>
  );
}

export default function Consent() {
  const { user, recordConsent } = useAuth();
  const { t } = useI18n();
  const [checked, setChecked] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Redirect href="/welcome" />;
  if (!user.emailVerified) return <Redirect href="/verify-email" />;
  if (user.consentedAt) return <Redirect href={HOME_BY_ROLE[user.role]} />;

  const items = consentItemsFor(user.role);
  const allRequired = items.filter((i) => i.required).every((i) => checked[i.key]);

  const accept = async () => {
    if (!allRequired) return setError(t('consent.needRequired'));
    setBusy(true);
    await recordConsent(Object.fromEntries(items.map((i) => [i.key, !!checked[i.key]])));
    router.replace(HOME_BY_ROLE[user.role]);
  };

  return (
    <Screen footer={
      <View style={{ padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
        {!!error && !allRequired && <Text style={{ color: colors.danger, marginBottom: 8, textAlign: 'center' }}>{error}</Text>}
        <Button title={t('consent.accept')} onPress={accept} loading={busy} disabled={!allRequired} />
      </View>
    }>
      <Header title={t('consent.title')} subtitle={t('consent.subtitle')} />
      {items.map((item) => (
        <ConsentRow key={item.key} item={item} checked={!!checked[item.key]} onToggle={() => setChecked((c) => ({ ...c, [item.key]: !c[item.key] }))} />
      ))}
    </Screen>
  );
}
