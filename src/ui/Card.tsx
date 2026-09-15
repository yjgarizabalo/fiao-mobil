/**
 * Contenedor de contenido.
 *
 * Tres niveles de elevación y una variante presionable. Al ser presionable
 * usa `PressableScale`, así que todas las tarjetas de la app responden igual
 * al tacto.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { PressableScale } from './PressableScale';
import { theme } from '../theme';
import type { RadiusToken, SpacingToken } from '../theme/tokens';

export interface CardProps {
  children: ReactNode;
  /** `flat`: solo borde. `raised`: sombra suave. `floating`: sombra marcada. */
  elevation?: 'flat' | 'raised' | 'floating';
  padding?: SpacingToken;
  radius?: RadiusToken;
  /** Fondo oscuro para tarjetas destacadas. */
  inverse?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const Card = ({
  children,
  elevation = 'flat',
  padding = 'lg',
  radius = 'xl',
  inverse = false,
  onPress,
  style,
  accessibilityLabel,
}: CardProps) => {
  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      padding: theme.spacing[padding],
      borderRadius: theme.radius[radius],
      backgroundColor: inverse ? theme.color.surfaceInverse : theme.color.surface,
      borderColor: inverse ? theme.color.borderInverse : theme.color.border,
    },
    elevation === 'raised' ? theme.shadow.sm : {},
    elevation === 'floating' ? theme.shadow.md : {},
    style ?? {},
  ];

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        style={containerStyle}
        activeScale={0.985}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </PressableScale>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
});
