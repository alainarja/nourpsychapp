import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Card, EmptyState, Header, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../db/db';
import { colors, radius } from '../../theme';
import { messageTime } from '../../utils/chat';

export default function Messages() {
  const { user } = useAuth();
  const { data: messages } = useCollection('messages');
  const { data: users } = useCollection('users');
  const { data: appointments } = useCollection('appointments');
  const [picking, setPicking] = useState(false);

  const threads = useMemo(() => {
    const byOther = new Map();
    for (const m of messages) {
      if (m.fromId !== user.id && m.toId !== user.id) continue;
      const other = m.fromId === user.id ? m.toId : m.fromId;
      const t = byOther.get(other) ?? { otherId: other, last: m, unread: 0 };
      if (new Date(m.createdAt) >= new Date(t.last.createdAt)) t.last = m;
      if (m.toId === user.id && !m.read) t.unread += 1;
      byOther.set(other, t);
    }
    return [...byOther.values()].sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt));
  }, [messages, user.id]);

  // People you can message: the other side of any non-cancelled appointment.
  const contacts = useMemo(() => {
    const ids = new Set();
    for (const a of appointments) {
      if (a.status === 'cancelled') continue;
      if (a.clientId === user.id) ids.add(a.proId);
      if (a.proId === user.id) ids.add(a.clientId);
    }
    return users.filter((u) => ids.has(u.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments, users, user.id]);

  const userOf = (id) => users.find((u) => u.id === id);

  return (
    <Screen>
      <Header
        title="Messages"
        subtitle={user.role === 'pro' ? 'Secure messages with your clients.' : 'Secure messages with your care team.'}
        back
        right={
          <Pressable onPress={() => setPicking((p) => !p)} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={picking ? 'close' : 'create-outline'} size={20} color={colors.white} />
          </Pressable>
        }
      />

      <Row style={{ backgroundColor: colors.primarySoft, padding: 12, borderRadius: radius.md, alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
        <Text style={[styles.muted, { flex: 1, color: colors.primary }]}>
          Messages will be end-to-end encrypted once the backend is live.
          {user.role === 'client' ? ' Not for emergencies — ' : ''}
          {user.role === 'client' && <Text style={[styles.link, { fontSize: 13 }]} onPress={() => router.push('/crisis')}>Get help now</Text>}
        </Text>
      </Row>

      {picking && (
        <>
          <SectionTitle>New message</SectionTitle>
          {contacts.length === 0 ? (
            <Text style={styles.muted}>
              {user.role === 'pro' ? 'Clients appear here once they book with you.' : 'You can message a professional after booking a session.'}
            </Text>
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {contacts.map((c) => (
                <Pressable key={c.id} onPress={() => { setPicking(false); router.push(`/messages/${c.id}`); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                  <Avatar name={c.name} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>{c.name}</Text>
                    {!!c.title && <Text style={styles.muted}>{c.title}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.faint} />
                </Pressable>
              ))}
            </Card>
          )}
        </>
      )}

      <SectionTitle>Conversations</SectionTitle>
      {threads.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No messages yet" message="Start a conversation with someone you have a session with." action="New message" onAction={() => setPicking(true)} />
      ) : (
        <View style={{ gap: 10 }}>
          {threads.map((t) => {
            const other = userOf(t.otherId);
            const mine = t.last.fromId === user.id;
            return (
              <Card key={t.otherId} onPress={() => router.push(`/messages/${t.otherId}`)} style={{ paddingVertical: 12 }}>
                <Row gap={12}>
                  <Avatar name={other?.name ?? '?'} size={46} />
                  <View style={{ flex: 1 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={[styles.h3, { flexShrink: 1 }]} numberOfLines={1}>{other?.name ?? 'Unknown'}</Text>
                      <Text style={[styles.muted, { fontSize: 12 }]}>{messageTime(t.last.createdAt)}</Text>
                    </Row>
                    <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={[styles.muted, { flex: 1 }, t.unread > 0 && { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                        {mine ? 'You: ' : ''}{t.last.text}
                      </Text>
                      {t.unread > 0 && (
                        <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                          <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{t.unread}</Text>
                        </View>
                      )}
                    </Row>
                  </View>
                </Row>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
