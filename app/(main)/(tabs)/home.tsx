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
import Header from "../../../components/Header";
import { Colors } from "../../../constants/Colors";
import { useAuth } from "../../../contexts/AuthContext";
import { useBusiness } from "../../../contexts/BusinessContext";

export default function HomeScreen() {
  const { user } = useAuth();
  const { businesses } = useBusiness();

  const handleViewClients = () => {
    if (businesses.length > 0) {
      router.push({
        pathname: "/(client)/clientList",
        params: { businessId: businesses[0].id, key: businesses[0].id },
      });
    }
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
          {/* Saludo */}
          <VStack space="xs" pt="$2">
            <Heading size="4xl" color={Colors.primary}>
              ¡Hola,{" "}
              <Text size="4xl" fontWeight="$bold" color="#2563eb">
                Don, {displayName}!
              </Text>
            </Heading>
            <Text size="md" color={Colors.gray400}>
              Tu negocio hoy tiene movimiento.
            </Text>
          </VStack>

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
