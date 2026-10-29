import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { useProData } from '../../components/pro/useProData';
import { Button, Card, ChipGroup, Header, Input, Row, Screen, SectionTitle, styles } from '../../components/ui';
import { DRAFT_TEMPLATES, NOTE_TEMPLATES } from '../../data/noteTemplates';
import { db } from '../../db/db';
import { colors } from '../../theme';
import { notify } from '../../utils/alert';
import { longDate, timeLabel } from '../../utils/date';

export default function Assistant() {
  const { me, user, clients } = useProData();
  const [template, setTemplate] = useState('soap');
  const [picked, setClientId] = useState(null);
  const [fields, setFields] = useState({ observations: '', interventions: '', plan: '' });
  const [draft, setDraft] = useState('');
  const set = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  // Collections load async, so default to the first client once they arrive.
  const clientId = picked ?? clients[0]?.id ?? null;
  const client = clients.find((c) => c.id === clientId);

  const generate = () => {
    const tpl = DRAFT_TEMPLATES.find((t) => t.id === template);
    setDraft(tpl.build({
      ...fields,
      clientName: client?.user.name ?? 'Client',
      proName: user?.name ?? '',
      date: new Date().toLocaleDateString(),
      nextSession: client?.next ? `${longDate(client.next.date)} at ${timeLabel(client.next.time)}` : null,
    }));
  };

  const saveToNotes = async () => {
    if (!clientId) return notify('Choose a client first');
    const isNote = NOTE_TEMPLATES.some((t) => t.id === template);
    await db.insert('notes', { proId: me, clientId, text: draft.trim(), template: isNote ? template : null });
    notify('Saved to client notes');
    router.push(`/pro/client/${clientId}`);
  };

  return (
    <Screen>
      <Header title="AI Assistant" subtitle="Documentation and admin support." back />
      <Card style={{ backgroundColor: colors.tanSoft, borderColor: colors.tanSoft, marginBottom: 6 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={20} color={colors.tan} />
          <Text style={[styles.body, { flex: 1, fontSize: 13 }]}>Offline drafting — real AI arrives with the backend. Always review before saving.</Text>
        </Row>
      </Card>

      <SectionTitle>What do you need?</SectionTitle>
      <ChipGroup small options={DRAFT_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} value={template} onChange={setTemplate} />

      <SectionTitle>Client</SectionTitle>
      {clients.length ? (
        <ChipGroup small scroll options={clients.map((c) => ({ value: c.id, label: c.user.name }))} value={clientId} onChange={setClientId} />
      ) : (
        <Text style={styles.muted}>No clients yet.</Text>
      )}

      <SectionTitle>Key points</SectionTitle>
      <Input label="Observations / presenting concerns" multiline value={fields.observations} onChangeText={set('observations')} />
      <Input label="Interventions" multiline value={fields.interventions} onChangeText={set('interventions')} placeholder="e.g. Thought record, grounding, psychoeducation" />
      <Input label="Plan / next steps" multiline value={fields.plan} onChangeText={set('plan')} />
      <Button title="Generate draft" icon="sparkles-outline" onPress={generate} />

      {!!draft && (
        <>
          <SectionTitle>Draft</SectionTitle>
          <Input multiline value={draft} onChangeText={setDraft} style={{ minHeight: 220 }} />
          <Button title="Save to client notes" icon="save-outline" variant="secondary" onPress={saveToNotes} disabled={!clientId || !draft.trim()} />
        </>
      )}
    </Screen>
  );
}
