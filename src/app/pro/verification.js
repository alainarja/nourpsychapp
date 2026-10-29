import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Header, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { notifyAdmins } from '../../utils/admins';
import { notify } from '../../utils/alert';

const BASE_DOCS = [
  { type: 'license', label: 'Professional license', required: true },
  { type: 'degree', label: 'Degree certificate', required: true },
];
const PSYCHIATRIST_DOCS = [{ type: 'medical_council', label: 'Medical council registration', required: true }];

const STEPS = ['Account created', 'Documents uploaded', 'Under review', 'Verified'];

// Which step index is complete for each status.
function stepFor(status, hasDocs) {
  if (status === 'approved') return 3;
  if (status === 'pending') return 2;
  return hasDocs ? 1 : 0;
}

const STATUS_BADGE = {
  not_submitted: ['Not submitted', 'muted'],
  pending: ['Under review', 'primary'],
  approved: ['Verified', 'success'],
  rejected: ['Needs changes', 'danger'],
};

export default function Verification() {
  const { user, updateProfile } = useAuth();
  const [docs, setDocs] = useState(user?.verificationDocs ?? []);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const status = user.verificationStatus ?? 'not_submitted';
  const locked = status === 'pending' || status === 'approved';
  const checklist = [...BASE_DOCS, ...(user.proType === 'psychiatrist' ? PSYCHIATRIST_DOCS : [])];
  const docFor = (type) => docs.find((d) => d.type === type);
  const missing = checklist.filter((c) => c.required && !docFor(c.type));
  const step = stepFor(status, docs.length > 0);
  const [badgeLabel, badgeTone] = STATUS_BADGE[status] ?? STATUS_BADGE.not_submitted;

  // Simulated file picker — real uploads need storage on the backend.
  const upload = (type) => setDocs((d) => [...d.filter((x) => x.type !== type), { type, name: `${type}-document.pdf`, uploadedAt: new Date().toISOString() }]);
  const removeDoc = (type) => setDocs((d) => d.filter((x) => x.type !== type));

  const submit = async () => {
    setBusy(true);
    try {
      await updateProfile({ verificationStatus: 'pending', verificationDocs: docs, verificationNote: null, verificationSubmittedAt: new Date().toISOString() });
      await notifyAdmins({ title: 'Verification request', body: `${user.name} submitted ${docs.length} documents for review.`, type: 'verification', link: `/admin/verification/${user.id}` });
      notify('Submitted for review', 'We usually review documents within 2 business days. You will get a notification when it is done.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="License verification" subtitle="Clients only see verified professionals." back />

      <Card style={{ marginBottom: 14 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={styles.h3}>Status</Text>
          <Badge label={badgeLabel} tone={badgeTone} />
        </Row>
        {STEPS.map((label, i) => {
          const done = i <= step;
          return (
            <Row key={label} gap={12} style={{ alignItems: 'flex-start' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: done ? colors.primary : colors.tanSoft, alignItems: 'center', justifyContent: 'center' }}>
                  {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : <Text style={{ fontSize: 11, color: colors.muted }}>{i + 1}</Text>}
                </View>
                {i < STEPS.length - 1 && <View style={{ width: 2, height: 22, backgroundColor: i < step ? colors.primary : colors.border }} />}
              </View>
              <Text style={[styles.body, { color: done ? colors.text : colors.muted, fontWeight: i === step ? '700' : '400' }]}>{label}</Text>
            </Row>
          );
        })}
        <Text style={[styles.muted, { marginTop: 8 }]}>License number: {user.license || 'Not provided'}</Text>
      </Card>

      {status === 'rejected' && (
        <Card style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft, marginBottom: 14 }}>
          <Text style={[styles.h3, { color: colors.danger }]}>Why it wasn't approved</Text>
          <Text style={[styles.body, { marginTop: 6 }]}>{user.verificationNote || 'No reason was given.'}</Text>
          <Text style={[styles.muted, { marginTop: 6 }]}>Update the documents below and resubmit.</Text>
        </Card>
      )}

      {status === 'approved' && (
        <Card style={{ backgroundColor: colors.successSoft, borderColor: colors.successSoft, marginBottom: 14 }}>
          <Row>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <Text style={[styles.body, { flex: 1 }]}>You're verified. Your profile shows a verified badge to clients.</Text>
          </Row>
        </Card>
      )}

      <SectionTitle>Documents</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {checklist.map((c, i) => {
          const doc = docFor(c.type);
          return (
            <Row key={c.type} gap={12} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <Ionicons name={doc ? 'document-attach' : 'document-outline'} size={22} color={doc ? colors.success : colors.faint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '600' }]}>{c.label}{c.required ? '' : ' (optional)'}</Text>
                <Text style={styles.muted} numberOfLines={1}>{doc ? `${doc.name} · ${new Date(doc.uploadedAt).toLocaleDateString()}` : 'Not uploaded'}</Text>
              </View>
              {!locked && (doc ? (
                <Pressable onPress={() => removeDoc(c.type)} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                </Pressable>
              ) : (
                <Button small variant="secondary" icon="cloud-upload-outline" title="Upload" onPress={() => upload(c.type)} />
              ))}
            </Row>
          );
        })}
      </Card>
      <Text style={[styles.muted, { marginTop: 8 }]}>Offline demo: "Upload" attaches a placeholder file. Real uploads will be stored securely once the backend is connected.</Text>

      {!locked && (
        <Button
          title={status === 'rejected' ? 'Resubmit for review' : 'Submit for review'}
          icon="send-outline"
          style={{ marginTop: 18 }}
          disabled={missing.length > 0}
          loading={busy}
          onPress={submit}
        />
      )}
      {!locked && missing.length > 0 && (
        <Text style={[styles.muted, { marginTop: 8, textAlign: 'center' }]}>Still needed: {missing.map((m) => m.label).join(', ')}</Text>
      )}
      {status === 'pending' && <Button variant="outline" title="Back to home" style={{ marginTop: 18 }} onPress={() => router.back()} />}
    </Screen>
  );
}
