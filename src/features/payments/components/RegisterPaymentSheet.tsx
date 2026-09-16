/**
 * Hoja para registrar un pago (abono al saldo del cliente).
 *
 * El caso más común es "me pagó todo", así que la hoja abre con el saldo
 * completo ya puesto y un solo toque lo confirma. Para abonos parciales hay
 * atajos de mitad y de montos redondos, y el campo acepta cualquier cifra.
 *
 * Nunca deja enviar más de lo que se debe: el backend lo rechazaría y el
 * usuario se quedaría sin saber por qué.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/core/utils/format';
import {
  PAYMENT_METHOD_ICON,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/domain/constants';
import { Button, MoneyField, PressableScale, Sheet, Text, TextField } from '@/ui';
import { theme } from '@/theme';

export interface RegisterPaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  debtorName: string;
  /** Saldo pendiente: es el máximo que se puede abonar. */
  balance: number;
  /**
   * Deuda a la que se abona. Sin esto el pago es al saldo total y el backend
   * lo reparte entre las deudas abiertas.
   */
  target?: string;
  onSubmit: (values: {
    amount: number;
    method: PaymentMethod;
    note: string;
  }) => Promise<void>;
}

export const RegisterPaymentSheet = ({
  visible,
  onClose,
  debtorName,
  balance,
  target,
  onSubmit,
}: RegisterPaymentSheetProps) => {
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al abrir se propone el saldo completo, que es el caso más frecuente.
  useEffect(() => {
    if (visible) {
      setAmount(balance);
      setMethod('CASH');
      setNote('');
    }
  }, [visible, balance]);

  const exceedsBalance = amount > balance;
  const isPartial = amount > 0 && amount < balance;
  const remaining = Math.max(0, balance - amount);
  const canSubmit = amount > 0 && !exceedsBalance && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ amount, method, note: note.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={target ? 'Abonar a la deuda' : 'Registrar pago'}
      subtitle={target ? `${debtorName} · ${target}` : `De ${debtorName}`}
      dismissible={!isSubmitting}
      scrollable
      footer={
        <>
          {isPartial ? (
            <View style={styles.remainingNotice}>
              <Ionicons name="information-circle" size={16} color={theme.color.info} />
              <Text variant="caption" color="textMuted" style={styles.remainingText}>
                Después de este abono quedarán{' '}
                <Text variant="captionStrong" color="text">
                  {formatMoney(remaining)}
                </Text>{' '}
                pendientes.
              </Text>
            </View>
          ) : null}

          <Button
            label={amount > 0 ? `Registrar ${formatMoney(amount)}` : 'Registrar pago'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canSubmit}
            size="lg"
            fullWidth
          />
        </>
      }
    >
      {/* Saldo pendiente, para que la decisión se tome con el dato a la vista */}
      <View style={styles.balanceCard}>
        <Text variant="overline" color="textSubtle">
          {target ? 'Falta por pagar de esta deuda' : 'Saldo pendiente'}
        </Text>
        <Text variant="title2" color="dangerStrong">
          {formatMoney(balance)}
        </Text>
      </View>

      <MoneyField
        value={amount}
        onChangeValue={setAmount}
        label="¿Cuánto te pagó?"
        size="hero"
        max={balance}
        maxExceededMessage={`No puede ser mayor al saldo (${formatMoney(balance)})`}
      />

      <View style={styles.shortcuts}>
        <Shortcut
          label="Pagó todo"
          active={amount === balance}
          onPress={() => setAmount(balance)}
        />
        <Shortcut
          label="La mitad"
          active={amount === Math.round(balance / 2)}
          onPress={() => setAmount(Math.round(balance / 2))}
        />
        <Shortcut label="Otro monto" active={false} onPress={() => setAmount(0)} />
      </View>

      <Text variant="captionStrong" color="textMuted" style={styles.methodLabel}>
        ¿Cómo te pagó?
      </Text>

      <View style={styles.methods}>
        {PAYMENT_METHODS.map((paymentMethod) => {
          const isActive = paymentMethod === method;
          return (
            <PressableScale
              key={paymentMethod}
              onPress={() => setMethod(paymentMethod)}
              haptic="select"
              activeScale={0.96}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={PAYMENT_METHOD_LABEL[paymentMethod]}
              style={[styles.method, isActive ? styles.methodActive : null]}
            >
              <Ionicons
                name={PAYMENT_METHOD_ICON[paymentMethod]}
                size={20}
                color={isActive ? theme.color.brandStrong : theme.color.textMuted}
              />
              <Text
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? 'brandStrong' : 'textMuted'}
              >
                {PAYMENT_METHOD_LABEL[paymentMethod]}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <TextField
        label="Nota (opcional)"
        placeholder="Abono de la semana, pagó con transferencia…"
        value={note}
        onChangeText={setNote}
        maxLength={140}
        returnKeyType="done"
      />
    </Sheet>
  );
};

interface ShortcutProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const Shortcut = ({ label, active, onPress }: ShortcutProps) => (
  <PressableScale
    onPress={onPress}
    haptic="select"
    activeScale={0.95}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={[styles.shortcut, active ? styles.shortcutActive : null]}
  >
    <Text
      variant="captionStrong"
      color={active ? 'brandOn' : 'textMuted'}
      numberOfLines={1}
    >
      {label}
    </Text>
  </PressableScale>
);

const styles = StyleSheet.create({
  balanceCard: {
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.color.dangerSoft,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  shortcut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceSunken,
    paddingHorizontal: theme.spacing.sm,
  },
  shortcutActive: {
    backgroundColor: theme.color.brand,
  },
  methodLabel: {
    marginBottom: theme.spacing.sm,
  },
  methods: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  method: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceMuted,
    paddingVertical: theme.spacing.md,
  },
  methodActive: {
    borderColor: theme.color.brand,
    backgroundColor: theme.color.brandSoft,
  },
  remainingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.color.infoSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  remainingText: {
    flex: 1,
  },
});
