/**
 * Fila de negocio en la lista.
 *
 * Es la hermana de `DebtorRow`: comparte **exactamente** los mismos tokens de
 * tarjeta (radio `lg`, borde `hairlineWidth*2`, paddings `lg`/`md`) para que la
 * lista de negocios y la de clientes se lean como parte del mismo sistema.
 * Antes la tarjeta se armaba a mano en la pantalla con un radio `xl` y un borde
 * `1.5` literales —más redondeada y con distinto grosor— y se notaba que "no
 * eran iguales".
 *
 * Añade dos cosas propias del negocio, que `ListRow` no cubre y por eso esto es
 * un componente aparte (igual que `DebtorRow`): el estado "activo" resaltado en
 * verde marca, y el botón secundario para cambiar de negocio activo sin salir
 * de la lista.
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { Business } from '@/domain/models';
import { Badge, Button, IconBubble, PressableScale, Text } from '@/ui';
import { theme } from '@/theme';

export interface BusinessRowProps {
  business: Business;
  isActive: boolean;
  /** Ver los clientes de este negocio. */
  onOpen: () => void;
  /** Marcar este negocio como el activo. */
  onSelect: () => void;
}

export const BusinessRow = ({ business, isActive, onOpen, onSelect }: BusinessRowProps) => (
  <View style={[styles.container, isActive ? styles.containerActive : null]}>
    <PressableScale
      onPress={onOpen}
      haptic="tap"
      activeScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={`Ver los clientes de ${business.name}`}
      style={styles.main}
    >
      <IconBubble icon="storefront" tone={isActive ? 'brand' : 'neutral'} size={48} />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {business.name}
          </Text>
          {isActive ? <Badge label="Activo" tone="brand" /> : null}
        </View>

        {business.address ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {business.address}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.color.textSubtle} />
    </PressableScale>

    {!isActive ? (
      <Button
        label="Usar este negocio"
        variant="ghost"
        size="sm"
        icon="swap-horizontal-outline"
        onPress={onSelect}
        fullWidth
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  /* Mismos tokens que DebtorRow.styles.container: es lo que unifica el look. */
  container: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: theme.color.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  containerActive: {
    borderColor: theme.color.brand,
    backgroundColor: theme.color.brandSoft,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
});
