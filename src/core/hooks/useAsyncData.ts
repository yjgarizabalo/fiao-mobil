// Máquina de estados para "traer un recurso y mostrarlo": idle → loading → success | error,
// más un `isRefreshing` aparte para pull-to-refresh (los datos viejos se quedan visibles
// mientras se recarga). Descarta resultados obsoletos si el fetch cambió de parámetros o el
// componente se desmontó antes de que la petición volviera.
import { useCallback, useEffect, useRef, useState } from 'react';
import { toAppError } from '../errors/AppError';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseAsyncDataOptions {
  enabled?: boolean;
  deps?: unknown[];
}

export function useAsyncData<T>(fetcher: () => Promise<T>, options: UseAsyncDataOptions = {}) {
  const { enabled = true, deps = [] } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<ReturnType<typeof toAppError> | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const run = useCallback(
    async (mode: 'reload' | 'refresh') => {
      if (!enabled) return;
      const runId = ++runIdRef.current;

      if (mode === 'reload') {
        setStatus('loading');
        setError(undefined);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = await fetcher();
        if (!mountedRef.current || runId !== runIdRef.current) return;
        setData(result);
        setStatus('success');
      } catch (caught) {
        const appError = toAppError(caught);
        if (!mountedRef.current || runId !== runIdRef.current) return;
        if (appError.code !== 'CANCELLED') {
          setError(appError);
          setStatus('error');
        }
      } finally {
        if (mountedRef.current && runId === runIdRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, ...deps]
  );

  useEffect(() => {
    run('reload');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isRefreshing,
    reload: () => run('reload'),
    refresh: () => run('refresh'),
    setData,
  };
}
