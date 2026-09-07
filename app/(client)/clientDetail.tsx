import AddDebtModal from "@/components/AddDebtModal";
import Header from "@/components/Header";
import RegisterPaymentModal from "@/components/RegisterPaymentModal";
import { Colors } from "@/constants/Colors";
import { useBusiness } from "@/contexts/BusinessContext";
import { useClients } from "@/contexts/ClientContext";
import { DebtWithPayments, useDebts } from "@/contexts/DebtsContext";
import { usePayments } from "@/contexts/PaymentsContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Box, Button, ButtonText, Card, HStack, Heading,
  Pressable, ScrollView, Text, VStack,
} from "@gluestack-ui/themed";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

const toNumber = (v: string | number | undefined | null) => {
  const n = Number(v); return isNaN(n) ? 0 : n;
};
const MOVEMENTS_LIMIT = 15;

export default function CreditClientScreen() {
  const { id, businessId: businessIdParam } = useLocalSearchParams();
  const { getClient, refreshClient } = useClients();
  const { businesses } = useBusiness();
  const { addDebt, loadDebtsWithPayments, debts, clearDebts } = useDebts();
  const { addGlobalPayment } = usePayments();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingDebt, setAddingDebt] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [movementsPage, setMovementsPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) { if (!cancelled) setLoading(false); return; }
      try {
        clearDebts();
        const resolvedBusinessId = (businessIdParam as string) ?? businesses[0]?.id;
        const result = await getClient(id as string, resolvedBusinessId);
        if (cancelled) return;
        setClient(result ?? null);
        setBusinessId(resolvedBusinessId);
        await loadDebtsWithPayments(id as string, resolvedBusinessId);
      } catch (e) {
        console.error("Error loading client detail:", e);
        if (!cancelled) setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const allPayments = useMemo(
    () => (debts as DebtWithPayments[]).flatMap((d) => d.payments ?? []),
    [debts]
  );

  const totalDebts = useMemo(
    () => debts.reduce((sum, d) => sum + toNumber(d.amount), 0),
    [debts]
  );

  const totalPayments = useMemo(
    () => allPayments.reduce((sum, p) => sum + toNumber(p.amount), 0),
    [allPayments]
  );

  const currentBalance = (() => {
    const serverBalance = client?.balance;
    if (serverBalance !== undefined && serverBalance !== null)
      return Math.max(0, toNumber(serverBalance));
    return Math.max(0, totalDebts - totalPayments);
  })();

  const paidDebtIds = useMemo(
    () => new Set(debts.filter((d) => d.status === "PAID").map((d) => d.id)),
    [debts]
  );

  const sortedMovements = useMemo(() => {
    const debtItems = debts.map((d) => ({
      type: "debt" as const,
      date: new Date(d.dueDate).getTime(),
      data: d,
    }));
    const paymentItems = allPayments.map((p) => ({
      type: "payment" as const,
      date: new Date(p.createdAt ?? 0).getTime(),
      data: p,
    }));
    return [...debtItems, ...paymentItems].sort((a, b) => b.date - a.date);
  }, [debts, allPayments]);

  const handlePaymentSubmit = async (data: { amount: number; note: string; method: string }) => {
    if (!businessId) return;
    setAddingPayment(true);
    try {
      await addGlobalPayment({
        businessId,
        debtorId: id as string,
        amount: toNumber(data.amount),
        method: data.method,
        note: data.note,
      });
      const updated = await refreshClient(id as string, businessId);
      if (updated) setClient(updated);
      await loadDebtsWithPayments(id as string, businessId);
      setMovementsPage(1);
    } catch (e) {
      console.error("Error al registrar pago:", e);
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDebtSubmit = async (data: { amount: number; description: string }) => {
    if (!businessId) return;
    setAddingDebt(true);
    try {
      await addDebt({
        businessId,
        debtorId: id as string,
        amount: toNumber(data.amount),
        description: data.description,
        dueDate: new Date().toISOString(),
      });
      const updated = await refreshClient(id as string, businessId);
      if (updated) setClient(updated);
      await loadDebtsWithPayments(id as string, businessId);
    } catch (e) {
      console.error("Error al agregar deuda:", e);
    } finally {
      setAddingDebt(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CO");

  if (loading) return <Box flex={1} justifyContent="center" alignItems="center"><Text>Cargando cliente...</Text></Box>;
  if (!client) return <Box flex={1} justifyContent="center" alignItems="center"><Text>Cliente no encontrado</Text></Box>;

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title={client.name} showBack />

      <Box p="$4">
        {/* Balance Card */}
        <Box mb="$4" borderRadius={20} overflow="hidden"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 8 }}>
          <Box px="$5" pt="$5" pb="$4" style={{ backgroundColor: currentBalance > 0 ? "#16101a" : "#0d1f16" }}>
            <Box alignSelf="flex-start" px="$3" py="$1" mb="$3" borderRadius={20}
              style={{ backgroundColor: currentBalance > 0 ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)" }}>
              <Text size="xs" fontWeight="$bold" style={{ color: currentBalance > 0 ? "#f87171" : "#4ade80", letterSpacing: 1 }}>
                {currentBalance > 0 ? "DEBE" : "AL DÍA"}
              </Text>
            </Box>
            <Text size="xs" mb="$1" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: 0.6 }}>SALDO ACTUAL</Text>
            <Heading size="3xl" style={{ color: currentBalance > 0 ? "#f87171" : "#4ade80" }}>
              {formatCurrency(currentBalance)}
            </Heading>
          </Box>

          {totalDebts > 0 && (
            <Box style={{ backgroundColor: "#0d0d0d" }} px="$5" py="$2">
              <HStack justifyContent="space-between" mb="$1">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.35)" }}>Pagado</Text>
                <Text size="xs" fontWeight="$semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {Math.min(100, Math.round((totalPayments / totalDebts) * 100))}%
                </Text>
              </HStack>
              <Box h={5} borderRadius={4} style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <Box h={5} borderRadius={4} style={{
                  width: `${Math.min(100, (totalPayments / totalDebts) * 100).toFixed(1)}%` as `${number}%`,
                  backgroundColor: "#4ade80",
                }} />
              </Box>
            </Box>
          )}

          <Box px="$5" pt="$3" pb="$4" style={{ backgroundColor: "#111111" }}>
            <HStack justifyContent="space-between">
              <VStack space="xs">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>DEUDAS</Text>
                <Text size="sm" fontWeight="$bold" style={{ color: "#f87171" }}>{formatCurrency(totalDebts)}</Text>
              </VStack>
              <Box w={1} style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              <VStack space="xs" alignItems="center">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>DEUDAS TOTAL</Text>
                <Text size="sm" fontWeight="$bold" style={{ color: "rgba(255,255,255,0.7)" }}>{debts.length}</Text>
              </VStack>
              <Box w={1} style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              <VStack space="xs" alignItems="flex-end">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>PAGADO</Text>
                <Text size="sm" fontWeight="$bold" style={{ color: "#4ade80" }}>{formatCurrency(totalPayments)}</Text>
              </VStack>
            </HStack>
          </Box>
        </Box>

        <HStack space="md" mb="$4">
          <Button flex={1} size="md" h={48} borderRadius={12} bg={Colors.success}
            onPress={() => setIsPaymentModalOpen(true)}
            isDisabled={addingPayment || currentBalance === 0}>
            <ButtonText color={Colors.white} size="sm">
              {addingPayment ? "Registrando..." : "Registrar Pago"}
            </ButtonText>
          </Button>
          <Button flex={1} size="md" h={48} borderRadius={12} bg={Colors.error}
            onPress={() => setIsDebtModalOpen(true)}>
            <ButtonText color={Colors.white} size="sm">Agregar Deuda</ButtonText>
          </Button>
        </HStack>

        <Heading size="md" color={Colors.primary} mb="$2">Extracto de Movimientos</Heading>
      </Box>

      <ScrollView flex={1} px="$4" contentContainerStyle={{ paddingBottom: 20 }}>
        <VStack space="sm">
          {sortedMovements.length === 0 ? (
            <Card p="$4" bg="$white" borderRadius={8} borderWidth={1} borderColor="$borderLight200">
              <Text size="sm" color="$textLight500" textAlign="center">No hay movimientos registrados</Text>
            </Card>
          ) : (() => {
            const total = sortedMovements.length;
            const totalPages = Math.ceil(total / MOVEMENTS_LIMIT);
            const paginated = sortedMovements.slice(
              (movementsPage - 1) * MOVEMENTS_LIMIT,
              movementsPage * MOVEMENTS_LIMIT
            );
            return (
              <>
                {paginated.map((item) => {
                  if (item.type === "debt") {
                    const debt = item.data as DebtWithPayments;
                    return (
                      <Card key={`debt-${debt.id}`} p="$3" bg="$white" borderRadius={8} borderWidth={1} borderColor="$borderLight200">
                        <HStack alignItems="center" justifyContent="space-between">
                          <VStack flex={1}>
                            <HStack alignItems="center" space="xs">
                              <Box w={8} h={8} borderRadius="$full"
                                bg={paidDebtIds.has(debt.id) ? Colors.success : Colors.error} />
                              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                                {debt.description || "Sin descripción"}
                              </Text>
                            </HStack>
                            <Text size="xs" color="$textLight500">{formatDate(debt.dueDate)}</Text>
                            {paidDebtIds.has(debt.id) && (
                              <Text size="xs" color={Colors.success}>Pagada ✓</Text>
                            )}
                          </VStack>
                          <Text size="md" fontWeight="$semibold" color={Colors.error}>
                            +{formatCurrency(toNumber(debt.amount))}
                          </Text>
                        </HStack>
                      </Card>
                    );
                  }

                  const payment = item.data;
                  return (
                    <Card key={`payment-${payment.id}`} p="$3" bg="$white" borderRadius={8} borderWidth={1} borderColor="$borderLight200">
                      <HStack alignItems="center" justifyContent="space-between">
                        <VStack flex={1}>
                          <HStack alignItems="center" space="xs">
                            <Box w={8} h={8} borderRadius="$full" bg={Colors.success} />
                            <Text size="sm" fontWeight="$medium" color={Colors.primary}>Pago registrado</Text>
                          </HStack>
                          <Text size="xs" color="$textLight500">
                            {payment.createdAt ? formatDate(payment.createdAt) : "Fecha desconocida"}
                          </Text>
                          {payment.method && (
                            <Text size="xs" color="$textLight400">{payment.method}</Text>
                          )}
                        </VStack>
                        <Text size="md" fontWeight="$semibold" color={Colors.success}>
                          -{formatCurrency(toNumber(payment.amount))}
                        </Text>
                      </HStack>
                    </Card>
                  );
                })}

                {totalPages > 1 && (
                  <Box mt="$3" mb="$1">
                    <Text size="xs" color="$textLight400" textAlign="center" mb="$2">
                      {(movementsPage - 1) * MOVEMENTS_LIMIT + 1}–{Math.min(movementsPage * MOVEMENTS_LIMIT, total)} de {total} movimientos
                    </Text>
                    <HStack justifyContent="center" alignItems="center" space="xs">
                      <Pressable onPress={() => setMovementsPage((p) => Math.max(1, p - 1))} disabled={movementsPage === 1}
                        style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
                          backgroundColor: movementsPage === 1 ? "#f3f4f6" : Colors.primary + "15", opacity: movementsPage === 1 ? 0.4 : 1 }}>
                        <Ionicons name="chevron-back" size={16} color={movementsPage === 1 ? "#9ca3af" : Colors.primary} />
                      </Pressable>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Pressable key={page} onPress={() => setMovementsPage(page)}
                          style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
                            backgroundColor: movementsPage === page ? Colors.primary : "#f9fafb",
                            borderWidth: movementsPage === page ? 0 : 1, borderColor: "#e5e7eb" }}>
                          <Text size="sm" fontWeight={movementsPage === page ? "$bold" : "$medium"}
                            style={{ color: movementsPage === page ? "#fff" : "#374151" }}>{page}</Text>
                        </Pressable>
                      ))}
                      <Pressable onPress={() => setMovementsPage((p) => Math.min(totalPages, p + 1))} disabled={movementsPage === totalPages}
                        style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
                          backgroundColor: movementsPage === totalPages ? "#f3f4f6" : Colors.primary + "15", opacity: movementsPage === totalPages ? 0.4 : 1 }}>
                        <Ionicons name="chevron-forward" size={16} color={movementsPage === totalPages ? "#9ca3af" : Colors.primary} />
                      </Pressable>
                    </HStack>
                  </Box>
                )}
              </>
            );
          })()}
        </VStack>
      </ScrollView>

      <RegisterPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        clientName={client.name}
        currentBalance={currentBalance}
        isLoading={addingPayment}
      />
      <AddDebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSubmit={handleDebtSubmit}
        clientName={client.name}
        isLoading={addingDebt}
      />
    </Box>
  );
}
