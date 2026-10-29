import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, EmptyState, Row, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { isCrisis } from '../../data/mirror';
import { markThreadRead, sendMessage, threadKey } from '../../db/actions';
import { useCollection } from '../../db/db';
import { colors, radius } from '../../theme';
import { comingSoon, notify } from '../../utils/alert';
import { clockTime, dayLabel } from '../../utils/chat';
import { dateKey, todayKey } from '../../utils/date';

export default function Thread() {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: messages } = useCollection('messages');
  const { data: users } = useCollection('users');
  const { data: appointments } = useCollection('appointments');
  const [text, setText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const scrollRef = useRef(null);

  const other = users.find((u) => u.id === userId);
  const key = threadKey(user.id, userId);
  const thread = useMemo(
    () => messages.filter((m) => m.threadId === key).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages, key],
  );
  const unreadCount = thread.filter((m) => m.toId === user.id && !m.read).length;

  useEffect(() => {
    if (unreadCount) markThreadRead(user.id, userId);
  }, [unreadCount, user.id, userId]);

  // Today's booked online session between the two of us, if any.
  const todaysCall = useMemo(
    () => appointments.find((a) =>
      a.status === 'booked' && a.mode === 'online' && a.date === todayKey()
      && ((a.clientId === user.id && a.proId === userId) || (a.proId === user.id && a.clientId === userId))),
    [appointments, user.id, userId],
  );

  const startCall = () => {
    if (todaysCall) router.push(`/call/${todaysCall.id}`);
    else notify('No session today', 'Video calls are available during booked online sessions.');
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    if (user.role === 'client' && isCrisis(body)) setShowCrisis(true);
    await sendMessage(user.id, userId, body);
  };

  if (!other) {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState title="Conversation not found" action="Back" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  let lastDay = null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Row gap={10} style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Avatar name={other.name} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.h3} numberOfLines={1}>{other.name}</Text>
          <Text style={[styles.muted, { fontSize: 12 }]}>{other.title ?? (other.role === 'client' ? 'Client' : '')}</Text>
        </View>
        <Pressable onPress={startCall} hitSlop={8} style={{ padding: 6 }} accessibilityLabel="Start video call">
          <Ionicons name="videocam-outline" size={24} color={todaysCall ? colors.primary : colors.faint} />
        </Pressable>
      </Row>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, gap: 6 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {thread.length === 0 && (
            <Text style={[styles.muted, { textAlign: 'center', marginTop: 24 }]}>Say hello to {other.name.split(' ')[0]}.</Text>
          )}
          {thread.map((m) => {
            const mine = m.fromId === user.id;
            const day = dateKey(new Date(m.createdAt));
            const separator = day !== lastDay;
            lastDay = day;
            return (
              <View key={m.id}>
                {separator && <Text style={[styles.muted, { textAlign: 'center', fontSize: 12, marginVertical: 10 }]}>{dayLabel(m.createdAt)}</Text>}
                <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <View style={{
                    backgroundColor: mine ? colors.primary : colors.surface, borderRadius: radius.lg, padding: 12,
                    borderBottomRightRadius: mine ? 4 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 4,
                    borderWidth: mine ? 0 : 1, borderColor: colors.border,
                  }}>
                    <Text style={{ color: mine ? colors.white : colors.text, fontSize: 15, lineHeight: 21 }}>{m.text}</Text>
                  </View>
                  <Text style={[styles.muted, { fontSize: 11, marginTop: 2, textAlign: mine ? 'right' : 'left' }]}>
                    {clockTime(m.createdAt)}{mine && m.read ? ' · Read' : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {showCrisis && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.dangerSoft }}>
            <Text style={[styles.body, { color: colors.danger, fontWeight: '700' }]}>You don't have to wait for a reply</Text>
            <Text style={[styles.muted, { marginTop: 2 }]}>
              Your therapist may not see this right away. If you're thinking about hurting yourself, please reach out now.
            </Text>
            <Row style={{ marginTop: 10 }}>
              <Button small title="Get help now" icon="call" style={{ flex: 1, backgroundColor: colors.danger }} onPress={() => router.push('/crisis')} />
              <Button small variant="ghost" title="Dismiss" onPress={() => setShowCrisis(false)} />
            </Row>
          </View>
        )}

        <Row gap={8} style={{ padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Pressable onPress={() => comingSoon('Attachments')} hitSlop={8} accessibilityLabel="Add attachment">
            <Ionicons name="attach" size={24} color={colors.muted} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={colors.faint}
            multiline
            onSubmitEditing={send}
            blurOnSubmit={false}
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            style={{ flex: 1, maxHeight: 110, minHeight: 42, backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, outlineStyle: 'none' }}
          />
          <Pressable onPress={send} disabled={!text.trim()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: text.trim() ? colors.primary : colors.faint, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Send">
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </Row>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
