/**
 * Fila de cliente en la lista.
 *
 * Es la unidad de información más repetida de la app, así que está diseñada
 * para leerse de un vistazo: avatar con punto de estado, nombre, teléfono y
 * —a la derecha, alineado y con cifras de ancho fijo— el saldo, en rojo si
 * debe y en gris si está al día.
 */
import { StyleSheet, View } from 'react-native';

import { formatMoney, formatPhone } from '@/core/utils/format';
import { type Debtor, debtorBalance } from '@/domain/models';
import { Avatar, Badge, PressableScale, Text } from '@/ui';
import { theme } from '@/theme';

export interface DebtorRowProps {
  debtor: Debtor;
  onPress: () => void;
  /** Muestra el nombre del negocio (útil en la lista consolidada). */
  businessName?: string;
}

export const DebtorRow = ({ debtor, onPress, businessName }: DebtorRowProps) => {
  const balance = debtorBalance(debtor);
  const hasDebt = balance > 0;

  const subtitle = businessName
    ? businessName
    : debtor.phone
      ? formatPhone(debtor.phone)
      : `${debtor.documentType} ${debtor.documentNumber}`;

  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={
        hasDebt
          ? `${debtor.name}, debe ${formatMoney(balance)}`
          : `${debtor.name}, sin deuda`
      }
      style={styles.container}
    >
      <Avatar name={debtor.name} status={hasDebt ? 'debt' : 'clear'} />

      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {debtor.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.amount}>
        {hasDebt ? (
          <>
            <Text variant="money" color="dangerStrong" numberOfLines={1}>
              {formatMoney(balance)}
            </Text>
            <Text variant="overline" color="textSubtle">
              debe
            </Text>
          </>
        ) : (
          <Badge label="Al día" tone="success" icon="checkmark-circle" />
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: theme.color.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  amount: {
    alignItems: 'flex-end',
    gap: 1,
  },
});
