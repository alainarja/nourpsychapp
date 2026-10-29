import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClinicalProfileCard, MedicationsPanel, PrescriptionsPanel } from '../../../components/pro/MedicationPanels';
import { useProData } from '../../../components/pro/useProData';
import { Avatar, Badge, Button, Card, ChipGroup, EmptyState, Header, Input, Row, Screen, Segmented, StatCard, styles } from '../../../components/ui';
import { ASSESSMENTS } from '../../../data/assessments';
import { NOTE_TEMPLATES } from '../../../data/noteTemplates';
import { apptDateTime, cancelAppointment, completeAppointment, sortByDateTime } from '../../../db/actions';
import { db, useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { confirm } from '../../../utils/alert';
import { longDate, shortDate, timeLabel } from '../../../utils/date';

const STATUS_TONE = { booked: 'primary', completed: 'success', cancelled: 'muted' };

export default function ClientRecord() {
  const { id } = useLocalSearchParams();
  const { me, user, usersById, myAppts } = useProData();
  const { data: notes } = useCollection('notes');
  const { data: assessments } = useCollection('assessments');
  const [tab, setTab] = useState('sessions');
  const [draft, setDraft] = useState('');
  const [template, setTemplate] = useState(null);

  const client = usersById[id];
  const appts = useMemo(() => sortByDateTime(myAppts.filter((a) => a.clientId === id), -1), [myAppts, id]);
  const myNotes = useMemo(
    () => notes.filter((n) => n.proId === me && n.clientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, me, id],
  );
  const results = useMemo(
    () => assessments.filter((a) => a.userId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [assessments, id],
  );

  if (!client) return <Screen><Header title="Client" back /><EmptyState title="Client not found" /></Screen>;

  const isPsychiatrist = user?.proType === 'psychiatrist';
  const now = new Date();
  const completed = appts.filter((a) => a.status === 'completed').length;
  const next = [...appts].reverse().find((a) => a.status === 'booked' && apptDateTime(a) > now);

  const pickTemplate = (t) => {
    setTemplate(t);
    const tpl = NOTE_TEMPLATES.find((x) => x.id === t);
    if (tpl && !draft.trim()) setDraft(tpl.skeleton);
  };

  const saveNote = async () => {
    if (!draft.trim()) return;
    await db.insert('notes', { proId: me, clientId: id, text: draft.trim(), template });
    setDraft('');
    setTemplate(null);
  };

  return (
    <Screen>
      <Header
        title="Client record"
        back
        right={<Button small variant="secondary" icon="chatbubble-ellipses-outline" title="Message" onPress={() => router.push(`/messages/${id}`)} />}
      />
      <Row gap={14} style={{ marginBottom: 14 }}>
        <Avatar name={client.name} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{client.name}</Text>
          {!!client.email && <Text style={styles.muted}>{client.email}</Text>}
          {!!client.concern && <Text style={styles.muted}>{[client.concern, client.approach].filter(Boolean).join(' · ')}</Text>}
        </View>
      </Row>
      <Row gap={10} style={{ marginBottom: 12 }}>
        <StatCard value={completed} label="Sessions completed" />
        <StatCard value={next ? shortDate(next.date) : '—'} label={next ? `Next · ${timeLabel(next.time)}` : 'No upcoming'} />
      </Row>
      <Row style={{ marginBottom: 12 }}>
        <Ionicons name="lock-closed" size={14} color={colors.tan} />
        <Badge label="Confidential — visible only to you" tone="tan" />
      </Row>

      <ClinicalProfileCard proId={me} clientId={id} />

      {isPsychiatrist ? (
        <View style={{ marginBottom: 14 }}>
          <ChipGroup
            scroll
            value={tab}
            onChange={setTab}
            options={[
              { value: 'sessions', label: 'Sessions' }, { value: 'notes', label: `Notes (${myNotes.length})` }, { value: 'assess', label: 'Assessments' },
              { value: 'meds', label: 'Medications' }, { value: 'rx', label: 'Prescriptions' },
            ]}
          />
        </View>
      ) : (
        <Segmented
          value={tab}
          onChange={setTab}
          style={{ marginBottom: 14 }}
          options={[{ value: 'sessions', label: 'Sessions' }, { value: 'notes', label: `Notes (${myNotes.length})` }, { value: 'assess', label: 'Assessments' }]}
        />
      )}

      {tab === 'meds' && isPsychiatrist && <MedicationsPanel proId={me} clientId={id} />}
      {tab === 'rx' && isPsychiatrist && <PrescriptionsPanel proId={me} clientId={id} clientName={client.name} />}

      {tab === 'sessions' && (appts.length === 0 ? <EmptyState title="No sessions" /> : appts.map((a) => {
        const isPast = apptDateTime(a) <= now;
        return (
          <Card key={a.id} style={{ marginBottom: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, { fontWeight: '700' }]}>{longDate(a.date)} · {timeLabel(a.time)}</Text>
                <Text style={styles.muted}>{a.type} · {a.mode === 'online' ? 'Online' : 'In-person'} · ${a.price}</Text>
              </View>
              <Badge label={a.status} tone={STATUS_TONE[a.status]} />
            </Row>
            {a.status === 'booked' && (
              <Row style={{ marginTop: 12 }}>
                {!isPast && a.mode === 'online' && <Button small title="Join" icon="videocam-outline" style={{ flex: 1 }} onPress={() => router.push(`/call/${a.id}`)} />}
                {isPast && <Button small title="Mark completed" icon="checkmark" style={{ flex: 1 }} onPress={() => completeAppointment(a.id)} />}
                <Button
                  small
                  variant="danger"
                  title="Cancel"
                  style={{ flex: 1 }}
                  onPress={() => confirm('Cancel session?', `${longDate(a.date)} at ${timeLabel(a.time)} with ${client.name}`, () => cancelAppointment(a.id, 'pro'), 'Cancel session', true)}
                />
              </Row>
            )}
          </Card>
        );
      }))}

      {tab === 'notes' && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <Text style={styles.label}>New session note</Text>
            <View style={{ marginBottom: 10 }}>
              <ChipGroup small options={NOTE_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} value={template} onChange={pickTemplate} />
            </View>
            <Input multiline placeholder="What happened in session, interventions, plan…" value={draft} onChangeText={setDraft} />
            <Button title="Save note" icon="save-outline" disabled={!draft.trim()} onPress={saveNote} />
          </Card>
          {myNotes.length === 0 ? <EmptyState icon="document-text-outline" title="No notes yet" /> : myNotes.map((n) => (
            <Card key={n.id} style={{ marginBottom: 10 }}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <Row gap={6}>
                  <Text style={styles.muted}>{new Date(n.createdAt).toLocaleDateString()}</Text>
                  {!!n.template && <Badge label={n.template.toUpperCase()} />}
                </Row>
                <Pressable hitSlop={8} onPress={() => confirm('Delete note?', 'This cannot be undone.', () => db.remove('notes', n.id), 'Delete', true)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </Row>
              <Text style={styles.body}>{n.text}</Text>
            </Card>
          ))}
        </>
      )}

      {tab === 'assess' && (
        <>
          <Row style={{ marginBottom: 14 }}>
            {Object.values(ASSESSMENTS).map((a) => (
              <Button key={a.id} small variant="secondary" title={`Administer ${a.name}`} style={{ flex: 1 }} onPress={() => router.push(`/assessment/${a.id}?clientId=${id}`)} />
            ))}
          </Row>
          {results.length === 0 ? <EmptyState icon="clipboard-outline" title="No assessments yet" message="Administer a PHQ-9 or GAD-7 in session to track progress." /> : results.map((r) => (
            <Card key={r.id} style={{ marginBottom: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Text style={[styles.body, { fontWeight: '700' }]}>{ASSESSMENTS[r.type]?.name ?? r.type} · {r.score}</Text>
                  <Text style={styles.muted}>{new Date(r.createdAt).toLocaleDateString()} · {r.administeredBy ? 'In session' : 'Self-reported'}</Text>
                </View>
                <Row gap={6}>
                  <Badge label={r.band} tone="primary" />
                  {r.risk && <Badge label="Risk" tone="danger" />}
                </Row>
              </Row>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
