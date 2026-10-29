import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Stars } from '../../../components/Stars';
import { Avatar, Button, Card, Chip, EmptyState, Header, Input, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { submitReview } from '../../../db/actions';
import { useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { notify } from '../../../utils/alert';
import { longDate, timeLabel } from '../../../utils/date';

const TAGS = ['Good listener', 'Helpful tools', 'Felt safe', 'Punctual'];
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function Review() {
  const { apptId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: appointments, loading } = useCollection('appointments');
  const { data: users } = useCollection('users');
  const { data: reviews } = useCollection('reviews');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);

  const appt = appointments.find((a) => a.id === apptId && a.clientId === user.id);
  const pro = appt && users.find((u) => u.id === appt.proId);
  const existing = reviews.find((r) => r.appointmentId === apptId);

  if (!appt || !pro) {
    return (
      <Screen>
        <Header title="Leave a review" back />
        {!loading && <EmptyState title="Session not found" />}
      </Screen>
    );
  }

  const toggleTag = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = async () => {
    setBusy(true);
    try {
      const body = [tags.join(' · '), text.trim()].filter(Boolean).join('\n');
      await submitReview({ appointment: appt, clientId: user.id, rating, text: body, anonymous });
      notify('Thank you', 'Your review helps others find the right support.');
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={existing ? 'Your review' : 'Leave a review'} back />
      <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Avatar name={pro.name} size={64} />
        <Text style={[styles.h3, { marginTop: 10 }]}>{pro.name}</Text>
        <Text style={styles.muted}>{longDate(appt.date)} · {timeLabel(appt.time)}</Text>
      </Card>

      {existing ? (
        <Card style={{ marginTop: 16 }}>
          <Stars value={existing.rating} size={28} />
          {!!existing.text && <Text style={[styles.body, { marginTop: 12 }]}>{existing.text}</Text>}
          <Text style={[styles.muted, { marginTop: 8 }]}>{existing.anonymous ? 'Posted as "Verified client"' : `Posted as ${user.name}`}</Text>
          {!!existing.reply && (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft }}>
              <Text style={[styles.label, { color: colors.primary }]}>Reply from {pro.name}</Text>
              <Text style={styles.body}>{existing.reply}</Text>
            </View>
          )}
        </Card>
      ) : (
        <>
          <Text style={[styles.h3, { textAlign: 'center', marginTop: 22 }]}>How was your session?</Text>
          <View style={{ marginTop: 10 }}><Stars value={rating} onChange={setRating} /></View>
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 6, minHeight: 18 }]}>{LABELS[rating]}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginVertical: 16 }}>
            {TAGS.map((t) => <Chip key={t} label={t} active={tags.includes(t)} onPress={() => toggleTag(t)} />)}
          </View>

          <Input multiline placeholder="Share more about your experience (optional)" value={text} onChangeText={setText} maxLength={500} />

          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '600' }]}>Post anonymously</Text>
              <Text style={styles.muted}>Shown as "Verified client". Your therapist still sees it's from a session.</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ true: colors.primary, false: colors.border }} />
          </Row>
          <Text style={[styles.muted, { marginBottom: 16 }]}>Please don't include personal details about your treatment.</Text>

          <Button title="Submit review" disabled={!rating} loading={busy} onPress={submit} />
        </>
      )}
    </Screen>
  );
}
