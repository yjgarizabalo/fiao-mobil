import AddDebtModal from "@/components/AddDebtModal";
import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useBusiness } from "@/contexts/BusinessContext";
import { Client, useClients } from "@/contexts/ClientContext";
import { useDebts } from "@/contexts/DebtsContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonText,
  Heading,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// Balance = suma de remainingAmount de las deudas del cliente.
// Retorna -1 si las deudas de ese cliente aún no están en el mapa (cargando).
const getBalanceFromMap = (
  clientId: string,
  debtsMap: Record<string, any[]>
): number => {
  if (!(clientId in debtsMap)) return -1;
  return (debtsMap[clientId] ?? []).reduce(
    (sum: number, d: any) => sum + Number(d.remainingAmount ?? 0),
    0
  );
};

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const normalizeText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function DebtorsTab() {
  const router = useRouter();
  const { businesses: rawBusinesses } = useBusiness();
  const { clients, pagination, loadAllClients, clearClients } = useClients();
  const { addDebt, clearDebts, debtsMap, loadDebtsByClients } = useDebts();

  const businesses = Array.isArray(rawBusinesses) ? rawBusinesses : [];

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const initialLoadDone = useRef(false);
  const currentPageRef = useRef(currentPage);

  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addingDebt, setAddingDebt] = useState(false);

  // ── Único mecanismo para disparar loadDebtsByClients ─────────────────────
  // Se incrementa explícitamente después de cada carga de clientes (carga
  // inicial, foco, paginación, post-mutación). Se eliminó el useEffect sobre
  // [clients] que corría en paralelo con éste y causaba doble llamada a la API.
  const [debtsLoadTrigger, setDebtsLoadTrigger] = useState(0);

  useEffect(() => {
    if (!clients.length || debtsLoadTrigger === 0) return;
    const input = clients.map((c) => ({
      id: c.id,
      businessId: (c as any).businessId ?? businesses[0]?.id ?? "",
    }));
    loadDebtsByClients(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtsLoadTrigger]);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    currentPageRef.current = 1;
    clearClients();
    clearDebts();
    initialLoadDone.current = false;

    loadAllClients(1, LIMIT).finally(() => {
      setLoading(false);
      initialLoadDone.current = true;
      // Disparar deudas una sola vez al terminar la carga inicial
      setDebtsLoadTrigger(1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // ── Refrescar al recuperar foco ───────────────────────────────────────────
  // Recarga clientes y luego incrementa el trigger para que las deudas se
  // recarguen exactamente una vez, sin importar si clients[] cambió o no.
  useFocusEffect(
    useCallback(() => {
      if (!initialLoadDone.current) return;

      const reload = async () => {
        await loadAllClients(currentPageRef.current, LIMIT);
        setDebtsLoadTrigger((n) => n + 1);
      };

      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // ── Cambio de página ──────────────────────────────────────────────────────
  const handlePageChange = async (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;
    setPageLoading(true);
    setCurrentPage(page);
    currentPageRef.current = page;
    await loadAllClients(page, LIMIT);
    setDebtsLoadTrigger((n) => n + 1);
    setPageLoading(false);
  };

  const filteredClients = clients.filter((client) =>
    normalizeText(client.name ?? "").includes(normalizeText(searchText))
  );

  const handleClientPress = (client: Client) => {
    router.navigate(
      `/(client)/clientDetail?id=${client.id}&businessId=${(client as any).businessId ?? businesses[0]?.id}` as any
    );
  };

  const handleAddClient = () => {
    const targetBusinessId = businesses[0]?.id;
    if (!targetBusinessId) return;
    router.navigate({
      pathname: "/(client)/addClientCredit",
      params: { businessId: targetBusinessId },
    } as any);
  };

  const handleCloseDebtModal = () => {
    setDebtModalOpen(false);
    setSelectedClient(null);
  };

  const handleSubmitDebt = async (data: { amount: number; description: string }) => {
    if (!selectedClient) return;
    const targetBusinessId = (selectedClient as any).businessId ?? businesses[0]?.id;
    if (!targetBusinessId) return;
    setAddingDebt(true);
    try {
      await addDebt({
        businessId: targetBusinessId,
        debtorId: selectedClient.id,
        amount: data.amount,
        description: data.description,
        dueDate: new Date().toISOString(),
      });
      handleCloseDebtModal();
      await loadAllClients(currentPageRef.current, LIMIT);
      // Refrescar deudas tras agregar una nueva
      setDebtsLoadTrigger((n) => n + 1);
    } catch (error) {
      console.error("Error al agregar deuda:", error);
    } finally {
      setAddingDebt(false);
    }
  };

  // ── Paginación visual ─────────────────────────────────────────────────────
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? clients.length;

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const range: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (currentPage > 3) range.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) range.push(i);
      if (currentPage < totalPages - 2) range.push("...");
      range.push(totalPages);
    }
    return (
      <Box mt="$4" mb="$2">
        <Text size="xs" color="$textLight400" textAlign="center" mb="$3">
          Página {currentPage} de {totalPages} · {total} clientes en total
        </Text>
        <HStack justifyContent="center" alignItems="center" space="xs">
          <Pressable
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || pageLoading}
            style={{
              width: 36, height: 36, borderRadius: 10,
              alignItems: "center", justifyContent: "center",
              backgroundColor: currentPage === 1 ? "#f3f4f6" : Colors.primary + "15",
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#9ca3af" : Colors.primary} />
          </Pressable>
          {range.map((item, idx) =>
            item === "..." ? (
              <Text key={`ellipsis-${idx}`} size="sm" color="$textLight400" px="$1">···</Text>
            ) : (
              <Pressable
                key={item}
                onPress={() => handlePageChange(item as number)}
                disabled={pageLoading}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: currentPage === item ? Colors.primary : "#f9fafb",
                  borderWidth: currentPage === item ? 0 : 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Text
                  size="sm"
                  fontWeight={currentPage === item ? "$bold" : "$medium"}
                  style={{ color: currentPage === item ? "#fff" : "#374151" }}
                >
                  {item}
                </Text>
              </Pressable>
            )
          )}
          <Pressable
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || pageLoading}
            style={{
              width: 36, height: 36, borderRadius: 10,
              alignItems: "center", justifyContent: "center",
              backgroundColor: currentPage === totalPages ? "#f3f4f6" : Colors.primary + "15",
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#9ca3af" : Colors.primary} />
          </Pressable>
        </HStack>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box flex={1} bg="$backgroundLight50" justifyContent="center" alignItems="center">
        <Text size="sm" color="$textLight400">Cargando clientes...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Clientes" />

      <Box px="$4" py="$3" bg="$white" borderBottomWidth={1} borderBottomColor="$borderLight100">
        <VStack space="sm">
          <Heading size="md" color={Colors.primary}>Todos los clientes</Heading>
          <Box borderRadius={12} borderWidth={1} borderColor="$borderLight200" bg="$backgroundLight50" overflow="hidden">
            <HStack alignItems="center" px="$3" h={46}>
              <Ionicons name="search-outline" size={18} color={Colors.primary} />
              <Input flex={1} variant="outline" size="sm" bg="transparent" borderWidth={0} ml="$2">
                <InputField
                  placeholder="Buscar por nombre..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor="#9ca3af"
                />
              </Input>
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")} p="$1">
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </HStack>
          </Box>
          {searchText.length > 0 && (
            <Text size="xs" color="$textLight400" px="$1">
              {filteredClients.length} resultado{filteredClients.length !== 1 ? "s" : ""} para &ldquo;{searchText}&rdquo;
            </Text>
          )}
        </VStack>
      </Box>

      <ScrollView flex={1} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {pageLoading ? (
          <Box py="$8" alignItems="center">
            <Text size="sm" color="$textLight400">Cargando página {currentPage}...</Text>
          </Box>
        ) : filteredClients.length === 0 ? (
          <Box py="$12" alignItems="center">
            <VStack space="sm" alignItems="center">
              <Box w={56} h={56} borderRadius="$full" bg="$backgroundLight100" alignItems="center" justifyContent="center" mb="$2">
                <Ionicons name="person-outline" size={28} color="#9ca3af" />
              </Box>
              <Text size="md" fontWeight="$semibold" color="$textLight500">
                {searchText ? "Sin resultados" : "Sin clientes"}
              </Text>
              <Text size="sm" color="$textLight400" textAlign="center">
                {searchText ? `No se encontró "${searchText}"` : "Agrega tu primer cliente con el botón de abajo"}
              </Text>
            </VStack>
          </Box>
        ) : (
          <VStack space="sm">
            {filteredClients.map((client) => {
              const balance = getBalanceFromMap(client.id, debtsMap);
              const isLoadingBalance = balance === -1;
              const isDebe = !isLoadingBalance && balance > 0;
              const isAlDia = !isLoadingBalance && balance === 0;
              const avatarColor = getAvatarColor(client.name ?? "A");
              const initials = getInitials(client.name ?? "?");

              return (
                <Pressable key={client.id} onPress={() => handleClientPress(client)}>
                  <Box
                    bg="$white" borderRadius={14} borderWidth={1}
                    borderColor={isDebe ? Colors.error + "20" : "$borderLight100"}
                    overflow="hidden"
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                  >
                    <HStack alignItems="center" px="$4" py="$3" space="md">
                      <Box w={44} h={44} borderRadius="$full" alignItems="center" justifyContent="center" style={{ backgroundColor: avatarColor + "22" }}>
                        <Text size="sm" fontWeight="$bold" style={{ color: avatarColor }}>{initials}</Text>
                      </Box>

                      <VStack flex={1} space="xs">
                        <Text size="md" fontWeight="$semibold" color={Colors.primary} numberOfLines={1}>
                          {client.name}
                        </Text>
                        <HStack alignItems="center" space="xs" mt="$0.5">
                          <Box
                            px="$2" py="$0.5" borderRadius={20}
                            style={{
                              backgroundColor: isDebe ? Colors.error + "15" : isAlDia ? Colors.success + "15" : "#f3f4f6",
                            }}
                          >
                            <HStack alignItems="center" space="xs">
                              <Box
                                w={5} h={5} borderRadius="$full"
                                style={{ backgroundColor: isDebe ? Colors.error : isAlDia ? Colors.success : "#9ca3af" }}
                              />
                              <Text
                                size="xs" fontWeight="$semibold"
                                style={{ color: isDebe ? Colors.error : isAlDia ? Colors.success : "#6b7280" }}
                              >
                                {isLoadingBalance ? "···" : isDebe ? "Debe" : "Al día"}
                              </Text>
                            </HStack>
                          </Box>
                          {isDebe && balance > 0 && (
                            <Text size="xs" fontWeight="$bold" style={{ color: Colors.error }}>
                              {formatCurrency(balance)}
                            </Text>
                          )}
                        </HStack>
                      </VStack>

                      <Box w={28} h={28} borderRadius="$full" bg="$backgroundLight50" alignItems="center" justifyContent="center">
                        <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
                      </Box>
                    </HStack>

                    {isDebe && (
                      <Box h={3} style={{ backgroundColor: Colors.error + "30" }}>
                        <Box h={3} w="100%" style={{ backgroundColor: Colors.error + "60" }} />
                      </Box>
                    )}
                  </Box>
                </Pressable>
              );
            })}
            {!searchText && renderPagination()}
          </VStack>
        )}
      </ScrollView>

      <Box
        position="absolute" bottom={0} left={0} right={0} px="$4" pt="$3" pb="$6" bg="$white"
        borderTopWidth={1} borderTopColor="$borderLight100"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 }}
      >
        <Button size="lg" w="100%" h={52} borderRadius={14} bg={Colors.primary} $pressed={{ opacity: 0.85 }} onPress={handleAddClient}>
          <HStack alignItems="center" space="sm">
            <Box w={24} h={24} borderRadius="$full" bg="rgba(255,255,255,0.2)" alignItems="center" justifyContent="center">
              <Ionicons name="add" size={16} color="#fff" />
            </Box>
            <ButtonText color="$white" fontWeight="$semibold">Agregar cliente</ButtonText>
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