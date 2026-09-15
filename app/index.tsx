/**
 * Puerta de entrada.
 *
 * Aquí estaba el bug histórico: `const isAuthenticated = false` fijo, así que
 * el arranque **siempre** mandaba al login aunque hubiera sesión guardada en
 * AsyncStorage. Ahora la decisión la toma el `status` real de la sesión, que
 * se rehidrata desde el almacenamiento al abrir la app.
 *
 * Mientras se rehidrata se muestra la pantalla de marca, no un flash blanco:
 * es el primer contacto visual con la app y merece cuidado.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { routes } from '../src/core/navigation/routes';
import { useSession } from '../src/features/auth/session/SessionProvider';
import { Text } from '../src/ui';
import { theme } from '../src/theme';

export default function IndexScreen() {
  const { status } = useSession();

  if (status === 'loading') return <SplashScreen />;

  return <Redirect href={status === 'authenticated' ? routes.tabs.home : routes.auth.login} />;
}

const SplashScreen = () => (
  <LinearGradient colors={theme.gradient.hero} style={styles.container}>
    <View style={styles.brand}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        contentFit="contain"
        transition={200}
      />
      <Text variant="title1" color="textInverse">
        Fiao
      </Text>
      <Text variant="caption" color="textInverseMuted">
        Tus vales, siempre al día
      </Text>
    </View>

    <ActivityIndicator color={theme.palette.brand[300]} style={styles.spinner} />
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
  },
  spinner: {
    position: 'absolute',
    bottom: 80,
  },
});
