import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DOC_LABEL, VERIFICATION_LABEL } from '../../../components/admin/shared';
import { Avatar, Badge, Button, Card, ChipGroup, EmptyState, Header, Input, Row, Screen, SectionTitle, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { notifyUser } from '../../../db/actions';
import { db, useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { comingSoon, confirm, notify } from '../../../utils/alert';

const CHECKS = [
  { id: 'registry', label: 'License number checked in the national registry' },
  { id: 'degree', label: 'Degree is from an accredited institution' },
  { id: 'current', label: 'License is current (not expired or suspended)' },
];

const REJECT_REASONS = ['License number not found in registry', 'Documents unreadable', 'Name mismatch between degree and license', 'License expired'];

export default function VerificationDetail() {
  const { id } = useLocalSearchParams();
  const { user: admin } = useAuth();
  const { data: users } = useCollection('users');
  const [checked, setChecked] = useState([]);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const pro = users.find((u) => u.id === id && u.role === 'pro');
  if (!pro) return <Screen><Header title="Verification" back /><EmptyState title="Professional not found" /></Screen>;

  const status = pro.verificationStatus ?? 'not_submitted';
  const [label, tone] = VERIFICATION_LABEL[status] ?? VERIFICATION_LABEL.not_submitted;
  const docs = pro.verificationDocs ?? [];
  const allChecked = checked.length === CHECKS.length;

  const approve = () => confirm('Approve verification?', `${pro.name} will be marked as verified and visible to clients.`, async () => {
    await db.update('users', pro.id, { verified: true, verificationStatus: 'approved', verificationNote: null, verifiedAt: new Date().toISOString(), verifiedBy: admin.id });
    await notifyUser(pro.id, { title: "You're verified", body: 'Your license was approved. Clients can now find and book you.', type: 'verification', link: '/pro/verification' });
    notify('Approved', `${pro.name} is now verified.`);
    router.back();
  }, 'Approve');

  const reject = async () => {
    if (!reason.trim()) return;
    await db.update('users', pro.id, { verified: false, verificationStatus: 'rejected', verificationNote: reason.trim(), verifiedBy: admin.id });
    await notifyUser(pro.id, { title: 'Verification needs changes', body: reason.trim(), type: 'verification', link: '/pro/verification' });
    notify('Rejected', `${pro.name} was asked to resubmit.`);
    router.back();
  };

  return (
    <Screen>
      <Header title="Verification review" back />
      <Card style={{ marginBottom: 14 }}>
        <Row gap={14}>
          <Avatar name={pro.name} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>{pro.name}</Text>
            <Text style={styles.muted}>{pro.title} · {pro.proType === 'psychiatrist' ? 'Psychiatrist' : 'Psychologist'}</Text>
            <Text style={styles.muted}>{pro.email}</Text>
          </View>
          <Badge label={label} tone={tone} />
        </Row>
        <Text style={[styles.body, { marginTop: 12 }]}><Text style={{ fontWeight: '700' }}>License: </Text>{pro.license || 'Not provided'}</Text>
        {!!pro.verificationSubmittedAt && <Text style={styles.muted}>Submitted {new Date(pro.verificationSubmittedAt).toLocaleString()}</Text>}
        {status === 'rejected' && !!pro.verificationNote && <Text style={[styles.muted, { color: colors.danger, marginTop: 4 }]}>Last rejection: {pro.verificationNote}</Text>}
      </Card>

      <SectionTitle>Documents ({docs.length})</SectionTitle>
      {docs.length === 0 ? <EmptyState icon="document-outline" title="No documents uploaded" /> : (
        <Card style={{ paddingVertical: 4 }}>
          {docs.map((d, i) => (
            <Pressable key={d.type} onPress={() => comingSoon('Document viewer')}>
              <Row gap={12} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600' }]}>{DOC_LABEL[d.type] ?? d.type}</Text>
                  <Text style={styles.muted}>{d.name} · {new Date(d.uploadedAt).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="eye-outline" size={18} color={colors.faint} />
              </Row>
            </Pressable>
          ))}
        </Card>
      )}

      {status === 'pending' && (
        <>
          <SectionTitle>Reviewer checklist</SectionTitle>
          <Card style={{ paddingVertical: 6 }}>
            {CHECKS.map((c) => {
              const on = checked.includes(c.id);
              return (
                <Pressable key={c.id} onPress={() => setChecked((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}>
                  <Row style={{ paddingVertical: 8, alignItems: 'flex-start' }}>
                    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
                    <Text style={[styles.body, { flex: 1 }]}>{c.label}</Text>
                  </Row>
                </Pressable>
              );
            })}
          </Card>

          {rejecting ? (
            <Card style={{ marginTop: 16 }}>
              <Text style={styles.label}>Reason (sent to the professional)</Text>
              <View style={{ marginBottom: 10 }}>
                <ChipGroup small options={REJECT_REASONS.map((r) => ({ value: r, label: r }))} value={reason} onChange={setReason} />
              </View>
              <Input multiline placeholder="Explain what needs to change…" value={reason} onChangeText={setReason} />
              <Row>
                <Button small variant="outline" title="Back" style={{ flex: 1 }} onPress={() => setRejecting(false)} />
                <Button small variant="danger" title="Reject" style={{ flex: 1 }} disabled={!reason.trim()} onPress={reject} />
              </Row>
            </Card>
          ) : (
            <Row style={{ marginTop: 16 }}>
              <Button variant="danger" title="Reject" icon="close" style={{ flex: 1 }} onPress={() => setRejecting(true)} />
              <Button title="Approve" icon="checkmark" style={{ flex: 1 }} disabled={!allChecked || docs.length === 0} onPress={approve} />
            </Row>
          )}
          {!allChecked && !rejecting && <Text style={[styles.muted, { textAlign: 'center', marginTop: 8 }]}>Complete the checklist to approve.</Text>}
        </>
      )}

      {status === 'approved' && (
        <Button variant="danger" title="Revoke verification" icon="shield-outline" style={{ marginTop: 16 }} onPress={() => confirm('Revoke verification?', `${pro.name} will be hidden from clients until re-verified.`, async () => {
          await db.update('users', pro.id, { verified: false, verificationStatus: 'rejected', verificationNote: 'Verification revoked by an administrator.' });
          await notifyUser(pro.id, { title: 'Verification revoked', body: 'Please contact support or resubmit your documents.', type: 'verification', link: '/pro/verification' });
        }, 'Revoke', true)} />
      )}
    </Screen>
  );
}
