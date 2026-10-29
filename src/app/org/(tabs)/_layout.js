import { Tabs } from 'expo-router';
import { tabIcon, useTabScreenOptions } from '../../../components/tabs';

export default function OrgTabs() {
  return (
    <Tabs screenOptions={useTabScreenOptions()}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="members" options={{ title: 'Members', tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="providers" options={{ title: 'Providers', tabBarIcon: tabIcon('medkit') }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: tabIcon('card') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('ellipsis-horizontal-circle') }} />
    </Tabs>
  );
}
