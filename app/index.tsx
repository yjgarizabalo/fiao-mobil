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

import { routes } from '@/core/navigation/routes';
import { useSession } from '@/features/auth/session/SessionProvider';
import { Text } from '@/ui';
import { theme } from '@/theme';

export default function IndexScreen() {
  const { status } = useSession();

  if (status === 'loading') return <SplashScreen />;

  return <Redirect href={status === 'authenticated' ? routes.tabs.home : routes.auth.login} />;
}

const SplashScreen = () => (
  <LinearGradient colors={theme.gradient.hero} style={styles.container}>
    <View style={styles.brand}>
      <Image
        source={require('../assets/images/icon-blanco.png')}
        style={styles.logo}
        contentFit="contain"
        transition={200}
      />
      <Text variant="body" color="textInverseMuted">
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
    width: 176,
    height: 71,
    marginBottom: theme.spacing.sm,
  },
  spinner: {
    position: 'absolute',
    bottom: 80,
  },
});
