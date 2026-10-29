import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar } from '../../../components/Calendar';
import { useProData } from '../../../components/pro/useProData';
import { Badge, Button, Card, EmptyState, Header, Row, Screen, SectionTitle, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../theme';
import { longDate, timeLabel, todayKey } from '../../../utils/date';

export default function ProCalendar() {
  const { updateProfile } = useAuth();
  const { user, usersById, liveAppts } = useProData();
  const [selected, setSelected] = useState(todayKey());

  const marked = useMemo(() => new Set(liveAppts.map((a) => a.date)), [liveAppts]);
  const dayAppts = liveAppts.filter((a) => a.date === selected);
  const blocked = user?.blockedDates ?? [];
  const isBlocked = blocked.includes(selected);

  const toggleBlock = () =>
    updateProfile({ blockedDates: isBlocked ? blocked.filter((d) => d !== selected) : [...blocked, selected] });

  return (
    <Screen>
      <Header
        title="Calendar"
        subtitle="Manage your availability."
        right={
          <Pressable onPress={() => router.push('/pro/availability')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={24} color={colors.white} />
          </Pressable>
        }
      />
      <Card>
        <Calendar selected={selected} onSelect={setSelected} marked={marked} />
      </Card>

      <SectionTitle>{longDate(selected)}</SectionTitle>
      {isBlocked && (
        <View style={{ marginBottom: 10 }}><Badge label="Blocked — clients can't book this day" tone="danger" /></View>
      )}
      {dayAppts.length === 0 ? (
        <EmptyState icon="calendar-clear-outline" title="No sessions" message="Nothing scheduled for this day." />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {dayAppts.map((a, i) => (
            <Pressable key={a.id} onPress={() => router.push(`/pro/client/${a.clientId}`)}>
              <Row gap={12} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                <Text style={{ width: 74, fontWeight: '700', color: colors.primary }}>{timeLabel(a.time)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{usersById[a.clientId]?.name ?? 'Client'}</Text>
                  <Text style={styles.muted}>{a.type}</Text>
                </View>
                {a.mode === 'online' && a.status === 'booked' ? (
                  <Button small icon="videocam-outline" title="Join" onPress={() => router.push(`/call/${a.id}`)} />
                ) : (
                  <Text style={styles.muted}>{a.mode === 'online' ? 'Online' : 'In-person'}</Text>
                )}
              </Row>
            </Pressable>
          ))}
        </Card>
      )}
      <Button
        variant={isBlocked ? 'secondary' : 'outline'}
        icon={isBlocked ? 'lock-open-outline' : 'ban-outline'}
        title={isBlocked ? 'Unblock this day' : 'Block this day'}
        style={{ marginTop: 16 }}
        onPress={toggleBlock}
      />
    </Screen>
  );
}
