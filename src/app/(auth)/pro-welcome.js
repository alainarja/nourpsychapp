import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hero } from '../../components/Hero';
import { Button, styles } from '../../components/ui';
import { useI18n } from '../../i18n';
import { colors, fonts } from '../../theme';

const go = (proType) => router.push({ pathname: '/sign-up', params: { role: 'pro', proType } });

export default function ProWelcome() {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Hero />
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 24, color: colors.primary, textAlign: 'center', lineHeight: 32 }}>
          {t('welcome.proTagline')}
        </Text>
        <View style={{ gap: 10 }}>
          <Button title={t('welcome.psychologist')} onPress={() => go('psychologist')} />
          <Button title={t('welcome.psychiatrist')} variant="secondary" onPress={() => go('psychiatrist')} />
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
