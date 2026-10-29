import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ChipGroup, Header, Input, ProductCover, Row, Screen, Segmented, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, RESOURCE_TYPES, WORKSHOP_DURATIONS, WORKSHOP_FORMATS } from '../../data/marketplace';
import { db } from '../../db/db';
import { colors } from '../../theme';
import { comingSoon } from '../../utils/alert';
import { parseKey, todayKey } from '../../utils/date';

const DURATIONS = WORKSHOP_DURATIONS.map((n) => ({ value: n, label: `${n} min` }));
const MODES = [{ value: 'online', label: 'Online' }, { value: 'in-person', label: 'In-person' }];

const EMPTY = {
  category: 'workshop', title: '', subtitle: '', price: '', description: '',
  resourceType: 'guide',
  format: 'live', date: '', time: '18:00', duration: 60, seats: '30', mode: 'online', location: '',
};

// Builds the stored row, keeping only the fields that apply to this kind of product.
function toRow(form) {
  const base = { category: form.category, title: form.title.trim(), subtitle: form.subtitle.trim(), price: Number(form.price), description: form.description.trim() };
  if (form.category === 'resource') return { ...base, resourceType: form.resourceType };
  if (form.format === 'recorded') return { ...base, format: 'recorded', duration: form.duration };
  return {
    ...base, format: 'live', date: form.date, time: form.time, duration: form.duration, seats: parseInt(form.seats, 10),
    mode: form.mode, location: form.mode === 'in-person' ? form.location.trim() : '',
  };
}

function validate(form) {
  const price = Number(form.price);
  if (!form.title.trim()) return 'Please add a title.';
  if (form.price === '' || !Number.isFinite(price) || price < 0) return 'Please enter a valid price (0 for free).';
  if (form.category !== 'workshop' || form.format !== 'live') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || isNaN(parseKey(form.date))) return 'Date must be YYYY-MM-DD.';
  if (form.date < todayKey()) return 'Date must be today or later.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) return 'Time must be HH:MM (24h).';
  if (!(parseInt(form.seats, 10) >= 1)) return 'Seats must be at least 1.';
  if (form.mode === 'in-person' && !form.location.trim()) return 'Please add the address for an in-person workshop.';
  return null;
}

export default function ProductForm() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    db.get('products', id).then((p) => p && setForm({ ...EMPTY, ...p, price: String(p.price), seats: String(p.seats ?? EMPTY.seats) }));
  }, [id]);

  const save = async () => {
    const problem = validate(form);
    if (problem) return setError(problem);
    const row = toRow(form);
    if (id) await db.update('products', id, row);
    else await db.insert('products', { ...row, sellerId: user.id });
    router.back();
  };

  const workshop = form.category === 'workshop';
  const live = workshop && form.format === 'live';

  return (
    <Screen>
      <Header title={id ? 'Edit Product' : 'New Product'} back />
      <ProductCover product={toRow(form)} title={form.title || 'Your product'} height={150} />

      <SectionTitle>What are you offering?</SectionTitle>
      <Segmented options={CATEGORIES} value={form.category} onChange={set('category')} style={{ marginBottom: 14 }} />

      {workshop ? (
        <>
          <Text style={styles.label}>Format</Text>
          <Segmented options={WORKSHOP_FORMATS} value={form.format} onChange={set('format')} style={{ marginBottom: 6 }} />
          <Text style={[styles.muted, { marginBottom: 14 }]}>
            {live
              ? 'Clients register in the app, get a reminder, and join the live room from the workshop page.'
              : 'Clients buy the recording and can watch it any time from My Purchases.'}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>Type</Text>
          <View style={{ marginBottom: 14 }}><ChipGroup options={RESOURCE_TYPES} value={form.resourceType} onChange={set('resourceType')} /></View>
        </>
      )}

      <Input label="Title" value={form.title} onChangeText={set('title')} />
      <Input label="Subtitle" value={form.subtitle} onChangeText={set('subtitle')} placeholder={workshop ? 'e.g. Practical tools for daily stress' : 'e.g. 20 printable worksheets'} />
      <Input label="Price (USD)" icon="cash-outline" keyboardType="numeric" value={form.price} onChangeText={set('price')} placeholder="0 for free" />
      <Input label="Description" multiline value={form.description} onChangeText={set('description')} />

      {workshop && (
        <>
          <Text style={styles.label}>Duration</Text>
          <View style={{ marginBottom: 14 }}><ChipGroup options={DURATIONS} value={form.duration} onChange={set('duration')} /></View>
        </>
      )}

      {live && (
        <>
          <Row gap={10}>
            <View style={{ flex: 1 }}><Input label="Date" placeholder="YYYY-MM-DD" value={form.date} onChangeText={set('date')} /></View>
            <View style={{ flex: 1 }}><Input label="Time" placeholder="HH:MM" value={form.time} onChangeText={set('time')} /></View>
          </Row>
          <Input label="Seats" keyboardType="numeric" value={form.seats} onChangeText={set('seats')} />
          <Text style={styles.label}>Where</Text>
          <View style={{ marginBottom: 12 }}><ChipGroup options={MODES} value={form.mode} onChange={set('mode')} /></View>
          {form.mode === 'in-person' && <Input label="Address" icon="location-outline" value={form.location} onChangeText={set('location')} />}
        </>
      )}

      {workshop && form.format === 'recorded' && (
        <Button title="Upload recording (video)" icon="cloud-upload-outline" variant="outline" onPress={() => comingSoon('Video uploads')} />
      )}
      {!workshop && (
        <Button title="Upload file (PDF, images)" icon="cloud-upload-outline" variant="outline" onPress={() => comingSoon('File uploads')} />
      )}

      {!!error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}
      <Button title={id ? 'Save changes' : 'Publish'} onPress={save} style={{ marginTop: 16 }} />
    </Screen>
  );
}
