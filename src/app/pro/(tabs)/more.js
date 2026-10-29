import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { MessagesButton, NotificationBell } from '../../../components/NotificationBell';
import { Avatar, Badge, Card, Header, MenuRow, Rating, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../db/db';
import { seedIfNeeded } from '../../../db/seed';
import { LANGUAGES, useI18n } from '../../../i18n';
import { comingSoon, confirm } from '../../../utils/alert';

const VERIFICATION = {
  approved: ['Verified', 'success'],
  pending: ['In review', 'tan'],
  rejected: ['Action needed', 'danger'],
  not_submitted: ['Not submitted', 'muted'],
};

export default function More() {
  const { user, signOut } = useAuth();
  const { t, lang } = useI18n();
  if (!user) return null;

  const status = user.verificationStatus ?? (user.verified ? 'approved' : 'not_submitted');
  const [statusLabel, statusTone] = VERIFICATION[status] ?? VERIFICATION.not_submitted;

  const logout = () => confirm(`${t('common.signOut')}?`, '', async () => {
    await signOut();
    router.replace('/welcome');
  }, t('common.signOut'));

  const resetDemo = () => confirm('Reset demo data?', 'All local data on this device will be erased and the demo data restored.', async () => {
    await signOut();
    await db.reset();
    await seedIfNeeded();
    router.replace('/welcome');
  }, 'Reset', true);

  return (
    <Screen>
      <Header title={t('tab.more')} right={<Row><MessagesButton /><NotificationBell /></Row>} />
      <Card onPress={() => router.push('/pro/profile')}>
        <Row gap={14}>
          <Avatar name={user.name} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>{user.name}</Text>
            <Text style={styles.muted}>{user.title}</Text>
            <Rating value={user.rating} count={user.reviews} />
          </View>
        </Row>
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="person-outline" title="My Profile" onPress={() => router.push('/pro/profile')} />
        <MenuRow icon="ribbon-outline" title="License verification" onPress={() => router.push('/pro/verification')} right={<Badge label={statusLabel} tone={statusTone} />} />
        <MenuRow icon="time-outline" title="Availability" onPress={() => router.push('/pro/availability')} />
        <MenuRow icon="chatbubble-ellipses-outline" title={t('common.messages')} onPress={() => router.push('/messages')} />
        <MenuRow icon="star-outline" title="Reviews" subtitle="What clients say" onPress={() => router.push('/pro/reviews')} />
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="diamond-outline" title="Psych Pro" subtitle="Premium tools for your practice" onPress={() => router.push('/pro/tools')} />
        <MenuRow icon="wallet-outline" title="Earnings" onPress={() => router.push('/pro/earnings')} />
        <MenuRow icon="cash-outline" title="Payouts" subtitle="Bank account and payout history" onPress={() => router.push('/pro/payouts')} />
        <MenuRow icon="receipt-outline" title="Receipts & invoices" onPress={() => router.push('/receipts')} />
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="notifications-outline" title={t('common.notifications')} subtitle={t('settings.notifications.sub')} onPress={() => router.push('/settings/notifications')} />
        <MenuRow icon="shield-checkmark-outline" title="Privacy & compliance" subtitle={t('settings.privacy.sub')} onPress={() => router.push('/settings/privacy')} />
        <MenuRow icon="language-outline" title={t('settings.language')} subtitle={LANGUAGES.find((l) => l.value === lang)?.native} onPress={() => router.push('/settings/language')} />
        <MenuRow icon="settings-outline" title={t('common.settings')} onPress={() => router.push('/settings')} />
        <MenuRow icon="help-circle-outline" title={t('settings.help')} onPress={() => comingSoon('Help & support')} />
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="refresh-outline" title="Reset demo data" onPress={resetDemo} />
        <MenuRow icon="log-out-outline" title={t('common.signOut')} danger onPress={logout} />
      </Card>
    </Screen>
  );
}
