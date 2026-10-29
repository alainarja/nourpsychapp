import { router } from 'expo-router';
import { Card, Header, MenuRow, Screen } from '../../components/ui';
import { comingSoon } from '../../utils/alert';

// Premium extras only — everyday practice management (calendar, clients) lives in the main tabs.
const TOOLS = [
  { icon: 'sparkles-outline', title: 'AI Assistant', subtitle: 'Documentation and admin support', go: () => router.push('/pro/assistant') },
  { icon: 'globe-outline', title: 'Build My Website', subtitle: 'Professional site and booking page', go: () => comingSoon('Website builder') },
  { icon: 'clipboard-outline', title: 'Clinical Tools', subtitle: 'Forms, assessments and worksheets', go: () => router.push('/pro/clinical-tools') },
  { icon: 'trending-up-outline', title: 'Practice Growth', subtitle: 'Analytics and visibility', go: () => router.push('/pro/growth') },
  { icon: 'diamond-outline', title: 'Premium Features', subtitle: 'Advanced tools and integrations', go: () => comingSoon('Premium plans') },
];

export default function PsychPro() {
  return (
    <Screen>
      <Header title="Psych Pro" subtitle="Premium tools to grow your practice." back />
      <Card style={{ paddingVertical: 4 }}>
        {TOOLS.map((t) => <MenuRow key={t.title} icon={t.icon} title={t.title} subtitle={t.subtitle} onPress={t.go} />)}
      </Card>
    </Screen>
  );
}
