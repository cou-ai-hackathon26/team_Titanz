// Shared animation settings, so every movement in the app feels the same.
// Inspired by Apple's motion guidelines: short, purposeful, physical (springs, not robotic timers),
// never in the way (you can tap while it moves), and switched off when the phone asks for less motion.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

// Springs tuned like iOS defaults: they settle quickly and smoothly, with no visible wobble.
export const SPRING = {
  // Content arriving on screen (about half a second, calm).
  soft: { stiffness: 160, damping: 22, mass: 1 },
  // A finger pressing something (quick and tight).
  press: { stiffness: 440, damping: 30, mass: 1 },
  // A playful arrival with one small bounce (quiz questions).
  bouncy: { stiffness: 230, damping: 17, mass: 1 },
} as const;

// Simple timings for fades.
export const DURATION = { fade: 260, fill: 900 } as const;
export const EASE_OUT = Easing.out(Easing.cubic);

// The native driver runs animations off the JavaScript thread (smoother). It doesn't exist on web.
export const NATIVE = Platform.OS !== 'web';

// True when the phone's "remove animations / reduce motion" setting is on. Then we skip movement.
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => alive && setReduce(on));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

// A number that glides smoothly to `target` (used to fill the risk gauge and the iftar ring).
// Returns the current in-between value, so it can be used to draw SVG shapes.
export function useGlide(target: number, duration: number = DURATION.fill, delay = 0): number {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setValue(v));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    if (reduce) {
      anim.setValue(target);
      return;
    }
    const run = Animated.timing(anim, { toValue: target, duration, delay, easing: EASE_OUT, useNativeDriver: false });
    run.start();
    return () => run.stop();
  }, [target, reduce, anim, duration, delay]);

  return value;
}
