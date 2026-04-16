import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  AvatarFallbackText,
  Box,
  Button,
  ButtonText,
  Card,
  Heading,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { Colors } from "../../constants/Colors";
import { useBusiness } from "../../contexts/BusinessContext";
import { useClients } from "../../contexts/ClientContext";

export default function ClientScreen() {
  const { businessId } = useLocalSearchParams();
  const { businesses } = useBusiness();
  const { clients, loadClientsByBusiness, clearClients } = useClients();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const business = businesses.find((b) => b.id === businessId);

  useEffect(() => {
    if (!businessId) return;

    setLoading(true);
    clearClients();

    loadClientsByBusiness(String(businessId)).finally(() => setLoading(false));
  }, [businessId]);

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredClients = clients.filter((client) =>
    normalizeText(`${client.name}`).includes(normalizeText(searchText)),
  );

  const handleClientPress = (clientId: string) => {
    router.push(`/(client)/clientDetail?id=${clientId}`);
  };

  const getStatusColor = (status: string) => {
    return status === "al_dia" ? Colors.success : Colors.error;
  };

  const getStatusText = (status: string) => {
    return status === "al_dia" ? "Al día" : "Debe";
  };

  const handleAddClient = () => {
    router.push({
      pathname: "/(client)/addClientCredit",
      params: { businessId: String(businessId) },
    });
  };
  if (loading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text>Cargando clientes...</Text>
      </Box>
    );
  }

  console.log("BusinessId recibido:", businessId);
  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Clientes" showBack />
      <Box
        bg="$white"
        p="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderLight200"
      >
        <VStack space="md">
          <VStack space="xs" alignItems="center">
            <Heading size="xl" color={Colors.primary}>
              Mis Clientes - {business?.name ?? "Negocio"}
            </Heading>
            <Text size="sm" color="$textLight500">
              {filteredClients.length} de {clients.length} clientes
            </Text>
          </VStack>

          <HStack
            alignItems="center"
            space="sm"
            bg="$backgroundLight50"
            borderRadius={8}
            borderWidth={1}
            borderColor="$borderLight200"
            px="$3"
            h={44}
          >
            <Ionicons name="search" size={18} color={Colors.gray400} />
            <Input
              flex={1}
              variant="outline"
              size="sm"
              bg="transparent"
              borderWidth={0}
            >
              <InputField
                placeholder="Buscar cliente..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </Input>
          </HStack>
        </VStack>
      </Box>

      <ScrollView flex={1} p="$4" contentContainerStyle={{ paddingBottom: 88 }}>
        <VStack space="md">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              p="$4"
              bg="$white"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderLight200"
              shadowOpacity={0}
              elevation={0}
              $pressed={{
                bg: "$backgroundLight100",
                borderColor: Colors.primary,
              }}
            >
              <Pressable onPress={() => handleClientPress(client.id)}>
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space="md" flex={1}>
                    <Avatar size="md" bg={Colors.gray200} borderRadius="$full">
                      <AvatarFallbackText color={Colors.gray600}>
                        {client.name}
                      </AvatarFallbackText>
                    </Avatar>
                    <VStack flex={1}>
                      <Text
                        size="md"
                        fontWeight="$semibold"
                        color={Colors.primary}
                      >
                        {client.name}
                      </Text>
                      <HStack alignItems="center" space="xs">
                        <Box
                          w={8}
                          h={8}
                          borderRadius="$full"
                          bg={getStatusColor(client.status)}
                        />
                        <Text
                          size="sm"
                          color={getStatusColor(client.status)}
                          fontWeight="$medium"
                        >
                          {getStatusText(client.status)}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.gray400}
                  />
                </HStack>
              </Pressable>
            </Card>
          ))}
        </VStack>
      </ScrollView>
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p="$4"
        bg="$backgroundLight50"
        borderTopWidth={1}
        borderTopColor="$borderLight200"
      >
        <Button
          size="lg"
          w="100%"
          h={52}
          borderRadius={14}
          bg={Colors.primary}
          $pressed={{
            bg: Colors.primaryHover,
          }}
          onPress={handleAddClient}
        >
          <HStack alignItems="center" justifyContent="space-between" w="100%">
            <ButtonText color={Colors.white}>Agregar cliente</ButtonText>
            <Ionicons name="add" size={20} color={Colors.white} />
          </HStack>
        </Button>
      </Box>
    </Box>
  );
}
