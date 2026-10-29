import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Avatar, Card, Header, MenuRow, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../db/db';
import { seedIfNeeded } from '../../../db/seed';
import { confirm } from '../../../utils/alert';

export default function AdminMore() {
  const { user, signOut } = useAuth();
  if (!user) return null;

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
        <Row gap={14}>
          <Avatar name={user.name} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>{user.name}</Text>
            <Text style={styles.muted}>{user.email} · Administrator</Text>
          </View>
        </Row>
      </Card>
      <Card style={{ paddingVertical: 4 }}>
        <MenuRow icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
        <MenuRow icon="settings-outline" title="Settings" subtitle="Security, privacy and language" onPress={() => router.push('/settings')} />
      </Card>
      <Card style={{ marginTop: 14, paddingVertical: 4 }}>
        <MenuRow icon="refresh-outline" title="Reset demo data" subtitle="Restore the original offline demo" onPress={resetDemo} />
        <MenuRow icon="log-out-outline" title="Sign out" danger onPress={doSignOut} />
      </Card>
    </Screen>
  );
}
