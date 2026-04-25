import AddDebtModal from "@/components/AddDebtModal";
import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useBusiness } from "@/contexts/BusinessContext";
import { Client, useClients } from "@/contexts/ClientContext";
import { useDebts } from "@/contexts/DebtsContext";
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
import { router } from "expo-router";
import { useEffect, useState } from "react";

const normalizeText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function DebtorsTab() {
  const { businesses: rawBusinesses } = useBusiness();
  const { clients, setClients, clearClients, loadAllClients } = useClients();
  const { addDebt } = useDebts();

  // Garantizar que siempre sea un array, independiente de lo que devuelva el contexto
  const businesses = Array.isArray(rawBusinesses) ? rawBusinesses : [];

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addingDebt, setAddingDebt] = useState(false);

  useEffect(() => {
    if (!businesses.length) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    clearClients();

    const businessIds = businesses.map((b) => b.id);
    loadAllClients(businessIds).finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses.length]);

  const filteredClients = clients.filter((client) =>
    normalizeText(client.name ?? "").includes(normalizeText(searchText)),
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

  const handleClientPress = (clientId: string) => {
    router.navigate(`/(client)/clientDetail?id=${clientId}`);
  };

  // const handleOpenDebtModal = (client: Client) => {
  //   setSelectedClient(client);
  //   setDebtModalOpen(true);
  // };

  const handleCloseDebtModal = () => {
    setDebtModalOpen(false);
    setSelectedClient(null);
  };

  const handleSubmitDebt = async (data: { amount: number; description: string }) => {
    if (!selectedClient) return;

    const businessId =
      (selectedClient as any).businessId ?? businesses[0]?.id;
    if (!businessId) return;

    setAddingDebt(true);
    try {
      await addDebt({
        businessId,
        debtorId: selectedClient.id,
        amount: data.amount,
        description: data.description,
        dueDate: new Date().toISOString(),
      });
      handleCloseDebtModal();
    } catch (error) {
      console.error("Error al agregar deuda:", error);
    } finally {
      setAddingDebt(false);
    }
  };

  if (loading) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text>Cargando clientes...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header />
      <Box bg="$white" p="$4" borderBottomWidth={1} borderBottomColor="$borderLight200">
        <VStack space="md">
          <VStack space="xs" alignItems="center">
            <Heading size="xl" color={Colors.primary}>Mis Clientes</Heading>
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
            <Input flex={1} variant="outline" size="sm" bg="transparent" borderWidth={0}>
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
            >
              <HStack alignItems="center" justifyContent="space-between">
                <Pressable flex={1} onPress={() => handleClientPress(client.id)}>
                  <HStack alignItems="center" space="md" flex={1}>
                    <Avatar size="md" bg={Colors.gray200} borderRadius="$full">
                      <AvatarFallbackText color={Colors.gray600}>
                        {client.name}
                      </AvatarFallbackText>
                    </Avatar>
                    <VStack flex={1}>
                      <Text size="md" fontWeight="$semibold" color={Colors.primary}>
                        {client.name}
                      </Text>
                      <HStack alignItems="center" space="xs">
                        <Box w={8} h={8} borderRadius="$full" bg={getStatusColor(client.status)} />
                        <Text size="sm" color={getStatusColor(client.status)} fontWeight="$medium">
                          {getStatusText(client.status)}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>

                <HStack alignItems="center" space="sm">
                  {/* <Pressable
                    onPress={() => handleOpenDebtModal(client)}
                    bg={Colors.error}
                    borderRadius={8}
                    px="$3"
                    py="$1"
                    $pressed={{ opacity: 0.8 }}
                  >
                    <HStack alignItems="center" space="xs">
                      <Ionicons name="add-circle-outline" size={16} color={Colors.white} />
                      <Text size="xs" color={Colors.white} fontWeight="$medium">
                        Deuda
                      </Text>
                    </HStack>
                  </Pressable> */}

                  <Pressable onPress={() => handleClientPress(client.id)}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                  </Pressable>
                </HStack>
              </HStack>
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
          $pressed={{ bg: Colors.primaryHover }}
          onPress={handleAddClient}
        >
          <HStack alignItems="center" justifyContent="space-between" w="100%">
            <ButtonText color={Colors.white}>Agregar cliente</ButtonText>
            <Ionicons name="add" size={20} color={Colors.white} />
          </HStack>
        </Button>
      </Box>

      {selectedClient && (
        <AddDebtModal
          isOpen={debtModalOpen}
          onClose={handleCloseDebtModal}
          onSubmit={handleSubmitDebt}
          clientName={selectedClient.name}
          isLoading={addingDebt}
        />
      )}
    </Box>
  );
}