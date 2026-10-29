import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { CodeInput } from '../../components/CodeInput';
import { SettingsSection, ToggleRow } from '../../components/settings';
import { Badge, Button, Card, Divider, Header, Input, Row, Screen, styles } from '../../components/ui';
import { DEMO_CODE, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { comingSoon, confirm, notify } from '../../utils/alert';

export default function Security() {
  const { user, changePassword, updateProfile } = useAuth();
  const { t } = useI18n();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [busy, setBusy] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const updatePassword = async () => {
    setPwError('');
    if (pw.next !== pw.confirm) return setPwError(t('forgot.mismatch'));
    setBusy(true);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      notify(t('security.updated'));
    } catch (e) {
      setPwError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle2FA = (on) => {
    if (on) {
      setEnrolling(true);
      setCode('');
      setCodeError('');
    } else {
      confirm('Turn off two-step verification?', 'Your account will be protected by your password only.', () => updateProfile({ twoFactor: false }), 'Turn off', true);
    }
  };

  const confirmEnroll = async () => {
    if (code !== DEMO_CODE) return setCodeError('That code is incorrect.');
    await updateProfile({ twoFactor: true });
    setEnrolling(false);
    notify(t('security.2fa.enabled'));
  };

  const device = Platform.select({ ios: 'iPhone', android: 'Android phone', default: 'Web browser' });

  return (
    <Screen>
      <Header title={t('settings.security')} back />

      <SettingsSection title={t('security.changePassword')}>
        <Card>
          <Input placeholder={t('security.current')} value={pw.current} onChangeText={(v) => setPw((p) => ({ ...p, current: v }))} secure />
          <Input placeholder={t('security.new')} value={pw.next} onChangeText={(v) => setPw((p) => ({ ...p, next: v }))} secure />
          <Input placeholder={t('security.confirm')} value={pw.confirm} onChangeText={(v) => setPw((p) => ({ ...p, confirm: v }))} secure />
          {!!pwError && <Text style={{ color: colors.danger, marginBottom: 10 }}>{pwError}</Text>}
          <Button title={t('security.update')} onPress={updatePassword} loading={busy} disabled={!pw.current || !pw.next} />
        </Card>
      </SettingsSection>

      <SettingsSection title={t('security.2fa')}>
        <Card>
          <ToggleRow title={t('security.2fa')} subtitle={t('security.2fa.sub')} value={user.twoFactor || enrolling} onChange={toggle2FA} />
          {enrolling && (
            <View style={{ marginTop: 8 }}>
              <Divider />
              <Text style={[styles.body, { marginBottom: 10 }]}>{t('security.2fa.enter')}</Text>
              <CodeInput value={code} onChange={setCode} onSubmit={confirmEnroll} />
              {!!codeError && <Text style={{ color: colors.danger, marginBottom: 10, textAlign: 'center' }}>{codeError}</Text>}
              <Row>
                <Button small variant="outline" title={t('common.cancel')} style={{ flex: 1 }} onPress={() => setEnrolling(false)} />
                <Button small title={t('security.2fa.enable')} style={{ flex: 1 }} onPress={confirmEnroll} disabled={code.length < 6} />
              </Row>
            </View>
          )}
          {!enrolling && (
            <Badge label={user.twoFactor ? t('security.2fa.enabled') : t('security.2fa.disabled')} tone={user.twoFactor ? 'success' : 'muted'} />
          )}
          <Divider />
          <ToggleRow
            title={t('security.loginAlerts')}
            subtitle={t('security.loginAlerts.sub')}
            value={user.loginAlerts ?? true}
            onChange={(v) => updateProfile({ loginAlerts: v })}
          />
        </Card>
      </SettingsSection>

      <SettingsSection title={t('security.sessions')}>
        <Card>
          <Row gap={12}>
            <Ionicons name={Platform.OS === 'web' ? 'desktop-outline' : 'phone-portrait-outline'} size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '600' }]}>{device}</Text>
              <Text style={styles.muted}>Active now</Text>
            </View>
            <Badge label={t('security.thisDevice')} tone="success" />
          </Row>
          <Button small variant="outline" title={t('security.signOutOthers')} style={{ marginTop: 14 }} onPress={() => comingSoon('Managing signed-in devices')} />
        </Card>
      </SettingsSection>
    </Screen>
  );
}
