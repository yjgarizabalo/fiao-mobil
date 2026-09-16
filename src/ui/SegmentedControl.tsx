/**
 * Filtro por segmentos con indicador deslizante.
 *
 * Sustituye a los filtros del v1 (que no existían: la lista de clientes solo
 * tenía buscador). El indicador se mueve con un spring en el hilo de UI, así
 * que el cambio de filtro se siente inmediato aunque la lista esté recargando.
 */
import { useCallback, useState } from 'react';
import { LayoutAnimation, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptics } from '@/core/haptics';
import { Text } from './Text';
import { theme } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Contador opcional a la derecha de la etiqueta (p. ej. "Con deuda 12"). */
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useSharedValue(0);

  const segmentWidth = options.length > 0 ? trackWidth / options.length : 0;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width - PADDING * 2;
      setTrackWidth(width);
      // Coloca el indicador sin animación en el primer render.
      offset.value = (width / options.length) * selectedIndex;
    },
    [offset, options.length, selectedIndex],
  );

  const handlePress = useCallback(
    (option: SegmentOption<T>, index: number) => {
      if (option.value === value) return;
      haptics.select();
      offset.value = withSpring(segmentWidth * index, theme.spring.snappy);
      LayoutAnimation.configureNext({
        duration: theme.duration.fast,
        update: { type: 'easeInEaseOut' },
      });
      onChange(option.value);
    },
    [offset, onChange, segmentWidth, value],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View style={styles.track} onLayout={handleLayout}>
      {segmentWidth > 0 ? (
        <Animated.View
          style={[styles.indicator, { width: segmentWidth }, indicatorStyle]}
        />
      ) : null}

      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option, index)}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={
              option.count === undefined
                ? option.label
                : `${option.label}, ${option.count}`
            }
          >
            <Text
              variant="captionStrong"
              color={isSelected ? 'text' : 'textMuted'}
              numberOfLines={1}
            >
              {option.label}
              {option.count !== undefined && option.count > 0 ? (
                <Text variant="captionStrong" color={isSelected ? 'brandStrong' : 'textSubtle'}>
                  {`  ${option.count}`}
                </Text>
              ) : null}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const PADDING = 4;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.color.surfaceSunken,
    borderRadius: theme.radius.pill,
    padding: PADDING,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    bottom: PADDING,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.pill,
    ...theme.shadow.xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm + 1,
  },
});
