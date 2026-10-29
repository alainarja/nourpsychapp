import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Header, Input, Logo, Screen, styles } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';

const DEMOS = [
  { key: 'demo.client', email: 'bella@demo.com', icon: 'person-outline' },
  { key: 'demo.psychologist', email: 'nour@demo.com', icon: 'medkit-outline' },
  { key: 'demo.psychiatrist', email: 'karim.h@demo.com', icon: 'medical-outline' },
  { key: 'demo.org', email: 'hr@acme.demo', icon: 'business-outline' },
  { key: 'demo.admin', email: 'admin@demo.com', icon: 'shield-outline' },
];

export default function SignIn() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e = email, p = password) => {
    setError('');
    setBusy(true);
    try {
      const result = await signIn(e, p);
      if (result.needs2FA) router.push('/two-factor');
      else router.replace(homeFor(result));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="" back />
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Logo size={32} />
        <Text style={[styles.h2, { marginTop: 18 }]}>{t('signIn.title')}</Text>
      </View>
      <Input icon="mail-outline" placeholder={t('signIn.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Input icon="lock-closed-outline" placeholder={t('signIn.password')} value={password} onChangeText={setPassword} secure onSubmitEditing={() => submit()} />
      <Pressable onPress={() => router.push({ pathname: '/forgot-password', params: { email } })} style={{ alignSelf: 'flex-end', marginBottom: 14 }} hitSlop={8}>
        <Text style={styles.link}>{t('signIn.forgot')}</Text>
      </Pressable>
      {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
      <Button title={t('signIn.submit')} onPress={() => submit()} loading={busy} />

      <Card style={{ marginTop: 24 }}>
        <Text style={styles.label}>{t('signIn.demoTitle')}</Text>
        <Text style={styles.muted}>{t('signIn.demoHint')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {DEMOS.map((d) => (
            <Button key={d.email} small variant="secondary" icon={d.icon} title={t(d.key)} style={{ flexBasis: '47%', flexGrow: 1 }} onPress={() => submit(d.email, 'demo123')} />
          ))}
        </View>
      </Card>

      <Pressable onPress={() => router.replace('/welcome')} style={{ marginTop: 20 }}>
        <Text style={[styles.muted, { textAlign: 'center' }]}>{t('signIn.new')} <Text style={styles.link}>{t('signIn.create')}</Text></Text>
      </Pressable>
    </Screen>
  );
}
