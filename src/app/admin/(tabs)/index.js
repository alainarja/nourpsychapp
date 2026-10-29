import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BarRow, ROLE_LABEL, ROLE_TONE } from '../../../components/admin/shared';
import { NotificationBell } from '../../../components/NotificationBell';
import { money } from '../../../components/pro/useProData';
import { Avatar, Badge, Card, MenuRow, Row, Screen, SectionTitle, StatCard, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../db/db';
import { colors, fonts } from '../../../theme';
import { parseKey } from '../../../utils/date';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: users } = useCollection('users');
  const { data: appointments } = useCollection('appointments');
  const { data: orders } = useCollection('orders');
  const { data: reports } = useCollection('reports');

  const stats = useMemo(() => {
    const now = new Date();
    const inThisMonth = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    const byRole = { client: 0, pro: 0, org: 0, admin: 0 };
    users.forEach((u) => { byRole[u.role] = (byRole[u.role] ?? 0) + 1; });
    const monthSessions = appointments.filter((a) => a.status !== 'cancelled' && inThisMonth(parseKey(a.date)));
    return {
      byRole,
      pending: users.filter((u) => u.role === 'pro' && u.verificationStatus === 'pending').length,
      sessions: monthSessions.length,
      sessionGmv: monthSessions.reduce((s, a) => s + (a.price ?? 0), 0),
      marketGmv: orders.reduce((s, o) => s + (o.price ?? 0), 0),
      openReports: reports.filter((r) => r.status === 'open').length,
      suspended: users.filter((u) => u.suspended).length,
      recent: [...users].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5),
    };
  }, [users, appointments, orders, reports]);

  const maxRole = Math.max(...Object.values(stats.byRole));

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginTop: 8, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { fontSize: 16 }]}>Admin console</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary }}>{user?.name}</Text>
        </View>
        <NotificationBell />
      </Row>

      <Row gap={10}>
        <StatCard value={users.length} label="Total users" />
        <StatCard value={stats.pending} label="Pending verifications" />
        <StatCard value={stats.openReports} label="Open reports" />
      </Row>
      <Row gap={10} style={{ marginTop: 10 }}>
        <StatCard value={stats.sessions} label="Sessions this month" />
        <StatCard value={money(stats.sessionGmv)} label="Session volume (month)" />
        <StatCard value={money(stats.marketGmv)} label="Marketplace GMV" />
      </Row>

      <SectionTitle>Users by role</SectionTitle>
      <Card>
        {Object.entries(stats.byRole).map(([role, n]) => (
          <BarRow key={role} label={ROLE_LABEL[role] ?? role} value={n} max={maxRole} />
        ))}
        {stats.suspended > 0 && <Text style={styles.muted}>{stats.suspended} suspended</Text>}
      </Card>

      <SectionTitle action="All users" onAction={() => router.push('/admin/users')}>Recent sign-ups</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {stats.recent.map((u, i) => (
          <Pressable key={u.id} onPress={() => router.push(`/admin/user/${u.id}`)}>
            <Row gap={12} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <Avatar name={u.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '600' }]}>{u.name}</Text>
                <Text style={styles.muted}>{u.email}</Text>
              </View>
              <Badge label={ROLE_LABEL[u.role] ?? u.role} tone={ROLE_TONE[u.role] ?? 'muted'} />
            </Row>
          </Pressable>
        ))}
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="shield-checkmark-outline" title="Review verifications" subtitle={`${stats.pending} waiting`} onPress={() => router.push('/admin/verifications')} />
        <MenuRow icon="flag-outline" title="Moderation queue" subtitle={`${stats.openReports} open reports`} onPress={() => router.push('/admin/reports')} />
        <MenuRow icon="people-outline" title="Manage users" subtitle="Search, inspect and suspend accounts" onPress={() => router.push('/admin/users')} />
      </Card>
    </Screen>
  );
}
