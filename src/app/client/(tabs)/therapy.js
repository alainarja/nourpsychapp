import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessagesButton } from '../../../components/NotificationBell';
import { Avatar, Badge, Button, Card, EmptyState, Header, Row, Screen, Segmented, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { apptDateTime, cancelAppointment, isLateCancellation, sortByDateTime } from '../../../db/actions';
import { useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { confirm } from '../../../utils/alert';
import { longDate, timeLabel } from '../../../utils/date';

const STATUS = {
  booked: { label: 'Booked', tone: 'primary' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
};

export default function Therapy() {
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const { data: appointments } = useCollection('appointments');
  const { data: users } = useCollection('users');
  const { data: reviews } = useCollection('reviews');

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const mine = appointments.filter((a) => a.clientId === user.id);
    const isUpcoming = (a) => a.status === 'booked' && apptDateTime(a) >= now;
    return {
      upcoming: sortByDateTime(mine.filter(isUpcoming)),
      past: sortByDateTime(mine.filter((a) => !isUpcoming(a)), -1),
    };
  }, [appointments, user.id]);

  const list = tab === 'upcoming' ? upcoming : past;
  const proOf = (id) => users.find((u) => u.id === id);
  const isReviewed = (a) => a.reviewed || reviews.some((r) => r.appointmentId === a.id);

  const cancel = (a) => {
    const pro = proOf(a.proId);
    const late = isLateCancellation(a, pro);
    const when = `${longDate(a.date)} at ${timeLabel(a.time)}`;
    const message = late
      ? `${when}

Late cancellation — this is within ${pro?.cancellationHours ?? 24}h of your session and may be charged per the cancellation policy.`
      : `${when}

Free cancellation — you won't be charged.`;
    confirm(late ? 'Late cancellation' : 'Cancel session?', message, () => cancelAppointment(a.id, 'client'), 'Cancel session', true);
  };

  return (
    <Screen>
      <Header
        title="My Therapy"
        subtitle="Your sessions, all in one place."
        right={
          <Row>
          <MessagesButton />
          <Pressable onPress={() => router.push('/client/find-match')} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={22} color={colors.white} />
          </Pressable>
          </Row>
        }
      />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[{ value: 'upcoming', label: `Upcoming (${upcoming.length})` }, { value: 'past', label: 'Past' }]}
        style={{ marginBottom: 16 }}
      />

      {list.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
          message="Find a psychologist or psychiatrist who fits your needs."
          action="Find My Match"
          onAction={() => router.push('/client/find-match')}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((a) => {
            const pro = proOf(a.proId);
            const status = STATUS[a.status] ?? STATUS.booked;
            return (
              <Card key={a.id}>
                <Row gap={12}>
                  <Avatar name={pro?.name ?? '?'} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h3}>{pro?.name ?? 'Unknown'}</Text>
                    <Text style={styles.muted}>{pro?.title}</Text>
                  </View>
                  <Badge label={status.label} tone={status.tone} />
                </Row>
                <Row style={{ marginTop: 12 }} gap={6}>
                  <Ionicons name="calendar-outline" size={15} color={colors.muted} />
                  <Text style={styles.body}>{longDate(a.date)} · {timeLabel(a.time)}</Text>
                </Row>
                <Row style={{ marginTop: 4 }} gap={6}>
                  <Ionicons name={a.mode === 'online' ? 'videocam-outline' : 'location-outline'} size={15} color={colors.muted} />
                  <Text style={styles.muted}>{a.mode === 'online' ? 'Online' : 'In-person'} · {a.type}</Text>
                </Row>
                {tab === 'upcoming' ? (
                  <>
                    {a.mode === 'online' && (
                      <Button small icon="videocam" title="Join session" style={{ marginTop: 14 }} onPress={() => router.push(`/call/${a.id}`)} />
                    )}
                    <Row style={{ marginTop: a.mode === 'online' ? 8 : 14 }}>
                      <Button small variant="outline" title="Reschedule" style={{ flex: 1 }} onPress={() => router.push(`/client/therapist/${a.proId}?reschedule=${a.id}`)} />
                      <Button small variant="danger" title="Cancel" style={{ flex: 1 }} onPress={() => cancel(a)} />
                    </Row>
                  </>
                ) : (
                  pro && (
                    <Row style={{ marginTop: 14 }}>
                      {a.status === 'completed' && (
                        isReviewed(a)
                          ? <Button small variant="ghost" icon="star" title="Reviewed" style={{ flex: 1 }} onPress={() => router.push(`/client/review/${a.id}`)} />
                          : <Button small variant="outline" icon="star-outline" title="Leave a review" style={{ flex: 1 }} onPress={() => router.push(`/client/review/${a.id}`)} />
                      )}
                      <Button small variant="secondary" title="Book again" style={{ flex: 1 }} onPress={() => router.push(`/client/therapist/${a.proId}`)} />
                    </Row>
                  )
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
