import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="clientDetail" />
      <Stack.Screen name="addClientCredit" />
      <Stack.Screen name="clientList" />
    </Stack>
  );
}