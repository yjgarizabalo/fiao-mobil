/**
 * Inicio.
 *
 * El v1 mostraba un banner de bienvenida y dos tarjetas de navegación: bonito,
 * pero sin información. Un tendero abre la app para saber **cuánto le deben** y
 * **quién le debe**, así que esta pantalla responde eso en el primer pantallazo:
 *
 *  1. héroe oscuro con el total por cobrar del negocio activo;
 *  2. dos cifras de apoyo (clientes con deuda / clientes al día);
 *  3. accesos rápidos a las acciones frecuentes;
 *  4. los clientes que más deben, listos para tocar y cobrar.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAsyncData } from '@/core/hooks/useAsyncData';
import { routes } from '@/core/navigation/routes';
import { getFirstName, pluralize } from '@/core/utils/format';
import { type Debtor, debtorBalance, displayName } from '@/domain/models';
import { useSession } from '@/features/auth/session/SessionProvider';
import { BusinessSwitcher } from '@/features/businesses/components/BusinessSwitcher';
import { useBusinesses } from '@/features/businesses/state/BusinessProvider';
import { debtorApi } from '@/features/debtors/api/debtorApi';
import { DebtorRow } from '@/features/debtors/components/DebtorRow';
import {
  AnimatedMoney,
  Button,
  CardSkeleton,
  EmptyState,
  ErrorState,
  IconBubble,
  PressableScale,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
} from '@/ui';
import { theme } from '@/theme';

/** Cuántos clientes con deuda se muestran en el resumen. */
const TOP_DEBTORS = 5;
/** Se pide una página amplia para calcular el total del negocio. */
const SUMMARY_PAGE_SIZE = 100;

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { activeBusinessId, activeBusiness, isEmpty: hasNoBusiness } = useBusinesses();

  const debtors = useAsyncData<Debtor[]>(
    async () => {
      if (!activeBusinessId) return [];
      const page = await debtorApi.listByBusiness(activeBusinessId, 1, SUMMARY_PAGE_SIZE);
      return page.items;
    },
    { enabled: Boolean(activeBusinessId), deps: [activeBusinessId] },
  );

  // Al volver de registrar un pago o una deuda, el resumen debe estar al día.
  useFocusEffect(
    useCallback(() => {
      if (activeBusinessId) void debtors.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeBusinessId]),
  );

  const summary = useMemo(() => {
    const list = debtors.data ?? [];
    const withDebt = list
      .filter((debtor) => debtorBalance(debtor) > 0)
      .sort((a, b) => debtorBalance(b) - debtorBalance(a));

    return {
      total: withDebt.reduce((sum, debtor) => sum + debtorBalance(debtor), 0),
      withDebtCount: withDebt.length,
      clearCount: list.length - withDebt.length,
      topDebtors: withDebt.slice(0, TOP_DEBTORS),
      isEmpty: list.length === 0,
    };
  }, [debtors.data]);

  const greeting = `Hola, ${getFirstName(displayName(user)) || 'Usuario'}`;

  /* ── Sin negocios: el usuario acaba de registrarse ─────────────────────── */

  if (hasNoBusiness) {
    return (
      <Screen padded>
        <View style={[styles.emptyHost, { paddingTop: insets.top }]}>
          <EmptyState
            icon="storefront-outline"
            title="Crea tu primer negocio"
            message="Fiao organiza tus vales por negocio. Crea uno para empezar a registrar clientes y deudas."
            actionLabel="Crear negocio"
            onAction={() => router.push(routes.business.create)}
            tone="brand"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={debtors.isRefreshing}
          onRefresh={debtors.refresh}
          tintColor={theme.color.brand}
          colors={[theme.color.brand]}
        />
      }
      contentStyle={styles.scrollContent}
      statusBar="light"
    >
      {/* ── Héroe con el total por cobrar ───────────────────────────────── */}
      <LinearGradient
        colors={theme.gradient.hero}
        style={[styles.hero, { paddingTop: insets.top + theme.spacing.lg }]}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <Text variant="caption" color="textInverseSubtle" uppercase>
              {greeting}
            </Text>
            <BusinessSwitcher inverse style={styles.switcher} />
          </View>

          <PressableScale
            onPress={() => router.push(routes.tabs.profile)}
            haptic="tap"
            activeScale={0.92}
            accessibilityLabel="Ir a tu perfil"
            style={styles.avatarButton}
          >
            <Ionicons name="person" size={20} color={theme.color.textInverse} />
          </PressableScale>
        </View>

        <View style={styles.heroBalance}>
          <Text variant="caption" color="textInverseMuted">
            Total por cobrar
          </Text>

          {debtors.isLoading ? (
            <Skeleton width={220} height={44} radius={12} style={styles.heroSkeleton} />
          ) : (
            <AnimatedMoney value={summary.total} color="textInverse" />
          )}

          <Text variant="caption" color="textInverseSubtle">
            {activeBusiness ? `en ${activeBusiness.name}` : 'en tu negocio'}
          </Text>
        </View>

        <View style={styles.heroStats}>
          <HeroStat
            icon="alert-circle-outline"
            value={String(summary.withDebtCount)}
            label={summary.withDebtCount === 1 ? 'cliente debe' : 'clientes deben'}
            tone="warning"
          />
          <View style={styles.heroStatDivider} />
          <HeroStat
            icon="checkmark-circle-outline"
            value={String(summary.clearCount)}
            label={summary.clearCount === 1 ? 'cliente al día' : 'clientes al día'}
            tone="brand"
          />
        </View>
      </LinearGradient>

      {/* ── Accesos rápidos ─────────────────────────────────────────────── */}
      <View style={styles.body}>
        <View style={styles.quickActions}>
          <QuickAction
            icon="person-add-outline"
            label="Nuevo cliente"
            onPress={() =>
              activeBusinessId && router.push(routes.client.create(activeBusinessId))
            }
            disabled={!activeBusinessId}
          />
          <QuickAction
            icon="people-outline"
            label="Ver clientes"
            onPress={() => router.push(routes.tabs.clients)}
          />
          <QuickAction
            icon="storefront-outline"
            label="Mis negocios"
            onPress={() => router.push(routes.tabs.businesses)}
          />
        </View>

        {/* ── Clientes que más deben ────────────────────────────────────── */}
        <SectionHeader
          title="Te deben"
          meta={
            summary.withDebtCount > 0
              ? pluralize(summary.withDebtCount, 'cliente')
              : undefined
          }
          actionLabel={summary.withDebtCount > TOP_DEBTORS ? 'Ver todos' : undefined}
          onAction={() => router.push(routes.tabs.clients)}
        />

        {debtors.isLoading ? (
          <View style={styles.list}>
            <CardSkeleton height={70} />
            <CardSkeleton height={70} />
            <CardSkeleton height={70} />
          </View>
        ) : debtors.error ? (
          <ErrorState error={debtors.error} onRetry={debtors.reload} />
        ) : summary.isEmpty ? (
          <EmptyState
            icon="person-add-outline"
            title="Aún no tienes clientes"
            message="Registra a la primera persona a la que le fías y empieza a llevar la cuenta."
            actionLabel="Agregar cliente"
            onAction={() =>
              activeBusinessId && router.push(routes.client.create(activeBusinessId))
            }
            tone="brand"
          />
        ) : summary.withDebtCount === 0 ? (
          <EmptyState
            icon="happy-outline"
            title="¡Todo cobrado!"
            message="Ninguno de tus clientes tiene saldo pendiente. Buen trabajo."
            tone="brand"
          />
        ) : (
          <View style={styles.list}>
            {summary.topDebtors.map((debtor) => (
              <DebtorRow
                key={debtor.id}
                debtor={debtor}
                onPress={() =>
                  router.push(
                    routes.client.detail(debtor.id, debtor.businessId ?? activeBusinessId ?? ''),
                  )
                }
              />
            ))}

            {summary.withDebtCount > TOP_DEBTORS ? (
              <Button
                label={`Ver los ${summary.withDebtCount} clientes`}
                variant="secondary"
                onPress={() => router.push(routes.tabs.clients)}
                iconRight="arrow-forward"
                fullWidth
              />
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
};

/* ── Piezas locales ───────────────────────────────────────────────────────── */

interface HeroStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone: 'warning' | 'brand';
}

const HeroStat = ({ icon, value, label, tone }: HeroStatProps) => (
  <View style={styles.heroStat}>
    <Ionicons
      name={icon}
      size={16}
      color={tone === 'warning' ? theme.palette.warning[500] : theme.palette.brand[300]}
    />
    <Text variant="bodyStrong" color="textInverse">
      {value}
    </Text>
    <Text variant="caption" color="textInverseSubtle" numberOfLines={1}>
      {label}
    </Text>
  </View>
);

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

const QuickAction = ({ icon, label, onPress, disabled }: QuickActionProps) => (
  <PressableScale
    onPress={onPress}
    disabled={disabled}
    haptic="tap"
    activeScale={0.96}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={[styles.quickAction, disabled ? styles.quickActionDisabled : null]}
  >
    <IconBubble icon={icon} tone="brand" size={40} />
    <Text variant="captionStrong" align="center" numberOfLines={2}>
      {label}
    </Text>
  </PressableScale>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing['3xl'],
  },
  hero: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing['2xl'],
    borderBottomLeftRadius: theme.radius['3xl'],
    borderBottomRightRadius: theme.radius['3xl'],
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  heroGreeting: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  switcher: {
    marginTop: theme.spacing.xxs,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroBalance: {
    alignItems: 'center',
    gap: theme.spacing.xxs,
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.xl,
  },
  heroSkeleton: {
    marginVertical: theme.spacing.xs,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: theme.spacing.sm,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
    backgroundColor: theme.color.borderInverse,
  },
  body: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: theme.color.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 118,
    justifyContent: 'center',
  },
  quickActionDisabled: {
    opacity: 0.5,
  },
  list: {
    gap: theme.spacing.sm,
  },
  emptyHost: {
    flex: 1,
    justifyContent: 'center',
  },
});
