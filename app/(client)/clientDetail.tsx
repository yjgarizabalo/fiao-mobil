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
import { useEffect, useState } from "react";

const toNumber = (value: string | number | undefined | null): number => {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function CreditClientScreen() {
  const { id } = useLocalSearchParams(); // id del cliente/deudor
  const { getClient } = useClients();
  const { businesses } = useBusiness();
  const { addDebt, loadDebtsByClient, debts, clearDebts } = useDebts();
  const { addPayment, loadPaymentsByClient, payments, clearPayments } = usePayments();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
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
        const result = await getClient(id as string);
        if (cancelled) return;
        setClient(result ?? null);
        await Promise.all([
          loadDebtsByClient(id as string),
          loadPaymentsByClient(id as string),
        ]);
      } catch (error) {
        console.error("Error loading client detail:", error);
        if (!cancelled) setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

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

  const totalDebts = debts.reduce((sum, debt) => sum + toNumber(debt.amount), 0);
  const totalPayments = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const currentBalance = totalDebts - totalPayments;

  const handleRegisterPayment = () => setIsPaymentModalOpen(true);
  const handleAddDebt = () => setIsDebtModalOpen(true);

  // 👈 onSubmit ahora recibe debtId desde el modal (el usuario lo seleccionó)
  const handlePaymentSubmit = async (data: { debtId: string; amount: number; note: string }) => {
    const businessId = client.businessId ?? businesses[0]?.id;
    if (!businessId) return;

    setAddingPayment(true);
    try {
      await addPayment({
        businessId,
        debtId: data.debtId, // ✅ id real de la deuda, viene del selector del modal
        amount: data.amount,
        method: "CASH",
        type: "PAYMENT",
        note: data.note,
      });
      await loadPaymentsByClient(id as string);
    } catch (error) {
      console.error("Error al registrar pago:", error);
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDebtSubmit = async (data: { amount: number; description: string }) => {
    const businessId = client.businessId ?? businesses[0]?.id;
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
      await loadDebtsByClient(id as string);
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
        {/* Card de saldo */}
        <Card
          p="$4"
          bg="$white"
          borderRadius={12}
          borderWidth={1}
          borderColor="$borderLight200"
          mb="$4"
        >
          <VStack space="sm" alignItems="center">
            <Text size="sm" color="$textLight500">
              Saldo Actual
            </Text>
            <Heading
              size="2xl"
              color={currentBalance > 0 ? Colors.error : Colors.success}
            >
              {formatCurrency(currentBalance)}
            </Heading>
            <Text size="xs" color="$textLight400">
              {currentBalance > 0
                ? `${debts.length} ${debts.length === 1 ? "deuda pendiente" : "deudas pendientes"}`
                : "Al día"}
            </Text>
          </VStack>
        </Card>

        <HStack space="md" mb="$4">
          {/* 👈 Botón Registrar Pago — abre modal con selector de deuda */}
          <Button
            flex={1}
            size="md"
            h={48}
            borderRadius={12}
            bg={Colors.success}
            onPress={handleRegisterPayment}
            isDisabled={addingPayment || debts.length === 0}
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
              {/* Deudas */}
              {debts.map((debt) => (
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
                        <Box w={8} h={8} borderRadius="$full" bg={Colors.error} />
                        <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                          {debt.description || "Sin descripción"}
                        </Text>
                      </HStack>
                      <Text size="xs" color="$textLight500">
                        {formatDate(debt.dueDate)}
                      </Text>
                    </VStack>
                    <Text size="md" fontWeight="$semibold" color={Colors.error}>
                      +{formatCurrency(toNumber(debt.amount))}
                    </Text>
                  </HStack>
                </Card>
              ))}

              {/* Pagos */}
              {payments.map((payment) => (
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
              ))}
            </>
          )}
        </VStack>
      </ScrollView>

      {/* 👈 Modal recibe debts para el selector interno */}
      <RegisterPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        clientName={client.name}
        debts={debts} // 👈 pasa todas las deudas al modal
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