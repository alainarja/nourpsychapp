import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, EmptyState, Header, Row, Screen, Segmented, styles } from '../components/ui';
import { onboardingRoute, useAuth } from '../context/AuthContext';
import { markAllNotificationsRead, markNotificationRead } from '../db/actions';
import { useCollection } from '../db/db';
import { useI18n } from '../i18n';
import { colors } from '../theme';
import { relativeTime } from '../utils/relativeTime';

const TYPE_ICON = {
  booking: 'calendar-outline',
  cancellation: 'close-circle-outline',
  reminder: 'alarm-outline',
  message: 'chatbubble-ellipses-outline',
  order: 'bag-handle-outline',
  workshop: 'easel-outline',
  review: 'star-outline',
  verification: 'shield-checkmark-outline',
  system: 'information-circle-outline',
};

export default function Notifications() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data } = useCollection('notifications');
  const [filter, setFilter] = useState('all');

  const mine = useMemo(
    () => (user ? data.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [data, user],
  );
  const unreadCount = mine.filter((n) => !n.read).length;
  const shown = filter === 'unread' ? mine.filter((n) => !n.read) : mine;

  const gate = onboardingRoute(user);
  if (gate) return <Redirect href={gate} />;

  const open = async (n) => {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <Screen>
      <Header
        title={t('notifs.title')}
        back
        right={
          <Pressable onPress={() => router.push('/settings/notifications')} hitSlop={10} accessibilityLabel={t('notifs.settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </Pressable>
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: t('notifs.all') }, { value: 'unread', label: `${t('notifs.unread')}${unreadCount ? ` (${unreadCount})` : ''}` }]}
      />
      {unreadCount > 0 && (
        <Button small variant="ghost" title={t('notifs.markAll')} style={{ alignSelf: 'flex-end', marginTop: 6 }} onPress={() => markAllNotificationsRead(user.id)} />
      )}

      {shown.length === 0 ? (
        <EmptyState icon="notifications-off-outline" title={t('notifs.empty')} message={t('notifs.emptyMsg')} />
      ) : (
        <View style={{ gap: 10, marginTop: 10 }}>
          {shown.map((n) => (
            <Card key={n.id} onPress={() => open(n)} style={!n.read && { borderColor: colors.primary, backgroundColor: colors.card }}>
              <Row gap={12} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={TYPE_ICON[n.type] ?? TYPE_ICON.system} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[styles.body, { fontWeight: n.read ? '600' : '800', flex: 1 }]} numberOfLines={1}>{n.title}</Text>
                    <Text style={[styles.muted, { fontSize: 11 }]}>{relativeTime(n.createdAt, t)}</Text>
                  </Row>
                  {!!n.body && <Text style={[styles.muted, { marginTop: 2 }]} numberOfLines={2}>{n.body}</Text>}
                </View>
                {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginTop: 6 }} accessibilityLabel="Unread" />}
              </Row>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
