import {
  Box,
  Button,
  ButtonText,
  Heading,
  Input,
  InputField,
  Pressable,
  Text,
  VStack,
  HStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { AuthMessages } from '../../constants/Messages';
import { Colors } from '../../constants/Colors';
import { isValidEmail } from '../../utils/validation';
import { RegisterService, RegisterError } from '../../services/registerUsers';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isValidEmail(email)) {
      const { title, message } = AuthMessages.validation.invalidEmail;
      Alert.alert(title, message);
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña muy corta',
        'Tu contraseña debe tener al menos 6 caracteres para mantener tu cuenta segura.'
      );
      return;
    }

    setLoading(true);
    try {
      await RegisterService.registerUser({
        firstName,
        lastName,
        documentType,
        documentNumber,
        email,
        phone,
        password
      });
      
      // Clear all fields
      setFirstName('');
      setLastName('');
      setDocumentType('CC');
      setDocumentNumber('');
      setEmail('');
      setPhone('');
      setPassword('');
      
      Alert.alert(
        '¡Cuenta creada!',
        'Redirigiendo al login...',
        [{ text: 'OK' }]
      );
      
      // Auto redirect to login after 1 second
      setTimeout(() => {
        router.push('/(auth)/login');
      }, 1000);
    } catch (error) {
      if (error instanceof RegisterError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'No se pudo crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box p="$6">
          <VStack space="lg" alignItems="center">
            <Heading size="2xl" textAlign="center" mb="$8" color={Colors.primary}>
              Crear Cuenta
            </Heading>
            
            <VStack space="sm" w="100%">
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
            
            <VStack space="sm" w="100%">
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
            
            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Tipo de Documento *
              </Text>
              <HStack space="sm" w="100%">
                <Input 
                  size="lg" 
                  flex={0.2}
                  h={54} 
                  borderRadius={4}
                >
                  <InputField
                    placeholder="CC"
                    value={documentType}
                    onChangeText={setDocumentType}
                  />
                </Input>
                
                <Input 
                  size="lg" 
                  flex={0.8}
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
              </HStack>
              {errors.documentNumber && (
                <Text size="xs" color={Colors.error}>
                  {errors.documentNumber}
                </Text>
              )}
            </VStack>
            
            <VStack space="sm" w="100%">
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
                  autoCapitalize="none"
                />
              </Input>
              {errors.email && (
                <Text size="xs" color={Colors.error}>
                  {errors.email}
                </Text>
              )}
            </VStack>
            
            <VStack space="sm" w="100%">
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
            
            <VStack space="sm" w="100%">
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
                  type="password"
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
              mt="$6" 
              h={52}
              borderRadius={14}
              bg={Colors.primary}
              onPress={handleRegister}
              isDisabled={loading}
              $pressed={{
                bg: Colors.primaryHover
              }}
            >
              <ButtonText color={Colors.white}>{loading ? 'Creando cuenta...' : 'Registrarse'}</ButtonText>
            </Button>
            
            <Pressable onPress={() => router.push('/(auth)/login')} mt="$4">
              <Text color={Colors.primary}>¿Ya tienes cuenta? Inicia sesión</Text>
            </Pressable>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}