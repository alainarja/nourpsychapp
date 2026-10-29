import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MessagesButton, NotificationBell } from '../../../components/NotificationBell';
import { inMonth, money, orderRevenue, sessionRevenue, useProData } from '../../../components/pro/useProData';
import { Avatar, Badge, Card, MenuRow, Row, Screen, SectionTitle, StatCard, styles } from '../../../components/ui';
import { apptDateTime } from '../../../db/actions';
import { colors, fonts } from '../../../theme';
import { addDays, greeting, startOfWeek, timeLabel, todayKey } from '../../../utils/date';

export default function ProHome() {
  const { user, usersById, liveAppts, clients, myOrders } = useProData();

  const stats = useMemo(() => {
    const ws = startOfWeek();
    const we = addDays(ws, 7);
    const thisMonth = inMonth(0);
    return {
      active: clients.filter((c) => c.active).length,
      week: liveAppts.filter((a) => { const d = apptDateTime(a); return d >= ws && d < we; }).length,
      earnings: sessionRevenue(liveAppts, thisMonth) + orderRevenue(myOrders, thisMonth),
      today: liveAppts.filter((a) => a.date === todayKey()),
    };
  }, [clients, liveAppts, myOrders]);

  if (!user) return null;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginTop: 8, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { fontSize: 16 }]}>{greeting()},</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary }} numberOfLines={1}>{user.name}</Text>
        </View>
        <Row gap={8}>
          <MessagesButton />
          <NotificationBell />
          <Pressable onPress={() => router.push('/pro/profile')}>
            <Avatar name={user.name} size={48} />
          </Pressable>
        </Row>
      </Row>

      {!user.verified && <VerificationBanner status={user.verificationStatus} note={user.verificationNote} />}

      <Row gap={10}>
        <StatCard value={stats.active} label="Clients" />
        <StatCard value={stats.week} label="Sessions This Week" />
        <StatCard value={money(stats.earnings)} label="Earnings This Month" />
      </Row>

      <SectionTitle action="Calendar" onAction={() => router.push('/pro/calendar')}>Today's sessions</SectionTitle>
      <Card style={{ paddingVertical: 6 }}>
        {stats.today.length === 0 ? (
          <Text style={[styles.muted, { paddingVertical: 10 }]}>No sessions today. Enjoy the breathing room.</Text>
        ) : (
          stats.today.map((a) => (
            <Pressable key={a.id} onPress={() => router.push(`/pro/client/${a.clientId}`)}>
              <Row style={{ paddingVertical: 10 }} gap={12}>
                <Text style={{ width: 72, fontWeight: '700', color: colors.primary }}>{timeLabel(a.time)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{usersById[a.clientId]?.name ?? 'Client'}</Text>
                  <Text style={styles.muted}>{a.type}</Text>
                </View>
                <Badge label={a.status === 'completed' ? 'Done' : a.mode === 'online' ? 'Online' : 'In-person'} tone={a.status === 'completed' ? 'success' : 'primary'} />
              </Row>
            </Pressable>
          ))
        )}
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="people-outline" title="My Clients" subtitle="Manage and support your clients" onPress={() => router.push('/pro/clients')} />
        <MenuRow icon="calendar-outline" title="Calendar" subtitle="View and manage your availability" onPress={() => router.push('/pro/calendar')} />
        <MenuRow icon="briefcase-outline" title="Psych Pro" subtitle="Premium tools for your practice" onPress={() => router.push('/pro/tools')} />
        <MenuRow icon="storefront-outline" title="Marketplace" subtitle="Sell your products and resources" onPress={() => router.push('/pro/marketplace')} />
        <MenuRow icon="wallet-outline" title="Earnings" subtitle="Track your income" onPress={() => router.push('/pro/earnings')} />
        <MenuRow icon="cash-outline" title="Payouts" subtitle="Bank details and payout history" onPress={() => router.push('/pro/payouts')} />
        <MenuRow icon="star-outline" title="Reviews" subtitle="See and reply to client feedback" onPress={() => router.push('/pro/reviews')} />
      </Card>
    </Screen>
  );
}

const BANNER = {
  not_submitted: { icon: 'shield-outline', title: 'Verify your license', body: 'Upload your documents so clients can find and book you.', tone: colors.tan, bg: colors.tanSoft },
  pending: { icon: 'time-outline', title: 'Verification under review', body: 'We usually review documents within 2 business days.', tone: colors.primary, bg: colors.primarySoft },
  rejected: { icon: 'alert-circle-outline', title: 'Verification needs attention', body: 'Your documents were not approved. Tap to see why and resubmit.', tone: colors.danger, bg: colors.dangerSoft },
};

function VerificationBanner({ status, note }) {
  const b = BANNER[status] ?? BANNER.not_submitted;
  return (
    <Pressable onPress={() => router.push('/pro/verification')}>
      <Card style={{ backgroundColor: b.bg, borderColor: b.bg, marginBottom: 14 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Ionicons name={b.icon} size={20} color={b.tone} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { fontWeight: '700', fontSize: 14 }]}>{b.title}</Text>
            <Text style={[styles.muted, { color: colors.text }]}>{status === 'rejected' && note ? note : b.body}</Text>
            <Text style={[styles.muted, { marginTop: 2 }]}>Your profile is hidden from clients until verified (offline demo still shows it).</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={b.tone} />
        </Row>
      </Card>
    </Pressable>
  );
}
