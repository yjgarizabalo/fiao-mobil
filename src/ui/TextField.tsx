/**
 * Campo de texto del design system.
 *
 * Detalles que hacen la diferencia:
 *  - el borde se anima al enfocar (Reanimated, en el hilo de UI);
 *  - el error aparece debajo sin mover el resto del formulario, porque el
 *    espacio del mensaje está reservado;
 *  - `secureTextEntry` trae su propio botón de ojo, con etiqueta accesible;
 *  - el contenedor entero es presionable y enfoca el input, así que un toque
 *    junto a la etiqueta también funciona.
 */
import { Ionicons } from '@expo/vector-icons';
import {
  type ComponentProps,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from './Text';
import { theme } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Mensaje de error. Cuando existe, el campo se pinta en rojo. */
  error?: string;
  /** Texto de ayuda debajo del campo (se oculta si hay error). */
  helper?: string;
  icon?: IconName;
  /** Elemento a la derecha (por ejemplo un botón "MAX"). */
  accessory?: ReactNode;
  /** Reserva el alto del mensaje para que el layout no salte. `false` lo quita. */
  reserveErrorSpace?: boolean;
  containerStyle?: ViewStyle;
}

export interface TextFieldHandle {
  focus: () => void;
  blur: () => void;
}

export const TextField = forwardRef<TextFieldHandle, TextFieldProps>(
  (
    {
      label,
      error,
      helper,
      icon,
      accessory,
      reserveErrorSpace = true,
      containerStyle,
      secureTextEntry,
      onFocus,
      onBlur,
      editable = true,
      ...rest
    },
    ref,
  ) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isSecretVisible, setIsSecretVisible] = useState(false);

    const focusProgress = useSharedValue(0);
    const errorProgress = useSharedValue(error ? 1 : 0);
    errorProgress.value = withTiming(error ? 1 : 0, { duration: theme.duration.fast });

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }));

    const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
      (event) => {
        setIsFocused(true);
        focusProgress.value = withTiming(1, { duration: theme.duration.fast });
        onFocus?.(event);
      },
      [focusProgress, onFocus],
    );

    const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
      (event) => {
        setIsFocused(false);
        focusProgress.value = withTiming(0, { duration: theme.duration.fast });
        onBlur?.(event);
      },
      [focusProgress, onBlur],
    );

    const animatedBorder = useAnimatedStyle(() => {
      const focusColor = interpolateColor(
        focusProgress.value,
        [0, 1],
        [theme.color.border, theme.color.brand],
      );
      return {
        borderColor: interpolateColor(
          errorProgress.value,
          [0, 1],
          [focusColor, theme.color.danger],
        ),
        backgroundColor: interpolateColor(
          focusProgress.value,
          [0, 1],
          [theme.color.surfaceMuted, theme.color.surface],
        ),
      };
    });

    const iconColor = error
      ? theme.color.danger
      : isFocused
        ? theme.color.brand
        : theme.color.textSubtle;

    return (
      <View style={containerStyle}>
        {label ? (
          <Text variant="captionStrong" color="textMuted" style={styles.label}>
            {label}
          </Text>
        ) : null}

        <Pressable onPress={() => inputRef.current?.focus()} disabled={!editable}>
          <Animated.View
            style={[styles.field, !editable && styles.fieldDisabled, animatedBorder]}
          >
            {icon ? (
              <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
            ) : null}

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholderTextColor={theme.color.textSubtle}
              selectionColor={theme.color.brand}
              cursorColor={theme.color.brand}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={editable}
              secureTextEntry={secureTextEntry && !isSecretVisible}
              accessibilityLabel={label}
              maxFontSizeMultiplier={1.25}
              {...rest}
            />

            {secureTextEntry ? (
              <Pressable
                onPress={() => setIsSecretVisible((visible) => !visible)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={
                  isSecretVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                style={styles.accessory}
              >
                <Ionicons
                  name={isSecretVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.color.textSubtle}
                />
              </Pressable>
            ) : null}

            {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
          </Animated.View>
        </Pressable>

        {reserveErrorSpace || error || helper ? (
          <View style={reserveErrorSpace ? styles.messageSlot : undefined}>
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={13} color={theme.color.danger} />
                <Text variant="caption" color="danger" style={styles.messageText}>
                  {error}
                </Text>
              </View>
            ) : helper ? (
              <Text variant="caption" color="textSubtle">
                {helper}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  label: {
    marginBottom: theme.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.layout.fieldHeight,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.lg,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    ...theme.typography.bodyLg,
    color: theme.color.text,
  },
  accessory: {
    marginLeft: theme.spacing.sm,
  },
  messageSlot: {
    minHeight: 20,
    paddingTop: theme.spacing.xs,
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  messageText: {
    flex: 1,
  },
});
