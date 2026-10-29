import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { avatarPalette, colors, fonts, radius, shadow } from '../theme';

// ---------- Layout ----------

export function Screen({ children, scroll = true, padded = true, edges = ['top'], contentStyle, footer }) {
  const inner = padded ? [styles.padded, contentStyle] : contentStyle;
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, back = false, right, large = true }) {
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {back && (
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={{ marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Pressable>
          )}
          <Text style={[large ? styles.h1 : styles.h2, { flexShrink: 1 }]} numberOfLines={2}>{title}</Text>
        </View>
        {right}
      </View>
      {!!subtitle && <Text style={[styles.subtitle, back && { marginLeft: 32 }]}>{subtitle}</Text>}
    </View>
  );
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.h3}>{children}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export const Row = ({ children, style, gap = 8 }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;

export const Card = ({ children, style, onPress }) =>
  onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>{children}</Pressable>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );

// ---------- Text ----------

export const T = {
  H1: ({ style, ...p }) => <Text style={[styles.h1, style]} {...p} />,
  H2: ({ style, ...p }) => <Text style={[styles.h2, style]} {...p} />,
  H3: ({ style, ...p }) => <Text style={[styles.h3, style]} {...p} />,
  Body: ({ style, ...p }) => <Text style={[styles.body, style]} {...p} />,
  Muted: ({ style, ...p }) => <Text style={[styles.muted, style]} {...p} />,
  Label: ({ style, ...p }) => <Text style={[styles.label, style]} {...p} />,
};

// ---------- Controls ----------

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, small }) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, small && styles.buttonSmall, v.box, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.text.color} style={{ marginRight: 8 }} />}
          <Text style={[styles.buttonText, small && { fontSize: 14 }, v.text]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { box: { backgroundColor: colors.primary }, text: { color: colors.white } },
  tan: { box: { backgroundColor: colors.tan }, text: { color: colors.white } },
  secondary: { box: { backgroundColor: colors.tanSoft }, text: { color: colors.primary } },
  outline: { box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, text: { color: colors.primary } },
  danger: { box: { backgroundColor: colors.dangerSoft }, text: { color: colors.danger } },
  ghost: { box: { backgroundColor: 'transparent' }, text: { color: colors.primary } },
};

export function Input({ icon, label, style, multiline, secure, ...props }) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.input, multiline && { alignItems: 'flex-start', paddingVertical: 10 }, style]}>
        {icon && <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }} />}
        <TextInput
          placeholderTextColor={colors.faint}
          style={[styles.inputText, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
          multiline={multiline}
          secureTextEntry={hidden}
          autoCorrect={!secure}
          {...props}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function Chip({ label, active, onPress, small, icon }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.chip, small && styles.chipSmall, active && styles.chipActive]}>
      {icon && <Ionicons name={icon} size={14} color={active ? colors.white : colors.primary} style={{ marginRight: 4 }} />}
      <Text style={[styles.chipText, small && { fontSize: 12 }, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ options, value, onChange, multi, scroll, small }) {
  const isActive = (o) => (multi ? value.includes(o.value) : value === o.value);
  const toggle = (o) => {
    if (!onChange) return;
    if (!multi) return onChange(o.value);
    onChange(isActive(o) ? value.filter((v) => v !== o.value) : [...value, o.value]);
  };
  const chips = options.map((o) => <Chip key={o.value} label={o.label} small={small} active={isActive(o)} onPress={onChange ? () => toggle(o) : undefined} />);
  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>{chips}</ScrollView>
  ) : (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{chips}</View>
  );
}

export function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Display ----------

export function Avatar({ name = '?', size = 48, color }) {
  const initials = name.replace(/^Dr\.?\s+/i, '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const bg = color ?? avatarPalette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function Rating({ value, count, size = 13 }) {
  if (!value) return <Text style={[styles.muted, { fontSize: size }]}>New</Text>;
  return (
    <Row gap={4}>
      <Ionicons name="star" size={size} color={colors.star} />
      <Text style={{ fontSize: size, fontWeight: '600', color: colors.text }}>{value.toFixed(1)}</Text>
      {count != null && <Text style={{ fontSize: size, color: colors.muted }}>({count})</Text>}
    </Row>
  );
}

export function IconTile({ icon, title, subtitle, onPress, color = colors.primary }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.tileSub} numberOfLines={2}>{subtitle}</Text>}
    </Pressable>
  );
}

export function MenuRow({ icon, title, subtitle, onPress, right, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.8 }]}>
      <View style={[styles.menuIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.faint} />}
    </Pressable>
  );
}

export function StatCard({ value, label, style }) {
  return (
    <View style={[styles.stat, style]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'primary' }) {
  const tones = {
    primary: [colors.primarySoft, colors.primary],
    success: [colors.successSoft, colors.success],
    danger: [colors.dangerSoft, colors.danger],
    tan: [colors.tanSoft, colors.tan],
    muted: ['#EEF0F2', colors.muted],
  };
  const [bg, fg] = tones[tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'leaf-outline', title, message, action, onAction }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={colors.tan} />
      <Text style={[styles.h3, { marginTop: 12, textAlign: 'center' }]}>{title}</Text>
      {!!message && <Text style={[styles.muted, { textAlign: 'center', marginTop: 4 }]}>{message}</Text>}
      {!!action && <Button title={action} onPress={onAction} small style={{ marginTop: 16, paddingHorizontal: 20 }} />}
    </View>
  );
}

// Product cover art (no images offline — a styled "book" cover instead)
export function ProductCover({ title, category, height = 120 }) {
  const icon = { guides: 'book-outline', cards: 'albums-outline', workshops: 'videocam-outline' }[category] ?? 'document-text-outline';
  const bg = { guides: '#DCE6F0', cards: '#F1E4D3', workshops: '#E4EDE6' }[category] ?? colors.primarySoft;
  return (
    <View style={{ height, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 10 }}>
      <View style={{ width: '62%', height: '86%', backgroundColor: colors.surface, borderRadius: 6, padding: 8, alignItems: 'center', justifyContent: 'center', ...shadow }}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <Text numberOfLines={3} style={{ fontFamily: fonts.serif, fontSize: 10, color: colors.primary, textAlign: 'center', marginTop: 4 }}>{title}</Text>
      </View>
    </View>
  );
}

export function Logo({ size = 40, tagline = true }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Row gap={0} style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: size, color: colors.primary, fontWeight: '700', lineHeight: size * 1.05, textAlign: 'center' }}>
          {'Shift\n&Thrive'}
        </Text>
        <Ionicons name="leaf" size={size * 0.6} color={colors.tan} style={{ marginLeft: -4, marginTop: -4 }} />
      </Row>
      {tagline && <Text style={{ color: colors.muted, fontSize: size * 0.3, marginTop: 4 }}>Shift your path, thrive in life</Text>}
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: 12 }, style]} />;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: 20, paddingTop: 8 },
  header: { marginBottom: 16, marginTop: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 28, color: colors.primary, fontWeight: '700' },
  h2: { fontFamily: fonts.serif, fontSize: 22, color: colors.primary, fontWeight: '700' },
  h3: { fontSize: 17, color: colors.text, fontWeight: '700' },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  label: { fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow },
  button: { height: 50, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonSmall: { height: 38, borderRadius: radius.sm, paddingHorizontal: 12 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  input: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 50 },
  inputText: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10, outlineStyle: 'none' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.tanSoft },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 5 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  segmented: { flexDirection: 'row', backgroundColor: colors.tanSoft, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontWeight: '600', color: colors.primary, fontSize: 14 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, minHeight: 128, ...shadow },
  tileIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileTitle: { fontWeight: '700', color: colors.primary, fontSize: 14, textAlign: 'center' },
  tileSub: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  menuSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
  empty: { alignItems: 'center', padding: 32 },
});
