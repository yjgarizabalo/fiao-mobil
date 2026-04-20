import { Colors } from '@/constants/Colors';
import {
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

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; description: string }) => void;
  clientName: string;
  isLoading?: boolean;
}

export default function AddDebtModal({ isOpen, onClose, onSubmit, clientName, isLoading = false }: AddDebtModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (numAmount > 0) {
      onSubmit({ amount: numAmount, description: description.trim() });
      setAmount('');
      setDescription('');
      onClose();
    }
  };

  const formatAmount = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? `$${parseInt(numbers).toLocaleString()}` : '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent bg="$white" borderRadius={16} mx="$4">
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight200" pb="$3">
          <Text size="lg" fontWeight="$semibold" color={Colors.primary}>
            Agregar Deuda
          </Text>
          <ModalCloseButton>
            <Icon as={CloseIcon} color={Colors.gray400} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody py="$4">
          <VStack space="md">
            <Text size="sm" color={Colors.gray600} mb="$2">
              Cliente: {clientName}
            </Text>

            <VStack space="xs">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Monto
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
                Descripción
              </Text>
              <Textarea borderRadius={8} borderColor="$borderLight300">
                <TextareaInput
                  placeholder="Describe el motivo de la deuda..."
                  value={description}
                  onChangeText={setDescription}
                />
              </Textarea>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth={1} borderTopColor="$borderLight200" pt="$3">
          <HStack space="md" flex={1}>
            <Button
              flex={1}
              variant="outline"
              borderColor="$borderLight300"
              borderRadius={8}
              onPress={onClose}
            >
              <ButtonText color={Colors.gray600}>Cancelar</ButtonText>
            </Button>
            <Button
              flex={1}
              bg={Colors.error}
              borderRadius={8}
              onPress={handleSubmit}
              isDisabled={!amount || isLoading}
            >
              <ButtonText color={Colors.white}>
                {isLoading ? "Guardando..." : "Agregar"}
              </ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}