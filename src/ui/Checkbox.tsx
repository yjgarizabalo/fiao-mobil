/**
 * Marca de selección múltiple.
 *
 * Mismo lenguaje visual que el círculo de `OptionPicker`: relleno de marca con
 * `checkmark-circle` cuando está marcada, círculo vacío con borde cuando no.
 * Es puramente visual —el toque lo maneja quien la envuelve, normalmente una
 * fila con `PressableScale`— para no anidar un presionable dentro de otro.
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

export interface CheckboxProps {
  checked: boolean;
  /** Círculo apagado: el elemento no se puede seleccionar. */
  disabled?: boolean;
  size?: number;
  style?: ViewStyle;
}

export const Checkbox = ({ checked, disabled = false, size = 22, style }: CheckboxProps) => {
  if (checked) {
    return (
      <View style={style}>
        <Ionicons
          name="checkmark-circle"
          size={size}
          color={disabled ? theme.color.disabledText : theme.color.brand}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.empty,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: disabled ? theme.color.disabled : theme.color.borderStrong,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  empty: {
    borderWidth: 2,
  },
});
