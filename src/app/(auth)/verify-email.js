import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CodeInput } from '../../components/CodeInput';
import { Button, Screen, styles } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';

const RESEND_SECONDS = 30;

export default function VerifyEmail() {
  const { user, verifyEmail, signOut } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  if (!user) return <Redirect href="/welcome" />;
  if (user.emailVerified) return <Redirect href={homeFor(user)} />;

  const submit = async () => {
    if (code.length < 6) return;
    setError('');
    setBusy(true);
    try {
      const updated = await verifyEmail(code);
      router.replace(homeFor(updated));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = () => {
    setWait(RESEND_SECONDS);
    setInfo(t('verify.resent'));
  };

  const changeEmail = async () => {
    const role = user.role;
    await signOut();
    router.replace({ pathname: '/sign-up', params: { role } });
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="mail-open-outline" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.h2, { marginTop: 16 }]}>{t('verify.title')}</Text>
        <Text style={[styles.muted, { textAlign: 'center', marginTop: 6 }]}>{t('verify.subtitle', undefined, { email: user.email })}</Text>
      </View>

      <CodeInput value={code} onChange={setCode} onSubmit={submit} />
      {!!error && <Text style={{ color: colors.danger, marginBottom: 10, textAlign: 'center' }}>{error}</Text>}
      {!!info && !error && <Text style={{ color: colors.success, marginBottom: 10, textAlign: 'center' }}>{info}</Text>}
      <Button title={t('verify.submit')} onPress={submit} loading={busy} disabled={code.length < 6} />

      <Pressable onPress={resend} disabled={wait > 0} style={{ marginTop: 18 }}>
        <Text style={[styles.link, { textAlign: 'center' }, wait > 0 && { color: colors.faint }]}>
          {wait > 0 ? t('verify.resendIn', undefined, { s: wait }) : t('verify.resend')}
        </Text>
      </Pressable>
      <Pressable onPress={changeEmail} style={{ marginTop: 14 }}>
        <Text style={[styles.muted, { textAlign: 'center' }]}>{t('verify.changeEmail')}</Text>
      </Pressable>
    </Screen>
  );
}
