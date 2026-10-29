import { Text } from 'react-native';
import { SettingsSection, ToggleRow } from '../../components/settings';
import { Card, ChipGroup, Divider, Header, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

const DEFAULT_NOTIFICATION_PREFS = {
  reminders: true, reminderTiming: 'both', messages: true, bookings: true, orders: true, workshops: true, news: false,
  push: true, email: true, sms: false, quietHours: 'none',
};

const QUIET = [
  { value: 'none', key: 'notifPrefs.none' },
  { value: '22-07', label: '10 PM – 7 AM' },
  { value: '23-08', label: '11 PM – 8 AM' },
  { value: '21-09', label: '9 PM – 9 AM' },
];

export default function NotificationSettings() {
  const { user, updateProfile } = useAuth();
  const { t } = useI18n();
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...user.notificationPrefs };
  const set = (k) => (v) => updateProfile({ notificationPrefs: { ...prefs, [k]: v } });
  const isPro = user.role === 'pro';

  return (
    <Screen>
      <Header title={t('settings.notifications')} back />

      <SettingsSection title={t('notifPrefs.types')}>
        <Card>
          {user.role !== 'org' && user.role !== 'admin' && (
            <>
              <ToggleRow title={t('notifPrefs.reminders')} value={prefs.reminders} onChange={set('reminders')} />
              {prefs.reminders && (
                <>
                  <Text style={[styles.muted, { marginBottom: 6 }]}>{t('notifPrefs.timing')}</Text>
                  <ChipGroup
                    small
                    value={prefs.reminderTiming}
                    onChange={set('reminderTiming')}
                    options={[{ value: '1h', label: '1 hour before' }, { value: '24h', label: '24 hours before' }, { value: 'both', label: 'Both' }]}
                  />
                  <Divider />
                </>
              )}
              <ToggleRow title={t('notifPrefs.messages')} value={prefs.messages} onChange={set('messages')} />
              <ToggleRow title={t('notifPrefs.bookings')} value={prefs.bookings} onChange={set('bookings')} />
            </>
          )}
          {isPro && <ToggleRow title={t('notifPrefs.orders')} value={prefs.orders} onChange={set('orders')} />}
          <ToggleRow title={t('notifPrefs.workshops')} value={prefs.workshops} onChange={set('workshops')} />
          <ToggleRow title={t('notifPrefs.news')} value={prefs.news} onChange={set('news')} />
        </Card>
      </SettingsSection>

      <SettingsSection title={t('notifPrefs.channels')}>
        <Card>
          <ToggleRow title={t('notifPrefs.push')} value={prefs.push} onChange={set('push')} />
          <ToggleRow title={t('notifPrefs.email')} value={prefs.email} onChange={set('email')} />
          <ToggleRow title={t('notifPrefs.sms')} value={prefs.sms} onChange={set('sms')} />
        </Card>
      </SettingsSection>

      <SettingsSection title={t('notifPrefs.quiet')}>
        <Card>
          <Text style={[styles.muted, { marginBottom: 10 }]}>{t('notifPrefs.quiet.sub')}</Text>
          <ChipGroup small value={prefs.quietHours} onChange={set('quietHours')} options={QUIET.map((q) => ({ value: q.value, label: q.key ? t(q.key) : q.label }))} />
        </Card>
      </SettingsSection>
    </Screen>
  );
}
