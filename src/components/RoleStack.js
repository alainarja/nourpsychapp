import { Redirect, Stack } from 'expo-router';
import { HOME_BY_ROLE, onboardingRoute, useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Stack navigator for one role's area; bounces anyone who isn't signed in, onboarded and of that role.
export function RoleStack({ role }) {
  const { user } = useAuth();
  const gate = onboardingRoute(user);
  if (gate) return <Redirect href={gate} />;
  if (user.role !== role) return <Redirect href={HOME_BY_ROLE[user.role] ?? '/welcome'} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
