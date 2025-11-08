import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  HStack,
  Pressable,
} from '@gluestack-ui/themed';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { Colors } from '../../constants/Colors';
import { useClients } from '../../contexts/ClientContext';

export default function AddClientCreditScreen() {
  const { addClient } = useClients();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';
    if (!documentNumber.trim()) newErrors.documentNumber = 'El número de documento es obligatorio';
    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!password.trim()) newErrors.password = 'La contraseña es obligatoria';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      addClient({
        firstName,
        lastName,
        documentType,
        documentNumber,
        email,
        phone,
        password
      });
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Agregar Cliente" />
      
      <Box p="$4">
        <HStack alignItems="center" space="md" mb="$4">
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </Pressable>
          <Heading size="lg" color={Colors.primary}>
            Nuevo Cliente
          </Heading>
        </HStack>

        <VStack space="lg">
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Nombre *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.firstName ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa el nombre"
                value={firstName}
                onChangeText={setFirstName}
              />
            </Input>
            {errors.firstName && (
              <Text size="xs" color={Colors.error}>
                {errors.firstName}
              </Text>
            )}
          </VStack>

          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Apellido *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.lastName ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa el apellido"
                value={lastName}
                onChangeText={setLastName}
              />
            </Input>
            {errors.lastName && (
              <Text size="xs" color={Colors.error}>
                {errors.lastName}
              </Text>
            )}
          </VStack>

          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Tipo de Documento *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
            >
              <InputField
                placeholder="CC"
                value={documentType}
                onChangeText={setDocumentType}
              />
            </Input>
          </VStack>

          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Número de Documento *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.documentNumber ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa el número de documento"
                value={documentNumber}
                onChangeText={setDocumentNumber}
                keyboardType="numeric"
              />
            </Input>
            {errors.documentNumber && (
              <Text size="xs" color={Colors.error}>
                {errors.documentNumber}
              </Text>
            )}
          </VStack>

          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Email *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.email ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa el email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </Input>
            {errors.email && (
              <Text size="xs" color={Colors.error}>
                {errors.email}
              </Text>
            )}
          </VStack>

          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Teléfono *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.phone ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa el teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Input>
            {errors.phone && (
              <Text size="xs" color={Colors.error}>
                {errors.phone}
              </Text>
            )}
          </VStack>

          <VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Contraseña *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.password ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa la contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </Input>
            {errors.password && (
              <Text size="xs" color={Colors.error}>
                {errors.password}
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
              bg: Colors.primaryHover
            }}
            onPress={handleSave}
            mt="$6"
          >
            <ButtonText color={Colors.white}>Guardar Cliente</ButtonText>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}