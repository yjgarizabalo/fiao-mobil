/**
 * Perfil y ajustes.
 *
 * El menú del v1 tenía dos opciones que no llevaban a ninguna parte
 * (Notificaciones y Ayuda, con el handler vacío). Un botón muerto es peor que
 * no ponerlo: aquí lo pendiente se marca como "Pronto" y avisa al tocarlo, así
 * el usuario sabe que la función existe y que todavía no está lista.
 *
 * El cierre de sesión pide confirmación, porque volver a entrar cuesta.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/core/config/env';
import { toAppError } from '@/core/errors/AppError';
import { routes } from '@/core/navigation/routes';
import { formatPhone, pluralize } from '@/core/utils/format';
import { displayName } from '@/domain/models';
import { useSession } from '@/features/auth/session/SessionProvider';
import { useBusinesses } from '@/features/businesses/state/BusinessProvider';
import {
  Avatar,
  Badge,
  Card,
  Dialog,
  Divider,
  IconBubble,
  PressableScale,
  Screen,
  Text,
  useDialog,
  useToast,
} from '@/ui';
import { theme } from '@/theme';

const SUPPORT_EMAIL = 'soporte@fiao.app';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useSession();
  const { businesses } = useBusinesses();
  const dialog = useDialog();
  const toast = useToast();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fullName = displayName(user);

  const handleLogout = () => {
    dialog.confirm({
      tone: 'danger',
      title: '¿Cerrar sesión?',
      message: 'Tendrás que ingresar tu correo y contraseña para volver a entrar.',
      confirmLabel: 'Cerrar sesión',
      onConfirm: async () => {
        setIsLoggingOut(true);
        try {
          await logout();
          router.replace(routes.auth.login);
        } catch (caught) {
          dialog.showError(toAppError(caught));
        } finally {
          setIsLoggingOut(false);
        }
      },
    });
  };

  const handleSupport = () => {
    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Ayuda con Fiao')}`,
    ).catch(() => toast.info(`Escríbenos a ${SUPPORT_EMAIL}`));
  };

  return (
    <Screen scroll statusBar="light">
      {/* ── Héroe de identidad ──────────────────────────────────────────── */}
      <LinearGradient
        colors={theme.gradient.hero}
        style={[styles.hero, { paddingTop: insets.top + theme.spacing['2xl'] }]}
      >
        <Avatar name={fullName} size="xl" />

        <Text variant="title2" color="textInverse" align="center" numberOfLines={2}>
          {fullName}
        </Text>

        {user?.email ? (
          <Text variant="caption" color="textInverseMuted" numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}

        <View style={styles.heroMeta}>
          {user?.documentNumber ? (
            <Badge
              label={`${user.documentType ?? 'CC'} ${user.documentNumber}`}
              tone="neutral"
            />
          ) : null}
          <Badge
            label={pluralize(businesses.length, 'negocio')}
            tone="brand"
            icon="storefront"
          />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Datos de contacto ───────────────────────────────────────────── */}
        {user?.phone ? (
          <Card padding="md" style={styles.contactCard}>
            <View style={styles.contactRow}>
              <IconBubble icon="call-outline" tone="brand" size={38} />
              <View style={styles.contactBody}>
                <Text variant="overline" color="textSubtle">
                  Tu celular
                </Text>
                <Text variant="bodyStrong">{formatPhone(user.phone)}</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* ── Cuenta ──────────────────────────────────────────────────────── */}
        <Text variant="overline" color="textSubtle" style={styles.groupLabel}>
          Cuenta
        </Text>

        <Card padding="none" style={styles.group}>
          <SettingRow
            icon="person-outline"
            label="Editar perfil"
            description="Nombre, documento y contacto"
            onPress={() => router.push(routes.settings.profile)}
          />
          <Divider inset />
          <SettingRow
            icon="lock-closed-outline"
            label="Seguridad"
            description="Cambia tu contraseña"
            onPress={() => router.push(routes.settings.security)}
          />
          <Divider inset />
          <SettingRow
            icon="notifications-outline"
            label="Notificaciones"
            description="Recordatorios de cobro"
            badge="Pronto"
            onPress={() =>
              toast.info('Los recordatorios de cobro llegarán en una próxima versión.')
            }
          />
        </Card>

        {/* ── Negocio ─────────────────────────────────────────────────────── */}
        <Text variant="overline" color="textSubtle" style={styles.groupLabel}>
          Negocio
        </Text>

        <Card padding="none" style={styles.group}>
          <SettingRow
            icon="storefront-outline"
            label="Mis negocios"
            description={pluralize(businesses.length, 'negocio', 'negocios')}
            onPress={() => router.push(routes.tabs.businesses)}
          />
        </Card>

        {/* ── Soporte ─────────────────────────────────────────────────────── */}
        <Text variant="overline" color="textSubtle" style={styles.groupLabel}>
          Ayuda
        </Text>

        <Card padding="none" style={styles.group}>
          <SettingRow
            icon="chatbubble-ellipses-outline"
            label="Contactar soporte"
            description={SUPPORT_EMAIL}
            onPress={handleSupport}
          />
        </Card>

        {/* ── Cerrar sesión ───────────────────────────────────────────────── */}
        <Card padding="none" style={styles.group}>
          <SettingRow
            icon="log-out-outline"
            label={isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            destructive
            onPress={handleLogout}
          />
        </Card>

        <Text variant="caption" color="textSubtle" align="center" style={styles.version}>
          Fiao v2.0.0
          {env.environment === 'prd' ? '' : ` · ${env.environment}`}
        </Text>
      </View>

      <Dialog {...dialog.props} loading={isLoggingOut} />
    </Screen>
  );
};

/* ── Fila de ajuste ───────────────────────────────────────────────────────── */

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  badge?: string;
  destructive?: boolean;
  onPress: () => void;
}

const SettingRow = ({
  icon,
  label,
  description,
  badge,
  destructive = false,
  onPress,
}: SettingRowProps) => (
  <PressableScale
    onPress={onPress}
    haptic="tap"
    activeScale={0.99}
    accessibilityRole="button"
    accessibilityLabel={description ? `${label}. ${description}` : label}
    style={styles.settingRow}
  >
    <IconBubble icon={icon} tone={destructive ? 'danger' : 'neutral'} size={38} />

    <View style={styles.settingBody}>
      <Text variant="bodyStrong" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
        {label}
      </Text>
      {description ? (
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {description}
        </Text>
      ) : null}
    </View>

    {badge ? <Badge label={badge} tone="info" /> : null}

    {!destructive ? (
      <Ionicons name="chevron-forward" size={18} color={theme.color.textSubtle} />
    ) : null}
  </PressableScale>
);

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing['2xl'],
    borderBottomLeftRadius: theme.radius['3xl'],
    borderBottomRightRadius: theme.radius['3xl'],
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  body: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.xl,
  },
  contactCard: {
    marginBottom: theme.spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  contactBody: {
    flex: 1,
    gap: 1,
  },
  groupLabel: {
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  group: {
    marginBottom: theme.spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  settingBody: {
    flex: 1,
    gap: 1,
  },
  version: {
    marginTop: theme.spacing.sm,
  },
});
