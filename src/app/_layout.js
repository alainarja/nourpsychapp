import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { I18nProvider } from '../i18n';
import { colors } from '../theme';

function RootStack() {
  const { ready } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  const stack = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
  if (Platform.OS !== 'web') return stack;
  // On desktop browsers, frame the app at phone width instead of stretching it.
  return (
    <View style={{ flex: 1, backgroundColor: '#E9DFCF', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0px 0px 24px rgba(30, 74, 122, 0.12)' }}>{stack}</View>
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
