/**
 * Carga de datos asíncronos con estados explícitos.
 *
 * El v1 mezclaba `isLoading`, `pageLoading`, `initialLoadDone` y refs en cada
 * pantalla. Aquí hay una máquina de estados clara —`idle → loading → success |
 * error`— más `refreshing` para el pull-to-refresh, que es un estado distinto:
 * durante un refresh la lista sigue visible.
 *
 * También cancela: si la pantalla se desmonta o llega una carga más reciente,
 * el resultado viejo se descarta en vez de sobrescribir el estado.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { type AppError, toAppError } from '../errors/AppError';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncDataResult<T> {
  data: T | null;
  status: AsyncStatus;
  error: AppError | null;
  /** Primera carga en curso (no hay datos que mostrar todavía). */
  isLoading: boolean;
  /** Recarga con datos ya en pantalla (pull-to-refresh). */
  isRefreshing: boolean;
  /** Vuelve a ejecutar la carga mostrando el skeleton. */
  reload: () => Promise<void>;
  /** Vuelve a ejecutar la carga manteniendo los datos visibles. */
  refresh: () => Promise<void>;
  /** Actualiza los datos en local, sin ir al servidor (updates optimistas). */
  setData: (updater: T | ((previous: T | null) => T | null)) => void;
}

export interface UseAsyncDataOptions {
  /** Si es `false`, no carga hasta que pase a `true`. Útil si falta un id. */
  enabled?: boolean;
  /** Dependencias que, al cambiar, disparan una recarga. */
  deps?: readonly unknown[];
}

export const useAsyncData = <T>(
  fetcher: () => Promise<T>,
  { enabled = true, deps = [] }: UseAsyncDataOptions = {},
): UseAsyncDataResult<T> => {
  const [data, setDataState] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>(enabled ? 'loading' : 'idle');
  const [error, setError] = useState<AppError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const mountedRef = useRef(true);
  /** Cada ejecución recibe un id; solo la más reciente puede escribir estado. */
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (mode: 'load' | 'refresh') => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    if (mode === 'refresh') setIsRefreshing(true);
    else setStatus('loading');
    setError(null);

    try {
      const result = await fetcherRef.current();
      if (!mountedRef.current || runIdRef.current !== runId) return;
      setDataState(result);
      setStatus('success');
    } catch (caught) {
      if (!mountedRef.current || runIdRef.current !== runId) return;
      const appError = toAppError(caught);
      // Una cancelación no es un error que deba pintarse en pantalla.
      if (appError.code === 'CANCELLED') return;
      setError(appError);
      setStatus('error');
    } finally {
      if (mountedRef.current && runIdRef.current === runId && mode === 'refresh') {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }
    void run('load');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  const setData = useCallback((updater: T | ((previous: T | null) => T | null)) => {
    setDataState((previous) =>
      typeof updater === 'function'
        ? (updater as (p: T | null) => T | null)(previous)
        : updater,
    );
  }, []);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isRefreshing,
    reload: useCallback(() => run('load'), [run]),
    refresh: useCallback(() => run('refresh'), [run]),
    setData,
  };
};
