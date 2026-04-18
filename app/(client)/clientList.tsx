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
import { Client, useClients } from "../../contexts/ClientContext";
import api from "../../utils/api";

export default function ClientScreen() {
  const { businessId } = useLocalSearchParams();
  const { businesses } = useBusiness();
  const { clients, loadClientsByBusiness, clearClients, setClients } = useClients();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const hasBusinessFilter = typeof businessId === "string" && businessId.length > 0;

  const business = businesses.find((b) => b.id === businessId);

  useEffect(() => {
    setLoading(true);
    clearClients();
    if (hasBusinessFilter) {
      loadClientsByBusiness(String(businessId)).finally(() => setLoading(false));
      return;
    }

    if (!businesses.length) {
      setClients([]);
      setLoading(false);
      return;
    }

    Promise.all(businesses.map((b) => api.get(`/business/${b.id}/debtors`)))
      .then((responses) => {
        const merged: Client[] = responses.flatMap((response) => response.data);
        const unique = Array.from(
          new Map(merged.map((client) => [client.id, client])).values(),
        );
        setClients(unique);
      })
      .catch((error) => {
        console.error("Error loading all clients:", error);
        setClients([]);
      })
      .finally(() => setLoading(false));
  }, [
    businessId,
    businesses,
    clearClients,
    hasBusinessFilter,
    loadClientsByBusiness,
    setClients,
  ]);

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
    const targetBusinessId = hasBusinessFilter ? String(businessId) : businesses[0]?.id;
    if (!targetBusinessId) {
      return;
    }

    router.push({
      pathname: "/(client)/addClientCredit",
      params: { businessId: targetBusinessId },
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
              {hasBusinessFilter
                ? `Mis Clientes - ${business?.name ?? "Negocio"}`
                : "Todos mis clientes"}
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
