import { Ionicons } from "@expo/vector-icons";
import {
  Avatar, AvatarFallbackText, Box, Button, ButtonText, Card, Heading,
  HStack, Input, InputField, Pressable, ScrollView, Text, VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { Colors } from "../../../constants/Colors";
import { useBusiness } from "../../../contexts/BusinessContext";
import { Client, useClients } from "../../../contexts/ClientContext";
import api from "../../../utils/api";

const normalizeText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function DebtorsTab() {
  const { businesses } = useBusiness();
  const { setClients } = useClients();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businesses.length) return;
    setLoading(true);
    Promise.all(businesses.map((b) => api.get(`/business/${b.id}/debtors`)))
      .then((responses) => {
        const merged: Client[] = responses.flatMap((r) => r.data);
        const unique = Array.from(new Map(merged.map((c) => [c.id, c])).values());
        setAllClients(unique);
        setClients(unique);
      })
      .finally(() => setLoading(false));
  }, [businesses, setClients]);

  const filtered = allClients.filter((c) =>
    normalizeText(c.name).includes(normalizeText(searchText))
  );

  const getStatusColor = (status: string) =>
    status === "al_dia" ? Colors.success : Colors.error;

  const getStatusText = (status: string) =>
    status === "al_dia" ? "Al día" : "Debe";

  const handleAddClient = () => {
    if (!businesses.length) return;
    router.push({
      pathname: "/(client)/addClientCredit",
      params: { businessId: businesses[0].id },
    });
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header />
      <Box bg="$white" p="$4" borderBottomWidth={1} borderBottomColor="$borderLight200">
        <VStack space="md">
          <VStack space="xs" alignItems="center">
            <Heading size="xl" color={Colors.primary}>Mis Clientes</Heading>
            <Text size="sm" color="$textLight500">
              {filtered.length} de {allClients.length} clientes
            </Text>
          </VStack>
          <HStack alignItems="center" space="sm" bg="$backgroundLight50"
            borderRadius={8} borderWidth={1} borderColor="$borderLight200" px="$3" h={44}>
            <Ionicons name="search" size={18} color={Colors.gray400} />
            <Input flex={1} variant="outline" size="sm" bg="transparent" borderWidth={0}>
              <InputField placeholder="Buscar cliente..." value={searchText} onChangeText={setSearchText} />
            </Input>
          </HStack>
        </VStack>
      </Box>

      <ScrollView flex={1} p="$4" contentContainerStyle={{ paddingBottom: 88 }}>
        {loading ? (
          <Text size="sm" color="$textLight500" textAlign="center" mt="$4">Cargando clientes...</Text>
        ) : filtered.length === 0 ? (
          <Text size="sm" color="$textLight500" textAlign="center" mt="$4">No se encontraron clientes</Text>
        ) : (
          <VStack space="md">
            {filtered.map((client) => (
              <Pressable key={client.id} onPress={() => router.push(`/(client)/clientDetail?id=${client.id}`)}>
                <Card p="$4" bg="$white" borderRadius={12} borderWidth={1}
                  borderColor="$borderLight200" shadowOpacity={0} elevation={0}
                  $pressed={{ bg: "$backgroundLight100", borderColor: Colors.primary }}>
                  <HStack alignItems="center" justifyContent="space-between">
                    <HStack alignItems="center" space="md" flex={1}>
                      <Avatar size="md" bg={Colors.gray200} borderRadius="$full">
                        <AvatarFallbackText color={Colors.gray600}>{client.name}</AvatarFallbackText>
                      </Avatar>
                      <VStack flex={1}>
                        <Text size="md" fontWeight="$semibold" color={Colors.primary}>{client.name}</Text>
                        <HStack alignItems="center" space="xs">
                          <Box w={8} h={8} borderRadius="$full" bg={getStatusColor(client.status)} />
                          <Text size="sm" color={getStatusColor(client.status)} fontWeight="$medium">
                            {getStatusText(client.status)}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                  </HStack>
                </Card>
              </Pressable>
            ))}
          </VStack>
        )}
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
          $pressed={{ bg: Colors.primaryHover }}
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
