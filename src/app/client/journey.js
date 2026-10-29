import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Header, Input, Row, Screen, SectionTitle, StatCard, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ASSESSMENTS, bandFor } from '../../data/assessments';
import { MOODS } from '../../db/actions';
import { db, useCollection } from '../../db/db';
import { colors } from '../../theme';
import { confirm } from '../../utils/alert';
import { addDays, dateKey, shortDate, WEEKDAYS } from '../../utils/date';

const moodOf = (v) => MOODS.find((m) => m.value === v);

export default function Journey() {
  const { user } = useAuth();
  const { data: moods } = useCollection('moods');
  const { data: goals } = useCollection('goals');
  const { data: appointments } = useCollection('appointments');
  const { data: assessments } = useCollection('assessments');
  const { data: medications } = useCollection('medications');
  const activeMeds = useMemo(() => medications.filter((m) => m.clientId === user.id && m.status === 'active').length, [medications, user.id]);
  const [newGoal, setNewGoal] = useState('');
  const [note, setNote] = useState(null); // null = not editing

  const myMoods = useMemo(
    () => moods.filter((m) => m.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [moods, user.id],
  );
  const myGoals = useMemo(() => goals.filter((g) => g.userId === user.id).sort((a, b) => Number(a.done) - Number(b.done)), [goals, user.id]);
  const myAssessments = useMemo(
    () => assessments.filter((a) => a.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [assessments, user.id],
  );
  const completed = appointments.filter((a) => a.clientId === user.id && a.status === 'completed').length;

  // Latest mood per day for the last 7 days.
  const week = useMemo(() => {
    const byDay = new Map();
    myMoods.forEach((m) => {
      const k = dateKey(new Date(m.createdAt));
      if (!byDay.has(k)) byDay.set(k, m);
    });
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i - 6);
      return { d, mood: byDay.get(dateKey(d)) };
    });
  }, [myMoods]);

  const todayMood = week[6].mood;

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    await db.insert('goals', { userId: user.id, title: newGoal.trim(), done: false });
    setNewGoal('');
  };

  const saveNote = async () => {
    if (todayMood) await db.update('moods', todayMood.id, { note: note.trim() });
    else await db.insert('moods', { userId: user.id, mood: 'calm', note: note.trim() });
    setNote(null);
  };

  return (
    <Screen>
      <Header title="My Journey" subtitle="Small steps add up." back />

      <Row gap={10}>
        <StatCard value={completed} label="Sessions completed" />
        <StatCard value={myMoods.length} label="Mood check-ins" />
        <StatCard value={myGoals.filter((g) => g.done).length} label="Goals reached" />
      </Row>

      {activeMeds > 0 && (
        <Card style={{ marginTop: 14, paddingVertical: 12 }} onPress={() => router.push('/client/medications')}>
          <Row gap={12}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="medical-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>My medications</Text>
              <Text style={styles.muted}>{activeMeds} active · track doses and reminders</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Row>
        </Card>
      )}

      <SectionTitle>This week</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          {week.map(({ d, mood }) => {
            const m = moodOf(mood?.mood);
            return (
              <View key={dateKey(d)} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: m?.color ?? colors.tanSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{m?.emoji ?? '·'}</Text>
                </View>
                <Text style={[styles.muted, { fontSize: 11, marginTop: 4 }]}>{WEEKDAYS[d.getDay()]}</Text>
              </View>
            );
          })}
        </Row>
        <View style={{ marginTop: 14 }}>
          {note === null ? (
            <Pressable onPress={() => setNote(todayMood?.note ?? '')}>
              <Row>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={[styles.link, { flex: 1 }]} numberOfLines={2}>
                  {todayMood?.note ? `Today: ${todayMood.note}` : "Add a journal note for today"}
                </Text>
              </Row>
            </Pressable>
          ) : (
            <>
              <Input multiline placeholder="How was your day? What's on your mind?" value={note} onChangeText={setNote} autoFocus />
              <Row>
                <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setNote(null)} />
                <Button small title="Save note" style={{ flex: 1 }} onPress={saveNote} />
              </Row>
            </>
          )}
        </View>
      </Card>

      <SectionTitle>Goals</SectionTitle>
      <Card>
        {myGoals.length === 0 && <Text style={styles.muted}>No goals yet. Add one below or ask Mirror AI to help you set one.</Text>}
        {myGoals.map((g) => (
          <Row key={g.id} style={{ paddingVertical: 8 }}>
            <Pressable onPress={() => db.update('goals', g.id, { done: !g.done })} hitSlop={8}>
              <Ionicons name={g.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={g.done ? colors.success : colors.faint} />
            </Pressable>
            <Text style={[styles.body, { flex: 1 }, g.done && { textDecorationLine: 'line-through', color: colors.muted }]}>{g.title}</Text>
            <Pressable onPress={() => confirm('Delete goal?', g.title, () => db.remove('goals', g.id), 'Delete', true)} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.faint} />
            </Pressable>
          </Row>
        ))}
        <Row style={{ marginTop: 8, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="New goal…" value={newGoal} onChangeText={setNewGoal} onSubmitEditing={addGoal} />
          </View>
          <Button title="Add" small style={{ height: 50 }} onPress={addGoal} disabled={!newGoal.trim()} />
        </Row>
      </Card>

      <SectionTitle>Self-assessments</SectionTitle>
      <Row>
        {Object.values(ASSESSMENTS).map((a) => (
          <Button key={a.id} small variant="secondary" title={`Take ${a.name}`} style={{ flex: 1 }} onPress={() => router.push(`/assessment/${a.id}`)} />
        ))}
      </Row>
      {myAssessments.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          {myAssessments.map((r) => {
            const a = ASSESSMENTS[r.type];
            const band = a ? bandFor(a, r.score) : null;
            return (
              <Row key={r.id} style={{ paddingVertical: 8, justifyContent: 'space-between' }}>
                <View>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{a?.name ?? r.type} · {r.score}</Text>
                  <Text style={styles.muted}>{shortDate(dateKey(new Date(r.createdAt)))}</Text>
                </View>
                {band && <Badge label={band.label} tone={band.tone} />}
              </Row>
            );
          })}
        </Card>
      )}

      <SectionTitle>Mood history</SectionTitle>
      <Card>
        {myMoods.length === 0 && <Text style={styles.muted}>Check in from the home screen to start tracking your mood.</Text>}
        {myMoods.slice(0, 14).map((m) => {
          const mood = moodOf(m.mood);
          return (
            <Row key={m.id} gap={12} style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 22 }}>{mood?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '600' }]}>{mood?.label ?? m.mood}</Text>
                {!!m.note && <Text style={styles.muted}>{m.note}</Text>}
              </View>
              <Text style={styles.muted}>{shortDate(dateKey(new Date(m.createdAt)))}</Text>
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
