import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useProData } from '../../components/pro/useProData';
import { Button, Card, ChipGroup, EmptyState, Header, Input, Rating, Row, Screen, styles } from '../../components/ui';
import { db, useCollection } from '../../db/db';
import { colors, radius } from '../../theme';
import { notifyAdmins } from '../../utils/admins';
import { notify } from '../../utils/alert';

const REPORT_REASONS = ['Fake or not a real client', 'Contains private information', 'Abusive or offensive', 'Other'].map((r) => ({ value: r, label: r }));

function Stars({ value }) {
  return (
    <Row gap={2}>
      {[1, 2, 3, 4, 5].map((n) => <Ionicons key={n} name={n <= value ? 'star' : 'star-outline'} size={14} color={colors.star} />)}
    </Row>
  );
}

export default function Reviews() {
  const { me, user, usersById } = useProData();
  const { data: reviews } = useCollection('reviews');
  const { data: reports } = useCollection('reports');
  const [replying, setReplying] = useState(null);
  const [reply, setReply] = useState('');
  const [reporting, setReporting] = useState(null);
  const [reason, setReason] = useState(null);

  const mine = useMemo(
    () => reviews.filter((r) => r.proId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews, me],
  );
  const reported = useMemo(() => new Set(reports.filter((r) => r.reporterId === me).map((r) => r.targetId)), [reports, me]);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: mine.filter((r) => r.rating === star).length }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  const saveReply = async (r) => {
    if (!reply.trim()) return;
    await db.update('reviews', r.id, { reply: reply.trim(), replyAt: new Date().toISOString() });
    setReplying(null);
    setReply('');
  };

  const submitReport = async (r) => {
    if (!reason) return;
    await db.insert('reports', { type: 'review', targetId: r.id, reason, status: 'open', reporterId: me });
    await notifyAdmins({ title: 'Review reported', body: `${user.name} reported a review: ${reason}`, type: 'system', link: '/admin/reports' });
    setReporting(null);
    setReason(null);
    notify('Report sent', 'Our team will review it. The review stays visible until a decision is made.');
  };

  return (
    <Screen>
      <Header title="Reviews" subtitle="What clients say about working with you." back />

      <Card style={{ marginBottom: 16 }}>
        <Row gap={20} style={{ alignItems: 'center' }}>
          <View style={{ alignItems: 'center', width: 90 }}>
            <Text style={{ fontSize: 40, fontWeight: '700', color: colors.primary }}>{user?.rating ? user.rating.toFixed(1) : '—'}</Text>
            <Rating value={user?.rating} count={user?.reviews ?? 0} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {distribution.map((d) => (
              <Row key={d.star} gap={6}>
                <Text style={[styles.muted, { width: 12 }]}>{d.star}</Text>
                <View style={{ flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.tanSoft, overflow: 'hidden' }}>
                  <View style={{ width: `${(d.count / maxCount) * 100}%`, height: '100%', backgroundColor: colors.star }} />
                </View>
                <Text style={[styles.muted, { width: 20, textAlign: 'right' }]}>{d.count}</Text>
              </Row>
            ))}
          </View>
        </Row>
        <Text style={[styles.muted, { marginTop: 10 }]}>
          Bars show reviews written in the app ({mine.length}). The overall rating also includes reviews imported before launch.
        </Text>
      </Card>

      {mine.length === 0 ? (
        <EmptyState icon="star-outline" title="No reviews yet" message="Clients can leave a review after a completed session." />
      ) : mine.map((r) => (
        <Card key={r.id} style={{ marginBottom: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[styles.body, { fontWeight: '700' }]}>{r.anonymous ? 'Verified client' : usersById[r.clientId]?.name ?? 'Client'}</Text>
            <Text style={styles.muted}>{new Date(r.createdAt).toLocaleDateString()}</Text>
          </Row>
          <View style={{ marginVertical: 6 }}><Stars value={r.rating} /></View>
          {!!r.text && <Text style={styles.body}>{r.text}</Text>}

          {!!r.reply && replying !== r.id && (
            <View style={{ marginTop: 10, padding: 10, borderRadius: radius.sm, backgroundColor: colors.primarySoft }}>
              <Text style={[styles.label, { marginBottom: 2 }]}>Your reply</Text>
              <Text style={styles.body}>{r.reply}</Text>
            </View>
          )}

          {replying === r.id && (
            <View style={{ marginTop: 10 }}>
              <Input multiline placeholder="Thank the client or add context. Never confirm someone is your client or share session details." value={reply} onChangeText={setReply} />
              <Row>
                <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setReplying(null)} />
                <Button small title="Post reply" style={{ flex: 1 }} disabled={!reply.trim()} onPress={() => saveReply(r)} />
              </Row>
            </View>
          )}

          {reporting === r.id && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Why are you reporting this review?</Text>
              <ChipGroup small options={REPORT_REASONS} value={reason} onChange={setReason} />
              <Row style={{ marginTop: 10 }}>
                <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setReporting(null)} />
                <Button small variant="danger" title="Send report" style={{ flex: 1 }} disabled={!reason} onPress={() => submitReport(r)} />
              </Row>
            </View>
          )}

          {replying !== r.id && reporting !== r.id && (
            <Row style={{ marginTop: 10, justifyContent: 'flex-end' }} gap={16}>
              <Pressable hitSlop={8} onPress={() => { setReplying(r.id); setReply(r.reply ?? ''); setReporting(null); }}>
                <Text style={styles.link}>{r.reply ? 'Edit reply' : 'Reply'}</Text>
              </Pressable>
              {reported.has(r.id) ? (
                <Text style={styles.muted}>Reported</Text>
              ) : (
                <Pressable hitSlop={8} onPress={() => { setReporting(r.id); setReason(null); setReplying(null); }}>
                  <Text style={[styles.link, { color: colors.danger }]}>Report</Text>
                </Pressable>
              )}
            </Row>
          )}
        </Card>
      ))}
    </Screen>
  );
}
