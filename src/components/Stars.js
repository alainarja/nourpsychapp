import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { colors } from '../theme';
import { Row } from './ui';

// Star rating; pass onChange to make it tappable.
export function Stars({ value, onChange, size = 36, center = true }) {
  return (
    <Row gap={size > 20 ? 6 : 2} style={center && { justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} disabled={!onChange} hitSlop={4} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
          <Ionicons name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={colors.star} />
        </Pressable>
      ))}
    </Row>
  );
}
