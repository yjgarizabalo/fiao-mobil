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
  Text,
  Textarea,
  TextareaInput,
  VStack,
} from '@gluestack-ui/themed';
import { useState } from 'react';
import { Colors } from '../constants/Colors';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; note: string; method: string }) => void;
  clientName: string;
  currentBalance: number;
  isLoading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const METHODS = [
  { key: 'CASH', label: 'Efectivo' },
  { key: 'TRANSFER', label: 'Transferencia' },
  { key: 'CARD', label: 'Tarjeta' },
];

export default function RegisterPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  clientName,
  currentBalance,
  isLoading = false,
}: RegisterPaymentModalProps) {
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<string>('CASH');
  const [amountInput, setAmountInput] = useState('');

  // Resolve the effective amount: typed value or full balance
  const parsedAmount = amountInput ? Number(amountInput.replace(/\D/g, '')) : 0;
  const effectiveAmount = parsedAmount > 0 ? parsedAmount : currentBalance;
  const isPartial = parsedAmount > 0 && parsedAmount < currentBalance;
  const exceedsBalance = parsedAmount > currentBalance;

  const canSubmit = effectiveAmount > 0 && !exceedsBalance && !isLoading;

  const handleClose = () => {
    setNote('');
    setAmountInput('');
    setMethod('CASH');
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      amount: effectiveAmount,
      note: note.trim(),
      method,
    });
    setNote('');
    setAmountInput('');
    setMethod('CASH');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalBackdrop />
      <ModalContent bg="$white" borderRadius={16} mx="$4">
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight200" pb="$3">
          <Text size="lg" fontWeight="$semibold" color={Colors.primary}>
            Registrar Pago
          </Text>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody py="$4">
          <VStack space="md">

            {/* Client + balance summary */}
            <Box
              p="$4"
              borderRadius={12}
              bg="$backgroundLight50"
              borderWidth={1}
              borderColor="$borderLight200"
            >
              <VStack space="xs" alignItems="center">
                <Text size="sm" color="$textLight500">
                  Cliente
                </Text>
                <Text size="md" fontWeight="$semibold" color={Colors.primary}>
                  {clientName}
                </Text>
                <Text size="xs" color="$textLight400" mt="$1">
                  Saldo pendiente
                </Text>
                <Text size="2xl" fontWeight="$bold" color={Colors.error}>
                  {formatCurrency(currentBalance)}
                </Text>
              </VStack>
            </Box>

            {/* Amount input — optional, defaults to full balance */}
            <VStack space="xs">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Monto a pagar
              </Text>
              <Input borderRadius={8} borderColor="$borderLight300">
                <InputField
                  keyboardType="numeric"
                  placeholder={`${formatCurrency(currentBalance)} (saldo completo)`}
                  value={amountInput}
                  onChangeText={(text) => setAmountInput(text.replace(/\D/g, ''))}
                />
              </Input>
              {isPartial && (
                <Text size="xs" color={Colors.warning ?? '$amber600'}>
                  Abono parcial — quedará un saldo de{' '}
                  {formatCurrency(currentBalance - parsedAmount)}
                </Text>
              )}
              {exceedsBalance && (
                <Text size="xs" color={Colors.error}>
                  El monto no puede superar el saldo pendiente
                </Text>
              )}
            </VStack>

            {/* Payment method */}
            <VStack space="xs">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Método de pago
              </Text>
              <HStack space="sm">
                {METHODS.map((m) => (
                  <Button
                    key={m.key}
                    flex={1}
                    size="sm"
                    h={36}
                    borderRadius={8}
                    variant={method === m.key ? 'solid' : 'outline'}
                    bg={method === m.key ? Colors.primary : '$white'}
                    borderColor={method === m.key ? Colors.primary : '$borderLight300'}
                    onPress={() => setMethod(m.key)}
                  >
                    <ButtonText
                      size="xs"
                      color={method === m.key ? '$white' : Colors.primary}
                    >
                      {m.label}
                    </ButtonText>
                  </Button>
                ))}
              </HStack>
            </VStack>

            {/* Note */}
            <VStack space="xs">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Nota (opcional)
              </Text>
              <Textarea borderRadius={8} size="sm" borderColor="$borderLight300">
                <TextareaInput
                  placeholder="Agregar nota del pago..."
                  value={note}
                  onChangeText={setNote}
                />
              </Textarea>
            </VStack>

            {/* Confirm amount pill */}
            {!exceedsBalance && (
              <Box
                p="$3"
                borderRadius={8}
                bg="$green50"
                borderWidth={1}
                borderColor="$green200"
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="sm" color={Colors.success} fontWeight="$medium">
                    {isPartial ? 'Abono a registrar:' : 'Total a registrar:'}
                  </Text>
                  <Text size="md" color={Colors.success} fontWeight="$bold">
                    {formatCurrency(effectiveAmount)}
                  </Text>
                </HStack>
              </Box>
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
              <ButtonText color="$textLight600">Cancelar</ButtonText>
            </Button>
            <Button
              flex={1}
              bg={Colors.success}
              borderRadius={8}
              onPress={handleSubmit}
              isDisabled={!canSubmit}
            >
              <ButtonText color="$white">
                {isLoading ? 'Registrando...' : 'Registrar'}
              </ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}