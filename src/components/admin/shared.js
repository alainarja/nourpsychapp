import { Text, View } from 'react-native';
import { colors, radius } from '../../theme';
import { Row, styles } from '../ui';

export const ROLE_LABEL = { client: 'Client', pro: 'Professional', org: 'Organization', admin: 'Admin' };
export const ROLE_TONE = { client: 'primary', pro: 'tan', org: 'success', admin: 'muted' };

export const VERIFICATION_LABEL = {
  not_submitted: ['Not submitted', 'muted'],
  pending: ['Pending', 'primary'],
  approved: ['Approved', 'success'],
  rejected: ['Rejected', 'danger'],
};

export const DOC_LABEL = {
  license: 'Professional license',
  id: 'Government ID',
  degree: 'Degree certificate',
  medical_council: 'Medical council registration',
  insurance: 'Malpractice insurance',
};

// Simple horizontal bar row for dashboards (no chart library).
export function BarRow({ label, value, max, suffix = '', color = colors.primary }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={[styles.body, { fontSize: 14 }]}>{label}</Text>
        <Text style={[styles.muted, { fontWeight: '600' }]}>{value}{suffix}</Text>
      </Row>
      <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.tanSoft, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: radius.pill }} />
      </View>
    </View>
  );
}
