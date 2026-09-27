/**
 * Aviso sutil de "estás viendo datos guardados".
 *
 * Aparece cuando una pantalla muestra información de la caché local que la red
 * aún no ha confirmado en esta sesión: pasa cuando el backend gratuito está
 * despertando (arranque en frío) o no hay conexión. Es informativo, no un error
 * —los datos siguen ahí y la app revalida sola en cuanto el servidor responde—,
 * así que usa el mismo lenguaje visual de `Badge`, en tono neutro.
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Badge } from './Badge';
import { theme } from '@/theme';

export interface StaleNoticeProps {
  visible: boolean;
  /** Texto alternativo; por defecto el mensaje estándar. */
  label?: string;
  style?: ViewStyle;
}

export const StaleNotice = ({
  visible,
  label = 'Mostrando datos guardados',
  style,
}: StaleNoticeProps) => {
  if (!visible) return null;
  return (
    <View style={[styles.host, style]}>
      <Badge label={label} tone="neutral" icon="cloud-offline-outline" size="sm" />
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
});
