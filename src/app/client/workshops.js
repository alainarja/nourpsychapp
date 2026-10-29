import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, EmptyState, Header, Row, Screen, Segmented, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { registerWorkshop, unregisterWorkshop } from '../../db/actions';
import { useCollection } from '../../db/db';
import { colors } from '../../theme';
import { comingSoon, notify } from '../../utils/alert';
import { parseKey, shortDate, timeLabel, todayKey } from '../../utils/date';

export default function Workshops() {
  const { user } = useAuth();
  const { data: workshops } = useCollection('workshops');
  const { data: registrations } = useCollection('registrations');
  const { data: users } = useCollection('users');
  const [tab, setTab] = useState('upcoming');

  const myRegs = useMemo(() => new Map(registrations.filter((r) => r.userId === user.id).map((r) => [r.workshopId, r])), [registrations, user.id]);

  const list = useMemo(() => {
    const today = todayKey();
    return workshops
      .filter((w) => (tab === 'upcoming' ? w.kind === 'live' && w.date >= today : w.kind === 'recorded'))
      .sort((a, b) => (tab === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  }, [workshops, tab]);

  const toggle = async (w) => {
    const reg = myRegs.get(w.id);
    if (reg) return unregisterWorkshop(reg.id);
    await registerWorkshop(w, user.id);
    notify("You're registered", `${w.title}\n${shortDate(w.date)} ${parseKey(w.date).getFullYear()} · ${timeLabel(w.time)}${w.price ? `\n\nPayment of $${w.price} is simulated in offline mode.` : ''}`);
  };

  return (
    <Screen>
      <Header title="Workshops" subtitle="Live and recorded." back />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'ondemand', label: 'On-Demand' }]} style={{ marginBottom: 16 }} />

      {list.length === 0 ? (
        <EmptyState icon="easel-outline" title="No workshops here yet" message="New events are added regularly." />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((w) => {
            const host = users.find((u) => u.id === w.hostId);
            const registered = myRegs.has(w.id);
            return (
              <Card key={w.id}>
                <Row gap={12} style={{ alignItems: 'flex-start' }}>
                  <Avatar name={host?.name ?? 'Shift Thrive'} size={64} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>{w.title}</Text>
                    <Text style={styles.muted}>{host?.name}</Text>
                    <Row gap={6} style={{ marginTop: 4 }}>
                      <Ionicons name={w.kind === 'live' ? 'calendar-outline' : 'play-circle-outline'} size={14} color={colors.muted} />
                      <Text style={styles.muted}>
                        {w.kind === 'live' ? `${shortDate(w.date)} ${parseKey(w.date).getFullYear()} · ${timeLabel(w.time)}` : `${w.duration ?? 60} min`} · {w.mode === 'online' ? 'Online' : 'In-person'}
                      </Text>
                    </Row>
                  </View>
                  <Badge label={w.price ? `$${w.price}` : 'Free'} tone={w.price ? 'tan' : 'success'} />
                </Row>
                {!!w.description && <Text style={[styles.muted, { marginTop: 10 }]}>{w.description}</Text>}
                {tab === 'upcoming' ? (
                  <Button small title={registered ? 'Registered ✓' : 'Register'} variant={registered ? 'secondary' : 'primary'} style={{ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 20 }} onPress={() => toggle(w)} />
                ) : (
                  <Button small icon="play" title="Watch" style={{ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 20 }} onPress={() => comingSoon('Video playback')} />
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
