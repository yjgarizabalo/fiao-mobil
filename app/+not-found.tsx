/**
 * Pantalla para rutas que no existen.
 *
 * Antes no había ninguna: un deep link mal escrito dejaba la app en blanco.
 * Con `+not-found` siempre hay una salida hacia el inicio.
 */
import { router } from 'expo-router';

import { routes } from '../src/core/navigation/routes';
import { EmptyState, Screen } from '../src/ui';

export default function NotFoundScreen() {
  return (
    <Screen padded>
      <EmptyState
        icon="compass-outline"
        title="No encontramos esta pantalla"
        message="El enlace que abriste no existe o cambió de lugar."
        actionLabel="Ir al inicio"
        onAction={() => router.replace(routes.root)}
        style={{ flex: 1 }}
      />
    </Screen>
  );
}
