import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '../../../components/tabs';
import { useI18n } from '../../../i18n';

export default function ProTabs() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: t('tab.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="clients" options={{ title: t('tab.clients'), tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="calendar" options={{ title: t('tab.calendar'), tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="tools" options={{ title: t('tab.tools'), tabBarIcon: tabIcon('grid') }} />
      <Tabs.Screen name="more" options={{ title: t('tab.more'), tabBarIcon: tabIcon('ellipsis-horizontal-circle') }} />
    </Tabs>
  );
}
