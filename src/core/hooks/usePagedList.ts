// Scroll infinito sobre un endpoint paginado. Reemplaza los dos patrones de paginación
// que convivían en v1 (botones de página en unas listas, "cargar más" con refs propias en
// otras). Dedupe por `id` al concatenar páginas por si el backend devuelve una fila
// repetida entre dos páginas (puede pasar si se crea un registro entre una carga y otra).
import { useCallback, useEffect, useRef, useState } from 'react';
import { toAppError } from '../errors/AppError';
import { DEFAULT_PAGE_SIZE, hasNextPage, Page, PaginationMeta } from '../http/payload';

interface UsePagedListOptions {
  pageSize?: number;
  enabled?: boolean;
  deps?: unknown[];
}

interface WithId {
  id: string | number;
}

function mergeUnique<T extends WithId>(previous: T[], next: T[]): T[] {
  const seen = new Set(previous.map((item) => item.id));
  return [...previous, ...next.filter((item) => !seen.has(item.id))];
}

export function usePagedList<T extends WithId>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
  options: UsePagedListOptions = {}
) {
  const { pageSize = DEFAULT_PAGE_SIZE, enabled = true, deps = [] } = options;

  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<ReturnType<typeof toAppError> | undefined>(undefined);

  const runIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (mode: 'reload' | 'refresh') => {
      if (!enabled) return;
      const runId = ++runIdRef.current;

      if (mode === 'reload') {
        setIsLoading(true);
        setError(undefined);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = await fetchPage(1, pageSize);
        if (runId !== runIdRef.current) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (caught) {
        if (runId !== runIdRef.current) return;
        setError(toAppError(caught));
      } finally {
        if (runId === runIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, pageSize, ...deps]
  );

  useEffect(() => {
    load('reload');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pageSize, ...deps]);

  const loadMore = useCallback(async () => {
    if (!enabled || !meta || loadingMoreRef.current || !hasNextPage(meta)) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    const runId = runIdRef.current;

    try {
      const nextPage = meta.page + 1;
      const result = await fetchPage(nextPage, pageSize);
      if (runId !== runIdRef.current) return;
      setItems((previous) => mergeUnique(previous, result.items));
      setMeta(result.meta);
    } catch (caught) {
      if (runId === runIdRef.current) setError(toAppError(caught));
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [enabled, meta, fetchPage, pageSize]);

  return {
    items,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore: meta ? hasNextPage(meta) : false,
    total: meta?.total ?? 0,
    reload: () => load('reload'),
    refresh: () => load('refresh'),
    loadMore,
    setItems,
  };
}
