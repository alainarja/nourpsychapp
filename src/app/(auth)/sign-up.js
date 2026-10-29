import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, ChipGroup, Header, Input, Logo, Row, Screen, Segmented, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { comingSoon } from '../../utils/alert';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_SIZES = [
  { value: 20, label: '1–20' },
  { value: 100, label: '21–100' },
  { value: 500, label: '101–500' },
  { value: 1000, label: '500+' },
];

export default function SignUp() {
  const params = useLocalSearchParams();
  const role = ['pro', 'org'].includes(params.role) ? params.role : 'client';
  const isPro = role === 'pro';
  const isOrg = role === 'org';
  const { signUp } = useAuth();
  const { t } = useI18n();
  const [proType, setProType] = useState(params.proType === 'psychiatrist' ? 'psychiatrist' : 'psychologist');
  const [form, setForm] = useState({ name: '', title: '', license: '', email: '', password: '', contactName: '' });
  const [seats, setSeats] = useState(100);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError(t(isOrg ? 'signUp.err.orgName' : 'signUp.err.name'));
    if (isOrg && !form.contactName.trim()) return setError(t('signUp.err.contact'));
    if (!EMAIL_RE.test(form.email.trim())) return setError(t('signUp.err.email'));
    if (form.password.length < 6) return setError(t('signUp.err.password'));
    if (isPro && !form.license.trim()) return setError(t('signUp.err.license'));
    if (!agreed) return setError(t('signUp.err.agree'));
    setBusy(true);
    try {
      let extra = {};
      if (isPro) {
        extra = { proType, title: form.title.trim() || (proType === 'psychiatrist' ? 'Psychiatrist' : 'Clinical Psychologist'), license: form.license.trim() };
      } else if (isOrg) {
        extra = { contactName: form.contactName.trim(), seats, plan: 'starter', proIds: [], sessionsPerMember: 4 };
      }
      await signUp({ name: form.name, email: form.email, password: form.password, role, ...extra });
      router.replace('/verify-email');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const social = () => comingSoon('Apple, Google and email-link sign in');
  const title = isOrg ? t('signUp.orgTitle') : isPro ? t('signUp.proTitle') : t('signUp.title');
  const subtitle = isOrg ? t('signUp.orgSubtitle') : isPro ? null : t('signUp.subtitle');

  return (
    <Screen>
      <Header title="" back />
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Logo size={32} />
        <Text style={[styles.h2, { marginTop: 18, textAlign: 'center' }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.muted, { textAlign: 'center', marginTop: 4 }]}>{subtitle}</Text>}
      </View>

      {isPro && (
        <Segmented
          style={{ marginBottom: 14 }}
          value={proType}
          onChange={setProType}
          options={[{ value: 'psychologist', label: t('signUp.psychologist') }, { value: 'psychiatrist', label: t('signUp.psychiatrist') }]}
        />
      )}

      {isOrg ? (
        <>
          <Input icon="business-outline" placeholder={t('signUp.orgName')} value={form.name} onChangeText={set('name')} autoCapitalize="words" />
          <Input icon="person-outline" placeholder={t('signUp.contactName')} value={form.contactName} onChangeText={set('contactName')} autoCapitalize="words" />
        </>
      ) : (
        <Input icon="person-outline" placeholder={t('signUp.fullName')} value={form.name} onChangeText={set('name')} autoCapitalize="words" />
      )}
      {isPro && (
        <>
          <Input icon="ribbon-outline" placeholder={t('signUp.proTitleField')} value={form.title} onChangeText={set('title')} />
          <Input icon="card-outline" placeholder={t('signUp.license')} value={form.license} onChangeText={set('license')} autoCapitalize="characters" />
        </>
      )}
      <Input icon="mail-outline" placeholder={t(isOrg ? 'signUp.workEmail' : 'signUp.email')} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
      <Input icon="lock-closed-outline" placeholder={t('signUp.password')} value={form.password} onChangeText={set('password')} secure />

      {isOrg && (
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>{t('signUp.teamSize')}</Text>
          <ChipGroup options={TEAM_SIZES} value={seats} onChange={setSeats} />
        </View>
      )}

      <Pressable onPress={() => setAgreed((a) => !a)} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
        <Row style={{ marginBottom: 14, alignItems: 'flex-start' }}>
          <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
          <Text style={[styles.muted, { flex: 1 }]}>{t('signUp.agree')}</Text>
        </Row>
      </Pressable>

      {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
      <Button title={t('signUp.submit')} variant={isPro ? 'tan' : 'primary'} onPress={submit} loading={busy} />

      {role === 'client' && (
        <>
          <Text style={[styles.muted, { textAlign: 'center', marginVertical: 16 }]}>{t('signUp.orContinue')}</Text>
          <Row gap={16} style={{ justifyContent: 'center' }}>
            {['logo-apple', 'logo-google', 'mail-outline'].map((icon) => (
              <Pressable key={icon} onPress={social} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon} size={24} color={icon === 'logo-google' ? '#DB4437' : colors.text} />
              </Pressable>
            ))}
          </Row>
        </>
      )}

      <Pressable onPress={() => router.replace('/sign-in')} style={{ marginTop: 20 }}>
        <Text style={[styles.muted, { textAlign: 'center' }]}>{t('welcome.haveAccount')} <Text style={styles.link}>{t('welcome.signIn')}</Text></Text>
      </Pressable>
    </Screen>
  );
}
