import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Card, Header, Screen, styles } from '../../components/ui';
import { LANGUAGES, useI18n } from '../../i18n';
import { colors } from '../../theme';
import { notify } from '../../utils/alert';

export default function Language() {
  const { t, lang, setLanguage } = useI18n();

  const choose = async (value) => {
    if (value === lang) return;
    const needsRestart = await setLanguage(value);
    if (needsRestart) notify(t('language.restart'));
  };

  return (
    <Screen>
      <Header title={t('language.title')} subtitle={t('language.subtitle')} back />
      <Card style={{ paddingVertical: 4 }}>
        {LANGUAGES.map((l, i) => (
          <Pressable
            key={l.value}
            onPress={() => choose(l.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: lang === l.value }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { fontWeight: '700' }]}>{l.native}</Text>
              <Text style={styles.muted}>{l.label}</Text>
            </View>
            <Ionicons name={lang === l.value ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.primary} />
          </Pressable>
        ))}
      </Card>
      {lang === 'ar' && <Text style={[styles.muted, { marginTop: 14 }]}>{t('language.partial')}</Text>}
    </Screen>
  );
}
