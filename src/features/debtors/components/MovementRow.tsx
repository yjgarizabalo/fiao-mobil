/**
 * Fila del extracto de movimientos.
 *
 * Una deuda y un pago se distinguen sin leer: icono y color opuestos, y el
 * signo del importe (`+` lo que se fía, `−` lo que abona). Así el extracto se
 * escanea como el cuaderno que reemplaza.
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { formatMoney, formatRelativeDate } from '@/core/utils/format';
import { DEBT_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/domain/constants';
import type { Movement } from '@/domain/models';
import { Badge, PressableScale, Text } from '@/ui';
import { theme } from '@/theme';

export interface MovementRowProps {
  movement: Movement;
  /** Solo las deudas se abren: un abono no tiene más detalle que el que se ve. */
  onPress?: () => void;
}

export const MovementRow = ({ movement, onPress }: MovementRowProps) => {
  const isDebt = movement.kind === 'debt';

  const title = isDebt
    ? movement.debt.description || 'Deuda'
    : `Pago en ${PAYMENT_METHOD_LABEL[movement.payment.method].toLowerCase()}`;

  const subtitle = isDebt
    ? formatRelativeDate(movement.debt.createdAt ?? movement.debt.dueDate)
    : [formatRelativeDate(movement.payment.createdAt), movement.payment.note]
        .filter(Boolean)
        .join(' · ');

  const content = (
    <>
      <View
        style={[
          styles.icon,
          { backgroundColor: isDebt ? theme.color.dangerSoft : theme.color.brandSoft },
        ]}
      >
        <Ionicons
          name={isDebt ? 'arrow-up' : 'arrow-down'}
          size={17}
          color={isDebt ? theme.color.dangerStrong : theme.color.brandStrong}
        />
      </View>

      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.amount}>
        <Text
          variant="money"
          color={isDebt ? 'dangerStrong' : 'brandStrong'}
          numberOfLines={1}
        >
          {isDebt ? '+' : '−'}
          {formatMoney(movement.amount)}
        </Text>

        {isDebt && movement.debt.status !== 'OPEN' ? (
          <Badge
            label={DEBT_STATUS_LABEL[movement.debt.status]}
            tone={
              movement.debt.status === 'PAID'
                ? 'success'
                : movement.debt.status === 'CANCELLED'
                  ? 'neutral'
                  : 'warning'
            }
          />
        ) : null}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.container}>{content}</View>;

  return (
    <PressableScale
      onPress={onPress}
      haptic="tap"
      activeScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={`Ver el detalle de ${title}`}
      style={styles.container}
    >
      {content}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  amount: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
});
