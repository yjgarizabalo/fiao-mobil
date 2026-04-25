import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar ninguna redirección hasta que el DOM esté listo
  if (!mounted) return null;

  if (isAuthenticated) {
    return <Redirect href="/(main)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}