// Vocabulario de vibración de la app sobre expo-haptics. No-op en web y nunca lanza:
// un componente puede llamar `haptics.tap()` sin preocuparse por la plataforma.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function safe(action: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  action().catch(() => {
    // Vibrar es un extra, nunca debe interrumpir el flujo si falla.
  });
}

export const haptics = {
  select: () => safe(() => Haptics.selectionAsync()),
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
