import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { BarRow } from '../../../components/admin/shared';
import { NotificationBell } from '../../../components/NotificationBell';
import { planById } from '../../../components/org/plans';
import { Badge, Card, MenuRow, Row, Screen, SectionTitle, StatCard, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useCollection } from '../../../db/db';
import { colors, fonts, radius } from '../../../theme';

// Smallest group we report engagement for, so individuals can't be singled out.
const MIN_GROUP = 5;

export default function OrgDashboard() {
  const { user: org } = useAuth();
  const { data: orgMembers } = useCollection('orgMembers');

  const s = useMemo(() => {
    const members = orgMembers.filter((m) => m.orgId === org?.id);
    const active = members.filter((m) => m.status === 'active');
    const departments = {};
    active.forEach((m) => { departments[m.department || 'Other'] = (departments[m.department || 'Other'] ?? 0) + 1; });
    return {
      active: active.length,
      invited: members.filter((m) => m.status === 'invited').length,
      // Demo data stores one running total per member; the backend should return this pre-aggregated.
      sessionsUsed: members.reduce((sum, m) => sum + (m.sessionsUsed ?? 0), 0),
      membersUsingCare: active.filter((m) => (m.sessionsUsed ?? 0) > 0).length,
      departments: Object.entries(departments).sort((a, b) => b[1] - a[1]),
    };
  }, [orgMembers, org]);

  if (!org) return null;
  const plan = planById(org.plan);
  const seats = org.seats ?? 0;
  const seatPct = seats ? Math.round((s.active / seats) * 100) : 0;
  const allowance = s.active * (org.sessionsPerMember ?? plan.sessionsPerMember);
  const maxDept = Math.max(1, ...s.departments.map(([, n]) => n));

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginTop: 8, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { fontSize: 16 }]}>Organization</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 28, fontWeight: '700', color: colors.primary }} numberOfLines={1}>{org.name}</Text>
          <View style={{ marginTop: 4 }}><Badge label={`${plan.name} plan`} tone="tan" /></View>
        </View>
        <NotificationBell />
      </Row>

      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, marginBottom: 14 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          <Text style={[styles.body, { flex: 1, fontSize: 13 }]}>
            <Text style={{ fontWeight: '700' }}>Aggregated & anonymised.</Text> You never see who booked what or any clinical information.
          </Text>
        </Row>
      </Card>

      <Row gap={10}>
        <StatCard value={`${s.active}/${seats}`} label="Seats used" />
        <StatCard value={s.invited} label="Pending invites" />
        <StatCard value={s.sessionsUsed} label="Sessions used" />
      </Row>

      <SectionTitle>Utilization</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.body}>Seats</Text>
          <Text style={[styles.muted, { fontWeight: '600' }]}>{seatPct}%</Text>
        </Row>
        <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: colors.tanSoft, overflow: 'hidden', marginBottom: 14 }}>
          <View style={{ width: `${Math.min(100, seatPct)}%`, height: '100%', backgroundColor: colors.primary }} />
        </View>
        <BarRow label="Sessions used of annual allowance" value={s.sessionsUsed} max={Math.max(1, allowance)} suffix={` / ${allowance}`} color={colors.tan} />
        {s.active >= MIN_GROUP ? (
          <BarRow label="Members who have used care" value={s.membersUsingCare} max={s.active} suffix={` / ${s.active}`} color={colors.success} />
        ) : (
          <Text style={[styles.muted, { marginBottom: 6 }]}>Member engagement appears once {MIN_GROUP} or more members are active.</Text>
        )}
        <Text style={styles.muted}>Engagement counts are shown only when at least {MIN_GROUP} members are active, to protect anonymity.</Text>
      </Card>

      <SectionTitle>Members by department</SectionTitle>
      <Card>
        {s.departments.length === 0 ? <Text style={styles.muted}>No active members yet.</Text> : s.departments.map(([dept, n]) => (
          <BarRow key={dept} label={dept} value={n} max={maxDept} />
        ))}
        <Text style={styles.muted}>Headcount only — usage is never broken down by department or person.</Text>
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <MenuRow icon="person-add-outline" title="Invite members" subtitle="Give your team access to care" onPress={() => router.push('/org/members')} />
        <MenuRow icon="medkit-outline" title="Provider network" subtitle={`${(org.proIds ?? []).length} affiliated professionals`} onPress={() => router.push('/org/providers')} />
        <MenuRow icon="card-outline" title="Plan & billing" subtitle={`${plan.name} · ${seats} seats`} onPress={() => router.push('/org/plan')} />
      </Card>
    </Screen>
  );
}
