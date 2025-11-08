import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Button,
  ButtonText,
  Card,
  ScrollView,
  Pressable,
} from '@gluestack-ui/themed';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Header from '../../components/Header';
import AddDebtModal from '../../components/AddDebtModal';
import RegisterPaymentModal from '../../components/RegisterPaymentModal';
import { Colors } from '../../constants/Colors';
import { useClients } from '../../contexts/ClientContext';



interface Transaction {
  id: string;
  type: 'pago' | 'deuda';
  amount: number;
  date: string;
  description: string;
}

const mockTransactions: Transaction[] = [];

export default function CreditClientScreen() {
  const { id } = useLocalSearchParams();
  const { getClient } = useClients();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  
  const client = getClient(id as string);
  
  if (!client) {
    return (
      <Box flex={1} bg="$backgroundLight50" justifyContent="center" alignItems="center">
        <Text>Cliente no encontrado</Text>
      </Box>
    );
  }
  
  const currentBalance = client.balance;

  const handleBack = () => {
    router.back();
  };

  const handleRegisterPayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handleAddDebt = () => {
    setIsDebtModalOpen(true);
  };

  const handlePaymentSubmit = (data: { amount: number; description: string }) => {
    console.log('Pago registrado:', data);
    // Aquí implementarías la lógica para guardar el pago
  };

  const handleDebtSubmit = (data: { amount: number; description: string }) => {
    console.log('Deuda agregada:', data);
    // Aquí implementarías la lógica para guardar la deuda
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Detalle Cliente" />
      
      <Box p="$4">
        <HStack alignItems="center" space="md" mb="$4">
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </Pressable>
          <Heading size="lg" color={Colors.primary} flex={1}>
            {client.firstName} {client.lastName}
          </Heading>
        </HStack>

        <Card p="$4" bg="$white" borderRadius={12} borderWidth={1} borderColor="$borderLight200" mb="$4">
          <VStack space="sm" alignItems="center">
            <Text size="sm" color="$textLight500">Saldo Actual</Text>
            <Heading size="2xl" color={currentBalance > 0 ? Colors.error : Colors.success}>
              {formatCurrency(currentBalance)}
            </Heading>
            <Text size="xs" color="$textLight400">
              {currentBalance > 0 ? 'Debe' : 'Al día'}
            </Text>
          </VStack>
        </Card>

        <HStack space="md" mb="$4">
          <Button 
            flex={1}
            size="md"
            h={48}
            borderRadius={12}
            bg={Colors.success}
            onPress={handleRegisterPayment}
          >
            <ButtonText color={Colors.white} size="sm">Registrar Pago</ButtonText>
          </Button>
          
          <Button 
            flex={1}
            size="md"
            h={48}
            borderRadius={12}
            bg={Colors.error}
            onPress={handleAddDebt}
          >
            <ButtonText color={Colors.white} size="sm">Agregar Deuda</ButtonText>
          </Button>
        </HStack>

        <VStack space="sm" mb="$2">
          <Heading size="md" color={Colors.primary}>Extracto de Movimientos</Heading>
        </VStack>
      </Box>

      <ScrollView flex={1} px="$4" contentContainerStyle={{ paddingBottom: 20 }}>
        <VStack space="sm">
          {mockTransactions.length === 0 ? (
            <Card p="$4" bg="$white" borderRadius={8} borderWidth={1} borderColor="$borderLight200">
              <Text size="sm" color="$textLight500" textAlign="center">
                No hay movimientos registrados
              </Text>
            </Card>
          ) : (
            mockTransactions.map((transaction) => (
              <Card 
                key={transaction.id} 
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
                        bg={transaction.type === 'pago' ? Colors.success : Colors.error}
                      />
                      <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                        {transaction.description}
                      </Text>
                    </HStack>
                    <Text size="xs" color="$textLight500">
                      {formatDate(transaction.date)}
                    </Text>
                  </VStack>
                  <Text 
                    size="md" 
                    fontWeight="$semibold" 
                    color={transaction.type === 'pago' ? Colors.success : Colors.error}
                  >
                    {transaction.type === 'pago' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </Text>
                </HStack>
              </Card>
            ))
          )}
        </VStack>
      </ScrollView>
      
      <RegisterPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        clientName={client.firstName}
        currentDebt={currentBalance}
      />
      
      <AddDebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSubmit={handleDebtSubmit}
        clientName={client.firstName}
      />
    </Box>
  );
}