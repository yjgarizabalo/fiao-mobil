import Header from '@/components/Header';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  Avatar,
  AvatarFallbackText,
  Box,
  Button,
  ButtonText,
  HStack,
  Heading,
  ScrollView,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

// ── Tipos de opciones del menú ──────────────────────────────────────────────
interface MenuOption {
  id: string;
  label: string;
  description?: string;
  icon: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.log('Logout failed:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : 'Usuario';

  // ── Opciones del menú — agrega o quita aquí fácilmente ───────────────────
  const menuOptions: MenuOption[] = [
    {
      id: 'edit-profile',
      label: 'Editar Perfil',
      description: 'Nombre, foto y datos personales',
      icon: '✏️',
      onPress: () => { /* TODO: router.push('/edit-profile') */ },
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      description: 'Configura tus alertas',
      icon: '🔔',
      onPress: () => { /* TODO */ },
    },
    {
      id: 'security',
      label: 'Seguridad',
      description: 'Contraseña y acceso',
      icon: '🔒',
      onPress: () => { /* TODO */ },
    },
    {
      id: 'help',
      label: 'Ayuda y soporte',
      description: 'Preguntas frecuentes',
      icon: '💬',
      onPress: () => { /* TODO */ },
    },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Perfil" />

      <ScrollView
        flex={1}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ──────────────────────────────────────────────────── */}
        <Box
          mx="$4"
          mt="$4"
          mb="$4"
          borderRadius={20}
          overflow="hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          {/* Dark header */}
          <Box
            px="$5"
            pt="$6"
            pb="$5"
            style={{ backgroundColor: '#16101a' }}
          >
            <HStack alignItems="center" space="md">
              {/* Avatar */}
              <Box
                borderRadius="$full"
                p="$0.5"
                style={{
                  borderWidth: 2,
                  borderColor: 'rgba(248,113,113,0.5)',
                }}
              >
                <Avatar size="lg" bg={Colors.primary}>
                  <AvatarFallbackText>{getInitials(fullName)}</AvatarFallbackText>
                </Avatar>
              </Box>

              {/* Name + email */}
              <VStack flex={1} space="xs">
                <Heading
                  numberOfLines={1}
                  style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}
                >
                  {fullName}
                </Heading>
                <Text
                  numberOfLines={1}
                  size="sm"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {user?.email || 'Sin correo registrado'}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Stats strip */}
          <Box
            px="$5"
            py="$3"
            style={{ backgroundColor: '#111111' }}
          >
            <HStack justifyContent="space-between">
              <VStack space="xs" alignItems="center">
                {/* <Text size="xs" style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5 }}>
                  ROL
                </Text>
                <Text size="sm" fontWeight="$bold" style={{ color: '#4ade80' }}>
                  {user?.role ?? 'Usuario'}
                </Text> */}
              </VStack>

              <Box w={1} style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

              <VStack space="xs" alignItems="center">
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5 }}>
                  ESTADO
                </Text>
                <Text size="sm" fontWeight="$bold" style={{ color: '#4ade80' }}>
                  Activo
                </Text>
              </VStack>

              <Box w={1} style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

              <VStack space="xs" alignItems="center">
                {/* <Text size="xs" style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5 }}>
                  PLAN
                </Text>
                <Text size="sm" fontWeight="$bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user?.plan ?? 'Básico'}
                </Text> */}
              </VStack>
            </HStack>
          </Box>
        </Box>

        {/* ── Opciones ───────────────────────────────────────────────────── */}
        <Box mx="$4" mb="$4">
          <Heading size="sm" mb="$3" style={{ color: Colors.primary, letterSpacing: 0.4 }}>
            CONFIGURACIÓN
          </Heading>

          <Box
            borderRadius={16}
            overflow="hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {menuOptions.map((option, index) => (
              <Box key={option.id}>
                <Button
                  variant="outline"
                  borderWidth={0}
                  borderRadius={0}
                  h={64}
                  bg="$white"
                  onPress={option.onPress}
                  justifyContent="flex-start"
                >
                  <HStack flex={1} alignItems="center" space="md" px="$1">
                    {/* Icon pill */}
                    <Box
                      w={38}
                      h={38}
                      borderRadius={10}
                      justifyContent="center"
                      alignItems="center"
                      style={{ backgroundColor: 'rgba(22,16,26,0.07)' }}
                    >
                      <Text style={{ fontSize: 18 }}>{option.icon}</Text>
                    </Box>

                    {/* Labels */}
                    <VStack flex={1} space="xs">
                      <Text
                        size="sm"
                        fontWeight="$semibold"
                        style={{ color: '#16101a' }}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text size="xs" style={{ color: 'rgba(22,16,26,0.45)' }}>
                          {option.description}
                        </Text>
                      )}
                    </VStack>

                    {/* Chevron */}
                    <Text style={{ color: 'rgba(22,16,26,0.25)', fontSize: 16 }}>›</Text>
                  </HStack>
                </Button>

                {/* Divider (skip last) */}
                {index < menuOptions.length - 1 && (
                  <Box
                    h={1}
                    mx="$4"
                    style={{ backgroundColor: 'rgba(22,16,26,0.06)' }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Cerrar Sesión ──────────────────────────────────────────────── */}
        <Box mx="$4">
          <Button
            size="lg"
            w="100%"
            h={52}
            borderRadius={14}
            bg={Colors.error}
            onPress={handleLogout}
            isDisabled={loading}
            style={{
              shadowColor: Colors.error,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <ButtonText color={Colors.white}>
              {loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </ButtonText>
          </Button>
        </Box>
      </ScrollView>
    </Box>
  );
}