import { Ionicons } from '@expo/vector-icons';
import { Linking, Text, View } from 'react-native';
import { Button, Card, Header, MenuRow, Screen, styles } from '../components/ui';
import { colors } from '../theme';

// Lebanon-first list (Arabic/English audience); extend per country once we know the user's region.
const LINES = [
  { name: 'Emergency services', detail: 'Immediate danger to life', phone: '112' },
  { name: 'Embrace Lifeline (Lebanon)', detail: 'Emotional support & suicide prevention, 24/7', phone: '1564' },
  { name: 'International directory', detail: 'Find a helpline in your country', url: 'https://findahelpline.com' },
];

export default function Crisis() {
  return (
    <Screen>
      <Header title="Get help now" subtitle="You are not alone. Reach out to someone right now." back />
      <Card style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Ionicons name="alert-circle" size={22} color={colors.danger} />
          <Text style={[styles.body, { flex: 1 }]}>
            If you are thinking about harming yourself or someone else, or you are in immediate danger, call emergency services now.
            Shift & Thrive is not an emergency service.
          </Text>
        </View>
        <Button title="Call emergency services (112)" icon="call" variant="primary" style={{ marginTop: 14, backgroundColor: colors.danger }} onPress={() => Linking.openURL('tel:112')} />
      </Card>

      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        {LINES.map((l) => (
          <MenuRow
            key={l.name}
            icon={l.phone ? 'call-outline' : 'globe-outline'}
            title={l.name}
            subtitle={`${l.detail}${l.phone ? ` · ${l.phone}` : ''}`}
            onPress={() => Linking.openURL(l.phone ? `tel:${l.phone}` : l.url)}
          />
        ))}
      </Card>

      <Text style={[styles.h3, { marginTop: 20, marginBottom: 8 }]}>While you wait</Text>
      <Card>
        {[
          'Breathe in for 4 seconds, hold for 4, out for 6. Repeat five times.',
          'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.',
          'Move to a safe place and, if you can, stay with someone you trust.',
        ].map((tip) => (
          <View key={tip} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <Ionicons name="leaf-outline" size={16} color={colors.tan} style={{ marginTop: 3 }} />
            <Text style={[styles.body, { flex: 1 }]}>{tip}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
