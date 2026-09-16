/**
 * Botón del design system.
 *
 * Variantes con intención semántica (no "azul"/"rojo" sino `primary`,
 * `danger`, `ghost`), estado de carga integrado —el botón no cambia de tamaño
 * al pasar a "Guardando…", que es un salto visual clásico— y área táctil
 * siempre ≥ 44pt.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';

import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { theme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono a la izquierda del texto. */
  icon?: IconName;
  /** Icono a la derecha (p. ej. una flecha de "continuar"). */
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa todo el ancho disponible. */
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  children?: ReactNode;
}

interface VariantStyle {
  background: string;
  pressedBackground: string;
  label: string;
  border?: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    background: theme.color.brand,
    pressedBackground: theme.color.brandStrong,
    label: theme.color.brandOn,
  },
  secondary: {
    background: theme.color.surface,
    pressedBackground: theme.color.surfaceSunken,
    label: theme.color.text,
    border: theme.color.borderStrong,
  },
  ghost: {
    background: 'transparent',
    pressedBackground: theme.color.surfaceSunken,
    label: theme.color.textMuted,
  },
  danger: {
    background: theme.color.danger,
    pressedBackground: theme.color.dangerStrong,
    label: theme.color.dangerOn,
  },
  inverse: {
    background: theme.color.surface,
    pressedBackground: theme.color.brandSoft,
    label: theme.color.surfaceInverse,
  },
};

const SIZES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; gap: number; iconSize: number; radius: number }
> = {
  sm: {
    height: theme.layout.buttonHeight.sm,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
    iconSize: 16,
    radius: theme.radius.md,
  },
  md: {
    height: theme.layout.buttonHeight.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
    iconSize: 18,
    radius: theme.radius.lg,
  },
  lg: {
    height: theme.layout.buttonHeight.lg,
    paddingHorizontal: theme.spacing['2xl'],
    gap: theme.spacing.sm,
    iconSize: 20,
    radius: theme.radius.lg,
  },
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: ButtonProps) => {
  const palette = VARIANTS[variant];
  const dimensions = SIZES[size];
  const isInactive = disabled || loading;

  const background = isInactive
    ? variant === 'ghost' || variant === 'secondary'
      ? palette.background
      : theme.color.disabled
    : palette.background;

  const labelColor = isInactive ? theme.color.disabledText : palette.label;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isInactive}
      haptic={variant === 'primary' || variant === 'danger' ? 'press' : 'tap'}
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.base,
        {
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingHorizontal,
          borderRadius: dimensions.radius,
          backgroundColor: background,
          gap: dimensions.gap,
        },
        palette.border && !isInactive
          ? { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: palette.border }
          : null,
        variant === 'primary' && !isInactive ? theme.shadow.sm : null,
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
    >
      {/* El spinner se superpone en lugar de sustituir el texto: así el botón
          conserva exactamente el mismo ancho mientras carga. */}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={labelColor} />
        </View>
      ) : null}

      <View style={[styles.content, { gap: dimensions.gap }, loading && styles.hidden]}>
        {icon ? <Ionicons name={icon} size={dimensions.iconSize} color={labelColor} /> : null}
        <Text
          variant={size === 'sm' ? 'captionStrong' : 'bodyStrong'}
          weight="bold"
          color={labelColor}
          numberOfLines={1}
        >
          {label}
        </Text>
        {iconRight ? (
          <Ionicons name={iconRight} size={dimensions.iconSize} color={labelColor} />
        ) : null}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  hidden: { opacity: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
