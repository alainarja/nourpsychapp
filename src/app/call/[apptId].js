import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Badge, Button, Card, EmptyState, Header, Row, Screen, styles } from '../../components/ui';
import { onboardingRoute, useAuth } from '../../context/AuthContext';
import { apptDateTime } from '../../db/actions';
import { useCollection } from '../../db/db';
import { colors, radius } from '../../theme';
import { comingSoon, confirm } from '../../utils/alert';
import { longDate, timeLabel } from '../../utils/date';
import { Redirect } from 'expo-router';

// Telehealth mock — no camera or media. A video provider (Daily/Twilio/Agora) replaces this with the backend.
const DARK = '#0F1E2E';

function Control({ icon, label, onPress, active = true, danger }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 4 }} accessibilityLabel={label}>
      <View style={{
        width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
        backgroundColor: danger ? colors.danger : active ? 'rgba(255,255,255,0.14)' : colors.white,
      }}>
        <Ionicons name={icon} size={24} color={danger ? colors.white : active ? colors.white : DARK} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{label}</Text>
    </Pressable>
  );
}

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Call() {
  const { apptId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: appointments, loading } = useCollection('appointments');
  const { data: users } = useCollection('users');
  const [stage, setStage] = useState('lobby'); // lobby | call
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const appt = appointments.find((a) => a.id === apptId);

  useEffect(() => {
    if (stage !== 'call') return;
    const c = setTimeout(() => setConnected(true), 1500);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { clearTimeout(c); clearInterval(t); };
  }, [stage]);

  const gate = onboardingRoute(user);
  if (gate) return <Redirect href={gate} />;

  const isParticipant = appt && (appt.clientId === user.id || appt.proId === user.id);
  if (!appt || !isParticipant) {
    return (
      <Screen>
        <Header title="Video session" back />
        {!loading && <EmptyState icon="videocam-off-outline" title="Session not found" message="This call link isn't available to you." />}
      </Screen>
    );
  }

  const otherId = appt.clientId === user.id ? appt.proId : appt.clientId;
  const other = users.find((u) => u.id === otherId);
  const isClient = user.role === 'client';

  const leave = () =>
    confirm('Leave session?', 'You can rejoin while the session is still running.', () => {
      const started = apptDateTime(appt) <= new Date();
      if (isClient && (appt.status === 'completed' || started) && !appt.reviewed) router.replace(`/client/review/${appt.id}`);
      else router.back();
    }, 'Leave', true);

  if (stage === 'lobby') {
    const checks = [
      { label: 'Camera', ok: cam, note: cam ? 'Ready' : 'Off' },
      { label: 'Microphone', ok: mic, note: mic ? 'Ready' : 'Muted' },
      { label: 'Connection', ok: true, note: 'Good' },
      { label: 'Private space', ok: true, note: 'Find a quiet place where you can talk freely' },
    ];
    return (
      <Screen>
        <Header title="Waiting room" subtitle="Check your setup before you join." back />
        <View style={{ height: 240, borderRadius: radius.lg, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center' }}>
          {cam ? <Avatar name={user.name} size={96} /> : <Ionicons name="videocam-off" size={40} color="rgba(255,255,255,0.6)" />}
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 12 }}>{cam ? 'Camera preview' : 'Camera is off'}</Text>
          <Row gap={16} style={{ position: 'absolute', bottom: 12 }}>
            <Pressable onPress={() => setMic((m) => !m)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: mic ? 'rgba(255,255,255,0.18)' : colors.white, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={mic ? 'mic' : 'mic-off'} size={20} color={mic ? colors.white : DARK} />
            </Pressable>
            <Pressable onPress={() => setCam((c) => !c)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: cam ? 'rgba(255,255,255,0.18)' : colors.white, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={cam ? 'videocam' : 'videocam-off'} size={20} color={cam ? colors.white : DARK} />
            </Pressable>
          </Row>
        </View>

        <Card style={{ marginTop: 16 }}>
          <Row gap={12}>
            <Avatar name={other?.name ?? '?'} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>{other?.name}</Text>
              <Text style={styles.muted}>{longDate(appt.date)} · {timeLabel(appt.time)}</Text>
            </View>
            <Badge label={appt.type ?? 'Session'} />
          </Row>
        </Card>

        <Card style={{ marginTop: 12 }}>
          {checks.map((c) => (
            <Row key={c.label} style={{ paddingVertical: 6, alignItems: 'flex-start' }}>
              <Ionicons name={c.ok ? 'checkmark-circle' : 'alert-circle'} size={18} color={c.ok ? colors.success : colors.tan} />
              <Text style={[styles.body, { fontWeight: '600', width: 110 }]}>{c.label}</Text>
              <Text style={[styles.muted, { flex: 1 }]}>{c.note}</Text>
            </Row>
          ))}
        </Card>

        <Text style={[styles.muted, { marginTop: 12, textAlign: 'center' }]}>
          Offline preview — real video arrives with the backend. Sessions will be encrypted and never recorded without consent.
        </Text>
        <Button title="Join session" icon="videocam" style={{ marginTop: 16 }} onPress={() => setStage('call')} />
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK }} edges={['top', 'bottom']}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
        <View>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>{other?.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{connected ? mmss(seconds) : 'Connecting…'}</Text>
        </View>
        <Row gap={6}>
          <Ionicons name="cellular" size={16} color={connected ? '#7FD1A5' : 'rgba(255,255,255,0.5)'} />
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{connected ? 'Good' : '…'}</Text>
          <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
        </Row>
      </Row>

      <View style={{ flex: 1, margin: 12, borderRadius: radius.lg, backgroundColor: '#1B3049', alignItems: 'center', justifyContent: 'center' }}>
        <Avatar name={other?.name ?? '?'} size={120} />
        <Text style={{ color: colors.white, marginTop: 14, fontSize: 16, fontWeight: '600' }}>{other?.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{connected ? 'Connected' : 'Connecting…'}</Text>

        <View style={{ position: 'absolute', right: 12, bottom: 12, width: 100, height: 140, borderRadius: radius.md, backgroundColor: '#2A4462', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
          {cam ? <Avatar name={user.name} size={52} /> : <Ionicons name="videocam-off" size={26} color="rgba(255,255,255,0.6)" />}
          {!mic && <Ionicons name="mic-off" size={14} color={colors.white} style={{ position: 'absolute', top: 6, left: 6 }} />}
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, position: 'absolute', bottom: 6 }}>You</Text>
        </View>
      </View>

      <Row style={{ justifyContent: 'space-evenly', paddingVertical: 16 }}>
        <Control icon={mic ? 'mic' : 'mic-off'} label={mic ? 'Mute' : 'Unmute'} active={mic} onPress={() => setMic((m) => !m)} />
        <Control icon={cam ? 'videocam' : 'videocam-off'} label="Camera" active={cam} onPress={() => setCam((c) => !c)} />
        <Control icon="camera-reverse-outline" label="Flip" onPress={() => comingSoon('Switching cameras')} />
        <Control icon="chatbubble-ellipses-outline" label="Chat" onPress={() => router.push(`/messages/${otherId}`)} />
        <Control icon="call" label="End" danger onPress={leave} />
      </Row>
    </SafeAreaView>
  );
}
