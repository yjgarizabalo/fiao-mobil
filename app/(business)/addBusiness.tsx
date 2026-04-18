import {
  Box,
  Button,
  ButtonText,
  Heading,
  Input,
  InputField,
  ScrollView,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import Header from '../../components/Header';
import { Colors } from '../../constants/Colors';
import { useBusiness } from '../../contexts/BusinessContext';


export default function AddBusinessScreen() {
  const { addBusiness } = useBusiness();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'El nombre del negocio es obligatorio';
    if (!address.trim()) newErrors.address = 'La dirección es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await addBusiness({
        name,
        address,
      });
      router.back();
    } catch (error) {
      console.error('Error saving business:', error);
      Alert.alert(
        'Error al guardar',
        'No se pudo crear el negocio. Inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Agregar Negocio" showBack />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box p="$6">
          <VStack space="lg" alignItems="center">
            <Heading size="2xl" color={Colors.primary} alignSelf="flex-start">
              Nuevo Negocio
            </Heading>

            <VStack space="sm" w="100%">
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

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Dirección *
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor={errors.address ? Colors.error : '$borderLight200'}
              >
                <InputField
                  placeholder="Ingresa la dirección"
                  value={address}
                  onChangeText={setAddress}
                />
              </Input>
              {errors.address && (
                <Text size="xs" color={Colors.error}>
                  {errors.address}
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
              isDisabled={loading}
              mt="$6"
            >
              <ButtonText color={Colors.white}>
                {loading ? 'Guardando negocio...' : 'Guardar Negocio'}
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
