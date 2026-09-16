/**
 * Selector de opciones basado en bottom sheet.
 *
 * Sustituye al `@react-native-picker/picker` del v1, que se veía distinto en
 * cada plataforma (rueda en iOS, diálogo en Android) y no se podía estilizar.
 * Aquí el control se ve igual en las dos, respeta el design system y elimina
 * una dependencia nativa.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { haptics } from '@/core/haptics';
import { Divider } from './Layout';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { theme } from '@/theme';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  /** Aclaración bajo la etiqueta (p. ej. "Cédula de ciudadanía"). */
  description?: string;
}

export interface OptionPickerProps<T extends string> {
  label?: string;
  value: T;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
  /** Título de la hoja. Por defecto usa `label`. */
  sheetTitle?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const OptionPicker = <T extends string>({
  label,
  value,
  options,
  onChange,
  sheetTitle,
  error,
  containerStyle,
}: OptionPickerProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const handleSelect = (option: PickerOption<T>) => {
    haptics.select();
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="captionStrong" color="textMuted" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <PressableScale
        onPress={() => setIsOpen(true)}
        haptic="tap"
        activeScale={0.99}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Seleccionar'}: ${selected?.label ?? 'sin seleccionar'}`}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <Text variant="bodyLg" color={selected ? 'text' : 'textSubtle'} numberOfLines={1}>
          {selected?.label ?? 'Selecciona una opción'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.color.textSubtle} />
      </PressableScale>

      <View style={styles.messageSlot}>
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </View>

      <Sheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={sheetTitle ?? label ?? 'Selecciona'}
      >
        <View>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <View key={option.value}>
                {index > 0 ? <Divider /> : null}
                <PressableScale
                  onPress={() => handleSelect(option)}
                  haptic={false}
                  activeScale={0.99}
                  style={styles.option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.optionText}>
                    <Text variant="bodyStrong" color={isSelected ? 'brandStrong' : 'text'}>
                      {option.label}
                    </Text>
                    {option.description ? (
                      <Text variant="caption" color="textMuted">
                        {option.description}
                      </Text>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.color.brand} />
                  ) : (
                    <View style={styles.optionEmptyMark} />
                  )}
                </PressableScale>
              </View>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: theme.spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    minHeight: theme.layout.fieldHeight,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceMuted,
    paddingHorizontal: theme.spacing.lg,
  },
  triggerError: {
    borderColor: theme.color.danger,
    backgroundColor: theme.color.dangerSoft,
  },
  messageSlot: {
    minHeight: 20,
    paddingTop: theme.spacing.xs,
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionEmptyMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
  },
});
