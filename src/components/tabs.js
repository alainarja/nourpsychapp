import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.faint,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingTop: 6 },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  sceneStyle: { backgroundColor: colors.bg },
};

export const tabIcon = (name) => ({ color, focused }) => <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />;
