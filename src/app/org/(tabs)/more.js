import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Button, Card, Header, Input, MenuRow, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../db/db';
import { seedIfNeeded } from '../../../db/seed';
import { colors } from '../../../theme';
import { confirm, notify } from '../../../utils/alert';

export default function OrgMore() {
  const { user: org, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '' });
  const [error, setError] = useState('');
  if (!org) return null;

  const start = () => {
    setForm({ name: org.name, contactName: org.contactName ?? '' });
    setError('');
    setEditing(true);
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Organization name is required.');
    await updateProfile({ name: form.name.trim(), contactName: form.contactName.trim() });
    setEditing(false);
    notify('Profile saved');
  };

  const doSignOut = () => confirm('Sign out?', '', async () => {
    await signOut();
    router.replace('/welcome');
  }, 'Sign out');

  const resetDemo = () => confirm('Reset demo data?', 'All offline data returns to the original demo state.', async () => {
    await signOut();
    await db.reset();
    await seedIfNeeded();
    router.replace('/welcome');
  }, 'Reset', true);

  return (
    <Screen>
      <Header title="More" />
      <Card style={{ marginBottom: 14 }}>
        {editing ? (
          <>
            <Input label="Organization name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Input label="Contact person" value={form.contactName} onChangeText={(v) => setForm((f) => ({ ...f, contactName: v }))} />
            {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
            <Row>
              <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button small title="Save" style={{ flex: 1 }} onPress={save} />
            </Row>
          </>
        ) : (
          <Row gap={14}>
            <Avatar name={org.name} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>{org.name}</Text>
              <Text style={styles.muted}>{org.contactName ? `${org.contactName} · ` : ''}{org.email}</Text>
            </View>
            <Button small variant="secondary" title="Edit" onPress={start} />
          </Row>
        )}
      </Card>
      <Card style={{ paddingVertical: 4 }}>
        <MenuRow icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
        <MenuRow icon="settings-outline" title="Settings" subtitle="Security, privacy and language" onPress={() => router.push('/settings')} />
        <MenuRow icon="call-outline" title="Crisis resources for your team" subtitle="Share helplines with employees" onPress={() => router.push('/crisis')} />
      </Card>
      <Card style={{ marginTop: 14, paddingVertical: 4 }}>
        <MenuRow icon="refresh-outline" title="Reset demo data" subtitle="Restore the original offline demo" onPress={resetDemo} />
        <MenuRow icon="log-out-outline" title="Sign out" danger onPress={doSignOut} />
      </Card>
    </Screen>
  );
}
