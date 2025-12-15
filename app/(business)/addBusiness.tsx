import { Ionicons } from '@expo/vector-icons';
import {
  Box,
  Button,
  ButtonText,
  Heading,
  HStack,
  Input,
  InputField,
  Pressable,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import Header from '../../components/Header';
import { Colors } from '../../constants/Colors';
import { useBusiness } from '../../contexts/BusinessContext';


export default function AddBusinessScreen() {
  const { addBusiness } = useBusiness();
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'El nombre del negocio es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      addBusiness({
        name,
      });
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Agregar Negocio" />

      <Box p="$4">
        <HStack alignItems="center" space="md" mb="$4">
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </Pressable>
          <Heading size="lg" color={Colors.primary}>
            Nuevo Negocio
          </Heading>
        </HStack>

        <VStack space="lg">
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Nombre del Negocio *
            </Text>
            <Input
              size="lg"
              w="100%"
              h={54}
              borderRadius={4}
              borderColor={errors.name ? Colors.error : '$borderLight200'}
            >
              <InputField
                placeholder="Ingresa el nombre del negocio"
                value={name}
                onChangeText={setName}
              />
            </Input>
            {errors.name && (
              <Text size="xs" color={Colors.error}>
                {errors.name}
              </Text>
            )}
          </VStack>

          <Button
            size="lg"
            w="100%"
            h={52}
            borderRadius={14}
            bg={Colors.primary}
            $pressed={{
              bg: Colors.primaryHover,
            }}
            onPress={handleSave}
            mt="$6"
          >
            <ButtonText color={Colors.white}>Guardar Negocio</ButtonText>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
