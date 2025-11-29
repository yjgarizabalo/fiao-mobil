import {
  Avatar,
  AvatarFallbackText,
  Box,
  Button,
  ButtonText,
  Card,
  Heading,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import Header from '../../../components/Header';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../contexts/AuthContext';


export default function ProfileScreen() {
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.log('Logout failed:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Perfil" />
      <VStack space="xl" flex={1}>
        <VStack space="sm" alignItems="center" mt="$16">
          <Avatar size="xl" bg="$primary600">
            <AvatarFallbackText>Usuario</AvatarFallbackText>
          </Avatar>
          <Heading size="2xl" textAlign="center">
            Perfil
          </Heading>
          <Text size="lg" color="$textLight600" textAlign="center">
            Información del usuario
          </Text>
        </VStack>
        
        <Box flex={1} justifyContent="center">
          <Card p="$6" bg="$white" borderRadius="$lg" borderWidth={1} borderColor="$borderLight200" shadowOpacity={0} elevation={0}>
            <VStack space="md">
              <Text size="md" textAlign="center" lineHeight="$lg">
                Aquí puedes mostrar y editar la información del perfil del usuario.
              </Text>
              
              <VStack space="sm">
                <Text size="sm" color="$textLight500">Nombre:</Text>
                <Text size="md">Usuario Ejemplo</Text>
              </VStack>
              
              <VStack space="sm">
                <Text size="sm" color="$textLight500">Email:</Text>
                <Text size="md">usuario@ejemplo.com</Text>
              </VStack>
            </VStack>
          </Card>
        </Box>
        
        <Box p="$4">
          <Button 
            size="lg"
            w="100%"
            h={52}
            borderRadius={14}
            bg={Colors.error}
            onPress={handleLogout}
          >
            <ButtonText color={Colors.white}>Cerrar Sesión</ButtonText>
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}