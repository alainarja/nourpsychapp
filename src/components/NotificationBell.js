import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../db/db';
import { colors } from '../theme';

function CountBadge({ count }) {
  if (!count) return null;
  return (
    <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
      <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const circle = { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' };

// Header icon → /notifications, with unread count.
export function NotificationBell() {
  const { user } = useAuth();
  const { data } = useCollection('notifications');
  const unread = useMemo(() => data.filter((n) => n.userId === user?.id && !n.read).length, [data, user]);
  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={circle} accessibilityLabel={`Notifications, ${unread} unread`}>
      <Ionicons name="notifications-outline" size={20} color={colors.primary} />
      <CountBadge count={unread} />
    </Pressable>
  );
}

// Header icon → /messages, with unread count.
export function MessagesButton() {
  const { user } = useAuth();
  const { data } = useCollection('messages');
  const unread = useMemo(() => data.filter((m) => m.toId === user?.id && !m.read).length, [data, user]);
  return (
    <Pressable onPress={() => router.push('/messages')} hitSlop={8} style={circle} accessibilityLabel={`Messages, ${unread} unread`}>
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
      <CountBadge count={unread} />
    </Pressable>
  );
}
