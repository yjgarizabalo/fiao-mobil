import Header from '@/components/Header';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/userService';
import {
  Box,
  Button,
  ButtonText,
  ChevronDownIcon,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  ScrollView,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function EditProfileScreen() {
  const { user, accessToken, updateUser } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    documentType: user?.documentType ?? 'CC',
    documentNumber: user?.documentNumber ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!user?.id || !accessToken) return;
    try {
      setLoading(true);
      await UserService.updateUser(user.id, { ...form, role: user.role }, accessToken);
      await updateUser({ ...form });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header showBack title="Editar Perfil" />
      <ScrollView
        flex={1}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
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
            {/* Nombre y Apellido */}
            <Box flexDirection="row" gap={12}>
              <FormControl flex={1}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                    NOMBRE
                  </FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={form.firstName}
                    onChangeText={set('firstName')}
                    placeholder="Nombre"
                  />
                </Input>
              </FormControl>
              <FormControl flex={1}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                    APELLIDO
                  </FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={form.lastName}
                    onChangeText={set('lastName')}
                    placeholder="Apellido"
                  />
                </Input>
              </FormControl>
            </Box>

            {/* Tipo y Número de documento */}
            <Box flexDirection="row" gap={12}>
              <FormControl flex={1}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                    TIPO DOC.
                  </FormControlLabelText>
                </FormControlLabel>
                <Select selectedValue={form.documentType} onValueChange={set('documentType')}>
                  <SelectTrigger borderRadius={10}>
                    <SelectInput placeholder="Tipo" />
                    <SelectIcon mr="$3" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      <SelectItem label="CC" value="CC" />
                      <SelectItem label="CE" value="CE" />
                      <SelectItem label="NIT" value="NIT" />
                      <SelectItem label="Pasaporte" value="PASSPORT" />
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
              <FormControl flex={1}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                    NÚMERO DOC.
                  </FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={form.documentNumber}
                    onChangeText={set('documentNumber')}
                    placeholder="Número"
                    keyboardType="numeric"
                  />
                </Input>
              </FormControl>
            </Box>

            {/* Email */}
            <FormControl>
              <FormControlLabel mb="$1">
                <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                  CORREO ELECTRÓNICO
                </FormControlLabelText>
              </FormControlLabel>
              <Input borderRadius={10}>
                <InputField
                  value={form.email}
                  onChangeText={set('email')}
                  placeholder="correo@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            </FormControl>

            {/* Teléfono */}
            <FormControl>
              <FormControlLabel mb="$1">
                <FormControlLabelText size="xs" style={{ color: Colors.gray500 }}>
                  TELÉFONO
                </FormControlLabelText>
              </FormControlLabel>
              <Input borderRadius={10}>
                <InputField
                  value={form.phone}
                  onChangeText={set('phone')}
                  placeholder="3001234567"
                  keyboardType="phone-pad"
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
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </ButtonText>
        </Button>
      </ScrollView>
    </Box>
  );
}
