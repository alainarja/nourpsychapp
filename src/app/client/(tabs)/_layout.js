import { Tabs } from 'expo-router';
import { tabIcon, useTabScreenOptions } from '../../../components/tabs';
import { useI18n } from '../../../i18n';

export default function ClientTabs() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={useTabScreenOptions()}>
      <Tabs.Screen name="index" options={{ title: t('tab.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="therapy" options={{ title: t('tab.therapy'), tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="mirror" options={{ title: t('tab.mirror'), tabBarIcon: tabIcon('sparkles') }} />
      <Tabs.Screen name="explore" options={{ title: t('tab.marketplace'), tabBarIcon: tabIcon('bag-handle') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile'), tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
