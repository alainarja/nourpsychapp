import { Redirect, Stack } from 'expo-router';
import { onboardingRoute, useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

export default function ReceiptsLayout() {
  const { user } = useAuth();
  const gate = onboardingRoute(user);
  if (gate) return <Redirect href={gate} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
