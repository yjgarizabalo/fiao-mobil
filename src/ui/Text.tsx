/**
 * Texto tipado por la escala tipográfica.
 *
 * Ningún componente debe escribir `fontSize` a mano: se elige una variante.
 * Eso mantiene la jerarquía visual coherente en toda la app.
 */
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import { type ThemeColor, theme } from '../theme';
import type { TypographyToken } from '../theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  color?: ThemeColor | (string & {});
  align?: 'auto' | 'left' | 'right' | 'center';
  /** Sobrescribe el peso de la variante (p. ej. un body en semibold). */
  weight?: keyof typeof theme.fontWeight;
  /** Convierte a MAYÚSCULAS. Se usa con la variante `overline`. */
  uppercase?: boolean;
}

const resolveColor = (color: TextProps['color']): string => {
  if (!color) return theme.color.text;
  return (theme.color as Record<string, string>)[color] ?? color;
};

export const Text = ({
  variant = 'body',
  color,
  align,
  weight,
  uppercase,
  style,
  ...rest
}: TextProps) => (
  <RNText
    style={[
      theme.typography[variant],
      { color: resolveColor(color) },
      align ? { textAlign: align } : null,
      weight ? { fontWeight: theme.fontWeight[weight] } : null,
      uppercase ? styles.uppercase : null,
      style,
    ]}
    // Evita que la letra crezca tanto con la accesibilidad del sistema que
    // rompa los layouts, sin dejar de respetar la preferencia del usuario.
    maxFontSizeMultiplier={1.35}
    {...rest}
  />
);

const styles = StyleSheet.create({
  uppercase: { textTransform: 'uppercase' },
});
