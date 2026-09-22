/**
 * Cola de envío de recordatorios por WhatsApp a varios clientes.
 *
 * WhatsApp no tiene una API gratuita para enviar mensajes sin interacción
 * (ver `@/core/utils/whatsapp`), así que "masivo" aquí significa: se abre
 * WhatsApp una vez por cliente, con el mensaje ya escrito, y el tendero
 * confirma el envío desde WhatsApp. Esta hoja lo hace cómodo — no obliga a
 * volver a la lista entre cliente y cliente — mostrando a todos los
 * seleccionados en una cola donde cada uno se marca como enviado al volver.
 */
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { toAppError } from '@/core/errors/AppError';
import { haptics } from '@/core/haptics';
import { formatMoney } from '@/core/utils/format';
import { buildDebtReminder, buildWhatsAppUrl } from '@/core/utils/whatsapp';
import { type Debtor, debtorBalance } from '@/domain/models';
import { Avatar, Badge, Dialog, Divider, IconButton, Sheet, Text, useDialog } from '@/ui';
import { theme } from '@/theme';

export interface WhatsAppBulkSheetProps {
  visible: boolean;
  debtors: Debtor[];
  /** Nombre del negocio que cobra, para personalizar el mensaje de cada uno. */
  getBusinessName: (debtor: Debtor) => string | undefined;
  /** Se avisa cuántos recordatorios se alcanzaron a enviar al cerrar la hoja. */
  onClose: (sentCount: number) => void;
}

export const WhatsAppBulkSheet = ({
  visible,
  debtors,
  getBusinessName,
  onClose,
}: WhatsAppBulkSheetProps) => {
  const dialog = useDialog();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // La cola arranca limpia cada vez que se abre con una nueva selección.
  useEffect(() => {
    if (visible) setSentIds(new Set());
  }, [visible]);

  const sendTo = async (debtor: Debtor) => {
    const url = buildWhatsAppUrl(
      debtor.phone,
      buildDebtReminder({
        debtorName: debtor.name,
        businessName: getBusinessName(debtor),
        formattedBalance: formatMoney(debtorBalance(debtor)),
      }),
    );
    if (!url) return;

    try {
      haptics.tap();
      await Linking.openURL(url);
      setSentIds((current) => new Set(current).add(debtor.id));
    } catch (caught) {
      dialog.showError(toAppError(caught));
    }
  };

  const allSent = debtors.length > 0 && sentIds.size === debtors.length;

  return (
    <>
      <Sheet
        visible={visible}
        onClose={() => onClose(sentIds.size)}
        title="Enviar recordatorio"
        subtitle={
          debtors.length > 0
            ? allSent
              ? 'Todos enviados'
              : `${sentIds.size} de ${debtors.length} enviados`
            : undefined
        }
        scrollable
      >
        <View>
          {debtors.map((debtor, index) => {
            const isSent = sentIds.has(debtor.id);
            return (
              <View key={debtor.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <Avatar name={debtor.name} size="sm" />

                  <View style={styles.rowBody}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {debtor.name}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {formatMoney(debtorBalance(debtor))}
                    </Text>
                  </View>

                  {isSent ? (
                    <Badge label="Enviado" tone="success" icon="checkmark-circle" />
                  ) : (
                    <IconButton
                      icon="logo-whatsapp"
                      onPress={() => void sendTo(debtor)}
                      accessibilityLabel={`Enviar recordatorio a ${debtor.name} por WhatsApp`}
                      color={theme.color.brandStrong}
                      surface="soft"
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Sheet>

      <Dialog {...dialog.props} />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
});
