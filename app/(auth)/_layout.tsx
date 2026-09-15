/**
 * Stack de autenticación.
 *
 * Si el usuario ya tiene sesión y llega aquí (por ejemplo con un deep link),
 * se le redirige a la app en lugar de mostrarle el login otra vez.
 */
import { Redirect, Stack } from 'expo-router';

import { routes } from '../../src/core/navigation/routes';
import { useSession } from '../../src/features/auth/session/SessionProvider';

export default function AuthLayout() {
  const { status } = useSession();

  if (status === 'authenticated') return <Redirect href={routes.tabs.home} />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
