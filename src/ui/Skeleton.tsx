/**
 * Placeholders de carga.
 *
 * Un skeleton con la forma del contenido real hace que la espera se perciba
 * más corta que un spinner centrado, porque la pantalla ya "está ahí".
 * La animación de brillo corre en el hilo de UI con Reanimated.
 */
import { useEffect } from 'react';
import { type DimensionValue, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width = '100%', height = 14, radius = 8, style }: SkeletonProps) => {
  const progress = useSharedValue(0.35);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.color.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
};

/** Skeleton de una fila de cliente: avatar, dos líneas y el importe. */
export const RowSkeleton = () => (
  <View style={styles.row}>
    <Skeleton width={44} height={44} radius={22} />
    <View style={styles.rowBody}>
      <Skeleton width="55%" height={14} />
      <Skeleton width="32%" height={11} style={styles.rowSecondLine} />
    </View>
    <Skeleton width={68} height={16} radius={6} />
  </View>
);

/** Lista de filas de carga. */
export const ListSkeleton = ({ count = 7 }: { count?: number }) => (
  <View style={styles.list}>
    {Array.from({ length: count }, (_, index) => (
      <RowSkeleton key={index} />
    ))}
  </View>
);

/** Skeleton de una tarjeta grande (héroe de saldo, resumen). */
export const CardSkeleton = ({ height = 150 }: { height?: number }) => (
  <Skeleton width="100%" height={height} radius={theme.radius['2xl']} />
);

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: theme.color.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  rowSecondLine: {
    marginTop: 2,
  },
});
