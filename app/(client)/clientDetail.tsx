import AddDebtModal from "@/components/AddDebtModal";
import Header from "@/components/Header";
import RegisterPaymentModal from "@/components/RegisterPaymentModal";
import { Colors } from "@/constants/Colors";
import { useBusiness } from "@/contexts/BusinessContext";
import { useClients } from "@/contexts/ClientContext";
import { useDebts } from "@/contexts/DebtsContext";
import { usePayments } from "@/contexts/PaymentsContext";
import {
  Box,
  Button,
  ButtonText,
  Card,
  HStack,
  Heading,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

const toNumber = (value: string | number | undefined | null): number => {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function CreditClientScreen() {
  const { id, businessId: businessIdParam } = useLocalSearchParams();
  const { getClient } = useClients();
  const { businesses } = useBusiness();
  const { addDebt, loadDebtsByClient, debts, clearDebts } = useDebts();
  const { addGlobalPayment, loadAllPaymentsForClient, payments, clearPayments } = usePayments();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [addingDebt, setAddingDebt] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        clearDebts();
        clearPayments();

        const resolvedBusinessId = (businessIdParam as string) ?? businesses[0]?.id;
        const result = await getClient(id as string, resolvedBusinessId);

        if (cancelled) return;
        setClient(result ?? null);
        setBusinessId(resolvedBusinessId);

        await loadDebtsByClient(id as string, resolvedBusinessId);
      } catch (error) {
        console.error("Error loading client detail:", error);
        if (!cancelled) setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Once debts are loaded, fetch payments for all of them
  useEffect(() => {
    if (debts.length > 0 && businessId) {
      loadAllPaymentsForClient(debts.map((d) => d.id), businessId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debts.length, businessId]);

  // IDs of debts whose payments sum >= debt amount
  const paidDebtIds = useMemo(() => {
    return new Set(
      debts
        .filter((debt) => {
          const paid = payments
            .filter((p) => p.debtId === debt.id)
            .reduce((sum, p) => sum + toNumber(p.amount), 0);
          return paid >= toNumber(debt.amount);
        })
        .map((d) => d.id)
    );
  }, [debts, payments]);

  const pendingDebts = useMemo(
    () => debts.filter((d) => !paidDebtIds.has(d.id)),
    [debts, paidDebtIds]
  );

  const totalDebts = useMemo(
    () => debts.reduce((sum, d) => sum + toNumber(d.amount), 0),
    [debts]
  );

  const totalPayments = useMemo(
    () => payments.reduce((sum, p) => sum + toNumber(p.amount), 0),
    [payments]
  );

  const currentBalance = Math.max(0, totalDebts - totalPayments);

  // Merge debts + payments sorted by date descending (most recent first)
  const sortedMovements = useMemo(() => {
    const debtItems = debts.map((d) => ({
      type: "debt" as const,
      date: new Date(d.dueDate).getTime(),
      data: d,
    }));
    const paymentItems = payments.map((p) => ({
      type: "payment" as const,
      date: new Date(p.createdAt ?? 0).getTime(),
      data: p,
    }));
    return [...debtItems, ...paymentItems].sort((a, b) => b.date - a.date);
  }, [debts, payments]);

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text>Cargando cliente...</Text>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text>Cliente no encontrado</Text>
      </Box>
    );
  }

  const handleRegisterPayment = () => setIsPaymentModalOpen(true);
  const handleAddDebt = () => setIsDebtModalOpen(true);

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
      // Reload debts first, then reload payments for all debt IDs
      await loadDebtsByClient(id as string, businessId);
      await loadAllPaymentsForClient(debts.map((d) => d.id), businessId);
    } catch (error) {
      console.error("Error al registrar pago:", error);
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
      await loadDebtsByClient(id as string, businessId);
    } catch (error) {
      console.error("Error al agregar deuda:", error);
    } finally {
      setAddingDebt(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-CO");

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title={client.name} showBack />

      <Box p="$4">
        {/* ── Balance Card ── */}
        <Box
          mb="$4"
          borderRadius={20}
          overflow="hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          {/* Dark header with balance */}
          <Box
            px="$5"
            pt="$5"
            pb="$4"
            style={{ backgroundColor: currentBalance > 0 ? "#16101a" : "#0d1f16" }}
          >
            {/* Status pill */}
            <Box
              alignSelf="flex-start"
              px="$3"
              py="$1"
              mb="$3"
              borderRadius={20}
              style={{
                backgroundColor: currentBalance > 0
                  ? "rgba(248,113,113,0.15)"
                  : "rgba(74,222,128,0.15)",
              }}
            >
              <Text
                size="xs"
                fontWeight="$bold"
                style={{
                  color: currentBalance > 0 ? "#f87171" : "#4ade80",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {currentBalance > 0
                  ? `● ${pendingDebts.length} ${pendingDebts.length === 1 ? "deuda pendiente" : "deudas pendientes"}`
                  : "● Al día"}
              </Text>
            </Box>

            {/* Label */}
            <Text
              size="xs"
              mb="$1"
              style={{ color: "rgba(255,255,255,0.45)", letterSpacing: 0.6 }}
            >
              SALDO ACTUAL
            </Text>

            {/* Main balance figure */}
            <Heading
              size="3xl"
              style={{ color: currentBalance > 0 ? "#f87171" : "#4ade80" }}
            >
              {formatCurrency(currentBalance)}
            </Heading>
          </Box>

          {/* Progress bar strip */}
          {totalDebts > 0 && (
            <Box style={{ backgroundColor: "#0d0d0d" }} px="$5" py="$2">
              <HStack justifyContent="space-between" mb="$1">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Pagado
                </Text>
                <Text size="xs" fontWeight="$semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {Math.min(100, Math.round((totalPayments / totalDebts) * 100))}%
                </Text>
              </HStack>
              {/* Track */}
              <Box
                h={5}
                borderRadius={4}
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                {/* Fill */}
                <Box
                  h={5}
                  borderRadius={4}
                  style={{
                    width: `${Math.min(100, (totalPayments / totalDebts) * 100).toFixed(1)}%` as `${number}%`,
                    backgroundColor: "#4ade80",
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Stats row */}
          <Box
            px="$5"
            pt="$3"
            pb="$4"
            style={{ backgroundColor: "#111111" }}
          >
            <HStack justifyContent="space-between">
              <VStack space="xs">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>
                  DEUDAS
                </Text>
                <Text size="sm" fontWeight="$bold" style={{ color: "#f87171" }}>
                  {formatCurrency(totalDebts)}
                </Text>
              </VStack>

              {/* Divider */}
              <Box w={1} style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

              <VStack space="xs" alignItems="center">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>
                  DEUDAS TOTAL
                </Text>
                <Text size="sm" fontWeight="$bold" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {debts.length}
                </Text>
              </VStack>

              {/* Divider */}
              <Box w={1} style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

              <VStack space="xs" alignItems="flex-end">
                <Text size="xs" style={{ color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>
                  PAGADO
                </Text>
                <Text size="sm" fontWeight="$bold" style={{ color: "#4ade80" }}>
                  {formatCurrency(totalPayments)}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </Box>

        <HStack space="md" mb="$4">
          <Button
            flex={1}
            size="md"
            h={48}
            borderRadius={12}
            bg={Colors.success}
            onPress={handleRegisterPayment}
            isDisabled={addingPayment || currentBalance === 0}
          >
            <ButtonText color={Colors.white} size="sm">
              {addingPayment ? "Registrando..." : "Registrar Pago"}
            </ButtonText>
          </Button>

          <Button
            flex={1}
            size="md"
            h={48}
            borderRadius={12}
            bg={Colors.error}
            onPress={handleAddDebt}
          >
            <ButtonText color={Colors.white} size="sm">
              Agregar Deuda
            </ButtonText>
          </Button>
        </HStack>

        <VStack space="sm" mb="$2">
          <Heading size="md" color={Colors.primary}>
            Extracto de Movimientos
          </Heading>
        </VStack>
      </Box>

      <ScrollView flex={1} px="$4" contentContainerStyle={{ paddingBottom: 20 }}>
        <VStack space="sm">
          {debts.length === 0 && payments.length === 0 ? (
            <Card
              p="$4"
              bg="$white"
              borderRadius={8}
              borderWidth={1}
              borderColor="$borderLight200"
            >
              <Text size="sm" color="$textLight500" textAlign="center">
                No hay movimientos registrados
              </Text>
            </Card>
          ) : (
            <>
              {sortedMovements.map((item) => {
                if (item.type === "debt") {
                  const debt = item.data;
                  return (
                    <Card
                      key={`debt-${debt.id}`}
                      p="$3"
                      bg="$white"
                      borderRadius={8}
                      borderWidth={1}
                      borderColor="$borderLight200"
                    >
                      <HStack alignItems="center" justifyContent="space-between">
                        <VStack flex={1}>
                          <HStack alignItems="center" space="xs">
                            <Box
                              w={8}
                              h={8}
                              borderRadius="$full"
                              bg={paidDebtIds.has(debt.id) ? Colors.success : Colors.error}
                            />
                            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                              {debt.description || "Sin descripción"}
                            </Text>
                          </HStack>
                          <Text size="xs" color="$textLight500">
                            {formatDate(debt.dueDate)}
                          </Text>
                          {paidDebtIds.has(debt.id) && (
                            <Text size="xs" color={Colors.success}>
                              Pagada ✓
                            </Text>
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
                  <Card
                    key={`payment-${payment.id}`}
                    p="$3"
                    bg="$white"
                    borderRadius={8}
                    borderWidth={1}
                    borderColor="$borderLight200"
                  >
                    <HStack alignItems="center" justifyContent="space-between">
                      <VStack flex={1}>
                        <HStack alignItems="center" space="xs">
                          <Box w={8} h={8} borderRadius="$full" bg={Colors.success} />
                          <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                            {payment.note || "Pago registrado"}
                          </Text>
                        </HStack>
                        <Text size="xs" color="$textLight500">
                          {payment.method}
                        </Text>
                      </VStack>
                      <Text size="md" fontWeight="$semibold" color={Colors.success}>
                        -{formatCurrency(toNumber(payment.amount))}
                      </Text>
                    </HStack>
                  </Card>
                );
              })}
            </>
          )}
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