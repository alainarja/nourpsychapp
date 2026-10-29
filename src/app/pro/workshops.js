import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, Header, Input, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { db, useCollection } from '../../db/db';
import { colors } from '../../theme';
import { confirm } from '../../utils/alert';
import { longDate, parseKey, timeLabel, todayKey } from '../../utils/date';

const EMPTY = { title: '', date: '', time: '18:00', price: '0', seats: '30', description: '' };

export default function ProWorkshops() {
  const { user } = useAuth();
  const { data: workshops } = useCollection('workshops');
  const { data: registrations } = useCollection('registrations');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const mine = useMemo(
    () => workshops.filter((w) => w.hostId === user?.id).sort((a, b) => b.date.localeCompare(a.date)),
    [workshops, user],
  );
  const regCount = (id) => registrations.filter((r) => r.workshopId === id).length;

  const create = async () => {
    setError('');
    if (!form.title.trim()) return setError('Please add a title.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || isNaN(parseKey(form.date))) return setError('Date must be YYYY-MM-DD.');
    if (form.date < todayKey()) return setError('Date must be today or later.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) return setError('Time must be HH:MM (24h).');
    const price = Number(form.price);
    const seats = parseInt(form.seats, 10);
    if (!Number.isFinite(price) || price < 0) return setError('Invalid price.');
    if (!seats || seats < 1) return setError('Seats must be at least 1.');
    await db.insert('workshops', {
      hostId: user.id, title: form.title.trim(), date: form.date, time: form.time, mode: 'online', kind: 'live',
      price, seats, description: form.description.trim(),
    });
    setForm(EMPTY);
    setShowForm(false);
  };

  return (
    <Screen>
      <Header title="Workshops" subtitle="Host live events for clients." back />
      {showForm ? (
        <Card style={{ marginBottom: 16 }}>
          <Text style={[styles.h3, { marginBottom: 12 }]}>New live workshop</Text>
          <Input label="Title" value={form.title} onChangeText={set('title')} />
          <Row gap={10}>
            <View style={{ flex: 1 }}><Input label="Date" placeholder="YYYY-MM-DD" value={form.date} onChangeText={set('date')} /></View>
            <View style={{ flex: 1 }}><Input label="Time" placeholder="HH:MM" value={form.time} onChangeText={set('time')} /></View>
          </Row>
          <Row gap={10}>
            <View style={{ flex: 1 }}><Input label="Price (USD)" keyboardType="numeric" value={form.price} onChangeText={set('price')} /></View>
            <View style={{ flex: 1 }}><Input label="Seats" keyboardType="numeric" value={form.seats} onChangeText={set('seats')} /></View>
          </Row>
          <Input label="Description" multiline value={form.description} onChangeText={set('description')} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Row>
            <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => { setShowForm(false); setError(''); }} />
            <Button title="Create" style={{ flex: 1 }} onPress={create} />
          </Row>
        </Card>
      ) : (
        <Button title="Host a new workshop" icon="add" onPress={() => setShowForm(true)} style={{ marginBottom: 8 }} />
      )}

      <SectionTitle>My workshops</SectionTitle>
      {mine.length === 0 ? (
        <EmptyState icon="easel-outline" title="No workshops yet" message="Workshops you host appear for clients under Explore." />
      ) : (
        mine.map((w) => (
          <Card key={w.id} style={{ marginBottom: 10 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '700', color: colors.primary }]}>{w.title}</Text>
                <Text style={styles.muted}>{longDate(w.date)} · {timeLabel(w.time)} · {w.price ? `$${w.price}` : 'Free'}</Text>
                <Row gap={6} style={{ marginTop: 6 }}>
                  <Badge label={w.kind === 'recorded' ? 'Recorded' : 'Live'} tone={w.kind === 'recorded' ? 'tan' : 'primary'} />
                  <Badge label={`${regCount(w.id)}${w.seats ? ` / ${w.seats}` : ''} registered`} tone="success" />
                </Row>
              </View>
              <Pressable hitSlop={8} onPress={() => confirm('Delete workshop?', `"${w.title}" will be removed.`, () => db.remove('workshops', w.id), 'Delete', true)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
