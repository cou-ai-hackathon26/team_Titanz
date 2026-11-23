import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { SPRING, DURATION, EASE_OUT, NATIVE, useReduceMotion } from '../lib/motion';

type Props = {
  children: ReactNode;
  from: 1 | -1; // 1 = comes in from the right (going forward), -1 = from the left (going back)
  style?: StyleProp<ViewStyle>;
};

// Content that slides in sideways with a small spring bounce and fades in.
// Give it a new `key` each time (e.g. the question number) so it plays again.
export default function SlideIn({ children, from, style }: Props) {
  const reduce = useReduceMotion();
  const x = useRef(new Animated.Value(reduce ? 0 : from * 48)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fade = Animated.timing(opacity, { toValue: 1, duration: DURATION.fade, easing: EASE_OUT, useNativeDriver: NATIVE });
    const run = reduce ? fade : Animated.parallel([fade, Animated.spring(x, { toValue: 0, ...SPRING.bouncy, useNativeDriver: NATIVE })]);
    run.start();
    return () => run.stop();
  }, [reduce, opacity, x]);

  return <Animated.View style={[style, { opacity, transform: [{ translateX: x }] }]}>{children}</Animated.View>;
}
