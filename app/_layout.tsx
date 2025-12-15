import { BusinessProvider } from '@/contexts/BusinessContext';
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { ClientProvider } from '../contexts/ClientContext';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <AuthProvider>
        <ClientProvider>
          <BusinessProvider>
            <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="(client)" />
            <Stack.Screen name="(business)" />
          </Stack>
          </BusinessProvider>
          <StatusBar style="auto" />
        </ClientProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}