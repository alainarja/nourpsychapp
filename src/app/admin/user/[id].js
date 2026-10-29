import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ROLE_LABEL, ROLE_TONE, VERIFICATION_LABEL } from '../../../components/admin/shared';
import { money } from '../../../components/pro/useProData';
import { Avatar, Badge, Button, Card, EmptyState, Header, Row, Screen, SectionTitle, StatCard, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { notifyUser } from '../../../db/actions';
import { db, useCollection } from '../../../db/db';
import { confirm } from '../../../utils/alert';

function InfoRow({ label, value }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.body, { fontSize: 14, flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </Row>
  );
}

export default function AdminUserDetail() {
  const { id } = useLocalSearchParams();
  const { user: me } = useAuth();
  const { data: users } = useCollection('users');
  const { data: appointments } = useCollection('appointments');
  const { data: orders } = useCollection('orders');
  const { data: orgMembers } = useCollection('orgMembers');

  const u = users.find((x) => x.id === id);

  // Admins see operational counts only — never clinical content (notes, moods, assessments).
  const stats = useMemo(() => {
    if (!u) return [];
    const live = appointments.filter((a) => a.status !== 'cancelled');
    if (u.role === 'client') {
      const mine = live.filter((a) => a.clientId === u.id);
      return [
        { value: mine.length, label: 'Sessions booked' },
        { value: orders.filter((o) => o.buyerId === u.id).length, label: 'Purchases' },
        { value: appointments.filter((a) => a.clientId === u.id && a.status === 'cancelled').length, label: 'Cancellations' },
      ];
    }
    if (u.role === 'pro') {
      const mine = live.filter((a) => a.proId === u.id);
      return [
        { value: new Set(mine.map((a) => a.clientId)).size, label: 'Clients' },
        { value: mine.length, label: 'Sessions' },
        { value: money(mine.reduce((s, a) => s + (a.price ?? 0), 0) + orders.filter((o) => o.sellerId === u.id).reduce((s, o) => s + o.price, 0)), label: 'Gross volume' },
      ];
    }
    if (u.role === 'org') {
      const members = orgMembers.filter((m) => m.orgId === u.id);
      return [
        { value: `${members.filter((m) => m.status === 'active').length}/${u.seats ?? 0}`, label: 'Seats used' },
        { value: members.filter((m) => m.status === 'invited').length, label: 'Pending invites' },
        { value: (u.proIds ?? []).length, label: 'Providers' },
      ];
    }
    return [];
  }, [u, appointments, orders, orgMembers]);

  if (!u) return <Screen><Header title="User" back /><EmptyState title="User not found" /></Screen>;

  const isSelf = u.id === me?.id;
  const toggleSuspend = () => {
    const next = !u.suspended;
    confirm(
      next ? 'Suspend account?' : 'Restore account?',
      next ? `${u.name} won't be able to sign in. Upcoming sessions are not cancelled automatically.` : `${u.name} will be able to sign in again.`,
      async () => {
        await db.update('users', u.id, { suspended: next, suspendedAt: next ? new Date().toISOString() : null });
        await notifyUser(u.id, { title: next ? 'Account suspended' : 'Account restored', body: next ? 'Contact support if you think this is a mistake.' : 'You can sign in again.', type: 'system' });
      },
      next ? 'Suspend' : 'Restore',
      next,
    );
  };

  return (
    <Screen>
      <Header title="User details" back />
      <Card style={{ marginBottom: 14 }}>
        <Row gap={14}>
          <Avatar name={u.name} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>{u.name}</Text>
            <Text style={styles.muted}>{u.email}</Text>
            <Row gap={6} style={{ marginTop: 6 }}>
              <Badge label={ROLE_LABEL[u.role] ?? u.role} tone={ROLE_TONE[u.role] ?? 'muted'} />
              {u.suspended && <Badge label="Suspended" tone="danger" />}
            </Row>
          </View>
        </Row>
      </Card>

      {stats.length > 0 && (
        <Row gap={10} style={{ marginBottom: 14 }}>
          {stats.map((s) => <StatCard key={s.label} value={s.value} label={s.label} />)}
        </Row>
      )}

      <SectionTitle>Account</SectionTitle>
      <Card>
        <InfoRow label="User ID" value={u.id} />
        <InfoRow label="Joined" value={u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'} />
        <InfoRow label="Email verified" value={u.emailVerified ? 'Yes' : 'No'} />
        <InfoRow label="Consents accepted" value={u.consentedAt ? new Date(u.consentedAt).toLocaleDateString() : 'No'} />
        <InfoRow label="Two-step verification" value={u.twoFactor ? 'On' : 'Off'} />
        {u.role === 'pro' && (
          <>
            <InfoRow label="Type" value={u.proType === 'psychiatrist' ? 'Psychiatrist' : 'Psychologist'} />
            <InfoRow label="License" value={u.license || '—'} />
            <InfoRow label="Verification" value={(VERIFICATION_LABEL[u.verificationStatus] ?? VERIFICATION_LABEL.not_submitted)[0]} />
          </>
        )}
        {u.role === 'org' && <InfoRow label="Plan" value={u.plan ?? '—'} />}
        {u.role === 'client' && !!u.orgId && <InfoRow label="Organization" value={users.find((x) => x.id === u.orgId)?.name ?? u.orgId} />}
      </Card>
      <Text style={[styles.muted, { marginTop: 8 }]}>Clinical data (notes, moods, assessments, messages) is never shown in the admin console.</Text>

      {u.role === 'pro' && (
        <Button variant="secondary" icon="shield-checkmark-outline" title="Open verification" style={{ marginTop: 16 }} onPress={() => router.push(`/admin/verification/${u.id}`)} />
      )}
      {!isSelf && (
        <Button
          variant={u.suspended ? 'secondary' : 'danger'}
          icon={u.suspended ? 'refresh-outline' : 'ban-outline'}
          title={u.suspended ? 'Restore account' : 'Suspend account'}
          style={{ marginTop: 10 }}
          onPress={toggleSuspend}
        />
      )}
      {isSelf && <Text style={[styles.muted, { textAlign: 'center', marginTop: 16 }]}>You can't suspend your own account.</Text>}
    </Screen>
  );
}
