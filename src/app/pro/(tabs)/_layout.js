import { Tabs } from 'expo-router';
import { tabIcon, useTabScreenOptions } from '../../../components/tabs';
import { useI18n } from '../../../i18n';

export default function ProTabs() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={useTabScreenOptions()}>
      <Tabs.Screen name="index" options={{ title: t('tab.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="clients" options={{ title: t('tab.clients'), tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="calendar" options={{ title: t('tab.calendar'), tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="marketplace" options={{ title: t('tab.marketplace'), tabBarIcon: tabIcon('storefront') }} />
      <Tabs.Screen name="more" options={{ title: t('tab.more'), tabBarIcon: tabIcon('ellipsis-horizontal-circle') }} />
    </Tabs>
  );
}
