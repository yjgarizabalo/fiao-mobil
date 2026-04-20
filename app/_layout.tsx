// provider
import { AuthProvider } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { DebtsProvider } from '@/contexts/DebtsContext';
import { PaymentProvider } from '@/contexts/PaymentsContext';

// config
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <AuthProvider>
        <ClientProvider>
          <BusinessProvider>
            <DebtsProvider>
              <PaymentProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(main)" />
                  <Stack.Screen name="(client)" />
                  <Stack.Screen name="(business)" />
                </Stack>
              </PaymentProvider>
            </DebtsProvider>
          </BusinessProvider>
          <StatusBar style="auto" />
        </ClientProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}