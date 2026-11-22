import { Tabs } from 'expo-router/tabs';
import BottomNav from '../../components/BottomNav';
import { colors } from '../../theme/tokens';

// The main app after setup: Home, Forecast and History share one fixed bottom bar.
// Switching tabs only fades the page above the bar; the bar itself never moves.
// The phone's back button on Forecast or History goes to Home first.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: colors.bgApp },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="forecast" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}
