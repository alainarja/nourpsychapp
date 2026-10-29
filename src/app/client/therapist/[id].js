import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Calendar, TimeSlots } from '../../../components/Calendar';
import { Stars } from '../../../components/Stars';
import { Avatar, Button, Card, Chip, EmptyState, Header, Rating, Row, Screen, SectionTitle, Segmented, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { availableSlots, bookAppointment, cancelAppointment } from '../../../db/actions';
import { useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { notify } from '../../../utils/alert';
import { addDays, dateKey, longDate, shortDate, timeLabel } from '../../../utils/date';

export default function TherapistBooking() {
  const { id, reschedule } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: users, loading } = useCollection('users');
  const { data: appointments } = useCollection('appointments');
  const { data: reviews } = useCollection('reviews');
  const pro = users.find((u) => u.id === id && u.role === 'pro');

  const modes = pro?.sessionTypes?.length ? pro.sessionTypes : ['online'];
  const [mode, setMode] = useState(modes[0]);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [busy, setBusy] = useState(false);

  // Default to the first day within 30 days that still has a free slot.
  useEffect(() => {
    if (!pro || date) return;
    for (let i = 0; i < 30; i++) {
      const key = dateKey(addDays(new Date(), i));
      if (availableSlots(pro, key, appointments).length) return setDate(key);
    }
    setDate(dateKey());
  }, [pro, appointments, date]);

  const proReviews = useMemo(
    () => reviews.filter((r) => r.proId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [reviews, id],
  );
  // Messaging opens once there's a (non-cancelled) booking between the two.
  const canMessage = useMemo(
    () => appointments.some((a) => a.proId === id && a.clientId === user.id && a.status !== 'cancelled'),
    [appointments, id, user.id],
  );

  const slots = useMemo(
    () => (pro && date ? availableSlots(pro, date, appointments).map((t) => ({ value: t, label: timeLabel(t) })) : []),
    [pro, date, appointments],
  );

  if (!pro) {
    return (
      <Screen>
        <Header title="Book a Session" back />
        {!loading && <EmptyState title="Professional not found" />}
      </Screen>
    );
  }

  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const isDisabled = (d) => d < today || !(pro.availability?.[d.getDay()]?.length);

  const book = async () => {
    // New bookings go through checkout; reschedules keep the original payment.
    if (!reschedule) {
      router.push({ pathname: '/checkout', params: { type: 'session', proId: pro.id, date, time, mode } });
      return;
    }
    setBusy(true);
    try {
      await bookAppointment({ pro, clientId: user.id, date, time, mode });
      if (reschedule) await cancelAppointment(reschedule, 'client');
      notify(reschedule ? 'Session rescheduled' : 'Session booked', `${pro.name}\n${longDate(date)} at ${timeLabel(time)} · ${mode === 'online' ? 'Online' : 'In-person'}`);
      router.replace('/client/therapy');
    } catch (e) {
      notify('Could not book', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={{ padding: 16, paddingBottom: 24, backgroundColor: colors.bg }}>
          <Button
            title={time ? (reschedule ? `Reschedule to ${timeLabel(time)}` : `Continue · ${timeLabel(time)} · ${pro.price}`) : 'Select a time'}
            disabled={!time || !date}
            loading={busy}
            onPress={book}
          />
        </View>
      }
    >
      <Header title={reschedule ? 'Reschedule' : 'Book a Session'} back />

      <Row gap={14} style={{ alignItems: 'flex-start' }}>
        <Avatar name={pro.name} size={76} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.h2, { fontSize: 20 }]}>{pro.name}</Text>
          <Text style={styles.muted}>{pro.title}</Text>
          <View style={{ marginTop: 4 }}><Rating value={pro.rating} count={pro.reviews != null ? `${pro.reviews} reviews` : null} /></View>
          <Text style={[styles.muted, { marginTop: 4 }]}>${pro.price} · {pro.sessionLength ?? 45} min session</Text>
        </View>
      </Row>

      {!pro.verified && (
        <Row style={{ marginTop: 12, backgroundColor: colors.tanSoft, padding: 10, borderRadius: 10 }}>
          <Ionicons name="information-circle-outline" size={18} color={colors.tan} />
          <Text style={[styles.muted, { flex: 1 }]}>This professional's license is not yet verified.</Text>
        </Row>
      )}

      <Row style={{ marginTop: 14 }}>
        <Button
          small
          variant="outline"
          icon="chatbubble-ellipses-outline"
          title="Message"
          style={{ flex: 1 }}
          disabled={!canMessage}
          onPress={() => router.push(`/messages/${pro.id}`)}
        />
      </Row>
      {!canMessage && <Text style={[styles.muted, { marginTop: 4 }]}>You can message after booking a session.</Text>}

      {!!pro.specialties?.length && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {pro.specialties.map((s) => <Chip key={s} label={s} small />)}
        </View>
      )}

      {!!pro.about && <Text style={[styles.body, { marginTop: 14 }]}>{pro.about}</Text>}
      {!!pro.languages?.length && (
        <Row style={{ marginTop: 8 }} gap={6}>
          <Ionicons name="language-outline" size={16} color={colors.muted} />
          <Text style={styles.muted}>{pro.languages.join(', ')}</Text>
        </Row>
      )}

      <SectionTitle>{`Reviews${proReviews.length ? ` (${proReviews.length})` : ''}`}</SectionTitle>
      {proReviews.length === 0 ? (
        <Text style={styles.muted}>No written reviews yet.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {proReviews.slice(0, 3).map((r) => {
            const author = users.find((u) => u.id === r.clientId);
            return (
              <Card key={r.id} style={{ padding: 14 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{r.anonymous || !author ? 'Verified client' : author.name}</Text>
                  <Text style={[styles.muted, { fontSize: 12 }]}>{shortDate(dateKey(new Date(r.createdAt)))}</Text>
                </Row>
                <View style={{ marginTop: 4 }}><Stars value={r.rating} size={14} center={false} /></View>
                {!!r.text && <Text style={[styles.body, { marginTop: 6 }]}>{r.text}</Text>}
                {!!r.reply && (
                  <View style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: colors.primarySoft }}>
                    <Text style={[styles.label, { color: colors.primary, marginBottom: 2 }]}>Reply from {pro.name}</Text>
                    <Text style={styles.muted}>{r.reply}</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      <Segmented
        style={{ marginTop: 18 }}
        value={mode}
        onChange={setMode}
        options={modes.map((m) => ({ value: m, label: m === 'online' ? 'Online' : 'In-person' }))}
      />

      <Card style={{ marginTop: 16 }}>
        {date && (
          <Calendar
            selected={date}
            onSelect={(k) => { setDate(k); setTime(null); }}
            isDisabled={isDisabled}
          />
        )}
      </Card>

      <Text style={[styles.h3, { marginTop: 18, marginBottom: 10 }]}>{date ? longDate(date) : 'Available times'}</Text>
      <TimeSlots slots={slots} value={time} onChange={setTime} />
      <Row style={{ marginTop: 14, alignItems: 'flex-start' }}>
        <Ionicons name="time-outline" size={16} color={colors.muted} style={{ marginTop: 2 }} />
        <Text style={[styles.muted, { flex: 1 }]}>Free cancellation up to {pro.cancellationHours ?? 24}h before the session.</Text>
      </Row>
    </Screen>
  );
}
