import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, Header, Input, ProductCover, Screen, Segmented, SectionTitle } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/db';
import { colors } from '../../theme';
import { comingSoon } from '../../utils/alert';

const CATEGORIES = [{ value: 'guides', label: 'Guides' }, { value: 'workshops', label: 'Workshops' }, { value: 'cards', label: 'Cards' }];

export default function ProductForm() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', subtitle: '', category: 'guides', price: '', description: '' });
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    db.get('products', id).then((p) => p && setForm({ ...p, price: String(p.price) }));
  }, [id]);

  const save = async () => {
    const price = Number(form.price);
    if (!form.title.trim()) return setError('Please add a title.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setError('Please enter a valid price (0 for free).');
    const row = { title: form.title.trim(), subtitle: form.subtitle.trim(), category: form.category, price, description: form.description.trim() };
    if (id) await db.update('products', id, row);
    else await db.insert('products', { ...row, sellerId: user.id });
    router.back();
  };

  return (
    <Screen>
      <Header title={id ? 'Edit Product' : 'New Product'} back />
      <ProductCover title={form.title || 'Your product'} category={form.category} height={150} />
      <SectionTitle>Category</SectionTitle>
      <Segmented options={CATEGORIES} value={form.category} onChange={set('category')} style={{ marginBottom: 14 }} />
      <Input label="Title" value={form.title} onChangeText={set('title')} />
      <Input label="Subtitle" value={form.subtitle} onChangeText={set('subtitle')} placeholder="e.g. 20 printable worksheets" />
      <Input label="Price (USD)" icon="cash-outline" keyboardType="numeric" value={form.price} onChangeText={set('price')} />
      <Input label="Description" multiline value={form.description} onChangeText={set('description')} />
      <Button title="Upload file (PDF, video)" icon="cloud-upload-outline" variant="outline" onPress={() => comingSoon('File uploads')} />
      {!!error && <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>}
      <Button title={id ? 'Save changes' : 'Publish product'} onPress={save} style={{ marginTop: 16 }} />
    </Screen>
  );
}
