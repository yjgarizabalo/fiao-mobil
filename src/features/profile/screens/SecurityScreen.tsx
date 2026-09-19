/**
 * Cambio de contraseña.
 *
 * Añade sobre el v1 un indicador de fuerza en vivo y la comprobación de que
 * las dos contraseñas coinciden mientras se escribe, en lugar de avisarlo solo
 * al pulsar guardar.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { toAppError } from '@/core/errors/AppError';
import { useForm } from '@/core/hooks/useForm';
import { matches, password as passwordRule } from '@/core/utils/validation';
import { authApi } from '@/features/auth/api/authApi';
import { useSession } from '@/features/auth/session/SessionProvider';
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

/** Cuatro niveles: cada criterio cumplido sube uno. */
const passwordStrength = (value: string): { level: 0 | 1 | 2 | 3 | 4; label: string } => {
  if (value.length === 0) return { level: 0, label: '' };

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^\w\s]/.test(value)) score += 1;

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'] as const;
  const level = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return { level, label: labels[level] };
};

const STRENGTH_COLOR = [
  theme.color.danger,
  theme.color.danger,
  theme.color.warning,
  theme.color.brand,
  theme.color.brandStrong,
] as const;

export const SecurityScreen = () => {
  const { user } = useSession();
  const dialog = useDialog();
  const toast = useToast();

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    rules: { password: [passwordRule] },
    onSubmit: async (values) => {
      if (!user?.id) return;

      if (values.password !== values.confirmPassword) {
        form.setFieldError('confirmPassword', 'Las contraseñas no coinciden');
        return;
      }

      try {
        await authApi.updatePassword(user.id, values.password);
        toast.success('Contraseña actualizada');
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

  const strength = passwordStrength(form.values.password);
  const confirmError =
    form.visibleError('confirmPassword') ??
    (form.values.confirmPassword.length > 0
      ? matches(form.values.password, 'Las contraseñas no coinciden')(
          form.values.confirmPassword,
        )
      : undefined);

  return (
    <Screen
      scroll
      padded
      keyboardAware
      footer={
        <Button
          label="Actualizar contraseña"
          onPress={form.submit}
          loading={form.isSubmitting}
          disabled={form.values.password.length === 0}
          size="lg"
          fullWidth
        />
      }
    >
      <AppBar onBack={() => router.back()} title="Seguridad" />

      <IconBubble icon="shield-checkmark-outline" tone="brand" size={56} />

      <Text variant="title2" style={styles.title}>
        Cambia tu contraseña
      </Text>
      <Text variant="body" color="textMuted" style={styles.subtitle}>
        Usa una contraseña que no uses en otras aplicaciones. Al cambiarla,
        tendrás que ingresarla la próxima vez que inicies sesión.
      </Text>

      <TextField
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        icon="lock-closed-outline"
        value={form.values.password}
        onChangeText={form.handleChange('password')}
        onBlur={form.handleBlur('password')}
        error={form.visibleError('password')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />

      {/* Indicador de fuerza: cuatro segmentos que se colorean */}
      {form.values.password.length > 0 ? (
        <View style={styles.strength}>
          <View style={styles.strengthBars}>
            {[1, 2, 3, 4].map((segment) => (
              <View
                key={segment}
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      strength.level >= segment
                        ? STRENGTH_COLOR[strength.level]
                        : theme.color.surfaceSunken,
                  },
                ]}
              />
            ))}
          </View>
          <Text variant="caption" color={STRENGTH_COLOR[strength.level]}>
            {strength.label}
          </Text>
        </View>
      ) : null}

      <TextField
        label="Confirmar contraseña"
        placeholder="Repite la contraseña"
        icon="lock-closed-outline"
        value={form.values.confirmPassword}
        onChangeText={form.handleChange('confirmPassword')}
        onBlur={form.handleBlur('confirmPassword')}
        error={confirmError}
        secureTextEntry
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={form.submit}
        containerStyle={styles.confirmField}
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
  strength: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  confirmField: {
    marginTop: theme.spacing.xs,
  },
});
