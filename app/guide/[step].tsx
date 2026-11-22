import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import Text from '../../components/Txt'; // <Text> that draws Bangla digits clearly
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { goBack } from '../../lib/nav';
import BackButton from '../../components/BackButton';
import StepBar from '../../components/StepBar';
import Icon, { IconName } from '../../components/Icon';
import { colors, fonts, softShadow } from '../../theme/tokens';

// A small white tag that floats over the picture, tilted a little.
type FloatChip = {
  text: string;
  icon?: IconName; // an icon, or...
  dot?: 'red' | 'green'; // ...a coloured dot
  iconColor?: string;
  left: number;
  top: number;
  tilt: number; // degrees
};

// What each of the 3 guide screens shows (Figma 00b, 00c, 00d).
type Guide = {
  image: number; // a require()'d picture
  round: boolean; // guide 2's picture sits in a 290px circle
  chips: FloatChip[];
  title: string;
  body: string;
  button: string;
};

const guides: Guide[] = [
  {
    image: require('../../assets/onboarding/guide-1.png'),
    round: false,
    chips: [
      { text: '৮টি সহজ প্রশ্ন', icon: 'quiz', iconColor: colors.textBrand, left: 18, top: 61, tilt: -4 },
      { text: 'দরকারে ডাক্তার', icon: 'stethoscope', iconColor: colors.riskHigh, left: 203, top: 300, tilt: 4 },
    ],
    title: 'রোজার আগে\nঝুঁকি জেনে নিন',
    body: '৮টি সহজ প্রশ্ন, ৩ মিনিট। দরকার হলে ডাক্তার দেখাতে বলবে।',
    button: 'পরবর্তী',
  },
  {
    image: require('../../assets/onboarding/guide-2.png'),
    round: true,
    chips: [
      { text: 'জিলাপি · ৪২g', dot: 'red', left: 219, top: 64, tilt: 4 },
      { text: 'ছোলা · ভালো', dot: 'green', left: 22, top: 288, tilt: -4 },
    ],
    title: 'প্লেটের ছবি তুললেই\nশর্করার হিসাব',
    body: 'খাবার চিনে নেবে, কোনটায় শর্করা বেশি দেখিয়ে দেবে।',
    button: 'পরবর্তী',
  },
  {
    image: require('../../assets/onboarding/guide-3.png'),
    round: false,
    chips: [
      { text: 'জিলাপি ২ → ১', icon: 'trending_down', iconColor: colors.textBrand, left: 22, top: 55, tilt: -4 },
      { text: '১৫ মিনিট হাঁটা', icon: 'directions_walk', iconColor: colors.textBrand, left: 201, top: 302, tilt: 4 },
    ],
    title: 'খাওয়ার আগেই\nসুগারের ধারণা',
    body: 'একটা খাবার বদলালে সুগার কতটা কম বাড়ে, আগেই দেখুন।',
    button: 'শুরু করুন',
  },
];

// The little sparkle stars around the picture (same on all 3 guides).
const sparkles = [
  { src: require('../../assets/onboarding/sparkle-large.svg'), left: 300, top: 40, size: 22 },
  { src: require('../../assets/onboarding/sparkle-medium.svg'), left: 40, top: 230, size: 14 },
  { src: require('../../assets/onboarding/sparkle-small.svg'), left: 330, top: 250, size: 12 },
];

const dots = {
  red: require('../../assets/onboarding/dot-red.svg'),
  green: require('../../assets/onboarding/dot-green.svg'),
};

const ART = 390; // the picture area is 390×390 in Figma; we shrink it on narrower phones

// Screens 00b–00d · Guide 1–3: picture, title, text, and a Next button. "Skip" jumps to setup.
export default function GuideScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const index = Math.min(Math.max(Number(step) || 1, 1), guides.length) - 1;
  const guide = guides[index];
  const isLast = index === guides.length - 1;
  const box = Math.min(width, ART);
  const scale = box / ART;

  // Go to the next guide, or to the "About you" setup after the last one.
  function goNext() {
    if (isLast) router.push('/about-you');
    else router.push(`/guide/${index + 2}`);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <BackButton size={40} onPress={() => goBack(index === 0 ? '/' : `/guide/${index}`)} />
        <StepBar total={3} done={index + 1} />
        <Pressable onPress={() => router.push('/about-you')} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.skip}>এড়িয়ে যান</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Picture area: a 390×390 Figma frame, scaled to fit the phone width */}
        <View style={{ width: box, height: box, alignSelf: 'center' }}>
          <View style={[styles.art, { transform: [{ scale }], left: (box - ART) / 2, top: (box - ART) / 2 }]}>
            {guide.round ? (
              <View style={styles.circle}>
                <Image source={guide.image} style={styles.circleImage} contentFit="cover" />
              </View>
            ) : (
              <Image source={guide.image} style={styles.squareImage} contentFit="cover" />
            )}
            {sparkles.map((s, i) => (
              <Image key={i} source={s.src} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size }} />
            ))}
            {guide.chips.map((chip) => (
              <View key={chip.text} style={[styles.chip, { left: chip.left, top: chip.top, transform: [{ rotate: `${chip.tilt}deg` }] }]}>
                {chip.icon ? <Icon name={chip.icon} size={18} color={chip.iconColor} /> : null}
                {chip.dot ? <Image source={dots[chip.dot]} style={styles.dot} /> : null}
                <Text style={styles.chipText}>{chip.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.body}>{guide.body}</Text>
        </View>

        <View style={styles.flexSpace} />
        <Button
          label={guide.button}
          icon="arrow_forward"
          onPress={goNext}
          style={[styles.button, { marginBottom: Math.max(20, insets.bottom + 14) }]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  topBar: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  skip: { fontFamily: fonts.banglaMedium, fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  scroll: { flexGrow: 1, paddingTop: 10 },
  art: { position: 'absolute', width: ART, height: ART },
  squareImage: { position: 'absolute', left: 0.6, top: 0, width: 388.7, height: 390 },
  circle: { position: 'absolute', left: 50, top: 50, width: 290, height: 290, borderRadius: 145, overflow: 'hidden' },
  // Figma crops this image: 114% size, moved up/left by 7%.
  circleImage: { position: 'absolute', left: -20.4, top: -20.4, width: 330.7, height: 330.7 },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.bgSurface,
    ...softShadow,
  },
  chipText: { fontFamily: fonts.banglaSemiBold, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  dot: { width: 10, height: 10 },
  textBlock: { marginTop: 22, paddingHorizontal: 32, gap: 12 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary, textAlign: 'center' },
  body: { fontFamily: fonts.bangla, fontSize: 16, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' },
  flexSpace: { flex: 1, minHeight: 24 },
  button: { width: 220, alignSelf: 'center' },
});
