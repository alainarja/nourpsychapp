import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { CodeInput } from '../../components/CodeInput';
import { Button, Header, Input, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { notify } from '../../utils/alert';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const params = useLocalSearchParams();
  const { requestPasswordReset, resetPassword } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setError('');
    if (!EMAIL_RE.test(email.trim())) return setError(t('signUp.err.email'));
    setBusy(true);
    await requestPasswordReset(email.trim());
    setBusy(false);
    setStep(2);
  };

  const reset = async () => {
    setError('');
    if (pw !== pw2) return setError(t('forgot.mismatch'));
    setBusy(true);
    try {
      await resetPassword(email, code, pw);
      notify(t('forgot.done'), t('forgot.doneMsg'));
      router.replace('/sign-in');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t('forgot.title')} subtitle={step === 1 ? t('forgot.step1') : t('forgot.step2', undefined, { email: email.trim() })} back />
      {step === 1 ? (
        <>
          <Input icon="mail-outline" placeholder={t('signIn.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" onSubmitEditing={send} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Button title={t('forgot.send')} onPress={send} loading={busy} />
        </>
      ) : (
        <>
          <Text style={styles.label}>{t('forgot.code')}</Text>
          <CodeInput value={code} onChange={setCode} />
          <Input icon="lock-closed-outline" placeholder={t('forgot.newPassword')} value={pw} onChangeText={setPw} secure />
          <Input icon="lock-closed-outline" placeholder={t('forgot.confirm')} value={pw2} onChangeText={setPw2} secure onSubmitEditing={reset} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Button title={t('forgot.submit')} onPress={reset} loading={busy} disabled={code.length < 6 || !pw} />
          <Button title={t('common.back')} variant="ghost" style={{ marginTop: 8 }} onPress={() => { setStep(1); setError(''); }} />
        </>
      )}
    </Screen>
  );
}
