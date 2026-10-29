import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { I18nProvider } from '../i18n';
import { colors } from '../theme';

const SIGNED_OUT = ['(auth)/welcome', '(auth)/pro-welcome', '(auth)/sign-in', '(auth)/sign-up', '(auth)/forgot-password', '(auth)/two-factor'];
const SIGNED_IN = ['client', 'pro', 'org', 'admin', 'messages', 'settings', 'receipts', 'notifications', 'checkout', 'call/[apptId]', 'assessment/[type]'];

function RootStack() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  // Flipping a guard drops that side's screens from history, so Back from a home screen
  // exits the app instead of returning to sign-in (and sign-out can't go "back" into an account).
  const stack = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        {SIGNED_OUT.map((name) => <Stack.Screen key={name} name={name} />)}
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        {SIGNED_IN.map((name) => <Stack.Screen key={name} name={name} />)}
      </Stack.Protected>
    </Stack>
  );
  if (Platform.OS !== 'web') return stack;
  // On desktop browsers, frame the app at phone width instead of stretching it.
  return (
    <View style={{ flex: 1, backgroundColor: '#EFE3D1', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0px 0px 24px rgba(14, 63, 110, 0.12)' }}>{stack}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootStack />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
