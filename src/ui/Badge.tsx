/**
 * Etiqueta de estado.
 *
 * Los estados de deuda (`OPEN`, `PARTIAL`, `PAID`) y de cliente (al día / con
 * saldo / en mora) se comunican siempre con el mismo lenguaje visual: color de
 * fondo suave, texto del mismo tono en oscuro y, opcionalmente, un icono.
 * El color nunca es el único indicador —siempre hay texto—, para que la
 * información siga siendo legible con daltonismo.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { theme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const TONES: Record<BadgeTone, { background: string; foreground: string }> = {
  neutral: { background: theme.color.surfaceSunken, foreground: theme.color.textMuted },
  success: { background: theme.color.successSoft, foreground: theme.color.brandStrong },
  warning: { background: theme.color.warningSoft, foreground: theme.color.warningStrong },
  danger: { background: theme.color.dangerSoft, foreground: theme.color.dangerStrong },
  info: { background: theme.color.infoSoft, foreground: theme.color.infoStrong },
  brand: { background: theme.color.brand, foreground: theme.color.brandOn },
};

export const Badge = ({ label, tone = 'neutral', icon, size = 'sm', style }: BadgeProps) => {
  const palette = TONES[tone];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.background,
          paddingVertical: isSmall ? 3 : theme.spacing.xs + 2,
          paddingHorizontal: isSmall ? theme.spacing.sm : theme.spacing.md,
          gap: theme.spacing.xxs + 2,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={isSmall ? 11 : 13} color={palette.foreground} />
      ) : null}
      <Text
        variant={isSmall ? 'overline' : 'captionStrong'}
        color={palette.foreground}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
  },
});
