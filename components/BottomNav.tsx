import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon, { IconName } from './Icon';
import { colors, fonts } from '../theme/tokens';

export type NavTab = 'home' | 'forecast' | 'history' | 'check';

const TABS: { id: NavTab; icon: IconName; label: string; path: '/home' | '/forecast' | '/history' | '/check' }[] = [
  { id: 'home', icon: 'home', label: 'হোম', path: '/home' },
  { id: 'forecast', icon: 'show_chart', label: 'পূর্বাভাস', path: '/forecast' },
  { id: 'history', icon: 'calendar_month', label: 'ইতিহাস', path: '/history' },
  { id: 'check', icon: 'health_and_safety', label: 'চেক', path: '/check' },
];

// Height of the bar without the phone's bottom inset. Screens add this as bottom padding.
export const NAV_HEIGHT = 80;

// One tab: icon, label and a dot under the active one.
function Tab({ tab, active }: { tab: (typeof TABS)[number]; active: boolean }) {
  return (
    <Pressable
      onPress={() => !active && router.replace(tab.path)}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={styles.tab}
      hitSlop={6}
    >
      <Icon name={tab.icon} size={24} color={active ? colors.textPrimary : colors.textSecondary} style={active ? null : styles.dim} />
      <Text style={[styles.label, active ? styles.labelActive : styles.dim]}>{tab.label}</Text>
      <View style={[styles.dot, active ? styles.dotActive : null]} />
    </Pressable>
  );
}

// Figma "Bottom nav": Home · Forecast · [lime scan button] · History · Check. Stays fixed at the bottom.
export default function BottomNav({ active }: { active: NavTab }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]} accessibilityRole="tablist">
      <Tab tab={TABS[0]} active={active === 'home'} />
      <Tab tab={TABS[1]} active={active === 'forecast'} />
      <Pressable
        onPress={() => router.push('/scan')}
        accessibilityRole="button"
        accessibilityLabel="প্লেট স্ক্যান করুন (Scan plate)"
        style={({ pressed }) => [styles.scan, pressed ? styles.scanPressed : null]}
      >
        <Icon name="center_focus_weak" size={30} />
      </Pressable>
      <Tab tab={TABS[2]} active={active === 'history'} />
      <Tab tab={TABS[3]} active={active === 'check'} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  scanPressed: { opacity: 0.85 },
});
