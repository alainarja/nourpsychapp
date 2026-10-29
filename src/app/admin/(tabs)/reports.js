import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, Header, Row, Screen, Segmented, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { notifyUser } from '../../../db/actions';
import { db, useCollection } from '../../../db/db';
import { colors, radius } from '../../../theme';
import { confirm } from '../../../utils/alert';

const STATUS_TONE = { open: 'danger', resolved: 'success', dismissed: 'muted' };

export default function Reports() {
  const { user: admin } = useAuth();
  const { data: reports } = useCollection('reports');
  const { data: reviews } = useCollection('reviews');
  const { data: users } = useCollection('users');
  const [tab, setTab] = useState('open');

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const reviewsById = useMemo(() => Object.fromEntries(reviews.map((r) => [r.id, r])), [reviews]);
  const list = reports
    .filter((r) => (tab === 'open' ? r.status === 'open' : r.status !== 'open'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const close = async (report, status, note) => {
    await db.update('reports', report.id, { status, resolvedBy: admin.id, resolvedAt: new Date().toISOString(), resolution: note });
    if (report.reporterId) {
      await notifyUser(report.reporterId, { title: 'Report reviewed', body: note, type: 'system' });
    }
  };

  const removeContent = (report) => confirm('Remove this review?', 'The review is deleted permanently and the report is resolved.', async () => {
    await db.remove('reviews', report.targetId);
    await close(report, 'resolved', 'The reported review was removed.');
  }, 'Remove', true);

  return (
    <Screen>
      <Header title="Moderation" subtitle="Reported content waiting for a decision." />
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 14 }}
        options={[
          { value: 'open', label: `Open (${reports.filter((r) => r.status === 'open').length})` },
          { value: 'closed', label: 'Closed' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon="flag-outline" title={tab === 'open' ? 'No open reports' : 'No closed reports'} />
      ) : list.map((r) => {
        const target = r.type === 'review' ? reviewsById[r.targetId] : null;
        return (
          <Card key={r.id} style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[styles.body, { fontWeight: '700', textTransform: 'capitalize' }]}>{r.type} report</Text>
              <Badge label={r.status} tone={STATUS_TONE[r.status] ?? 'muted'} />
            </Row>
            <Text style={styles.muted}>
              Reason: <Text style={{ color: colors.text }}>{r.reason}</Text>
            </Text>
            <Text style={styles.muted}>By {usersById[r.reporterId]?.name ?? 'Unknown'} · {new Date(r.createdAt).toLocaleDateString()}</Text>

            <View style={{ marginTop: 10, padding: 10, borderRadius: radius.sm, backgroundColor: colors.tanSoft }}>
              {target ? (
                <>
                  <Text style={[styles.label, { marginBottom: 2 }]}>
                    {target.rating}★ review of {usersById[target.proId]?.name ?? 'professional'}{target.anonymous ? ' (anonymous)' : ''}
                  </Text>
                  <Text style={styles.body}>{target.text || 'No text'}</Text>
                </>
              ) : (
                <Text style={styles.muted}>Content no longer exists.</Text>
              )}
            </View>

            {r.status === 'open' ? (
              <Row style={{ marginTop: 12 }} gap={8}>
                <Button small variant="outline" title="Dismiss" style={{ flex: 1 }} onPress={() => close(r, 'dismissed', 'No action taken — the content follows our guidelines.')} />
                <Button small variant="secondary" title="Resolve" style={{ flex: 1 }} onPress={() => close(r, 'resolved', 'The report was resolved.')} />
                {target && <Button small variant="danger" title="Remove" style={{ flex: 1 }} onPress={() => removeContent(r)} />}
              </Row>
            ) : (
              !!r.resolution && <Text style={[styles.muted, { marginTop: 8 }]}>{r.resolution}</Text>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
