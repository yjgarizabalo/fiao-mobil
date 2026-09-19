/**
 * Lista paginada con scroll infinito.
 *
 * El v1 tenía dos implementaciones distintas de paginación (botones de página
 * en clientes, "cargar más" en negocios) con su propio juego de refs. Aquí hay
 * una sola, y expone justo lo que `FlatList` necesita:
 * `onEndReached={loadMore}` y `refreshing`/`onRefresh`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { type AppError, toAppError } from '@/core/errors/AppError';
import { DEFAULT_PAGE_SIZE, type Page } from '@/core/http/payload';

export interface UsePagedListResult<T> {
  items: T[];
  /** Primera carga: hay que mostrar skeleton. */
  isLoading: boolean;
  /** Pull-to-refresh: la lista sigue visible. */
  isRefreshing: boolean;
  /** Cargando la siguiente página: spinner en el pie de la lista. */
  isLoadingMore: boolean;
  error: AppError | null;
  hasMore: boolean;
  total: number;
  /** Recarga desde la página 1 mostrando skeleton. */
  reload: () => Promise<void>;
  /** Recarga desde la página 1 sin ocultar la lista. */
  refresh: () => Promise<void>;
  /** Carga la página siguiente. Segura de llamar varias veces. */
  loadMore: () => Promise<void>;
  /** Muta la lista en local (updates optimistas). */
  setItems: (updater: (previous: T[]) => T[]) => void;
}

export interface UsePagedListOptions {
  pageSize?: number;
  enabled?: boolean;
  deps?: readonly unknown[];
}

export const usePagedList = <T>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
  { pageSize = DEFAULT_PAGE_SIZE, enabled = true, deps = [] }: UsePagedListOptions = {},
): UsePagedListResult<T> => {
  const [items, setItemsState] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);
  /** Evita disparar dos "cargar más" a la vez (FlatList llama de más). */
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadFirstPage = useCallback(
    async (mode: 'load' | 'refresh') => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;

      if (mode === 'refresh') setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const result = await fetchRef.current(1, pageSize);
        if (!mountedRef.current || runIdRef.current !== runId) return;
        setItemsState(result.items);
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
      } catch (caught) {
        if (!mountedRef.current || runIdRef.current !== runId) return;
        const appError = toAppError(caught);
        if (appError.code === 'CANCELLED') return;
        setError(appError);
        setItemsState([]);
      } finally {
        if (mountedRef.current && runIdRef.current === runId) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [pageSize],
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || isLoading || isRefreshing) return;
    if (page >= totalPages) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const result = await fetchRef.current(nextPage, pageSize);
      if (!mountedRef.current) return;
      // Se concatena deduplicando por si el backend repite un registro entre
      // páginas (pasa cuando alguien inserta datos mientras paginas).
      setItemsState((previous) => {
        const seen = new Set(
          previous.map((item) => (item as { id?: string }).id).filter(Boolean),
        );
        const fresh = result.items.filter((item) => {
          const id = (item as { id?: string }).id;
          return id === undefined || !seen.has(id);
        });
        return [...previous, ...fresh];
      });
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (caught) {
      // Un fallo al paginar no debe borrar lo que ya se ve: solo se registra.
      if (mountedRef.current) setError(toAppError(caught));
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current) setIsLoadingMore(false);
    }
  }, [isLoading, isRefreshing, page, totalPages, pageSize]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setItemsState([]);
      return;
    }
    void loadFirstPage('load');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loadFirstPage, ...deps]);

  const setItems = useCallback((updater: (previous: T[]) => T[]) => {
    setItemsState(updater);
  }, []);

  return {
    items,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore: page < totalPages,
    total,
    reload: useCallback(() => loadFirstPage('load'), [loadFirstPage]),
    refresh: useCallback(() => loadFirstPage('refresh'), [loadFirstPage]),
    loadMore,
    setItems,
  };
};
