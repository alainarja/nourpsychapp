import { Text, TextInput, View } from 'react-native';
import { DEMO_CODE } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';

// Large, letter-spaced 6-digit code field with the offline-demo hint underneath.
export function CodeInput({ value, onChange, onSubmit, autoFocus = true }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 6))}
        onSubmitEditing={onSubmit}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus={autoFocus}
        placeholder="••••••"
        placeholderTextColor={colors.faint}
        accessibilityLabel="Verification code"
        style={{
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
          height: 64, fontSize: 30, letterSpacing: 14, textAlign: 'center', color: colors.primary, fontWeight: '700', outlineStyle: 'none',
        }}
      />
      <DemoCodeHint />
    </View>
  );
}

export function DemoCodeHint() {
  const { t } = useI18n();
  return (
    <Text style={{ color: colors.tan, fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>
      {t('common.demoCode', undefined, { code: DEMO_CODE })}
    </Text>
  );
}
