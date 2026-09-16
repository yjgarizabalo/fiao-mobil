/**
 * Edición del perfil.
 *
 * Guarda con `PATCH /users/:id` y sincroniza la copia local del usuario, para
 * que el saludo del inicio y el perfil se actualicen sin volver a entrar.
 *
 * El botón de guardar solo se habilita si algo cambió (`isDirty`): evita
 * peticiones inútiles y deja claro que no hay nada que guardar.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { toAppError } from '@/core/errors/AppError';
import { useForm } from '@/core/hooks/useForm';
import {
  documentNumber as documentNumberRule,
  email as emailRule,
  minLength,
  phone as phoneRule,
  required,
} from '@/core/utils/validation';
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from '@/domain/constants';
import { authApi } from '@/features/auth/api/authApi';
import { useSession } from '@/features/auth/session/SessionProvider';
import {
  AppBar,
  Button,
  Dialog,
  OptionPicker,
  Screen,
  SectionHeader,
  Text,
  TextField,
  useDialog,
  useToast,
} from '@/ui';
import { theme } from '@/theme';

export const EditProfileScreen = () => {
  const { user, patchUser } = useSession();
  const dialog = useDialog();
  const toast = useToast();

  const form = useForm({
    initialValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      documentType: (user?.documentType ?? 'CC') as DocumentType,
      documentNumber: user?.documentNumber ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
    rules: {
      firstName: [required('El nombre'), minLength(2, 'El nombre')],
      lastName: [required('El apellido'), minLength(2, 'El apellido')],
      documentNumber: [documentNumberRule],
      email: [required('El correo'), emailRule],
      phone: [phoneRule],
    },
    onSubmit: async (values) => {
      if (!user?.id) return;

      try {
        const payload = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          documentType: values.documentType as DocumentType,
          documentNumber: values.documentNumber.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          // El backend espera el rol en el PATCH; se reenvía sin cambios.
          role: user.role,
        };

        await authApi.updateProfile(user.id, payload);
        await patchUser(payload);

        toast.success('Perfil actualizado');
        router.back();
      } catch (caught) {
        const error = toAppError(caught);
        if (error.fieldErrors) {
          form.setFieldErrors(error.fieldErrors);
          return;
        }
        if (error.code === 'CONFLICT') {
          form.setFieldError('email', 'Ya existe una cuenta con este correo');
          return;
        }
        dialog.showError(error);
      }
    },
  });

  return (
    <Screen
      scroll
      padded
      keyboardAware
      footer={
        <Button
          label="Guardar cambios"
          onPress={form.submit}
          loading={form.isSubmitting}
          disabled={!form.isDirty}
          size="lg"
          fullWidth
        />
      }
    >
      <AppBar onBack={() => router.back()} title="Editar perfil" />

      <Text variant="body" color="textMuted" style={styles.intro}>
        Estos datos identifican tu cuenta. Tus clientes no los ven.
      </Text>

      <SectionHeader title="Nombre" />

      <View style={styles.row}>
        <TextField
          label="Nombre"
          value={form.values.firstName}
          onChangeText={form.handleChange('firstName')}
          onBlur={form.handleBlur('firstName')}
          error={form.visibleError('firstName')}
          autoCapitalize="words"
          containerStyle={styles.rowItem}
        />
        <TextField
          label="Apellido"
          value={form.values.lastName}
          onChangeText={form.handleChange('lastName')}
          onBlur={form.handleBlur('lastName')}
          error={form.visibleError('lastName')}
          autoCapitalize="words"
          containerStyle={styles.rowItem}
        />
      </View>

      <SectionHeader title="Documento" />

      <View style={styles.row}>
        <OptionPicker
          label="Tipo"
          value={form.values.documentType}
          options={DOCUMENT_TYPE_OPTIONS}
          onChange={(value) => form.setValue('documentType', value)}
          sheetTitle="Tipo de documento"
          containerStyle={styles.documentType}
        />
        <TextField
          label="Número"
          value={form.values.documentNumber}
          onChangeText={form.handleChange('documentNumber')}
          onBlur={form.handleBlur('documentNumber')}
          error={form.visibleError('documentNumber')}
          keyboardType="number-pad"
          containerStyle={styles.documentNumber}
        />
      </View>

      <SectionHeader title="Contacto" />

      <TextField
        label="Correo electrónico"
        icon="mail-outline"
        value={form.values.email}
        onChangeText={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        error={form.visibleError('email')}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextField
        label="Celular"
        icon="call-outline"
        value={form.values.phone}
        onChangeText={form.handleChange('phone')}
        onBlur={form.handleBlur('phone')}
        error={form.visibleError('phone')}
        keyboardType="phone-pad"
        returnKeyType="done"
        onSubmitEditing={form.submit}
      />

      <Dialog {...dialog.props} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: {
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  documentType: {
    width: 118,
  },
  documentNumber: {
    flex: 1,
  },
});
