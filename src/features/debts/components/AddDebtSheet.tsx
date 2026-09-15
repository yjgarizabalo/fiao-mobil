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

import { formatMoney } from '../../../core/utils/format';
import { Button, MoneyField, PressableScale, Sheet, Text, TextField } from '../../../ui';
import { theme } from '../../../theme';

export interface AddDebtSheetProps {
  visible: boolean;
  onClose: () => void;
  debtorName: string;
  /** Devuelve una promesa: la hoja muestra el estado de carga hasta que acabe. */
  onSubmit: (values: { amount: number; description: string }) => Promise<void>;
}

/** Montos frecuentes en una tienda de barrio. */
const QUICK_AMOUNTS = [2_000, 5_000, 10_000, 20_000, 50_000];

export const AddDebtSheet = ({
  visible,
  onClose,
  debtorName,
  onSubmit,
}: AddDebtSheetProps) => {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se limpia al abrir, no al cerrar: si el envío falla, el usuario conserva
  // lo que había escrito.
  useEffect(() => {
    if (visible) {
      setAmount(0);
      setDescription('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ amount, description: description.trim() });
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
});
