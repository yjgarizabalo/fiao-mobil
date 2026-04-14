import { Stack } from "expo-router";

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="businessList" />
      <Stack.Screen name="addBusiness" />
    </Stack>
  );
}
