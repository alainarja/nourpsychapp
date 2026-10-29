import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '../../../components/tabs';

export default function AdminTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="verifications" options={{ title: 'Verify', tabBarIcon: tabIcon('shield-checkmark') }} />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: tabIcon('flag') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('ellipsis-horizontal-circle') }} />
    </Tabs>
  );
}
