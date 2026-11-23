import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { SPRING, DURATION, EASE_OUT, NATIVE, useReduceMotion } from '../lib/motion';

type Props = {
  children: ReactNode;
  delay?: number; // ms to wait first (use 0, 60, 120… to let cards arrive one after another)
  style?: StyleProp<ViewStyle>;
};

// Content gently arrives: fades in and drifts up 12 px with a soft spring.
// With "reduce motion" on, it only fades (no movement), as Apple recommends.
export default function FadeIn({ children, delay = 0, style }: Props) {
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const fade = Animated.timing(opacity, { toValue: 1, duration: DURATION.fade, delay, easing: EASE_OUT, useNativeDriver: NATIVE });
    const rise = Animated.spring(lift, { toValue: 0, delay, ...SPRING.soft, useNativeDriver: NATIVE });
    if (reduce) lift.setValue(0);
    const run = reduce ? fade : Animated.parallel([fade, rise]);
    run.start();
    return () => run.stop();
  }, [delay, reduce, opacity, lift]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY: lift }] }]}>{children}</Animated.View>;
}
