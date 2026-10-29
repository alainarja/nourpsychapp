import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Button, Card, Header, Input, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/db';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { comingSoon, notify } from '../../utils/alert';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Account() {
  const { user, updateProfile } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    if (!name.trim()) return setError(t('signUp.err.name'));
    if (!EMAIL_RE.test(email.trim())) return setError(t('signUp.err.email'));
    if (phone && !/^\+?[\d\s()-]{7,}$/.test(phone.trim())) return setError('Please enter a valid phone number.');
    const normalized = email.trim().toLowerCase();
    const taken = await db.where('users', (u) => u.id !== user.id && u.email?.toLowerCase() === normalized);
    if (taken.length) return setError('An account with this email already exists.');
    await updateProfile({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() });
    notify(t('settings.saved'));
    router.back();
  };

  return (
    <Screen>
      <Header title={t('settings.account')} back />
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Avatar name={name || user.name} size={80} />
        <Button small variant="ghost" title="Change photo" onPress={() => comingSoon('Profile photos')} />
      </View>
      <Card>
        <Input label={t('settings.name')} value={name} onChangeText={setName} autoCapitalize="words" />
        <Input label={t('settings.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={[styles.muted, { marginTop: -6, marginBottom: 12 }]}>{t('settings.emailNote')}</Text>
        <Input label={t('settings.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+961 70 000 000" />
        {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
        <Button title={t('common.save')} onPress={save} />
      </Card>
    </Screen>
  );
}
