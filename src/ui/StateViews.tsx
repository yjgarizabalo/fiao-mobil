/**
 * Estados vacío y de error.
 *
 * En el v1 el estado vacío era una línea de texto gris y el de error no
 * existía (los fallos solo se veían en la consola). Aquí los dos son
 * componentes con icono, explicación y acción, porque son parte del producto:
 * la primera pantalla que ve un usuario nuevo es un estado vacío.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { AppError } from '../core/errors/AppError';
import { Button } from './Button';
import { Text } from './Text';
import { theme } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Acción secundaria en texto (p. ej. "Limpiar búsqueda"). */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tone?: 'neutral' | 'brand';
  style?: ViewStyle;
}

export const EmptyState = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tone = 'neutral',
  style,
}: EmptyStateProps) => (
  <View style={[styles.container, style]}>
    <View
      style={[
        styles.iconCircle,
        {
          backgroundColor: tone === 'brand' ? theme.color.brandSoft : theme.color.surfaceSunken,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={34}
        color={tone === 'brand' ? theme.color.brandStrong : theme.color.textSubtle}
      />
    </View>

    <Text variant="title3" align="center" style={styles.title}>
      {title}
    </Text>

    {message ? (
      <Text variant="body" color="textMuted" align="center" style={styles.message}>
        {message}
      </Text>
    ) : null}

    {actionLabel && onAction ? (
      <Button label={actionLabel} onPress={onAction} style={styles.action} />
    ) : null}

    {secondaryActionLabel && onSecondaryAction ? (
      <Button
        label={secondaryActionLabel}
        onPress={onSecondaryAction}
        variant="ghost"
        size="sm"
      />
    ) : null}
  </View>
);

export interface ErrorStateProps {
  error: AppError;
  onRetry?: () => void;
  style?: ViewStyle;
}

/**
 * Estado de error a pantalla completa. El mensaje sale del propio `AppError`,
 * que ya trae un texto pensado para el usuario, y el botón de reintentar solo
 * aparece cuando reintentar puede servir de algo.
 */
export const ErrorState = ({ error, onRetry, style }: ErrorStateProps) => (
  <EmptyState
    icon={
      error.code === 'NETWORK' || error.code === 'TIMEOUT'
        ? 'cloud-offline-outline'
        : 'alert-circle-outline'
    }
    title={error.title}
    message={error.message}
    actionLabel={error.isRetryable && onRetry ? 'Reintentar' : undefined}
    onAction={error.isRetryable ? onRetry : undefined}
    style={style}
  />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing['4xl'],
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.xxs,
  },
  message: {
    maxWidth: 300,
  },
  action: {
    marginTop: theme.spacing.lg,
    minWidth: 200,
  },
});
