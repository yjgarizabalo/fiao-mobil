/**
 * Layout raíz: providers y stack de navegación.
 *
 * Antes se anidaban seis providers (Gluestack + cinco contexts de dominio).
 * Aquí quedan los tres imprescindibles:
 *  - `GestureHandlerRootView`, requerido por los gestos de los bottom sheets;
 *  - `SafeAreaProvider`, que alimenta los insets reales del dispositivo;
 *  - `SessionProvider` + `BusinessProvider`, el único estado verdaderamente
 *    global, y `ToastProvider` para los avisos.
 */
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { SessionProvider } from '@/features/auth/session/SessionProvider';
import { BusinessProvider } from '@/features/businesses/state/BusinessProvider';
import { ToastProvider } from '@/ui';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <BusinessProvider>
            <ToastProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.color.bg },
                  // Transición nativa: en iOS empuja desde la derecha, en
                  // Android usa la animación del sistema.
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ animation: 'none' }} />
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
              </Stack>
            </ToastProvider>
          </BusinessProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
