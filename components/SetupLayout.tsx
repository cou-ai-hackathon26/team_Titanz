import { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import { Href } from 'expo-router';
import { goBack } from '../lib/nav';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import StepBar from './StepBar';
import { colors, fonts } from '../theme/tokens';
import { toBanglaDigits } from '../lib/bangla';

type Props = {
  step: number; // 1 or 2
  totalSteps: number;
  title: string;
  subtitle: string;
  children: ReactNode; // the form fields
  bottom: ReactNode; // the button pinned at the bottom
  backTo: Href; // where the back arrow goes if there is no previous screen
};

// Shared frame for the setup screens (00g, 00h): back button, "ধাপ x / ২", progress bar,
// title, scrolling form, and a button pinned to the bottom that stays above the keyboard.
export default function SetupLayout({ step, totalSteps, title, subtitle, children, bottom, backTo }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton onPress={() => goBack(backTo)} />
          <Text style={styles.stepText}>
            ধাপ {toBanglaDigits(step)} / {toBanglaDigits(totalSteps)}
          </Text>
          <View style={styles.topBarSpace} />
        </View>
        <View style={styles.progress}>
          <StepBar total={totalSteps} done={step} height={6} doneColor={colors.bgBrandStrong} />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>{bottom}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 24, paddingBottom: 24, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  stepText: { fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  progress: { flexDirection: 'row' },
  heading: { gap: 6 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.bangla, fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  bottom: { backgroundColor: colors.bgApp, paddingTop: 12, paddingHorizontal: 24 },
});
