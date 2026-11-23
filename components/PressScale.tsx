import { ReactNode, useRef, useState } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { SPRING, NATIVE, useReduceMotion } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  // Style for the button; can depend on whether it is being pressed.
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  children: ReactNode;
  pressedScale?: number; // how small it gets while held (default 97%)
};

// A Pressable that shrinks a little while your finger is on it and springs back when you let go,
// like buttons on an iPhone. Works everywhere a Pressable works.
export default function PressScale({ style, children, pressedScale = 0.97, onPressIn, onPressOut, disabled, ...rest }: Props) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  // Springs the size to `to` (interruptible: a new touch simply takes over).
  const springTo = (to: number) => {
    if (reduce) return;
    Animated.spring(scale, { toValue: to, ...SPRING.press, useNativeDriver: NATIVE }).start();
  };

  const look = typeof style === 'function' ? style(pressed) : style;

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        springTo(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        springTo(1);
        onPressOut?.(e);
      }}
      style={[look, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
