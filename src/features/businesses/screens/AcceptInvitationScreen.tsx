/**
 * Unirse a un negocio con un código de invitación.
 *
 * Es la contraparte de "Invitar": la persona que recibió el correo (o el código
 * a mano) lo teclea aquí para entrar al negocio. Se eligió el código dentro de
 * la app en vez de un deep link porque es lo que el backend ya soporta sin
 * cambios y funciona en Expo Go (un deep link `https` exigiría un dev build).
 *
 * El flujo valida el código con `GET /invitations/:code` para mostrar el rol
 * antes de confirmar, y solo entonces lo acepta.
 */
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { toAppError } from '@/core/errors/AppError';
import { useForm } from '@/core/hooks/useForm';
import { routes } from '@/core/navigation/routes';
import { required } from '@/core/utils/validation';
import { BUSINESS_ROLE_LABEL } from '@/domain/constants';
import { invitationApi } from '@/features/businesses/api/invitationApi';
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

export const AcceptInvitationScreen = () => {
  const { refresh: refreshBusinesses, selectBusiness } = useBusinesses();
  const dialog = useDialog();
  const toast = useToast();

  const acceptCode = async (code: string, businessId: string | null) => {
    try {
      await invitationApi.accept(code);
      await refreshBusinesses();
      // El negocio recién aceptado pasa a ser el activo, que es a donde el
      // usuario quiere entrar.
      if (businessId) selectBusiness(businessId);
      toast.success('¡Ya eres parte del equipo!');
      router.replace(routes.tabs.businesses);
    } catch (caught) {
      dialog.showError(toAppError(caught));
    }
  };

  const form = useForm({
    initialValues: { code: '' },
    rules: {
      code: [required('El código')],
    },
    onSubmit: async (values) => {
      const code = values.code.trim().toLowerCase();
      try {
        const invitation = await invitationApi.getByCode(code);

        if (invitation.type !== 'BUSINESS_USER') {
          form.setFieldError('code', 'Este código no sirve para unirte a un negocio');
          return;
        }

        const roleLabel = invitation.role ? BUSINESS_ROLE_LABEL[invitation.role] : 'miembro';
        dialog.confirm({
          tone: 'info',
          title: '¿Unirte al negocio?',
          message: `Entrarás como ${roleLabel}. Podrás empezar a trabajar de una vez.`,
          confirmLabel: 'Unirme',
          onConfirm: () => void acceptCode(invitation.code, invitation.businessId ?? null),
        });
      } catch (caught) {
        const error = toAppError(caught);

        if (error.fieldErrors) {
          form.setFieldErrors(error.fieldErrors);
          return;
        }
        // Código inexistente, ya usado o expirado: el backend manda un mensaje
        // claro en español, así que se muestra junto al campo.
        if (
          error.code === 'NOT_FOUND' ||
          error.code === 'VALIDATION' ||
          error.code === 'CONFLICT'
        ) {
          form.setFieldError('code', error.message);
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
          label="Continuar"
          onPress={form.submit}
          loading={form.isSubmitting}
          size="lg"
          fullWidth
        />
      }
    >
      <AppBar onBack={() => router.back()} />

      <IconBubble icon="ticket-outline" tone="brand" size={56} />
      <Text variant="title1" style={styles.title}>
        Tengo un código
      </Text>
      <Text variant="body" color="textMuted" style={styles.subtitle}>
        Escribe el código que te compartieron para unirte a un negocio como parte de su equipo.
      </Text>

      <TextField
        label="Código de invitación"
        placeholder="a1b2c3"
        icon="key-outline"
        value={form.values.code}
        onChangeText={form.handleChange('code')}
        onBlur={form.handleBlur('code')}
        error={form.visibleError('code')}
        autoCapitalize="none"
        autoCorrect={false}
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
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.xl,
  },
});
