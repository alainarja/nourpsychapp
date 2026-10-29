import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, ChipGroup, Header, Input, Rating, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGES, SPECIALTIES } from '../../db/actions';
import { colors } from '../../theme';
import { comingSoon, notify } from '../../utils/alert';

const toOptions = (list) => list.map((v) => ({ value: v, label: v }));
const SESSION_TYPES = [{ value: 'online', label: 'Online' }, { value: 'in-person', label: 'In-person' }];

export default function ProProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    title: user?.title ?? '',
    about: user?.about ?? '',
    specialties: user?.specialties ?? [],
    languages: user?.languages ?? [],
    sessionTypes: user?.sessionTypes ?? [],
    price: String(user?.price ?? 60),
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return null;

  const save = async () => {
    const price = Number(form.price);
    if (!form.name.trim()) return notify('Name required');
    if (!Number.isFinite(price) || price < 0) return notify('Invalid price');
    if (!form.sessionTypes.length) return notify('Choose at least one session type');
    setBusy(true);
    await updateProfile({ ...form, name: form.name.trim(), title: form.title.trim(), about: form.about.trim(), price });
    setBusy(false);
    notify('Profile saved');
    router.back();
  };

  return (
    <Screen>
      <Header title="My Profile" subtitle="Showcase your professional presence." back />
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Avatar name={form.name || user.name} size={96} />
        <Pressable onPress={() => comingSoon('Profile photos')}><Text style={[styles.link, { marginTop: 8 }]}>Edit Photo</Text></Pressable>
        <Text style={[styles.h2, { marginTop: 10 }]}>{form.name || user.name}</Text>
        <Text style={styles.muted}>{form.title || user.title}</Text>
        <View style={{ marginTop: 4 }}><Rating value={user.rating} count={user.reviews} /></View>
      </View>

      <Input label="Full name" value={form.name} onChangeText={set('name')} />
      <Input label="Professional title" value={form.title} onChangeText={set('title')} />
      <Card style={{ marginBottom: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.label}>License number</Text>
            <Text style={styles.body}>{user.license || '—'}</Text>
          </View>
          <Badge label={user.verified ? 'Verified' : 'Pending verification'} tone={user.verified ? 'success' : 'tan'} />
        </Row>
      </Card>

      <Input label="About me" multiline value={form.about} onChangeText={set('about')} placeholder="Describe your approach and who you help…" />

      <SectionTitle>Specialties</SectionTitle>
      <ChipGroup small multi options={toOptions(SPECIALTIES)} value={form.specialties} onChange={set('specialties')} />
      <SectionTitle>Languages</SectionTitle>
      <ChipGroup small multi options={toOptions(LANGUAGES)} value={form.languages} onChange={set('languages')} />
      <SectionTitle>Session type</SectionTitle>
      <ChipGroup multi options={SESSION_TYPES} value={form.sessionTypes} onChange={set('sessionTypes')} />
      <View style={{ height: 12 }} />
      <Input label="Session price (USD)" icon="cash-outline" keyboardType="numeric" value={form.price} onChangeText={set('price')} />

      <SectionTitle>How clients see you</SectionTitle>
      <Card>
        <Row gap={12} style={{ alignItems: 'flex-start' }}>
          <Avatar name={form.name || user.name} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { fontWeight: '700', color: colors.primary }]}>{form.name}</Text>
            <Text style={styles.muted}>{form.title}</Text>
            <Text style={styles.muted} numberOfLines={1}>{form.specialties.slice(0, 3).join(', ') || 'Add specialties'}</Text>
            <Row style={{ marginTop: 4, justifyContent: 'space-between' }}>
              <Rating value={user.rating} count={user.reviews} />
              <Text style={[styles.muted, { fontWeight: '700' }]}>${form.price} / session</Text>
            </Row>
          </View>
        </Row>
      </Card>

      <Button title="Save profile" onPress={save} loading={busy} style={{ marginTop: 20 }} />
    </Screen>
  );
}
