// Psychiatrist-only panels for the client record: medications and e-prescriptions (simulated).
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { notifyUser } from '../../db/actions';
import { db, useCollection } from '../../db/db';
import { colors } from '../../theme';
import { confirm, notify } from '../../utils/alert';
import { longDate, todayKey } from '../../utils/date';
import { Badge, Button, Card, ChipGroup, EmptyState, Input, Row, Segmented, styles } from '../ui';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY_MED = { name: '', dose: '', frequency: '', startDate: '', instructions: '' };

export function MedicationsPanel({ proId, clientId }) {
  const { data } = useCollection('medications');
  const [filter, setFilter] = useState('active');
  const [editing, setEditing] = useState(null); // null | 'new' | med id
  const [form, setForm] = useState(EMPTY_MED);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const meds = useMemo(
    () => data.filter((m) => m.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data, clientId],
  );
  const shown = meds.filter((m) => m.status === filter);

  const open = (med) => {
    setError('');
    setEditing(med ? med.id : 'new');
    setForm(med ? { name: med.name, dose: med.dose, frequency: med.frequency, startDate: med.startDate ?? '', instructions: med.instructions ?? '' } : { ...EMPTY_MED, startDate: todayKey() });
  };

  const save = async () => {
    if (!form.name.trim() || !form.dose.trim() || !form.frequency.trim()) return setError('Name, dose and frequency are required.');
    if (form.startDate && !DATE_RE.test(form.startDate)) return setError('Start date must be YYYY-MM-DD.');
    const fields = { name: form.name.trim(), dose: form.dose.trim(), frequency: form.frequency.trim(), startDate: form.startDate, instructions: form.instructions.trim() };
    if (editing === 'new') {
      await db.insert('medications', { ...fields, clientId, proId, status: 'active' });
      await notifyUser(clientId, { title: 'New medication added', body: `${fields.name} ${fields.dose} · ${fields.frequency}`, type: 'system', link: '/client/medications' });
    } else {
      await db.update('medications', editing, fields);
      await notifyUser(clientId, { title: 'Medication updated', body: `${fields.name} ${fields.dose} · ${fields.frequency}`, type: 'system', link: '/client/medications' });
    }
    setEditing(null);
  };

  const stop = (med) => confirm('Stop medication?', `${med.name} ${med.dose} will be marked as stopped today.`, async () => {
    await db.update('medications', med.id, { status: 'stopped', endDate: todayKey() });
    await notifyUser(clientId, { title: 'Medication stopped', body: `${med.name} was stopped by your psychiatrist.`, type: 'system', link: '/client/medications' });
  }, 'Stop', true);

  return (
    <>
      <Row style={{ marginBottom: 12 }}>
        <Segmented
          style={{ flex: 1 }}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: `Active (${meds.filter((m) => m.status === 'active').length})` },
            { value: 'stopped', label: `Stopped (${meds.filter((m) => m.status === 'stopped').length})` },
          ]}
        />
      </Row>

      {editing ? (
        <Card style={{ marginBottom: 14 }}>
          <Text style={[styles.h3, { marginBottom: 10 }]}>{editing === 'new' ? 'Add medication' : 'Edit medication'}</Text>
          <Input label="Medication" placeholder="e.g. Sertraline" value={form.name} onChangeText={set('name')} />
          <Row gap={10}>
            <View style={{ flex: 1 }}><Input label="Dose" placeholder="50 mg" value={form.dose} onChangeText={set('dose')} /></View>
            <View style={{ flex: 1 }}><Input label="Start date" placeholder="YYYY-MM-DD" value={form.startDate} onChangeText={set('startDate')} /></View>
          </Row>
          <Input label="Frequency" placeholder="Once daily (morning)" value={form.frequency} onChangeText={set('frequency')} />
          <Input label="Instructions" placeholder="Take with food…" value={form.instructions} onChangeText={set('instructions')} multiline />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Row>
            <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setEditing(null)} />
            <Button small title="Save" icon="save-outline" style={{ flex: 1 }} onPress={save} />
          </Row>
        </Card>
      ) : (
        <Button title="Add medication" icon="add" variant="secondary" style={{ marginBottom: 14 }} onPress={() => open(null)} />
      )}

      {shown.length === 0 ? (
        <EmptyState icon="medkit-outline" title={filter === 'active' ? 'No active medications' : 'No stopped medications'} />
      ) : shown.map((m) => (
        <Card key={m.id} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '700' }]}>{m.name} · {m.dose}</Text>
              <Text style={styles.muted}>{m.frequency}</Text>
              <Text style={styles.muted}>
                {m.startDate ? `Since ${longDate(m.startDate)}` : 'No start date'}{m.endDate ? ` · stopped ${longDate(m.endDate)}` : ''}
              </Text>
              {!!m.instructions && <Text style={[styles.muted, { marginTop: 4, fontStyle: 'italic' }]}>{m.instructions}</Text>}
            </View>
            <Badge label={m.status} tone={m.status === 'active' ? 'success' : 'muted'} />
          </Row>
          {m.status === 'active' && m.proId === proId && (
            <Row style={{ marginTop: 12 }}>
              <Button small variant="outline" title="Edit" icon="create-outline" style={{ flex: 1 }} onPress={() => open(m)} />
              <Button small variant="danger" title="Stop" icon="stop-circle-outline" style={{ flex: 1 }} onPress={() => stop(m)} />
            </Row>
          )}
        </Card>
      ))}
    </>
  );
}

const EMPTY_RX = { medication: '', dose: '', quantity: '30', refills: '0', pharmacy: '' };

export function PrescriptionsPanel({ proId, clientId, clientName }) {
  const { data: rxs } = useCollection('prescriptions');
  const { data: meds } = useCollection('medications');
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState(EMPTY_RX);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const list = useMemo(
    () => rxs.filter((r) => r.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rxs, clientId],
  );
  const activeMeds = meds.filter((m) => m.clientId === clientId && m.status === 'active');

  const pickMed = (id) => {
    const m = activeMeds.find((x) => x.id === id);
    if (m) setForm((f) => ({ ...f, medication: m.name, dose: m.dose }));
  };

  const saveDraft = async () => {
    const quantity = Number(form.quantity);
    const refills = Number(form.refills);
    if (!form.medication.trim() || !form.dose.trim()) return setError('Medication and dose are required.');
    if (!Number.isInteger(quantity) || quantity <= 0) return setError('Quantity must be a whole number above 0.');
    if (!Number.isInteger(refills) || refills < 0 || refills > 12) return setError('Refills must be between 0 and 12.');
    if (!form.pharmacy.trim()) return setError('Choose a pharmacy.');
    await db.insert('prescriptions', {
      clientId, proId, medication: form.medication.trim(), dose: form.dose.trim(), quantity, refills, pharmacy: form.pharmacy.trim(), status: 'draft',
    });
    setForm(EMPTY_RX);
    setComposing(false);
    setError('');
  };

  const send = (rx) => confirm(
    'Sign & send prescription?',
    `${rx.medication} ${rx.dose} × ${rx.quantity} (${rx.refills} refills) to ${rx.pharmacy} for ${clientName}.`,
    async () => {
      await db.update('prescriptions', rx.id, { status: 'sent', sentAt: new Date().toISOString() });
      await notifyUser(clientId, { title: 'Prescription sent', body: `${rx.medication} ${rx.dose} was sent to ${rx.pharmacy}.`, type: 'system', link: '/client/medications' });
      notify('Prescription sent', 'Simulated — no pharmacy was contacted.');
    },
    'Sign & send',
  );

  return (
    <>
      <Card style={{ backgroundColor: colors.tanSoft, borderColor: colors.tanSoft, marginBottom: 14 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={18} color={colors.tan} />
          <Text style={[styles.muted, { flex: 1, color: colors.text }]}>
            E-prescribing is simulated. Real e-Rx requires a licensed integration and local regulatory approval.
          </Text>
        </Row>
      </Card>

      {composing ? (
        <Card style={{ marginBottom: 14 }}>
          <Text style={[styles.h3, { marginBottom: 10 }]}>New e-prescription</Text>
          {activeMeds.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>From active medications</Text>
              <ChipGroup small scroll options={activeMeds.map((m) => ({ value: m.id, label: `${m.name} ${m.dose}` }))} value={null} onChange={pickMed} />
            </View>
          )}
          <Input label="Medication" placeholder="Medication name" value={form.medication} onChangeText={set('medication')} />
          <Input label="Dose" placeholder="50 mg" value={form.dose} onChangeText={set('dose')} />
          <Row gap={10}>
            <View style={{ flex: 1 }}><Input label="Quantity" keyboardType="number-pad" value={form.quantity} onChangeText={set('quantity')} /></View>
            <View style={{ flex: 1 }}><Input label="Refills" keyboardType="number-pad" value={form.refills} onChangeText={set('refills')} /></View>
          </Row>
          <Input label="Pharmacy" placeholder="e.g. City Pharmacy" value={form.pharmacy} onChangeText={set('pharmacy')} />
          {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
          <Row>
            <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => { setComposing(false); setError(''); }} />
            <Button small title="Save draft" icon="document-outline" style={{ flex: 1 }} onPress={saveDraft} />
          </Row>
        </Card>
      ) : (
        <Button title="New e-prescription" icon="add" variant="secondary" style={{ marginBottom: 14 }} onPress={() => setComposing(true)} />
      )}

      {list.length === 0 ? <EmptyState icon="receipt-outline" title="No prescriptions yet" /> : list.map((rx) => (
        <Card key={rx.id} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '700' }]}>{rx.medication} · {rx.dose}</Text>
              <Text style={styles.muted}>Qty {rx.quantity} · {rx.refills} refills · {rx.pharmacy}</Text>
              <Text style={styles.muted}>
                {rx.status === 'sent' ? `Sent ${new Date(rx.sentAt ?? rx.createdAt).toLocaleDateString()}` : `Drafted ${new Date(rx.createdAt).toLocaleDateString()}`}
              </Text>
            </View>
            <Badge label={rx.status} tone={rx.status === 'sent' ? 'success' : 'tan'} />
          </Row>
          {rx.status === 'draft' && rx.proId === proId && (
            <Row style={{ marginTop: 12 }}>
              <Pressable hitSlop={8} onPress={() => confirm('Delete draft?', '', () => db.remove('prescriptions', rx.id), 'Delete', true)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
              <Button small title="Sign & send" icon="send-outline" style={{ flex: 1 }} onPress={() => send(rx)} />
            </Row>
          )}
        </Card>
      ))}
    </>
  );
}

// Allergies / conditions shared context for the client record (one row per pro + client).
export function ClinicalProfileCard({ proId, clientId }) {
  const { data } = useCollection('clinicalProfiles');
  const profile = data.find((p) => p.proId === proId && p.clientId === clientId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ allergies: '', conditions: '' });

  const start = () => {
    setForm({ allergies: profile?.allergies ?? '', conditions: profile?.conditions ?? '' });
    setEditing(true);
  };

  const save = async () => {
    const fields = { allergies: form.allergies.trim(), conditions: form.conditions.trim() };
    if (profile) await db.update('clinicalProfiles', profile.id, fields);
    else await db.insert('clinicalProfiles', { proId, clientId, ...fields });
    setEditing(false);
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={styles.label}>Allergies & conditions</Text>
        {!editing && (
          <Pressable onPress={start} hitSlop={8}>
            <Text style={styles.link}>{profile ? 'Edit' : 'Add'}</Text>
          </Pressable>
        )}
      </Row>
      {editing ? (
        <>
          <Input placeholder="Allergies (e.g. penicillin) or 'None known'" value={form.allergies} onChangeText={(v) => setForm((f) => ({ ...f, allergies: v }))} />
          <Input placeholder="Relevant conditions / diagnoses" value={form.conditions} onChangeText={(v) => setForm((f) => ({ ...f, conditions: v }))} multiline />
          <Row>
            <Button small variant="outline" title="Cancel" style={{ flex: 1 }} onPress={() => setEditing(false)} />
            <Button small title="Save" style={{ flex: 1 }} onPress={save} />
          </Row>
        </>
      ) : (
        <>
          <Text style={styles.body}><Text style={{ fontWeight: '600' }}>Allergies: </Text>{profile?.allergies || 'Not recorded'}</Text>
          <Text style={[styles.body, { marginTop: 4 }]}><Text style={{ fontWeight: '600' }}>Conditions: </Text>{profile?.conditions || 'Not recorded'}</Text>
        </>
      )}
    </Card>
  );
}
