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
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AuthMessages } from '../../constants/Messages';
import { useAuth } from '../../contexts/AuthContext';
import { AuthError } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!firstName || !email || !password || !lastName || !documentType || !documentNumber || !phone) {
      Alert.alert(
        '¡Faltan algunos datos!',
        'Para crear tu cuenta necesitamos tu nombre completo, correo electrónico y una contraseña segura.'
      );
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
    }
       setIsLoading(true);
      
          try {
            await register({ firstName, lastName, documentType, documentNumber, email, phone, password });
            await login({ identifier: email, password });
            router.replace('/(main)/(tabs)/dashBoard');
            console.log('Register:', { name, email, password });
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

    // TODO: Implementar lógica de registro
    
  };

  return (
    <Box flex={1} justifyContent="center" p="$6" bg="$white">
      <VStack space="lg" alignItems="center">
        <Heading size="2xl" textAlign="center" mb="$8">
          Crear Cuenta
        </Heading>
        
        <Input size="lg" w="100%">
          <InputField
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
          />
        </Input>

           <Input size="lg" w="100%">
          <InputField
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
          />
        </Input>

           <Input size="lg" w="100%">
          <InputField
            placeholder="Tipo de Documento"
            value={documentType}
            onChangeText={setDocumentType}
          />
        </Input>

           <Input size="lg" w="100%">
          <InputField
            placeholder="Número de Documento"
            value={documentNumber}
            onChangeText={setDocumentNumber}
          />
        </Input>

           <Input size="lg" w="100%">
          <InputField
            placeholder="Telefono"
            value={phone}
            onChangeText={setPhone}
          />
        </Input>
        
        <Input size="lg" w="100%">
          <InputField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="default"
            autoCapitalize="none"
          />
        </Input>
        
        <Input size="lg" w="100%">
          <InputField
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            type="password"
          />
        </Input>
        
        <Button 
          size="lg" 
          w="100%" 
          mt="$4" 
          h={52}
          bg="#1c1c1c"
          onPress={handleRegister}
          isDisabled={isLoading}
          $pressed={{
            bg: "#2c2c2c"
          }}
        >
          <ButtonText color="$white">Registrarse</ButtonText>
        </Button>
        
        <Pressable onPress={() => router.back()} mt="$4">
          <Text color="$primary600">¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </VStack>
    </Box>
  );
}