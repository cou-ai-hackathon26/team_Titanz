import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import PressScale from './PressScale';
import { SPRING, NATIVE } from '../lib/motion';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon, { IconName } from './Icon';
import { colors, fonts } from '../theme/tokens';

type TabItem = { route: string; icon: IconName; label: string };

// Left to right. Home, Forecast and History are real tabs (the bar stays, only the page changes).
// "Check" opens the full-screen pre-iftar check on top (it has its own big buttons at the bottom).
const LEFT: TabItem[] = [
  { route: 'home', icon: 'home', label: 'হোম' },
  { route: 'forecast', icon: 'show_chart', label: 'পূর্বাভাস' },
];
const RIGHT: TabItem[] = [
  { route: 'history', icon: 'calendar_month', label: 'ইতিহাস' },
  { route: 'check', icon: 'health_and_safety', label: 'চেক' },
];

// One tab: icon, label and a dot under the active one. The dot springs in when the tab becomes active.
function Tab({ item, active, onPress }: { item: TabItem; active: boolean; onPress: () => void }) {
  const dot = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(dot, { toValue: active ? 1 : 0, ...SPRING.press, useNativeDriver: NATIVE }).start();
  }, [active, dot]);
  return (
    <PressScale
      pressedScale={0.9}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      style={styles.tab}
      hitSlop={6}
    >
      <Icon name={item.icon} size={24} color={active ? colors.textPrimary : colors.textSecondary} style={active ? null : styles.dim} />
      <Text style={[styles.label, active ? styles.labelActive : styles.dim]}>{item.label}</Text>
      <Animated.View style={[styles.dot, styles.dotActive, { opacity: dot, transform: [{ scale: dot }] }]} />
    </PressScale>
  );
}

// Figma "Bottom nav": Home · Forecast · [lime scan button] · History · Check.
// It is the tab bar of the (tabs) group, so it never moves: tapping a tab only changes the page above it.
export default function BottomNav({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index].name;

  // Switches to a tab, or opens the Check screen on top.
  function open(route: string) {
    if (route === 'check') router.push('/check');
    else if (route !== current) {
      const target = state.routes.find((r) => r.name === route);
      if (target) navigateToTab(target.key);
    }
  }

  const renderTab = (item: TabItem) => <Tab key={item.route} item={item} active={item.route === current} onPress={() => open(item.route)} />;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]} accessibilityRole="tablist">
      {LEFT.map(renderTab)}
      <PressScale
        pressedScale={0.92}
        onPress={() => router.push('/scan')}
        accessibilityRole="button"
        accessibilityLabel="প্লেট স্ক্যান করুন (Scan plate)"
        style={styles.scan}
      >
        <Icon name="center_focus_weak" size={30} />
      </PressScale>
      {RIGHT.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.bgSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  tab: { width: 56, alignItems: 'center', gap: 2 },
  label: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  labelActive: { fontFamily: fonts.banglaSemiBold, color: colors.textPrimary },
  dim: { opacity: 0.75 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotActive: { backgroundColor: colors.textPrimary },
  scan: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgPage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#66801A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
});
