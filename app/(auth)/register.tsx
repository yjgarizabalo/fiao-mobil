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
import { isValidEmail } from '../../utils/validation';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!name || !email || !password) {
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
      return;
    }

    // TODO: Implementar lógica de registro
    console.log('Register:', { name, email, password });
    router.replace('/(main)/(tabs)/client');
  };

  return (
    <Box flex={1} justifyContent="center" p="$6" bg="$white">
      <VStack space="lg" alignItems="center">
        <Heading size="2xl" textAlign="center" mb="$8">
          Crear Cuenta
        </Heading>
        
        <Input size="lg" w="100%">
          <InputField
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
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