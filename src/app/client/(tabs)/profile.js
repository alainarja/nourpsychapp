import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { MessagesButton, NotificationBell } from '../../../components/NotificationBell';
import { Avatar, Button, Card, Divider, Header, Input, MenuRow, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../db/db';
import { seedIfNeeded } from '../../../db/seed';
import { LANGUAGES, useI18n } from '../../../i18n';
import { confirm } from '../../../utils/alert';

export default function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);

  const saveName = async () => {
    if (!name.trim()) return;
    await updateProfile({ name: name.trim() });
    setEditing(false);
  };

  const logout = () =>
    confirm(`${t('common.signOut')}?`, '', async () => {
      await signOut();
      router.replace('/welcome');
    }, t('common.signOut'));

  const resetDemo = () =>
    confirm('Reset demo data?', 'This erases everything stored on this device and restores the demo data.', async () => {
      await signOut();
      await db.reset();
      await seedIfNeeded();
      router.replace('/welcome');
    }, 'Reset', true);

  return (
    <Screen>
      <Header title={t('tab.profile')} right={<Row><MessagesButton /><NotificationBell /></Row>} />
      <Card>
        <Row gap={14}>
          <Avatar name={user.name} size={64} />
          <View style={{ flex: 1 }}>
            {editing ? (
              <>
                <Input value={name} onChangeText={setName} placeholder="Your name" autoFocus onSubmitEditing={saveName} />
                <Row>
                  <Button small variant="outline" title={t('common.cancel')} style={{ flex: 1 }} onPress={() => { setName(user.name); setEditing(false); }} />
                  <Button small title={t('common.save')} style={{ flex: 1 }} onPress={saveName} />
                </Row>
              </>
            ) : (
              <>
                <Text style={styles.h2}>{user.name}</Text>
                <Text style={styles.muted}>{user.email}</Text>
              </>
            )}
          </View>
        </Row>
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="person-outline" title="Edit name" onPress={() => setEditing(true)} />
        <MenuRow icon="trending-up-outline" title="My Journey" subtitle="Moods, goals and progress" onPress={() => router.push('/client/journey')} />
        <MenuRow icon="calendar-outline" title="My Sessions" subtitle="Upcoming and past sessions" onPress={() => router.push('/client/therapy')} />
        <MenuRow icon="chatbubble-ellipses-outline" title={t('common.messages')} subtitle="Talk with your therapist" onPress={() => router.push('/messages')} />
        <MenuRow icon="medkit-outline" title="My medications" subtitle="Prescriptions and reminders" onPress={() => router.push('/client/medications')} />
        <MenuRow icon="clipboard-outline" title="Self-assessments" subtitle="PHQ-9 and GAD-7" onPress={() => router.push('/client/journey')} />
        <MenuRow icon="sparkles-outline" title="Find my match quiz" subtitle="Get matched with the right professional" onPress={() => router.push('/client/match-quiz')} />
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="bag-handle-outline" title="My Purchases" onPress={() => router.push('/client/purchases')} />
        <MenuRow icon="receipt-outline" title="Receipts & invoices" onPress={() => router.push('/receipts')} />
        <MenuRow icon="card-outline" title={t('settings.payments')} subtitle={t('settings.payments.sub')} onPress={() => router.push('/settings/payments')} />
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="heart-outline" title="Get help now" subtitle="Crisis lines and grounding" onPress={() => router.push('/crisis')} />
        <MenuRow icon="notifications-outline" title={t('common.notifications')} subtitle={t('settings.notifications.sub')} onPress={() => router.push('/settings/notifications')} />
        <MenuRow icon="shield-checkmark-outline" title={t('settings.privacy')} subtitle={t('settings.privacy.sub')} onPress={() => router.push('/settings/privacy')} />
        <MenuRow icon="language-outline" title={t('settings.language')} subtitle={LANGUAGES.find((l) => l.value === lang)?.native} onPress={() => router.push('/settings/language')} />
        <MenuRow icon="settings-outline" title={t('common.settings')} onPress={() => router.push('/settings')} />
        <Divider style={{ marginVertical: 4 }} />
        <MenuRow icon="refresh-outline" title="Reset demo data" onPress={resetDemo} />
        <MenuRow icon="log-out-outline" title={t('common.signOut')} danger onPress={logout} />
      </Card>
    </Screen>
  );
}
