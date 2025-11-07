import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClientProvider } from '../contexts/ClientContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <AuthProvider>
        <ClientProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="(client)" />
          </Stack>
          <StatusBar style="auto" />
        </ClientProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}