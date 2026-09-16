/**
 * Creación de un negocio.
 *
 * Es la primera pantalla real de un usuario nuevo (sin negocio no hay
 * clientes), así que explica para qué sirve en lugar de mostrar dos campos
 * sueltos.
 */
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { toAppError } from '@/core/errors/AppError';
import { useForm } from '@/core/hooks/useForm';
import { minLength, required } from '@/core/utils/validation';
import { useBusinesses } from '@/features/businesses/state/BusinessProvider';
import {
  AppBar,
  Button,
  Dialog,
  IconBubble,
  Screen,
  Text,
  TextField,
  useDialog,
  useToast,
} from '@/ui';
import { theme } from '@/theme';

export const AddBusinessScreen = () => {
  const { createBusiness, isEmpty: isFirstBusiness } = useBusinesses();
  const dialog = useDialog();
  const toast = useToast();

  const form = useForm({
    initialValues: { name: '', address: '' },
    rules: {
      name: [required('El nombre del negocio'), minLength(3, 'El nombre')],
      address: [required('La dirección')],
    },
    onSubmit: async (values) => {
      try {
        const created = await createBusiness({
          name: values.name.trim(),
          address: values.address.trim(),
        });
        toast.success(`${created.name} está listo`);
        router.back();
      } catch (caught) {
        const error = toAppError(caught);
        if (error.fieldErrors) {
          form.setFieldErrors(error.fieldErrors);
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
          label={isFirstBusiness ? 'Crear mi negocio' : 'Guardar negocio'}
          onPress={form.submit}
          loading={form.isSubmitting}
          size="lg"
          fullWidth
        />
      }
    >
      <AppBar onBack={() => router.back()} />

      <IconBubble icon="storefront" tone="brand" size={56} />

      <Text variant="title1" style={styles.title}>
        {isFirstBusiness ? 'Crea tu negocio' : 'Nuevo negocio'}
      </Text>
      <Text variant="body" color="textMuted" style={styles.subtitle}>
        Los clientes, las deudas y los pagos se organizan por negocio. Si tienes
        más de una tienda, podrás cambiar entre ellas cuando quieras.
      </Text>

      <TextField
        label="Nombre del negocio"
        placeholder="Tienda La Esquina"
        icon="pricetag-outline"
        value={form.values.name}
        onChangeText={form.handleChange('name')}
        onBlur={form.handleBlur('name')}
        error={form.visibleError('name')}
        autoCapitalize="words"
        returnKeyType="next"
      />

      <TextField
        label="Dirección"
        placeholder="Calle 45 #12-30, Barranquilla"
        icon="location-outline"
        value={form.values.address}
        onChangeText={form.handleChange('address')}
        onBlur={form.handleBlur('address')}
        error={form.visibleError('address')}
        autoCapitalize="sentences"
        returnKeyType="done"
        onSubmitEditing={form.submit}
      />

      <Dialog {...dialog.props} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: theme.spacing.lg,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing['2xl'],
  },
});
