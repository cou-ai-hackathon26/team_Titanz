import { useEffect, useRef, useState, ComponentRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import QuizAnswer from '../components/QuizAnswer';
import Icon from '../components/Icon';
import SlideIn from '../components/SlideIn';
import { SPRING } from '../lib/motion';
import { goBack } from '../lib/nav';
import { loadProfile, saveRisk, Profile } from '../lib/storage';
import { QUICK_QUIZ_IDS, DarAnswers, getElement, scoreDar, treatmentOptionIds, treatmentQuestion } from '../lib/dar';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// Works out which questions to ask, and which answers we already know from "About you".
function planQuiz(profile: Profile) {
  const known: DarAnswers = {
    type: profile.diabetesType === 'type1' ? 't1' : 't2', // the app is for type 2; "don't know" counts as type 2
    hours: 'lt16', // in Bangladesh a Ramadan fast is always under 16 hours (about 13–15 h)
  };
  const treatmentChoice = treatmentOptionIds(profile.treatment);
  if (treatmentChoice === 'auto-other') known.treatment = 'other'; // diet only: no medicine question
  const ids = QUICK_QUIZ_IDS.filter((id) => {
    if (id === 'pregnancy') return profile.gender === 'female'; // only ask women
    if (id === 'treatment') return treatmentChoice !== 'auto-other';
    return true;
  });
  return {
    ids,
    known,
    treatmentIds: treatmentChoice === 'auto-other' ? [] : treatmentChoice,
    under70: profile.age !== null && profile.age < 70, // hide the "over 70, no help at home" answer
    treatmentWords: treatmentQuestion(profile.treatment), // "which tablet?" / "which insulin?"
  };
}

// Screen 02 · Risk Quiz: one IDF-DAR question per page, big answer cards, Back / Next at the bottom.
export default function RiskQuizScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [plan, setPlan] = useState<ReturnType<typeof planQuiz> | null>(null);
  const [index, setIndex] = useState(0); // which question we are on
  const [direction, setDirection] = useState<1 | -1>(1); // which way the next question slides in
  const [answers, setAnswers] = useState<DarAnswers>({});
  const [saving, setSaving] = useState(false); // stops a double tap from saving twice

  // Read "About you" answers once, to decide the questions.
  useEffect(() => {
    loadProfile().then((p) => setPlan(planQuiz(p)));
  }, []);

  // The progress bar glides to the new length.
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!plan) return;
    Animated.spring(progress, { toValue: (index + 1) / plan.ids.length, ...SPRING.soft, useNativeDriver: false }).start();
  }, [index, plan, progress]);

  // Scroll back to the top whenever the question changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  if (!plan) return <View style={styles.screen} />; // still loading (a split second)

  const total = plan.ids.length;
  const baseElement = getElement(plan.ids[index]);
  // The medicine question uses words that fit the person ("which tablet?" or "which insulin?").
  const element = baseElement.id === 'treatment' && plan.treatmentWords ? { ...baseElement, ...plan.treatmentWords } : baseElement;
  // Only show answers that can apply to this person.
  const options = element.options.filter((o) => {
    if (element.id === 'treatment') return plan.treatmentIds.includes(o.id);
    if (element.id === 'frailty' && o.id === 'gt70_alone') return !plan.under70;
    return true;
  });
  const picked = answers[element.id];
  const isLast = index === total - 1;

  // Go to the previous question, or leave the quiz from the first one.
  function previous() {
    if (index > 0) {
      setDirection(-1);
      setIndex(index - 1);
    }
    else goBack('/iftar');
  }

  // Go to the next question, or score everything and show the result after the last one.
  async function next() {
    if (!picked || !plan || saving) return;
    if (!isLast) {
      setDirection(1);
      setIndex(index + 1);
      return;
    }
    setSaving(true);
    const all = { ...plan.known, ...answers };
    const result = scoreDar(all);
    await saveRisk({ answers: all, score: result.score, band: result.band, date: new Date().toISOString() });
    router.replace('/risk-result');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton onPress={previous} />
          <Text style={styles.counter}>
            প্রশ্ন {toBanglaDigits(index + 1)} / {toBanglaDigits(total)}
          </Text>
          <View style={styles.topBarSpace} />
        </View>

        <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: index + 1 }}>
          <Animated.View
            style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </View>

        {/* The question and its answers slide in together (new key = plays again) */}
        <SlideIn key={element.id} from={direction} style={styles.slide}>
        <View style={styles.topic}>
          <Icon name={element.topicIcon} size={16} />
          <Text style={styles.topicText}>{element.topicBn}</Text>
        </View>

        <View style={styles.question}>
          <Text style={styles.questionBn}>{element.questionBn}</Text>
          <Text style={styles.questionEn}>{element.questionEn}</Text>
        </View>

        <View style={styles.answers} accessibilityRole="radiogroup">
          {options.map((o) => (
            <QuizAnswer
              key={o.id}
              label={o.labelBn}
              sub={o.labelEn}
              selected={picked === o.id}
              onPress={() => setAnswers({ ...answers, [element.id]: o.id })}
            />
          ))}
        </View>

        {element.hintBn ? (
          <View style={styles.hint}>
            <Icon name="help" size={18} color={colors.textSecondary} />
            <Text style={styles.hintText}>{element.hintBn}</Text>
          </View>
        ) : null}
        </SlideIn>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        <Button label="আগে" variant="Secondary" onPress={previous} style={styles.prevButton} />
        <Button
          label={isLast ? 'ফলাফল দেখুন' : 'পরবর্তী'}
          sub={isLast ? 'See result' : 'Next'}
          onPress={next}
          disabled={!picked || saving}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  counter: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.borderDefault, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.riskLow },
  topic: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgPage,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicText: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  question: { gap: 6 },
  questionBn: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary },
  questionEn: { fontFamily: fonts.english, fontSize: 15, lineHeight: 18, color: colors.textSecondary },
  answers: { gap: 10 },
  slide: { gap: 20 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintText: { flex: 1, fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  bottom: { flexDirection: 'row', gap: 12, paddingTop: 12, paddingHorizontal: 20, backgroundColor: colors.bgApp },
  prevButton: { width: 86, paddingHorizontal: 0 },
  nextButton: { flex: 1 },
});
