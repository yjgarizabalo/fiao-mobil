/**
 * Fila de cliente en la lista.
 *
 * Es la unidad de información más repetida de la app, así que está diseñada
 * para leerse de un vistazo: avatar con punto de estado, nombre, teléfono y
 * —a la derecha, alineado y con cifras de ancho fijo— el saldo, en rojo si
 * debe y en gris si está al día.
 *
 * En modo selección (envío de WhatsApp masivo) cambia el avatar por una
 * marca de selección. Solo se puede marcar a quien debe y tiene celular
 * registrado — a nadie más se le puede escribir un recordatorio de cobro—,
 * así que el resto de las filas se atenúan y dejan de responder al toque.
 */
import { StyleSheet, View } from 'react-native';

import { formatMoney, formatPhone } from '@/core/utils/format';
import { type Debtor, debtorBalance } from '@/domain/models';
import { Avatar, Badge, Checkbox, PressableScale, Text } from '@/ui';
import { theme } from '@/theme';

export interface DebtorRowProps {
  debtor: Debtor;
  onPress: () => void;
  /** Muestra el nombre del negocio (útil en la lista consolidada). */
  businessName?: string;
  /** Modo selección múltiple, para elegir a quién recordarle por WhatsApp. */
  selectable?: boolean;
  selected?: boolean;
}

export const DebtorRow = ({
  debtor,
  onPress,
  businessName,
  selectable = false,
  selected = false,
}: DebtorRowProps) => {
  const balance = debtorBalance(debtor);
  const hasDebt = balance > 0;
  const canSelect = hasDebt && debtor.phone.length > 0;
  const isDisabled = selectable && !canSelect;

  const subtitle = businessName
    ? businessName
    : debtor.phone
      ? formatPhone(debtor.phone)
      : `${debtor.documentType} ${debtor.documentNumber}`;

  const selectionLabel = !canSelect
    ? `no se puede seleccionar (${!hasDebt ? 'sin deuda' : 'sin celular registrado'})`
    : selected
      ? 'seleccionado'
      : 'sin seleccionar';

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      activeScale={0.985}
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected, disabled: isDisabled } : undefined}
      accessibilityLabel={
        selectable
          ? `${debtor.name}, ${selectionLabel}`
          : hasDebt
            ? `${debtor.name}, debe ${formatMoney(balance)}`
            : `${debtor.name}, sin deuda`
      }
      style={[styles.container, isDisabled ? styles.containerDisabled : null]}
    >
      {selectable ? (
        <Checkbox checked={selected} disabled={isDisabled} />
      ) : (
        <Avatar name={debtor.name} status={hasDebt ? 'debt' : 'clear'} />
      )}

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
  containerDisabled: {
    opacity: 0.5,
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
