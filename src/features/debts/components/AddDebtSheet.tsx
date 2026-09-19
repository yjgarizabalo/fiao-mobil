/**
 * Hoja para registrar una deuda nueva ("fiar").
 *
 * Detalle de UX pensado para el caso real: el tendero está atendiendo y tiene
 * que registrar rápido. Por eso hay montos rápidos —los valores más comunes de
 * una tienda de barrio— y el campo de monto llega enfocado, con teclado
 * numérico y la cifra en grande.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney } from '@/core/utils/format';
import { Button, MoneyField, PressableScale, Sheet, Text, TextField } from '@/ui';
import { theme } from '@/theme';

export interface AddDebtSheetProps {
  visible: boolean;
  onClose: () => void;
  debtorName: string;
  /** Devuelve una promesa: la hoja muestra el estado de carga hasta que acabe. */
  onSubmit: (values: {
    amount: number;
    description: string;
    /** ISO-8601, o `undefined` si el tendero no fijó plazo. */
    dueDate: string | undefined;
  }) => Promise<void>;
}

/** Montos frecuentes en una tienda de barrio. */
const QUICK_AMOUNTS = [2_000, 5_000, 10_000, 20_000, 50_000];

/**
 * Plazos en días. Se ofrecen como atajos en vez de un calendario porque el
 * tendero está atendiendo: "para el otro sábado" es un toque, no seis.
 * `null` = sin plazo, que es lo que el backend guarda cuando no se manda nada.
 */
const DUE_OPTIONS: { label: string; days: number | null }[] = [
  { label: 'Sin plazo', days: null },
  { label: '8 días', days: 8 },
  { label: '15 días', days: 15 },
  { label: '30 días', days: 30 },
];

/** Fecha ISO a N días de hoy, al final del día para no vencer a mitad de jornada. */
const dueDateFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 0);
  return date.toISOString();
};

export const AddDebtSheet = ({
  visible,
  onClose,
  debtorName,
  onSubmit,
}: AddDebtSheetProps) => {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [dueDays, setDueDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se limpia al abrir, no al cerrar: si el envío falla, el usuario conserva
  // lo que había escrito.
  useEffect(() => {
    if (visible) {
      setAmount(0);
      setDescription('');
      setDueDays(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        amount,
        description: description.trim(),
        dueDate: dueDays === null ? undefined : dueDateFromNow(dueDays),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Agregar deuda"
      subtitle={`A nombre de ${debtorName}`}
      dismissible={!isSubmitting}
      scrollable
      footer={
        <Button
          label={amount > 0 ? `Fiar ${formatMoney(amount)}` : 'Fiar'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={amount <= 0}
          size="lg"
          fullWidth
        />
      }
    >
      <MoneyField
        value={amount}
        onChangeValue={setAmount}
        label="¿Cuánto le vas a fiar?"
        size="hero"
        autoFocus
      />

      <View style={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((quickAmount) => (
          <PressableScale
            key={quickAmount}
            onPress={() => setAmount((current) => current + quickAmount)}
            haptic="select"
            activeScale={0.94}
            accessibilityRole="button"
            accessibilityLabel={`Sumar ${formatMoney(quickAmount)}`}
            style={styles.chip}
          >
            <Text variant="captionStrong" color="brandStrong">
              +{formatMoney(quickAmount)}
            </Text>
          </PressableScale>
        ))}
      </View>

      <View style={styles.dueSection}>
        <Text variant="captionStrong" color="textMuted">
          ¿Cuándo te lo paga?
        </Text>

        <View style={styles.dueOptions}>
          {DUE_OPTIONS.map((option) => {
            const isActive = option.days === dueDays;
            return (
              <PressableScale
                key={option.label}
                onPress={() => setDueDays(option.days)}
                haptic="select"
                activeScale={0.95}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={option.label}
                style={[styles.dueChip, isActive ? styles.dueChipActive : null]}
              >
                <Text
                  variant="captionStrong"
                  color={isActive ? 'brandOn' : 'textMuted'}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {dueDays !== null ? (
          <Text variant="caption" color="textMuted">
            Vence el {formatDate(dueDateFromNow(dueDays))}
          </Text>
        ) : null}
      </View>

      <TextField
        label="¿Qué le fiaste? (opcional)"
        placeholder="Pan, leche, arroz…"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={2}
        maxLength={140}
        helper="Te ayuda a recordar de qué era la deuda"
        returnKeyType="done"
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  chip: {
    backgroundColor: theme.color.brandSoft,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  dueSection: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  dueOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dueChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceSunken,
    paddingHorizontal: theme.spacing.xs,
  },
  dueChipActive: {
    backgroundColor: theme.color.brand,
  },
});
