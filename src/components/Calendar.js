import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { dateKey, monthMatrix, MONTHS, parseKey, WEEKDAYS } from '../utils/date';

// Month calendar. `marked` is a Set of date keys that get a dot; `isDisabled(date)` greys days out.
export function Calendar({ selected, onSelect, marked, isDisabled }) {
  const initial = selected ? parseKey(selected) : new Date();
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const today = dateKey();

  const shift = (n) => setCursor(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  return (
    <View>
      <View style={s.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={10}><Ionicons name="chevron-back" size={20} color={colors.primary} /></Pressable>
        <Text style={s.month}>{MONTHS[cursor.m]} {cursor.y}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></Pressable>
      </View>
      <View style={s.week}>
        {WEEKDAYS.map((w) => <Text key={w} style={s.weekday}>{w}</Text>)}
      </View>
      {monthMatrix(cursor.y, cursor.m).map((week, i) => (
        <View key={i} style={s.week}>
          {week.map((d, j) => {
            if (!d) return <View key={j} style={s.cell} />;
            const key = dateKey(d);
            const disabled = isDisabled?.(d);
            const active = key === selected;
            return (
              <Pressable key={j} style={s.cell} disabled={disabled} onPress={() => onSelect?.(key)}>
                <View style={[s.day, active && s.dayActive, !active && key === today && s.dayToday]}>
                  <Text style={[s.dayText, disabled && { color: colors.faint }, active && { color: colors.white, fontWeight: '700' }]}>{d.getDate()}</Text>
                </View>
                {marked?.has(key) && <View style={[s.dot, active && { backgroundColor: colors.tan }]} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function TimeSlots({ slots, value, onChange, taken = [] }) {
  if (!slots.length) return <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 12 }}>No available times on this day.</Text>;
  return (
    <View style={s.slots}>
      {slots.map((t) => {
        const isTaken = taken.includes(t.value);
        const active = value === t.value;
        return (
          <Pressable key={t.value} disabled={isTaken} onPress={() => onChange(t.value)} style={[s.slot, active && s.slotActive, isTaken && { opacity: 0.35 }]}>
            <Text style={[s.slotText, active && { color: colors.white }, isTaken && { textDecorationLine: 'line-through' }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  month: { fontSize: 16, fontWeight: '700', color: colors.primary },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.muted, marginBottom: 6 },
  cell: { flex: 1, alignItems: 'center', height: 42 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1, borderColor: colors.tan },
  dayText: { fontSize: 14, color: colors.text },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 1 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '31%', paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
