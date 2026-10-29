import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hero } from '../../components/Hero';
import { Button, styles } from '../../components/ui';
import { useI18n } from '../../i18n';
import { colors, fonts } from '../../theme';

export default function Welcome() {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Hero />
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 24, color: colors.primary, textAlign: 'center', lineHeight: 32 }}>
          {t('welcome.tagline')}
        </Text>
        <View style={{ gap: 10 }}>
          <Button title={t('welcome.client')} icon="person-outline" onPress={() => router.push({ pathname: '/sign-up', params: { role: 'client' } })} />
          <Button title={t('welcome.pro')} icon="medkit-outline" variant="secondary" onPress={() => router.push('/pro-welcome')} />
          <Button title={t('welcome.org')} icon="business-outline" variant="secondary" onPress={() => router.push({ pathname: '/sign-up', params: { role: 'org' } })} />
        </View>
        <Pressable onPress={() => router.push('/sign-in')}>
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            {t('welcome.haveAccount')} <Text style={styles.link}>{t('welcome.signIn')}</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
