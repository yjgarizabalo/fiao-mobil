/**
 * Campo de monto.
 *
 * Todo el manejo de dinero de la app pasa por aquí, así que el formateo con
 * separador de miles, el teclado numérico y la validación contra un máximo
 * están resueltos en un solo lugar. Muestra el valor como `$ 15.000` mientras
 * el usuario escribe y devuelve siempre el número.
 */
import { StyleSheet, TextInput, View } from 'react-native';

import { formatNumber, parseMoney } from '@/core/utils/format';
import { Text } from './Text';
import { theme } from '@/theme';

export interface MoneyFieldProps {
  value: number;
  onChangeValue: (value: number) => void;
  label?: string;
  /** Monto máximo aceptado. Al superarlo se muestra `maxExceededMessage`. */
  max?: number;
  maxExceededMessage?: string;
  error?: string;
  helper?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** `hero` para la pantalla de pago (cifra gigante centrada). */
  size?: 'field' | 'hero';
}

export const MoneyField = ({
  value,
  onChangeValue,
  label,
  max,
  maxExceededMessage = 'El monto supera el saldo pendiente',
  error,
  helper,
  placeholder = '0',
  autoFocus = false,
  size = 'field',
}: MoneyFieldProps) => {
  const exceedsMax = max !== undefined && value > max;
  const message = error ?? (exceedsMax ? maxExceededMessage : undefined);
  const isHero = size === 'hero';

  const handleChangeText = (text: string) => {
    // Se reconstruye desde los dígitos: así da igual que el usuario pegue
    // "$ 15.000" o escriba "15000".
    onChangeValue(parseMoney(text));
  };

  const displayValue = value > 0 ? formatNumber(value) : '';

  return (
    <View>
      {label ? (
        <Text variant="captionStrong" color="textMuted" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.container,
          isHero ? styles.containerHero : styles.containerField,
          message ? styles.containerError : null,
        ]}
      >
        <Text
          variant={isHero ? 'title1' : 'title3'}
          color={value > 0 ? 'text' : 'textSubtle'}
          style={styles.currency}
        >
          $
        </Text>
        <TextInput
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.color.textSubtle}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          selectionColor={theme.color.brand}
          cursorColor={theme.color.brand}
          accessibilityLabel={label ?? 'Monto'}
          maxFontSizeMultiplier={1.15}
          style={[
            styles.input,
            isHero ? theme.typography.moneyHero : theme.typography.title2,
            { color: message ? theme.color.danger : theme.color.text },
          ]}
        />
      </View>

      <View style={styles.messageSlot}>
        {message ? (
          <Text variant="caption" color="danger">
            {message}
          </Text>
        ) : helper ? (
          <Text variant="caption" color="textSubtle">
            {helper}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: theme.spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceMuted,
  },
  containerField: {
    minHeight: theme.layout.fieldHeight,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  containerHero: {
    justifyContent: 'center',
    borderRadius: theme.radius['2xl'],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  containerError: {
    borderColor: theme.color.danger,
    backgroundColor: theme.color.dangerSoft,
  },
  currency: {
    opacity: 0.7,
  },
  input: {
    flexShrink: 1,
    minWidth: 60,
    paddingVertical: theme.spacing.sm,
  },
  messageSlot: {
    minHeight: 20,
    paddingTop: theme.spacing.xs,
    justifyContent: 'center',
  },
});
