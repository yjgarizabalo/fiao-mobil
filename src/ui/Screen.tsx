/**
 * Contenedor de pantalla, consciente de las áreas seguras.
 *
 * Es la corrección del problema más serio de UI del v1: allí el `Header`
 * calculaba a mano `Platform.OS === 'android' ? StatusBar.currentHeight : 44`,
 * un valor fijo que se queda corto en los iPhone con notch o Dynamic Island, y
 * nadie contemplaba el inset inferior (barra de gestos), así que los botones
 * quedaban pegados al borde.
 *
 * Aquí los insets salen de `react-native-safe-area-context`, que los lee del
 * sistema en las dos plataformas.
 */
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type RefreshControlProps,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Fondo de la pantalla. `inverse` = superficie oscura (héroes, login). */
  background?: 'bg' | 'surface' | 'inverse';
  /** Envuelve el contenido en un ScrollView con el padding inferior seguro. */
  scroll?: boolean;
  /** Aplica el gutter horizontal estándar al contenido. */
  padded?: boolean;
  /** Sube el contenido cuando aparece el teclado (formularios). */
  keyboardAware?: boolean;
  /** Barra fija al fondo (CTA principal), ya separada de la barra de gestos. */
  footer?: ReactNode;
  /**
   * Color de los iconos de la barra de estado. Por defecto se deduce del
   * fondo, pero una pantalla con héroe oscuro sobre fondo claro necesita
   * forzarlo a `light`.
   */
  statusBar?: 'light' | 'dark';
  refreshControl?: React.ReactElement<RefreshControlProps>;
  scrollProps?: Omit<ScrollViewProps, 'refreshControl' | 'children'>;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Screen = ({
  children,
  background = 'bg',
  scroll = false,
  padded = false,
  keyboardAware = false,
  footer,
  statusBar,
  refreshControl,
  scrollProps,
  style,
  contentStyle,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();

  const backgroundColor =
    background === 'inverse'
      ? theme.color.surfaceInverse
      : background === 'surface'
        ? theme.color.surface
        : theme.color.bg;

  const horizontalPadding = padded ? theme.layout.gutter : 0;
  /** Si hay footer fijo, el inset inferior lo aplica el footer, no el scroll. */
  const bottomPadding = footer ? theme.spacing.lg : insets.bottom + theme.spacing.lg;

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        {
          paddingHorizontal: horizontalPadding,
          paddingBottom: bottomPadding,
        },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        { paddingHorizontal: horizontalPadding },
        !footer ? { paddingBottom: insets.bottom } : null,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.flex}
      // `padding` en iOS y `height` en Android es la combinación que funciona
      // en las dos plataformas con el teclado nativo.
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[styles.flex, { backgroundColor }, style]}>
      <StatusBar style={statusBar ?? (background === 'inverse' ? 'light' : 'dark')} />
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + theme.spacing.md,
              paddingHorizontal: theme.layout.gutter,
              backgroundColor,
              borderTopColor:
                background === 'inverse' ? theme.color.borderInverse : theme.color.border,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: {
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
});
