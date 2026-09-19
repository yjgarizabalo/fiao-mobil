/**
 * Feedback táctil.
 *
 * Es la mitad de la sensación "app cara": el botón que confirma un pago
 * vibra distinto al que muestra un error. Envuelto en helpers propios porque
 * (a) en web no existe y debe ser un no-op silencioso, y (b) así se usa el
 * mismo vocabulario en toda la app en lugar de elegir un estilo al azar.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Las promesas se ignoran a propósito: el feedback nunca debe romper un flujo. */
const safely = (action: () => Promise<void>) => {
  if (!isSupported) return;
  action().catch(() => {
    /* silencio: un fallo de vibración no es un error de la app */
  });
};

export const haptics = {
  /** Toque ligero: seleccionar un elemento, cambiar de pestaña. */
  select: () => safely(() => Haptics.selectionAsync()),
  /** Toque medio: abrir una hoja, pulsar un botón secundario. */
  tap: () =>
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Golpe firme: acción primaria confirmada. */
  press: () =>
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Éxito: pago registrado, cliente creado. */
  success: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Advertencia: monto que supera el saldo. */
  warning: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Error: falló la operación. */
  error: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;
