/**
 * Pestañas principales.
 *
 * El orden importa: Inicio (resumen), Clientes (el trabajo del día),
 * Negocios (configuración de tiendas) y Perfil. Antes "Negocios" estaba
 * antes que "Clientes", pero la acción más frecuente de un tendero es
 * consultar o cobrar un vale, así que Clientes va primero.
 */
import { Tabs } from 'expo-router';

import { TabBar } from '@/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="businesses" options={{ title: 'Negocios' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
