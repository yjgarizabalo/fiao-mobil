import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Card,
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { ImageBackground } from "react-native";

export default function HomeScreen() {
  const { user } = useAuth();
  const { businesses } = useBusiness();

  const handleViewClients = () => {
    router.push("/(client)/clientList");
  };

  const handleViewBusiness = () => {
    router.push("/(business)/businessList");
  };

  const displayName = user?.firstName ?? user?.name ?? "Usuario";

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header />
      <ScrollView flex={1} p="$4">
        <VStack space="xl">
          {/* Banner saludo */}
          <ImageBackground
            source={require("@/assets/images/banner_fiao_sin_logo.png")}
            resizeMode="cover"
            style={{ borderRadius: 20, overflow: "hidden" }}
            imageStyle={{ borderRadius: 20 }}
          >
            {/* Overlay oscuro para garantizar legibilidad */}
            <Box
              px="$5"
              pt="$6"
              pb="$6"
              style={{
                backgroundColor: "rgba(0,0,0,0.38)",
                borderRadius: 20,
              }}
            >
              <VStack space="xs">
                <Text
                  size="sm"
                  style={{ color: "rgba(255,255,255,0.65)", letterSpacing: 0.8, textTransform: "uppercase" }}
                >
                  Bienvenido de nuevo
                </Text>
                <Heading
                  size="2xl"
                  style={{ color: "#ffffff", lineHeight: 34 }}
                >
                  ¡Hola,{" "}
                  <Text
                    size="3xl"
                    fontWeight="$bold"
                    style={{ color: "#4ade80" }}
                  >
                    {displayName}!
                  </Text>
                </Heading>
                <Text
                  size="sm"
                  mt="$1"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Tu negocio hoy tiene movimiento.
                </Text>
              </VStack>
            </Box>
          </ImageBackground>

          {/* Cards principales */}
          <HStack space="md">
            <Pressable flex={1} onPress={handleViewClients}>
              <Card
                p="$5"
                h={160}
                bg="$white"
                borderRadius={16}
                borderWidth={1}
                borderColor="$borderLight200"
                justifyContent="space-between"
                $pressed={{
                  bg: "$backgroundLight100",
                  borderColor: Colors.primary,
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={Colors.gray600}
                />
                <VStack space="xs">
                  <Text size="md" fontWeight="$semibold" color={Colors.primary}>
                    Ver mis vales
                  </Text>
                  <Text
                    size="xs"
                    color={Colors.gray400}
                    textTransform="uppercase"
                  >
                    clientes
                  </Text>
                </VStack>
              </Card>
            </Pressable>

            <Pressable flex={1} onPress={handleViewBusiness}>
              <Card
                p="$5"
                h={160}
                bg="$white"
                borderRadius={16}
                borderWidth={1}
                borderColor="$borderLight200"
                justifyContent="space-between"
                $pressed={{
                  bg: "$backgroundLight100",
                  borderColor: Colors.primary,
                }}
              >
                <Ionicons
                  name="storefront-outline"
                  size={28}
                  color={Colors.gray600}
                />
                <VStack space="xs">
                  <Text size="md" fontWeight="$semibold" color={Colors.primary}>
                    Ver mi negocio
                  </Text>
                  <Text
                    size="xs"
                    color={Colors.gray400}
                    textTransform="uppercase"
                  >
                    tiendas
                  </Text>
                </VStack>
              </Card>
            </Pressable>
          </HStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}