/**
 * Botón de acción flotante.
 *
 * La acción principal de una lista ("agregar cliente", "agregar negocio")
 * siempre está al alcance del pulgar y por encima de la barra de gestos.
 * Se contrae a un círculo al hacer scroll hacia abajo para no tapar contenido.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { theme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface FabProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
  /** Cuando es `true`, el FAB se reduce a un círculo (solo icono). */
  collapsed?: boolean;
  /** Alternativa reactiva a `collapsed`, para engancharlo al scroll. */
  collapsedValue?: SharedValue<number>;
}

export const Fab = ({ label, icon = 'add', onPress, collapsed = false, collapsedValue }: FabProps) => {
  const insets = useSafeAreaInsets();

  const progress = useDerivedValue(() => {
    const target = collapsedValue ? collapsedValue.value : collapsed ? 1 : 0;
    return withSpring(target, theme.spring.snappy);
  }, [collapsed]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1 - progress.value, { duration: theme.duration.fast }),
    maxWidth: (1 - progress.value) * 180,
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="press"
      activeScale={0.94}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.fab,
        { bottom: insets.bottom + theme.spacing.xl },
      ]}
    >
      <Ionicons name={icon} size={24} color={theme.color.brandOn} />
      <Animated.View style={[styles.labelWrapper, labelStyle]}>
        <Text variant="bodyStrong" weight="bold" color="brandOn" numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 56,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.brand,
    ...theme.shadow.lg,
  },
  labelWrapper: {
    overflow: 'hidden',
  },
});
