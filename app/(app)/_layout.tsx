/**
 * Stack de la aplicación autenticada, con guardia de sesión.
 *
 * Antes no había guardia: cualquier pantalla era alcanzable sin sesión y
 * fallaba con 401 al pedir datos. Aquí, si no hay sesión, se redirige al
 * login antes de montar nada.
 *
 * Las pantallas de formulario se presentan como modal en iOS
 * (`presentation: 'modal'`), que es el gesto que los usuarios de iPhone
 * esperan para "crear algo", y como push normal en Android.
 */
import { Redirect, Stack } from 'expo-router';
import { Platform } from 'react-native';

import { routes } from '@/core/navigation/routes';
import { useSession } from '@/features/auth/session/SessionProvider';

export default function AppLayout() {
  const { status } = useSession();

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Redirect href={routes.auth.login} />;

  const formPresentation = Platform.OS === 'ios' ? 'modal' : 'card';

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="client/[id]" />
      <Stack.Screen name="client/new" options={{ presentation: formPresentation }} />
      <Stack.Screen name="client/edit" options={{ presentation: formPresentation }} />
      <Stack.Screen name="business/new" options={{ presentation: formPresentation }} />
      <Stack.Screen name="settings/profile" options={{ presentation: formPresentation }} />
      <Stack.Screen name="settings/security" options={{ presentation: formPresentation }} />
    </Stack>
  );
}
