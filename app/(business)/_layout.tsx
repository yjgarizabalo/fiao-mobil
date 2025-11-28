import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="business" />
      <Stack.Screen name="addBusiness" />
    </Stack>
  );
}