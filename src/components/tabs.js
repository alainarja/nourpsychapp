import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const BAR_HEIGHT = 66;

// Tab bar options; pads for the system navigation bar so icons never sit under Android's buttons.
export function useTabScreenOptions() {
  const { bottom } = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelPosition: 'below-icon',
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      height: BAR_HEIGHT + bottom,
      paddingTop: 6,
      paddingBottom: bottom + 6,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    sceneStyle: { backgroundColor: colors.bg },
  };
}

export const tabIcon = (name) => {
  const TabIcon = ({ color, focused }) => <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />;
  return TabIcon;
};
