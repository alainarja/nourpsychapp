import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Row, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { QUICK_PROMPTS, reply } from '../../../data/mirror';
import { db, useCollection } from '../../../db/db';
import { colors, radius } from '../../../theme';
import { confirm } from '../../../utils/alert';

export default function Mirror() {
  const { user } = useAuth();
  const { data: chats } = useCollection('chats');
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  const messages = useMemo(
    () => chats.filter((c) => c.userId === user.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [chats, user.id],
  );

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, typing]);

  const send = async (raw) => {
    const msg = raw.trim();
    if (!msg || typing) return;
    setText('');
    const lastAi = [...messages].reverse().find((m) => m.from === 'ai');
    await db.insert('chats', { userId: user.id, from: 'user', text: msg });
    setTyping(true);
    setTimeout(async () => {
      const r = reply(msg, { name: user.name.split(' ')[0], awaitingGoal: !!lastAi?.asksGoal });
      if (r.goal) await db.insert('goals', { userId: user.id, title: r.goal, done: false });
      await db.insert('chats', { userId: user.id, from: 'ai', text: r.text, crisis: !!r.crisis, asksGoal: !!r.asksGoal });
      setTyping(false);
    }, 600);
  };

  const clear = () =>
    confirm('Clear conversation?', 'This removes your Mirror chat history from this device.', async () => {
      for (const m of messages) await db.remove('chats', m.id);
    }, 'Clear', true);

  const intro = `Hi ${user.name.split(' ')[0]},\n\nI'm here to support you. You can talk about anything — your feelings, thoughts, challenges or goals. What would you like to explore today?`;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.h1}>Mirror AI</Text>
            {messages.length > 0 && (
              <Pressable onPress={clear} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            )}
          </Row>
          <Text style={styles.subtitle}>Your reflection space.</Text>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 10 }} keyboardShouldPersistTaps="handled">
          <Bubble from="ai" text={intro} />
          {messages.length === 0 && (
            <View style={{ gap: 8, marginTop: 4 }}>
              {QUICK_PROMPTS.map((p) => (
                <Pressable key={p} onPress={() => send(p)} style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.primarySoft }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>{p}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {messages.map((m) => (
            <View key={m.id}>
              <Bubble from={m.from} text={m.text} />
              {m.crisis && <Button title="Get help now" icon="call" small style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.danger }} onPress={() => router.push('/crisis')} />}
            </View>
          ))}
          {typing && <Bubble from="ai" text="…" />}
        </ScrollView>

        {messages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }} style={{ flexGrow: 0 }}>
            {QUICK_PROMPTS.map((p) => (
              <Pressable key={p} onPress={() => send(p)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.tanSoft }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Row style={{ backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your message…"
              placeholderTextColor={colors.faint}
              style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 6, outlineStyle: 'none' }}
              onSubmitEditing={() => send(text)}
              returnKeyType="send"
            />
            <Pressable onPress={() => send(text)} disabled={!text.trim() || typing} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: text.trim() ? 1 : 0.5 }}>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </Pressable>
          </Row>
          <Text style={[styles.muted, { fontSize: 11, textAlign: 'center', marginTop: 6 }]}>Mirror is not a therapist or emergency service.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ from, text }) {
  const mine = from === 'user';
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 8 }}>
      {!mine && (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          <Ionicons name="sparkles" size={14} color={colors.white} />
        </View>
      )}
      <View style={{ maxWidth: '80%', padding: 12, borderRadius: 16, backgroundColor: mine ? colors.primary : colors.surface, borderWidth: mine ? 0 : 1, borderColor: colors.border, borderTopLeftRadius: mine ? 16 : 4, borderTopRightRadius: mine ? 4 : 16 }}>
        <Text style={{ color: mine ? colors.white : colors.text, fontSize: 15, lineHeight: 21 }}>{text}</Text>
      </View>
    </View>
  );
}
