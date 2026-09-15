/**
 * Detalle de un cliente: saldo, acciones y extracto de movimientos.
 *
 * Es la pantalla donde el tendero pasa el día, así que concentra las dos
 * acciones del negocio —fiar y cobrar— en botones grandes y siempre visibles,
 * y debajo el extracto que reemplaza al cuaderno.
 *
 * Cambios de fondo respecto al v1:
 *  - una sola petición para las deudas (ya vienen con sus pagos), en vez de
 *    una llamada extra por deuda;
 *  - el saldo se recalcula desde el servidor tras cada operación, así que no
 *    hay pagos "fantasma" en la lista local;
 *  - errores visibles: si el pago falla, el usuario se entera (en el v1 solo
 *    quedaba un `console.error`).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '../../../core/errors/AppError';
import { useAsyncData } from '../../../core/hooks/useAsyncData';
import { formatMoney, formatPhone, formatRelativeDate } from '../../../core/utils/format';
import {
  type Debt,
  type Debtor,
  buildMovements,
  summarizeDebts,
} from '../../../domain/models';
import { debtApi } from '../../debts/api/debtApi';
import { AddDebtSheet } from '../../debts/components/AddDebtSheet';
import { debtorApi } from '../../debtors/api/debtorApi';
import { MovementRow } from '../../debtors/components/MovementRow';
import { paymentApi } from '../../payments/api/paymentApi';
import { RegisterPaymentSheet } from '../../payments/components/RegisterPaymentSheet';
import {
  AnimatedMoney,
  AppBar,
  Avatar,
  Badge,
  Button,
  Card,
  CardSkeleton,
  Dialog,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  ListSkeleton,
  PressableScale,
  Screen,
  SectionHeader,
  StatTile,
  Text,
  useDialog,
  useToast,
} from '../../../ui';
import { theme } from '../../../theme';

/** Movimientos que se muestran por página del extracto. */
const MOVEMENTS_PAGE = 15;

interface DetailData {
  debtor: Debtor;
  debts: Debt[];
}

export const DebtorDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; businessId?: string }>();
  const dialog = useDialog();
  const toast = useToast();

  const debtorId = params.id ?? '';
  const businessId = params.businessId ?? '';

  const [isDebtSheetOpen, setIsDebtSheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [visibleMovements, setVisibleMovements] = useState(MOVEMENTS_PAGE);

  const detail = useAsyncData<DetailData>(
    async () => {
      // Las dos peticiones son independientes: se lanzan en paralelo.
      const [debtor, debts] = await Promise.all([
        debtorApi.getById(debtorId, businessId),
        debtApi.listByDebtor(debtorId, businessId),
      ]);
      return { debtor, debts };
    },
    { enabled: debtorId.length > 0 && businessId.length > 0, deps: [debtorId, businessId] },
  );

  const debtor = detail.data?.debtor ?? null;
  // `?? []` crearía un array nuevo en cada render y con él invalidaría los
  // memos de abajo, así que la lista también se memoiza.
  const debts = useMemo(() => detail.data?.debts ?? [], [detail.data]);

  const summary = useMemo(() => summarizeDebts(debts, debtor?.balance), [debts, debtor?.balance]);
  const movements = useMemo(() => buildMovements(debts), [debts]);

  /** Recarga tras una operación y reinicia la paginación del extracto. */
  const reloadAfterMutation = useCallback(async () => {
    setVisibleMovements(MOVEMENTS_PAGE);
    await detail.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.refresh]);

  const handleAddDebt = useCallback(
    async ({ amount, description }: { amount: number; description: string }) => {
      try {
        await debtApi.create(businessId, { debtorId, amount, description });
        setIsDebtSheetOpen(false);
        toast.success(`Deuda de ${formatMoney(amount)} registrada`);
        await reloadAfterMutation();
      } catch (caught) {
        setIsDebtSheetOpen(false);
        dialog.showError(toAppError(caught));
      }
    },
    [businessId, debtorId, dialog, reloadAfterMutation, toast],
  );

  const handleRegisterPayment = useCallback(
    async ({
      amount,
      method,
      note,
    }: {
      amount: number;
      method: 'CASH' | 'TRANSFER' | 'CARD';
      note: string;
    }) => {
      try {
        const result = await paymentApi.createGlobal(businessId, {
          debtorId,
          amount,
          method,
          note,
        });
        setIsPaymentSheetOpen(false);
        toast.success(`Pago de ${formatMoney(result.totalAmount)} registrado`);
        await reloadAfterMutation();
      } catch (caught) {
        setIsPaymentSheetOpen(false);
        dialog.showError(toAppError(caught));
      }
    },
    [businessId, debtorId, dialog, reloadAfterMutation, toast],
  );

  const callDebtor = useCallback(() => {
    if (!debtor?.phone) return;
    void Linking.openURL(`tel:${debtor.phone}`);
  }, [debtor?.phone]);

  /* ── Parámetros incompletos ────────────────────────────────────────────── */

  if (!debtorId || !businessId) {
    return (
      <Screen>
        <AppBar onBack={() => router.back()} title="Cliente" />
        <EmptyState
          icon="alert-circle-outline"
          title="No pudimos abrir el cliente"
          message="Faltan datos para cargar esta pantalla. Vuelve a la lista e intenta de nuevo."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  /* ── Carga inicial ─────────────────────────────────────────────────────── */

  if (detail.isLoading) {
    return (
      <Screen padded>
        <AppBar onBack={() => router.back()} />
        <CardSkeleton height={230} />
        <View style={styles.skeletonList}>
          <ListSkeleton count={4} />
        </View>
      </Screen>
    );
  }

  if (detail.error || !debtor) {
    return (
      <Screen>
        <AppBar onBack={() => router.back()} title="Cliente" />
        <ErrorState
          error={detail.error ?? toAppError(new Error('Cliente no encontrado'))}
          onRetry={detail.reload}
        />
      </Screen>
    );
  }

  const hasDebt = summary.balance > 0;
  const isOverdue = summary.oldestOverdueDate !== null && hasDebt;

  return (
    <Screen
      scroll
      statusBar="light"
      refreshControl={
        <RefreshControl
          refreshing={detail.isRefreshing}
          onRefresh={detail.refresh}
          tintColor={theme.color.brand}
          colors={[theme.color.brand]}
        />
      }
      footer={
        <View style={styles.actions}>
          <Button
            label="Fiar"
            icon="add-circle-outline"
            variant="secondary"
            onPress={() => setIsDebtSheetOpen(true)}
            size="lg"
            style={styles.actionButton}
          />
          <Button
            label="Registrar pago"
            icon="cash-outline"
            onPress={() => setIsPaymentSheetOpen(true)}
            disabled={!hasDebt}
            size="lg"
            style={styles.actionButton}
          />
        </View>
      }
    >
      {/* ── Héroe con la identidad y el saldo ───────────────────────────── */}
      <LinearGradient
        colors={hasDebt ? theme.gradient.hero : [theme.palette.ink[900], theme.palette.brand[800]]}
        style={[styles.hero, { paddingTop: insets.top + theme.spacing.xs }]}
      >
        <View style={styles.heroBar}>
          <IconButton
            icon="chevron-back"
            onPress={() => router.back()}
            accessibilityLabel="Volver"
            color={theme.color.textInverse}
            surface="inverse"
            size={24}
          />
          {debtor.phone ? (
            <IconButton
              icon="call-outline"
              onPress={callDebtor}
              accessibilityLabel={`Llamar a ${debtor.name}`}
              color={theme.color.textInverse}
              surface="inverse"
              size={20}
            />
          ) : null}
        </View>

        <View style={styles.identity}>
          <Avatar name={debtor.name} size="xl" />
          <Text variant="title2" color="textInverse" align="center" numberOfLines={2}>
            {debtor.name}
          </Text>
          <Text variant="caption" color="textInverseSubtle">
            {debtor.documentType} {debtor.documentNumber}
            {debtor.phone ? ` · ${formatPhone(debtor.phone)}` : ''}
          </Text>
        </View>

        <View style={styles.heroBalance}>
          <Text variant="caption" color="textInverseMuted">
            {hasDebt ? 'Saldo pendiente' : 'Sin deudas pendientes'}
          </Text>
          <AnimatedMoney value={summary.balance} color="textInverse" />

          {isOverdue ? (
            <Badge
              label={`Venció ${formatRelativeDate(summary.oldestOverdueDate).toLowerCase()}`}
              tone="danger"
              icon="time-outline"
              size="md"
            />
          ) : hasDebt ? (
            <Badge
              label={`${summary.openDebts} ${summary.openDebts === 1 ? 'deuda abierta' : 'deudas abiertas'}`}
              tone="warning"
              size="md"
            />
          ) : (
            <Badge label="Al día" tone="success" icon="checkmark-circle" size="md" />
          )}
        </View>

        <View style={styles.stats}>
          <StatTile
            label="Total fiado"
            value={formatMoney(summary.totalDebt)}
            icon="arrow-up-outline"
            inverse
          />
          <StatTile
            label="Total pagado"
            value={formatMoney(summary.totalPaid)}
            icon="arrow-down-outline"
            inverse
          />
        </View>
      </LinearGradient>

      {/* ── Extracto ────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        <SectionHeader
          title="Movimientos"
          meta={
            movements.length > 0
              ? `${movements.length} ${movements.length === 1 ? 'registro' : 'registros'}`
              : undefined
          }
        />

        {movements.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Sin movimientos"
            message={`Aún no le has fiado nada a ${debtor.name.split(' ')[0]}. Empieza con el botón "Fiar".`}
            tone="brand"
          />
        ) : (
          <Card padding="md" elevation="flat">
            {movements.slice(0, visibleMovements).map((movement, index) => (
              <View key={movement.id}>
                {index > 0 ? <Divider /> : null}
                <MovementRow movement={movement} />
              </View>
            ))}

            {movements.length > visibleMovements ? (
              <PressableScale
                onPress={() => setVisibleMovements((current) => current + MOVEMENTS_PAGE)}
                haptic="tap"
                style={styles.loadMore}
                accessibilityRole="button"
                accessibilityLabel="Ver más movimientos"
              >
                <Text variant="captionStrong" color="brandStrong">
                  Ver {Math.min(MOVEMENTS_PAGE, movements.length - visibleMovements)} más
                </Text>
                <Ionicons name="chevron-down" size={15} color={theme.color.brandStrong} />
              </PressableScale>
            ) : null}
          </Card>
        )}
      </View>

      <AddDebtSheet
        visible={isDebtSheetOpen}
        onClose={() => setIsDebtSheetOpen(false)}
        debtorName={debtor.name}
        onSubmit={handleAddDebt}
      />

      <RegisterPaymentSheet
        visible={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        debtorName={debtor.name}
        balance={summary.balance}
        onSubmit={handleRegisterPayment}
      />

      <Dialog {...dialog.props} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: theme.radius['3xl'],
    borderBottomRightRadius: theme.radius['3xl'],
  },
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  heroBalance: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  body: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.md,
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: theme.color.border,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  skeletonList: {
    marginTop: theme.spacing.xl,
  },
});
