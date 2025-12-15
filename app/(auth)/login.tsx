import {
  Box,
  Button,
  ButtonText,
  Heading,
  HStack,
  Image,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  Pressable,
  Text,
  VStack
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { AuthMessages } from '../../constants/Messages';
import { AuthService, AuthError } from '../../services/authService';
import { isValidIdentifier } from '../../utils/validation';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!identifier.trim()) newErrors.identifier = 'Este campo es obligatorio';
    if (!password.trim()) newErrors.password = 'Este campo es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isValidIdentifier(identifier)) {
      Alert.alert('Datos inválidos', 'Ingresa un correo electrónico válido o un número de identificación.');
      return;
    }

    setIsLoading(true);
    try {
      const authResponse = await AuthService.login({ identifier, password });
      await login(authResponse);
      router.replace('/(main)/(tabs)/client');
    } catch (error) {
      let errorMessage = AuthMessages.login.unknownError;
      
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'INVALID_CREDENTIALS':
            errorMessage = AuthMessages.login.invalidCredentials;
            break;
          case 'NETWORK_ERROR':
            errorMessage = AuthMessages.login.networkError;
            break;
          case 'SERVER_ERROR':
            errorMessage = AuthMessages.login.serverError;
            break;
        }
      }
      
      Alert.alert(errorMessage.title, errorMessage.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} justifyContent="center" p="$6" bg="$white">
      <VStack space="lg" alignItems="center">
        <Image
          source={require('../../assets/images/fiaoicon.png')}
          alt="Fiao"
          w={100}
          h={100}
          mb="$0"
        />
        <Heading size="2xl" textAlign="center" mb="$5" fontSize={24}>
          Iniciar Sesión
        </Heading>

        <VStack space="xs" w="100%">
          <Input 
            size="lg" 
            w="100%" 
            h={54} 
            borderRadius={4}
            borderColor={errors.identifier ? Colors.error : "$borderLight200"}
          >
            <InputField
              placeholder="Correo o Número de Identificación *"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="default"
              autoCapitalize="none"
            />
          </Input>
          {errors.identifier && (
            <Text size="xs" color={Colors.error}>
              {errors.identifier}
            </Text>
          )}
        </VStack>

        <VStack space="xs" w="100%">
          <Input 
            size="lg" 
            w="100%" 
            h={54}
            borderColor={errors.password ? Colors.error : "$borderLight200"}
          >
            <InputField
              placeholder="Ingresa tu contraseña *"
              value={password}
              onChangeText={setPassword}
              type={showPassword ? "text" : "password"}
            />
            <InputSlot pr="$3" onPress={() => setShowPassword(!showPassword)}>
              <InputIcon as={() => (
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={Colors.gray400} 
                />
              )} />
            </InputSlot>
          </Input>
          {errors.password && (
            <Text size="xs" color={Colors.error}>
              {errors.password}
            </Text>
          )}
        </VStack>

        <Pressable onPress={() => router.push('/(auth)/register')} mt="$2">
          <Text color={Colors.gray400}>
            ¿Olvidaste tu contraseña?{' '}
            <Text color={Colors.primary} textDecorationLine="underline" fontWeight="bold">
              Ingresa aquí
            </Text>
          </Text>
        </Pressable>

        <Button
          size="lg"
          w="100%"
          mt="$4"
          h={52}
          borderRadius={14}
          bg={Colors.primary}
          $pressed={{
            bg: Colors.primaryHover
          }}
          onPress={handleLogin}
          isDisabled={isLoading}
        >
          <ButtonText color={Colors.white}>
            {isLoading ? 'Iniciando...' : 'Iniciar'}
          </ButtonText>
        </Button>

        {/* <Button
          size="lg"
          w="100%"
          h={52}
          borderRadius={14}
          bg={Colors.gray100}
          $pressed={{
            bg: Colors.gray200
          }}
          onPress={handleLogin}
        >
          <HStack space="sm" alignItems="center">
            <Image
              source={require('../../assets/images/googleicon.png')}
              alt="Google"
              w={20}
              h={20}
            />
            <ButtonText color={Colors.primary}>Iniciar con Google</ButtonText>
          </HStack>
        </Button> */}

        <Pressable onPress={() => router.push('/(auth)/register')} mt="$2">
          <Text color={Colors.gray400}>¿No tienes cuenta?{' '} <Text color={Colors.primary} textDecorationLine="underline" fontWeight="bold">Regístrate</Text></Text>
        </Pressable>
        
        <Box w="100%" h={60} mt="$6" bg={Colors.gray100} borderRadius={12} justifyContent="center" alignItems="center">
          <Text fontSize={12} color={Colors.gray500} fontWeight="bold">
            PATROCINADORES
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}