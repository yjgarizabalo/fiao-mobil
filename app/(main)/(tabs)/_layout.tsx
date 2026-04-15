import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.gray400,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home-outline"
              size={24}
              color={focused ? Colors.black : Colors.gray400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="businesses"
        options={{
          title: "Negocios",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="storefront-outline"
              size={24}
              color={focused ? Colors.black : Colors.gray400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clientes",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="people-outline"
              size={24}
              color={focused ? Colors.black : Colors.gray400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="person"
              size={24}
              color={focused ? Colors.black : Colors.gray400}
            />
          ),
        }}
      />
    </Tabs>
  );
}
