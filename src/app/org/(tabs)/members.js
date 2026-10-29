import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, EmptyState, Header, Input, Row, Screen, Segmented, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { notifyUser } from '../../../db/actions';
import { db, useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { confirm, notify } from '../../../utils/alert';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Members() {
  const { user: org } = useAuth();
  const { data: orgMembers } = useCollection('orgMembers');
  const [tab, setTab] = useState('active');
  const [q, setQ] = useState('');
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [error, setError] = useState('');

  const members = useMemo(() => orgMembers.filter((m) => m.orgId === org?.id), [orgMembers, org]);
  const counts = { active: members.filter((m) => m.status === 'active').length, invited: members.filter((m) => m.status === 'invited').length };
  const term = q.trim().toLowerCase();
  const list = members
    .filter((m) => m.status === tab)
    .filter((m) => !term || m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term) || (m.department ?? '').toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!org) return null;
  const seatsLeft = (org.seats ?? 0) - counts.active - counts.invited;
  const perMember = org.sessionsPerMember ?? 6;

  const invite = async () => {
    setError('');
    const email = form.email.trim().toLowerCase();
    if (!form.name.trim()) return setError('Enter the member’s name.');
    if (!EMAIL_RE.test(email)) return setError('Enter a valid work email.');
    if (members.some((m) => m.email.toLowerCase() === email)) return setError('This person is already a member or invited.');
    if (seatsLeft <= 0) return setError('No seats left. Add seats from the Plan tab.');
    await db.insert('orgMembers', { orgId: org.id, name: form.name.trim(), email, department: form.department.trim() || 'Other', status: 'invited', sessionsUsed: 0 });
    await notifyUser(org.id, { title: 'Invitation sent', body: `${form.name.trim()} (${email}) was invited to join.`, type: 'system', link: '/org/members' });
    setForm({ name: '', email: '', department: '' });
    setInviting(false);
    setTab('invited');
    notify('Invitation sent', `Simulated — an email to ${email} will be sent once the backend is connected.`);
  };

  const resend = async (m) => {
    await db.update('orgMembers', m.id, { lastInvitedAt: new Date().toISOString() });
    notify('Invitation resent', `Simulated email to ${m.email}.`);
  };

  const revoke = (m) => confirm(
    m.status === 'invited' ? 'Revoke invitation?' : 'Remove member?',
    m.status === 'invited' ? `${m.email} will no longer be able to join.` : `${m.name} loses access to sponsored care. Their personal account and history stay private and are not deleted.`,
    () => db.remove('orgMembers', m.id),
    m.status === 'invited' ? 'Revoke' : 'Remove',
    true,
  );

  return (
    <Screen>
      <Header
        title="Members"
        subtitle={`${seatsLeft} of ${org.seats ?? 0} seats available`}
        right={!inviting && <Button small icon="person-add-outline" title="Invite" onPress={() => setInviting(true)} />}
      />

      {inviting && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={[styles.h3, { marginBottom: 10 }]}>Invite a team member</Text>
          <Input icon="person-outline" placeholder="Full name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Input icon="mail-outline" placeholder="Work email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} />
          <Input icon="briefcase-outline" placeholder="Department (optional)" value={form.department} onChangeText={(v) => setForm((f) => ({ ...f, department: v }))} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Row>
            <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => { setInviting(false); setError(''); }} />
            <Button small title="Send invite" icon="send-outline" style={{ flex: 1 }} onPress={invite} />
          </Row>
        </Card>
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 12 }}
        options={[{ value: 'active', label: `Active (${counts.active})` }, { value: 'invited', label: `Invited (${counts.invited})` }]}
      />
      <Input icon="search-outline" placeholder="Search name, email or department" value={q} onChangeText={setQ} autoCapitalize="none" />

      {list.length === 0 ? (
        <EmptyState icon="people-outline" title={tab === 'active' ? 'No active members' : 'No pending invitations'} />
      ) : list.map((m) => (
        <Card key={m.id} style={{ marginBottom: 8, paddingVertical: 12 }}>
          <Row gap={12}>
            <Avatar name={m.name} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '600' }]}>{m.name}</Text>
              <Text style={styles.muted} numberOfLines={1}>{m.email} · {m.department}</Text>
              {m.status === 'active' ? (
                <Text style={styles.muted}>{m.sessionsUsed ?? 0} sessions used (of {perMember})</Text>
              ) : (
                <Text style={styles.muted}>Invited {new Date(m.lastInvitedAt ?? m.createdAt).toLocaleDateString()}</Text>
              )}
            </View>
            {m.status === 'invited' && (
              <Pressable hitSlop={8} onPress={() => resend(m)} style={{ padding: 6 }}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              </Pressable>
            )}
            <Pressable hitSlop={8} onPress={() => revoke(m)} style={{ padding: 6 }}>
              <Ionicons name={m.status === 'invited' ? 'close-circle-outline' : 'person-remove-outline'} size={20} color={colors.danger} />
            </Pressable>
          </Row>
        </Card>
      ))}

      {tab === 'active' && (
        <Card style={{ marginTop: 10, backgroundColor: colors.tanSoft, borderColor: colors.tanSoft }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.tan} />
            <View style={{ flex: 1 }}>
              <Badge label="Demo only" tone="tan" />
              <Text style={[styles.muted, { color: colors.text, marginTop: 4 }]}>
                Per-member session counts are shown for the offline demo. In production, organizations will only see aggregated totals.
              </Text>
            </View>
          </Row>
        </Card>
      )}
    </Screen>
  );
}
