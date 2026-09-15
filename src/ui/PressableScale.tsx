/**
 * Zona táctil que se "hunde" al presionar.
 *
 * Es el detalle que más separa una app que se siente nativa de una que se
 * siente web: el elemento responde al dedo antes de que ocurra la navegación.
 * Se usa Reanimated (hilo de UI) para que la animación no se trabe aunque el
 * hilo de JS esté ocupado cargando datos.
 */
import { type ReactNode, useCallback } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '../core/haptics';
import { theme } from '../theme';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala al presionar. 0.97 es sutil; 0.94 para tarjetas grandes. */
  activeScale?: number;
  /** Opacidad al presionar. */
  activeOpacity?: number;
  /** Feedback táctil al presionar. `false` lo desactiva. */
  haptic?: 'select' | 'tap' | 'press' | false;
}

export const PressableScale = ({
  children,
  style,
  activeScale = 0.97,
  activeOpacity = 0.92,
  haptic = 'select',
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      scale.value = withSpring(activeScale, theme.spring.snappy);
      opacity.value = withTiming(activeOpacity, { duration: theme.duration.instant });
      if (haptic) haptics[haptic]();
      onPressIn?.(event);
    },
    [activeScale, activeOpacity, haptic, onPressIn, opacity, scale],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scale.value = withSpring(1, theme.spring.snappy);
      opacity.value = withTiming(1, { duration: theme.duration.fast });
      onPressOut?.(event);
    },
    [onPressOut, opacity, scale],
  );

  return (
    <Pressable
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};
