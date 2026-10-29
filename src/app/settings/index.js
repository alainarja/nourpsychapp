import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { Card, Header, MenuRow, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGES, useI18n } from '../../i18n';
import { comingSoon } from '../../utils/alert';

export default function Settings() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <Header title={t('settings.title')} back />
      <Card style={{ paddingVertical: 4 }}>
        <MenuRow icon="person-circle-outline" title={t('settings.account')} subtitle={t('settings.account.sub')} onPress={() => router.push('/settings/account')} />
        <MenuRow icon="lock-closed-outline" title={t('settings.security')} subtitle={t('settings.security.sub')} onPress={() => router.push('/settings/security')} />
        <MenuRow icon="shield-checkmark-outline" title={t('settings.privacy')} subtitle={t('settings.privacy.sub')} onPress={() => router.push('/settings/privacy')} />
        <MenuRow icon="notifications-outline" title={t('settings.notifications')} subtitle={t('settings.notifications.sub')} onPress={() => router.push('/settings/notifications')} />
        <MenuRow icon="language-outline" title={t('settings.language')} subtitle={LANGUAGES.find((l) => l.value === lang)?.native} onPress={() => router.push('/settings/language')} />
        {user.role !== 'admin' && (
          <MenuRow icon="card-outline" title={t('settings.payments')} subtitle={t('settings.payments.sub')} onPress={() => router.push('/settings/payments')} />
        )}
      </Card>
      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="help-circle-outline" title={t('settings.help')} onPress={() => comingSoon('Help & support')} />
        <MenuRow icon="heart-outline" title="Get help now" subtitle="Crisis lines and grounding" onPress={() => router.push('/crisis')} />
      </Card>
      <Text style={[styles.muted, { textAlign: 'center', marginTop: 20 }]}>Shift & Thrive · {t('settings.version', undefined, { v: version })}</Text>
    </Screen>
  );
}
