/**
 * Lista paginada con scroll infinito.
 *
 * El v1 tenía dos implementaciones distintas de paginación (botones de página
 * en clientes, "cargar más" en negocios) con su propio juego de refs. Aquí hay
 * una sola, y expone justo lo que `FlatList` necesita:
 * `onEndReached={loadMore}` y `refreshing`/`onRefresh`.
 *
 * Caché offline (opcional, con `cacheKey`): se guarda la **primera página** en
 * disco y se rehidrata al montar (stale-while-revalidate). Con el backend
 * gratuito que se duerme, al reabrir la app la lista aparece al instante y, si
 * la red falla mientras el servicio despierta, se conserva en vez de quedar en
 * blanco. Las páginas siguientes (`loadMore`) sí requieren red: no tiene sentido
 * paginar sobre datos viejos. Ver `src/core/storage/cache.ts`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { type AppError, toAppError } from '@/core/errors/AppError';
import { DEFAULT_PAGE_SIZE, type Page, type PaginationMeta } from '@/core/http/payload';
import { createLogger } from '@/core/logger';
import { isCacheStale, readCache, writeCache } from '@/core/storage/cache';

const log = createLogger('paged-list');

/** Caché más fresca que este tiempo se usa sin ir a la red. */
const CACHE_TTL_DEFAULT_MS = 10 * 60 * 1000;

export interface UsePagedListResult<T> {
  items: T[];
  /** Primera carga: hay que mostrar skeleton. */
  isLoading: boolean;
  /** Pull-to-refresh: la lista sigue visible. */
  isRefreshing: boolean;
  /** Cargando la siguiente página: spinner en el pie de la lista. */
  isLoadingMore: boolean;
  error: AppError | null;
  /**
   * Los items que se ven vienen de la caché y aún no los confirmó la red en esta
   * sesión (el servidor puede estar despertando).
   */
  isStale: boolean;
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
  /**
   * Llave de caché de la primera página. Debe ser única por contexto (usuario +
   * negocio + filtros) para no mezclar los datos de una consulta con otra.
   */
  cacheKey?: string;
  /**
   * TTL en ms. Caché más fresca que esto se usa directamente sin ir a la red.
   * Default: 10 minutos. Pasar `0` para forzar siempre la red.
   */
  cacheTtlMs?: number;
}

/** Lo que se persiste de una lista: la primera página y su metadata. */
interface CachedPage<T> {
  items: T[];
  meta: PaginationMeta;
}

export const usePagedList = <T>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
  { pageSize = DEFAULT_PAGE_SIZE, enabled = true, deps = [], cacheKey, cacheTtlMs }: UsePagedListOptions = {},
): UsePagedListResult<T> => {
  const [items, setItemsState] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;

  const cacheTtlMsRef = useRef(cacheTtlMs);
  cacheTtlMsRef.current = cacheTtlMs;

  /** Espejo síncrono de `items` para decidir en el `catch` si ya hay algo. */
  const itemsRef = useRef<T[]>([]);

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

  const commitItems = useCallback((next: T[]) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  const loadFirstPage = useCallback(
    async (mode: 'load' | 'refresh') => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      const key = cacheKeyRef.current;
      const ttlMs = cacheTtlMsRef.current ?? CACHE_TTL_DEFAULT_MS;

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        // Carga "fresca": se limpia para hidratar la nueva llave sin arrastrar
        // el contexto anterior (otro negocio, otro filtro).
        if (key) commitItems([]);
        setIsLoading(true);
        setIsStale(false);
      }
      setError(null);

      // Con TTL: primero se lee el caché y se decide si la red es necesaria.
      // Caché fresca (< ttlMs) → se pinta y se sale; no se toca el servidor.
      // Caché vencida → se pinta mientras se lanza la red en segundo plano.
      if (key && mode === 'load') {
        const hit = await readCache<CachedPage<T>>(key);
        if (!mountedRef.current || runIdRef.current !== runId) return;

        if (hit) {
          const expired = isCacheStale(hit.savedAt, ttlMs);
          if (itemsRef.current.length === 0) {
            commitItems(hit.data.items);
            setPage(hit.data.meta.page);
            setTotalPages(hit.data.meta.totalPages);
            setTotal(hit.data.meta.total);
            setIsLoading(false);
            setIsStale(expired);
          }
          if (!expired) return;
        }
      }

      try {
        const result = await fetchRef.current(1, pageSize);
        if (!mountedRef.current || runIdRef.current !== runId) return;
        commitItems(result.items);
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
        setIsStale(false);
        if (key) void writeCache<CachedPage<T>>(key, { items: result.items, meta: result.meta });
      } catch (caught) {
        if (!mountedRef.current || runIdRef.current !== runId) return;
        const appError = toAppError(caught);
        if (appError.code === 'CANCELLED') return;

        // Si ya hay items que mostrar (caché o carga previa), no se borran: el
        // servidor dormido no debe dejar la lista en blanco. Solo se marca stale.
        if (itemsRef.current.length > 0) {
          setIsStale(true);
          log.warn('Revalidación de lista fallida; se conservan los datos en caché', {
            code: appError.code,
          });
        } else {
          setError(appError);
          commitItems([]);
        }
      } finally {
        if (mountedRef.current && runIdRef.current === runId) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [commitItems, pageSize],
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
      const merged = ((): T[] => {
        const previous = itemsRef.current;
        const seen = new Set(previous.map((item) => (item as { id?: string }).id).filter(Boolean));
        const fresh = result.items.filter((item) => {
          const id = (item as { id?: string }).id;
          return id === undefined || !seen.has(id);
        });
        return [...previous, ...fresh];
      })();
      commitItems(merged);
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
  }, [commitItems, isLoading, isRefreshing, page, totalPages, pageSize]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      commitItems([]);
      return;
    }
    void loadFirstPage('load');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loadFirstPage, cacheKey, ...deps]);

  const setItems = useCallback(
    (updater: (previous: T[]) => T[]) => {
      setItemsState((previous) => {
        const next = updater(previous);
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  return {
    items,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    isStale,
    hasMore: page < totalPages,
    total,
    reload: useCallback(() => loadFirstPage('load'), [loadFirstPage]),
    refresh: useCallback(() => loadFirstPage('refresh'), [loadFirstPage]),
    loadMore,
    setItems,
  };
};
