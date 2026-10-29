import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CodeInput } from '../../components/CodeInput';
import { Button, Header, Screen, styles } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { comingSoon } from '../../utils/alert';

export default function TwoFactor() {
  const { pending2FA, verifyTwoFactor } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!pending2FA && !busy) return <Redirect href="/sign-in" />;

  const submit = async () => {
    if (code.length < 6) return;
    setError('');
    setBusy(true);
    try {
      const user = await verifyTwoFactor(code);
      router.replace(homeFor(user));
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="" back />
      <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="phone-portrait-outline" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.h2, { marginTop: 16 }]}>{t('twoFactor.title')}</Text>
        <Text style={[styles.muted, { textAlign: 'center', marginTop: 6 }]}>{t('twoFactor.subtitle')}</Text>
      </View>
      <CodeInput value={code} onChange={setCode} onSubmit={submit} />
      {!!error && <Text style={{ color: colors.danger, marginBottom: 10, textAlign: 'center' }}>{error}</Text>}
      <Button title={t('twoFactor.submit')} onPress={submit} loading={busy} disabled={code.length < 6} />
      <Pressable onPress={() => comingSoon('Backup codes')} style={{ marginTop: 18 }}>
        <Text style={[styles.link, { textAlign: 'center' }]}>{t('twoFactor.backup')}</Text>
      </Pressable>
    </Screen>
  );
}
