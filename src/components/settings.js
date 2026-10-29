import { Switch, Text, View } from 'react-native';
import { styles } from './ui';
import { colors } from '../theme';

export function ToggleRow({ title, subtitle, value, onChange, disabled }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.body, { fontWeight: '600' }]}>{title}</Text>
        {!!subtitle && <Text style={styles.muted}>{subtitle}</Text>}
      </View>
      <Switch
        value={!!value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        activeThumbColor={colors.white}
        accessibilityLabel={title}
      />
    </View>
  );
}

export const SettingsSection = ({ title, children }) => (
  <View style={{ marginTop: 20 }}>
    {!!title && <Text style={[styles.label, { color: colors.muted, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5 }]}>{title}</Text>}
    {children}
  </View>
);
