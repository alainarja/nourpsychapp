import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessagesButton, NotificationBell } from '../../../components/NotificationBell';
import { Avatar, Badge, Card, IconTile, Row, Screen, SectionTitle, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { MOODS, apptDateTime, sortByDateTime } from '../../../db/actions';
import { db, useCollection } from '../../../db/db';
import { colors, fonts, radius } from '../../../theme';
import { dateKey, greeting, longDate, timeLabel } from '../../../utils/date';

const TILES = [
  { icon: 'search', title: 'Find My Match', subtitle: 'Get matched with a psychologist', href: '/client/find-match' },
  { icon: 'people', title: 'Therapy', subtitle: 'Book and manage sessions', href: '/client/therapy' },
  { icon: 'sparkles', title: 'Mirror AI', subtitle: 'Reflect, learn and grow', href: '/client/mirror' },
  { icon: 'bag-handle', title: 'Marketplace', subtitle: 'Guides, tools and resources', href: '/client/explore' },
  { icon: 'easel', title: 'Workshops', subtitle: 'Live and recorded events', href: '/client/workshops' },
  { icon: 'trending-up', title: 'My Journey', subtitle: 'Track your progress', href: '/client/journey' },
];

export default function ClientHome() {
  const { user } = useAuth();
  const { data: moods } = useCollection('moods');
  const { data: appointments } = useCollection('appointments');
  const { data: users } = useCollection('users');

  const todayMood = useMemo(
    () => moods.find((m) => m.userId === user.id && dateKey(new Date(m.createdAt)) === dateKey()),
    [moods, user.id],
  );

  const next = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter((a) => a.clientId === user.id && a.status === 'booked' && apptDateTime(a) >= now);
    return sortByDateTime(upcoming)[0];
  }, [appointments, user.id]);
  const nextPro = next && users.find((u) => u.id === next.proId);
  const org = user.orgId ? users.find((u) => u.id === user.orgId && u.role === 'org') : null;

  const logMood = async (mood) => {
    if (todayMood) await db.update('moods', todayMood.id, { mood });
    else await db.insert('moods', { userId: user.id, mood, note: '' });
  };

  const logged = MOODS.find((m) => m.value === todayMood?.mood);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
        <View>
          <Text style={{ fontSize: 18, color: colors.muted }}>{greeting()},</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.primary, fontWeight: '700' }}>{user.name.split(' ')[0]} ☀️</Text>
        </View>
        <Row>
          <MessagesButton />
          <NotificationBell />
        </Row>
      </Row>

      {org && (
        <Row gap={6} style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.successSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill }}>
          <Ionicons name="business-outline" size={14} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>Your sessions are supported by {org.name}</Text>
        </Row>
      )}

      <Card style={{ marginTop: 18 }}>
        <Row>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <Text style={[styles.body, { fontWeight: '600' }]}>How are you feeling today?</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 14 }}>
          {MOODS.map((m) => {
            const active = todayMood?.mood === m.value;
            return (
              <Pressable key={m.value} onPress={() => logMood(m.value)} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: active ? colors.primary : 'transparent' }}>
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                </View>
                <Text style={{ fontSize: 12, marginTop: 4, color: active ? colors.primary : colors.muted, fontWeight: active ? '700' : '500' }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </Row>
        {logged && (
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 10 }]}>
            Logged: {logged.label} · tap another to update
          </Text>
        )}
      </Card>

      {next && nextPro && (
        <>
          <SectionTitle action="All sessions" onAction={() => router.push('/client/therapy')}>Your next session</SectionTitle>
          <Card onPress={() => router.push('/client/therapy')}>
            <Row gap={12}>
              <Avatar name={nextPro.name} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>{nextPro.name}</Text>
                <Text style={styles.muted}>{longDate(next.date)} · {timeLabel(next.time)}</Text>
              </View>
              <Badge label={next.mode === 'online' ? 'Online' : 'In-person'} />
            </Row>
          </Card>
        </>
      )}

      <Card style={{ marginTop: 20 }} onPress={() => router.push('/client/match-quiz')}>
          <Row gap={12}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tanSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="compass-outline" size={22} color={colors.tan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>Not sure who to choose?</Text>
              <Text style={styles.muted}>Take the 1-minute match quiz</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Row>
        </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
        {TILES.map((t) => (
          <View key={t.title} style={{ width: '48%', flexGrow: 1 }}>
            <IconTile icon={t.icon} title={t.title} subtitle={t.subtitle} onPress={() => router.push(t.href)} />
          </View>
        ))}
      </View>

      <Pressable onPress={() => router.push('/crisis')} style={{ marginTop: 20, padding: 14, borderRadius: radius.md, backgroundColor: colors.tanSoft, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="heart-outline" size={20} color={colors.tan} />
        <Text style={[styles.body, { flex: 1 }]}>Need help now? <Text style={styles.link}>Find support</Text></Text>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </Pressable>
    </Screen>
  );
}
