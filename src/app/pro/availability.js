import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, ChipGroup, Header, Input, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_SESSION_LENGTH, SESSION_LENGTHS } from '../../db/actions';
import { notify } from '../../utils/alert';
import { DEFAULT_SLOTS, timeLabel, WEEKDAYS } from '../../utils/date';

const SLOT_OPTIONS = DEFAULT_SLOTS.map((t) => ({ value: t, label: timeLabel(t) }));
const LENGTHS = SESSION_LENGTHS.map((n) => ({ value: n, label: `${n} min` }));
const CANCEL_WINDOWS = [12, 24, 48].map((n) => ({ value: n, label: `${n}h` }));

const deviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
};

export default function Availability() {
  const { user, updateProfile } = useAuth();
  const [availability, setAvailability] = useState(() => {
    const a = {};
    WEEKDAYS.forEach((_, i) => (a[i] = [...(user?.availability?.[i] ?? [])]));
    return a;
  });
  const [sessionLength, setSessionLength] = useState(SESSION_LENGTHS.includes(user?.sessionLength) ? user.sessionLength : DEFAULT_SESSION_LENGTH);
  const [price, setPrice] = useState(String(user?.price ?? 60));
  const [cancellationHours, setCancellationHours] = useState(user?.cancellationHours ?? 24);
  const timeZone = deviceTimeZone();

  const save = async () => {
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0) return notify('Invalid price', 'Please enter a valid session price.');
    const sorted = Object.fromEntries(Object.entries(availability).map(([d, slots]) => [d, [...slots].sort()]));
    await updateProfile({ availability: sorted, sessionLength, price: n, cancellationHours, timeZone });
    notify('Availability saved');
    router.back();
  };

  return (
    <Screen>
      <Header title="Availability" subtitle="Choose the times clients can book each week." back />
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Time zone · {timeZone}</Text>
        <Text style={styles.muted}>
          Times below are in your device's time zone. Once the backend is connected, clients in other time zones will see slots converted to their local time.
        </Text>
      </Card>
      {WEEKDAYS.map((day, i) => (
        <Card key={day} style={{ marginBottom: 10 }}>
          <Text style={[styles.label, { marginBottom: 8 }]}>{day} · {availability[i].length ? `${availability[i].length} slots` : 'Unavailable'}</Text>
          <ChipGroup small multi options={SLOT_OPTIONS} value={availability[i]} onChange={(v) => setAvailability((a) => ({ ...a, [i]: v }))} />
        </Card>
      ))}
      <SectionTitle>Session length</SectionTitle>
      <ChipGroup options={LENGTHS} value={sessionLength} onChange={setSessionLength} />
      <SectionTitle>Session price (USD)</SectionTitle>
      <Input icon="cash-outline" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <SectionTitle>Free cancellation window</SectionTitle>
      <ChipGroup options={CANCEL_WINDOWS} value={cancellationHours} onChange={setCancellationHours} />
      <Text style={[styles.muted, { marginTop: 8 }]}>
        Clients who cancel less than {cancellationHours} hours before a session are warned that it may be charged.
      </Text>
      <Button title="Save availability" onPress={save} style={{ marginTop: 16 }} />
    </Screen>
  );
}
