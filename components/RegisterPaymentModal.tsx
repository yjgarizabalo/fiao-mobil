import {
  Box,
  Button,
  ButtonText,
  CloseIcon,
  HStack,
  Icon,
  Input,
  InputField,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Text,
  Textarea,
  TextareaInput,
  VStack,
} from '@gluestack-ui/themed';
import { useState } from 'react';
import { Colors } from '../constants/Colors';

interface Debt {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
}

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { debtId: string; amount: number; note: string }) => void; // 👈 incluye debtId
  clientName: string;
  debts: Debt[]; // 👈 lista de deudas para el selector
  isLoading?: boolean;
}

export default function RegisterPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  clientName,
  debts,
  isLoading = false,
}: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null); // 👈 deuda seleccionada

  const selectedDebt = debts.find((d) => d.id === selectedDebtId) ?? null;

  const handleClose = () => {
    setAmount('');
    setNote('');
    setSelectedDebtId(null);
    onClose();
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (numAmount > 0 && selectedDebtId) {
      onSubmit({ debtId: selectedDebtId, amount: numAmount, note: note.trim() });
      setAmount('');
      setNote('');
      setSelectedDebtId(null);
      onClose();
    }
  };

  const formatAmount = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? `$${parseInt(numbers).toLocaleString()}` : '';
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-CO');

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalBackdrop />
      <ModalContent bg="$white" borderRadius={16} mx="$4">
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight200" pb="$3">
          <Text size="lg" fontWeight="$semibold" color={Colors.primary}>
            Registrar Pago
          </Text>
          <ModalCloseButton>
            <Icon as={CloseIcon} color={Colors.gray400} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody py="$4">
          <VStack space="md">

            <Text size="sm" color={Colors.gray600}>
              Cliente: {clientName}
            </Text>

            {/* 👈 Selector de deuda */}
            <VStack space="xs">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Selecciona la deuda a pagar
              </Text>
              <VStack space="xs">
                {debts.map((debt) => (
                  <Pressable key={debt.id} onPress={() => setSelectedDebtId(debt.id)}>
                    <Box
                      p="$3"
                      borderRadius={8}
                      borderWidth={1}
                      borderColor={
                        selectedDebtId === debt.id ? Colors.success : '$borderLight200'
                      }
                      bg={selectedDebtId === debt.id ? '$green50' : '$white'}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <VStack flex={1}>
                          <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                            {debt.description || 'Sin descripción'}
                          </Text>
                          <Text size="xs" color="$textLight500">
                            {formatDate(debt.dueDate)}
                          </Text>
                        </VStack>
                        <Text size="sm" fontWeight="$semibold" color={Colors.error}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                ))}
              </VStack>
            </VStack>

            {/* Monto — solo visible si hay deuda seleccionada */}
            {selectedDebt && (
              <>
                <Text size="xs" color={Colors.error}>
                  Deuda seleccionada: {formatCurrency(selectedDebt.amount)}
                </Text>

                <VStack space="xs">
                  <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                    Monto del Pago
                  </Text>
                  <Input borderRadius={8} borderColor="$borderLight300">
                    <InputField
                      placeholder="$0"
                      value={amount}
                      onChangeText={(text) => setAmount(formatAmount(text))}
                      keyboardType="numeric"
                    />
                  </Input>
                </VStack>

                <VStack space="xs">
                  <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                    Nota
                  </Text>
                  <Textarea borderRadius={8} borderColor="$borderLight300">
                    <TextareaInput
                      placeholder="Agregar nota de tu pago..."
                      value={note}
                      onChangeText={setNote}
                    />
                  </Textarea>
                </VStack>
              </>
            )}

          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth={1} borderTopColor="$borderLight200" pt="$3">
          <HStack space="md" flex={1}>
            <Button
              flex={1}
              variant="outline"
              borderColor="$borderLight300"
              borderRadius={8}
              onPress={handleClose}
              isDisabled={isLoading}
            >
              <ButtonText color={Colors.gray600}>Cancelar</ButtonText>
            </Button>
            <Button
              flex={1}
              bg={Colors.success}
              borderRadius={8}
              onPress={handleSubmit}
              isDisabled={!amount || !selectedDebtId || isLoading} // 👈 requiere deuda seleccionada
            >
              <ButtonText color={Colors.white}>
                {isLoading ? 'Registrando...' : 'Registrar'}
              </ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}