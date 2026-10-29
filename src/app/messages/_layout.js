import { Redirect, Stack } from 'expo-router';
import { onboardingRoute, useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

// Shared by every role, so it only checks that someone is signed in and onboarded.
export default function MessagesLayout() {
  const { user } = useAuth();
  const gate = onboardingRoute(user);
  if (gate) return <Redirect href={gate} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
