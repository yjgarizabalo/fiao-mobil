import Header from '@/components/Header';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/userService';
import {
  Box,
  Button,
  ButtonText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function EditSecurityScreen() {
  const { user, accessToken } = useAuth();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.password) return Alert.alert('Error', 'Ingresa una contraseña');
    if (form.password !== form.confirm)
      return Alert.alert('Error', 'Las contraseñas no coinciden');
    if (!user?.id || !accessToken) return;
    try {
      setLoading(true);
      await UserService.updateUser(user.id, { password: form.password }, accessToken);
      Alert.alert('Éxito', 'Contraseña actualizada', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header showBack title="Seguridad" />
      <Box p="$4">
        <Box
          bg="$white"
          borderRadius={16}
          p="$5"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <VStack space="lg">
            <Text size="sm" style={{ color: Colors.gray500 }}>
              Ingresa y confirma tu nueva contraseña.
            </Text>

            <FormControl>
              <FormControlLabel mb="$1">
                <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                  NUEVA CONTRASEÑA
                </FormControlLabelText>
              </FormControlLabel>
              <Input borderRadius={10}>
                <InputField
                  value={form.password}
                  onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                  placeholder="••••••••"
                  secureTextEntry
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel mb="$1">
                <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                  CONFIRMAR CONTRASEÑA
                </FormControlLabelText>
              </FormControlLabel>
              <Input borderRadius={10}>
                <InputField
                  value={form.confirm}
                  onChangeText={(v) => setForm((p) => ({ ...p, confirm: v }))}
                  placeholder="••••••••"
                  secureTextEntry
                />
              </Input>
            </FormControl>
          </VStack>
        </Box>

        <Button
          mt="$6"
          h={52}
          borderRadius={14}
          bg={Colors.primary}
          onPress={handleSave}
          isDisabled={loading}
          style={{
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <ButtonText color={Colors.white}>
            {loading ? 'Guardando...' : 'Actualizar contraseña'}
          </ButtonText>
        </Button>
      </Box>
    </Box>
  );
}
