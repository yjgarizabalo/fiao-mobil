/**
 * Lista de clientes.
 *
 * Mejoras sobre el v1:
 *  - `FlatList` en vez de `ScrollView` con `.map()`: recicla filas, así que
 *    500 clientes se desplazan igual de fluido que 10;
 *  - scroll infinito en lugar de botones de página;
 *  - filtros por estado (todos / deben / al día) resueltos en el servidor,
 *    con contadores exactos del negocio y no de la página cargada;
 *  - buscador con debounce que consulta al **servidor**, no a la página
 *    cargada, para que encuentre a un cliente esté en la página que esté;
 *  - pull-to-refresh;
 *  - estados de carga, vacío, "sin resultados" y error, cada uno con su texto.
 *
 * Sirve para dos casos: los clientes del negocio activo (por defecto) o los de
 * un negocio concreto cuando llega `businessId` por parámetro.
 */
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useAsyncData } from '@/core/hooks/useAsyncData';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { usePagedList } from '@/core/hooks/usePagedList';
import { routes } from '@/core/navigation/routes';
import { formatMoney } from '@/core/utils/format';
import type { Debtor } from '@/domain/models';
import { useBusinesses } from '@/features/businesses/state/BusinessProvider';
import { debtorApi } from '@/features/debtors/api/debtorApi';
import { DebtorRow } from '@/features/debtors/components/DebtorRow';
import {
  AppBar,
  EmptyState,
  ErrorState,
  Fab,
  ListFooterLoader,
  ListSkeleton,
  Screen,
  SearchBar,
  SegmentedControl,
  Text,
} from '@/ui';
import { theme } from '@/theme';

type StatusFilter = 'all' | 'debt' | 'clear';
/** Alcance de la lista: solo el negocio activo o todos los negocios. */
type Scope = 'business' | 'all';

const PAGE_SIZE = 20;

export const DebtorListScreen = () => {
  const params = useLocalSearchParams<{ businessId?: string }>();
  const { activeBusinessId, businesses, getBusiness, isEmpty: hasNoBusiness } =
    useBusinesses();

  /** El parámetro manda; si no viene, se usa el negocio activo. */
  const businessId = params.businessId ?? activeBusinessId ?? null;
  const business = businessId ? getBusiness(businessId) : undefined;
  const isFilteredByParam = Boolean(params.businessId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [scope, setScope] = useState<Scope>('business');
  const debouncedSearch = useDebouncedValue(search, 220);

  /**
   * El conmutador de alcance solo tiene sentido con más de un negocio y
   * cuando no se llegó filtrando por uno concreto.
   */
  const canSwitchScope = businesses.length > 1 && !isFilteredByParam;
  const effectiveScope: Scope = canSwitchScope ? scope : 'business';

  /**
   * Búsqueda y filtro de estado los resuelve el **servidor**, y ambos forman
   * parte de las `deps`: al cambiarlos se vuelve a pedir la página 1 ya
   * filtrada. Filtrar en local solo miraba la página cargada, así que con
   * muchos clientes un nombre de la página 8 no aparecía nunca y el chip
   * "Deben" mostraba un puñado de los que hubiera a mano.
   */
  const hasDebtFilter = statusFilter === 'all' ? undefined : statusFilter === 'debt';

  const list = usePagedList<Debtor>(
    (page, limit) => {
      const query = { search: debouncedSearch, hasDebt: hasDebtFilter };
      return effectiveScope === 'all'
        ? debtorApi.listAll(page, limit, query)
        : debtorApi.listByBusiness(businessId as string, page, limit, query);
    },
    {
      pageSize: PAGE_SIZE,
      enabled: effectiveScope === 'all' || Boolean(businessId),
      deps: [businessId, effectiveScope, debouncedSearch, hasDebtFilter],
    },
  );

  /**
   * Totales exactos del negocio para los contadores de los chips. Es una
   * petición agregada y barata; contarlos sobre `list.items` decía "20
   * clientes" cuando había 300. No aplica al alcance "todos los negocios",
   * que no tiene un resumen equivalente en el backend: ahí los chips van sin
   * número, que es preferible a enseñar uno falso.
   */
  const totals = useAsyncData(
    () => debtorApi.getSummary(businessId as string, 0),
    {
      enabled: effectiveScope === 'business' && Boolean(businessId),
      deps: [businessId, effectiveScope],
    },
  );

  // Al volver del detalle, los saldos pueden haber cambiado.
  useFocusEffect(
    useCallback(() => {
      if (effectiveScope === 'all' || businessId) {
        void list.refresh();
        void totals.refresh();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId, effectiveScope]),
  );

  const counts = useMemo(() => {
    const data = totals.data;
    if (!data) return { all: undefined, debt: undefined, clear: undefined };
    return { all: data.totalDebtors, debt: data.debtorsWithDebt, clear: data.debtorsClear };
  }, [totals.data]);

  // Ya no hay filtrado local: la lista llega filtrada del servidor.
  const visibleDebtors = list.items;

  /**
   * Saldo total del negocio, tal como lo calcula el servidor. Sumar
   * `list.items` daba la suma de la página cargada presentada como si fuera
   * el total del negocio.
   */
  const totalOwed = statusFilter === 'clear' ? 0 : (totals.data?.totalBalance ?? 0);

  const openDebtor = useCallback(
    (debtor: Debtor) => {
      const targetBusinessId = debtor.businessId ?? businessId;
      if (!targetBusinessId) return;
      router.push(routes.client.detail(debtor.id, targetBusinessId));
    },
    [businessId],
  );

  /* ── Sin negocio todavía ───────────────────────────────────────────────── */

  if (hasNoBusiness || (!businessId && effectiveScope !== 'all')) {
    return (
      <Screen>
        <AppBar title="Clientes" large />
        <EmptyState
          icon="storefront-outline"
          title="Primero crea un negocio"
          message="Los clientes se registran dentro de un negocio. Crea el tuyo para empezar."
          actionLabel="Crear negocio"
          onAction={() => router.push(routes.business.create)}
          tone="brand"
        />
      </Screen>
    );
  }

  const isSearching = debouncedSearch.trim().length > 0 || statusFilter !== 'all';

  return (
    <Screen>
      <AppBar
        title={isFilteredByParam ? (business?.name ?? 'Clientes') : 'Clientes'}
        subtitle={isFilteredByParam ? 'Clientes de este negocio' : undefined}
        onBack={isFilteredByParam ? () => router.back() : undefined}
        large={!isFilteredByParam}
      />

      <View style={styles.controls}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, documento o teléfono"
        />

        {canSwitchScope ? (
          <SegmentedControl<Scope>
            value={scope}
            onChange={setScope}
            options={[
              { value: 'business', label: business?.name ?? 'Este negocio' },
              { value: 'all', label: 'Todos mis negocios' },
            ]}
          />
        ) : null}

        <SegmentedControl<StatusFilter>
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Todos', count: counts.all },
            { value: 'debt', label: 'Deben', count: counts.debt },
            { value: 'clear', label: 'Al día', count: counts.clear },
          ]}
        />

        {totalOwed > 0 ? (
          <View style={styles.totalRow}>
            <Text variant="caption" color="textMuted">
              Total por cobrar
            </Text>
            <Text variant="captionStrong" color="dangerStrong">
              {formatMoney(totalOwed)}
            </Text>
          </View>
        ) : null}
      </View>

      {/*
        El skeleton solo aparece cuando no hay nada que enseñar. Como la
        búsqueda ahora va al servidor, cada tecleo recarga la lista; si el
        skeleton saliera siempre, la pantalla parpadearía en cada letra. Se
        mantienen los resultados anteriores hasta que llegan los nuevos.
      */}
      {list.isLoading && list.items.length === 0 ? (
        <View style={styles.skeletonHost}>
          <ListSkeleton />
        </View>
      ) : list.error && list.items.length === 0 ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <FlatList
          data={visibleDebtors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DebtorRow
              debtor={item}
              onPress={() => openDebtor(item)}
              businessName={
                effectiveScope === 'all' && item.businessId
                  ? getBusiness(item.businessId)?.name
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          // Recicla agresivamente: la app corre en celulares de gama baja.
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefreshing}
              onRefresh={list.refresh}
              tintColor={theme.color.brand}
              colors={[theme.color.brand]}
            />
          }
          ListFooterComponent={<ListFooterLoader visible={list.isLoadingMore} />}
          ListEmptyComponent={
            isSearching ? (
              <EmptyState
                icon="search-outline"
                title="Sin resultados"
                message={
                  debouncedSearch.trim().length > 0
                    ? `No encontramos clientes que coincidan con "${debouncedSearch.trim()}".`
                    : 'Ningún cliente cumple con este filtro.'
                }
                secondaryActionLabel="Limpiar filtros"
                onSecondaryAction={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              />
            ) : (
              <EmptyState
                icon="person-add-outline"
                title="Aún no hay clientes"
                message="Registra a la primera persona a la que le fías y lleva su cuenta al día."
                actionLabel={businessId ? 'Agregar cliente' : undefined}
                onAction={
                  businessId
                    ? () => router.push(routes.client.create(businessId))
                    : undefined
                }
                tone="brand"
              />
            )
          }
        />
      )}

      {businessId ? (
        <Fab label="Agregar" onPress={() => router.push(routes.client.create(businessId))} />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  controls: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  skeletonHost: {
    paddingHorizontal: theme.layout.gutter,
  },
  listContent: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: 120,
    flexGrow: 1,
  },
  separator: {
    height: theme.spacing.sm,
  },
});
