import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Switch, Text, View } from 'react-native';
import { Badge, Button, Card, ChipGroup, EmptyState, Header, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { db, useCollection } from '../../db/db';
import { colors, radius } from '../../theme';
import { addDays, dateKey, parseKey, shortDate, timeLabel, todayKey, WEEKDAYS } from '../../utils/date';

const REMINDER_TIMES = ['08:00', '12:00', '18:00', '21:00'].map((t) => ({ value: t, label: timeLabel(t) }));

export default function Medications() {
  const { user } = useAuth();
  const { data: meds } = useCollection('medications');
  const { data: logs } = useCollection('medLogs');
  const { data: reminders } = useCollection('medReminders');
  const { data: users } = useCollection('users');

  const mine = useMemo(
    () => meds.filter((m) => m.clientId === user.id).sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1)),
    [meds, user.id],
  );
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => dateKey(addDays(new Date(), i - 6))), []);
  const prescriberIds = [...new Set(mine.map((m) => m.proId))];

  const takenOn = (medId, day) => logs.some((l) => l.userId === user.id && l.medicationId === medId && l.date === day);
  const reminderFor = (medId) => reminders.find((r) => r.userId === user.id && r.medicationId === medId);

  const toggleTaken = async (med) => {
    const today = todayKey();
    const existing = logs.find((l) => l.userId === user.id && l.medicationId === med.id && l.date === today);
    if (existing) await db.remove('medLogs', existing.id);
    else await db.insert('medLogs', { userId: user.id, medicationId: med.id, date: today });
  };

  const setReminder = async (med, patch) => {
    const r = reminderFor(med.id);
    if (r) await db.update('medReminders', r.id, patch);
    else await db.insert('medReminders', { userId: user.id, medicationId: med.id, enabled: false, times: ['08:00'], ...patch });
  };

  return (
    <Screen>
      <Header title="My medications" subtitle="Track doses and set reminders." back />

      <Row style={{ backgroundColor: colors.primarySoft, padding: 12, borderRadius: radius.md, alignItems: 'flex-start' }}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
        <Text style={[styles.muted, { flex: 1, color: colors.primary }]}>
          Only your psychiatrist can change your prescription. Never stop a medication suddenly without talking to them.
        </Text>
      </Row>

      {mine.length === 0 ? (
        <EmptyState icon="medical-outline" title="No medications" message="Medications prescribed by your psychiatrist will appear here." />
      ) : (
        mine.map((m) => {
          const prescriber = users.find((u) => u.id === m.proId);
          const reminder = reminderFor(m.id);
          const active = m.status === 'active';
          const takenToday = takenOn(m.id, todayKey());
          const adherence = last7.filter((d) => takenOn(m.id, d)).length;
          return (
            <Card key={m.id} style={{ marginTop: 14, opacity: active ? 1 : 0.7 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3}>{m.name} <Text style={[styles.muted, { fontSize: 15 }]}>{m.dose}</Text></Text>
                  <Text style={styles.muted}>{m.frequency}</Text>
                </View>
                <Badge label={active ? 'Active' : 'Stopped'} tone={active ? 'success' : 'muted'} />
              </Row>
              {!!m.instructions && <Text style={[styles.body, { marginTop: 8 }]}>{m.instructions}</Text>}
              <Text style={[styles.muted, { marginTop: 6 }]}>
                Prescribed by {prescriber?.name ?? 'your psychiatrist'}{m.startDate ? ` · since ${shortDate(m.startDate)}` : ''}
              </Text>

              {active && (
                <>
                  <SectionTitle>Last 7 days · {adherence}/7</SectionTitle>
                  <Row style={{ justifyContent: 'space-between' }}>
                    {last7.map((d) => {
                      const taken = takenOn(m.id, d);
                      return (
                        <View key={d} style={{ alignItems: 'center', gap: 4 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: taken ? colors.success : colors.tanSoft }}>
                            {taken && <Ionicons name="checkmark" size={16} color={colors.white} />}
                          </View>
                          <Text style={[styles.muted, { fontSize: 11 }]}>{WEEKDAYS[parseKey(d).getDay()][0]}</Text>
                        </View>
                      );
                    })}
                  </Row>
                  <Button
                    small
                    style={{ marginTop: 14 }}
                    variant={takenToday ? 'secondary' : 'primary'}
                    icon={takenToday ? 'checkmark-done' : 'checkmark'}
                    title={takenToday ? 'Taken today · undo' : 'Mark taken today'}
                    onPress={() => toggleTaken(m)}
                  />

                  <Row style={{ justifyContent: 'space-between', marginTop: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.body, { fontWeight: '600' }]}>Reminders</Text>
                      <Text style={styles.muted}>Push reminders arrive once notifications are connected.</Text>
                    </View>
                    <Switch value={!!reminder?.enabled} onValueChange={(enabled) => setReminder(m, { enabled })} trackColor={{ true: colors.primary, false: colors.border }} />
                  </Row>
                  {reminder?.enabled && (
                    <View style={{ marginTop: 10 }}>
                      <ChipGroup small multi options={REMINDER_TIMES} value={reminder.times ?? []} onChange={(times) => setReminder(m, { times })} />
                    </View>
                  )}
                </>
              )}
            </Card>
          );
        })
      )}

      {prescriberIds.length > 0 && (
        <Button
          title="Message my psychiatrist"
          icon="chatbubble-ellipses-outline"
          variant="outline"
          style={{ marginTop: 20 }}
          onPress={() => router.push(`/messages/${prescriberIds[0]}`)}
        />
      )}
      <Text style={[styles.muted, { marginTop: 12, textAlign: 'center' }]}>
        Side effects that worry you? Contact your psychiatrist. In an emergency, <Text style={styles.link} onPress={() => router.push('/crisis')}>get help now</Text>.
      </Text>
    </Screen>
  );
}
