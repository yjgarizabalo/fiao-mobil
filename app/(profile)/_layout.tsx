import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return <Stack screenOptions={{ presentation: 'modal', headerShown: false }} />;
}
