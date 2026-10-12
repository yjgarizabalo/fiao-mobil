/**
 * Extracto del cliente: todo lo que le fiaron y todo lo que abonó, en todas
 * las tiendas a la vez y ordenado por fecha.
 *
 * Es lo que el modo tendero no tiene equivalente directo: allá el extracto es
 * de un cliente dentro de un negocio, mientras que aquí la pregunta es "¿en
 * qué se me fue el fiado este mes?" sin importar la tienda. Por eso cada fila
 * dice de dónde viene.
 *
 * El filtro usa `SegmentedControl` con contadores, el mismo patrón que la
 * lista de clientes del tendero, y se aplica en memoria: el extracto ya está
 * cargado entero (viene de las mismas deudas que alimentan el inicio), así que
 * filtrar no cuesta una petición.
 *
 * Comparte `cacheKey` con el inicio del modo cliente a propósito: las dos
 * pantallas se arman con la misma respuesta, y así al entrar aquí se ve el
 * extracto al instante en vez de esperar de nuevo al servidor.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useAsyncData } from '@/core/hooks/useAsyncData';
import { formatMoney } from '@/core/utils/format';
import {
  type ClientMovement,
  type ClientStanding,
  buildClientMovements,
} from '@/domain/models';
import { useSession } from '@/features/auth/session/SessionProvider';
import { clientApi } from '@/features/client/api/clientApi';
import { ClientMovementRow } from '@/features/client/components/ClientMovementRow';
import {
  AppBar,
  Divider,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SegmentedControl,
  StaleNotice,
  Text,
} from '@/ui';
import { theme } from '@/theme';

type MovementFilter = 'all' | 'debts' | 'payments';

export const ClientMovementsScreen = () => {
  const { user } = useSession();
  const [filter, setFilter] = useState<MovementFilter>('all');

  const standings = useAsyncData<ClientStanding[]>(() => clientApi.loadOverview(), {
    cacheKey: user?.id ? `client-overview:${user.id}` : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      void standings.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const movements = useMemo(
    () => buildClientMovements(standings.data ?? []),
    [standings.data],
  );

  const counts = useMemo(() => {
    let debts = 0;
    let payments = 0;
    for (const row of movements) {
      if (row.movement.kind === 'debt') debts += 1;
      else payments += 1;
    }
    return { all: movements.length, debts, payments };
  }, [movements]);

  const visible = useMemo(() => {
    if (filter === 'all') return movements;
    const kind = filter === 'debts' ? 'debt' : 'payment';
    return movements.filter((row) => row.movement.kind === kind);
  }, [filter, movements]);

  /** Lo fiado y lo abonado del tramo visible, para el resumen del encabezado. */
  const totals = useMemo(() => {
    let owed = 0;
    let paid = 0;
    for (const row of movements) {
      if (row.movement.kind === 'debt') owed += row.movement.amount;
      else if (row.movement.payment.type === 'PAYMENT') paid += row.movement.amount;
    }
    return { owed, paid };
  }, [movements]);

  const renderItem = useCallback(
    ({ item }: { item: ClientMovement }) => <ClientMovementRow row={item} />,
    [],
  );

  return (
    <Screen background="surface">
      <AppBar title="Movimientos" large bordered />

      {standings.isLoading ? (
        <View style={styles.padded}>
          <ListSkeleton count={8} />
        </View>
      ) : standings.error ? (
        <ErrorState error={standings.error} onRetry={standings.reload} />
      ) : movements.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Todavía no hay movimientos"
          message="Cuando una tienda te fíe algo o registre un abono tuyo, aparecerá aquí."
          tone="brand"
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(row) => row.movement.id}
          renderItem={renderItem}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={standings.isRefreshing}
              onRefresh={standings.refresh}
              tintColor={theme.color.brand}
              colors={[theme.color.brand]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <StaleNotice visible={standings.isStale} />

              <View style={styles.summary}>
                <Text variant="caption" color="textMuted">
                  Te han fiado{' '}
                  <Text variant="captionStrong" color="dangerStrong">
                    {formatMoney(totals.owed)}
                  </Text>
                  {'  ·  '}
                  Has abonado{' '}
                  <Text variant="captionStrong" color="brandStrong">
                    {formatMoney(totals.paid)}
                  </Text>
                </Text>
              </View>

              <SegmentedControl<MovementFilter>
                options={[
                  { value: 'all', label: 'Todos', count: counts.all },
                  { value: 'debts', label: 'Fiado', count: counts.debts },
                  { value: 'payments', label: 'Abonos', count: counts.payments },
                ]}
                value={filter}
                onChange={setFilter}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="filter-outline"
              title="Nada en este filtro"
              message={
                filter === 'debts'
                  ? 'No hay vales fiados registrados.'
                  : 'Todavía no tienes abonos registrados.'
              }
              secondaryActionLabel="Ver todos"
              onSecondaryAction={() => setFilter('all')}
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing['3xl'],
  },
  header: {
    paddingBottom: theme.spacing.sm,
  },
  summary: {
    paddingVertical: theme.spacing.md,
  },
});
