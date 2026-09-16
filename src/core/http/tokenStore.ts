/**
 * Fuente única de verdad de los tokens de sesión.
 *
 * Mantiene una copia en memoria para no pegarle a AsyncStorage en cada
 * petición (el v1 hacía tres lecturas asíncronas *por request*), y notifica a
 * quien escuche cuando la sesión se invalida, para que la UI reaccione en vez
 * de quedarse colgada con un token muerto.
 */
import { StorageKeys, getItems, removeItems, setItem } from '@/core/storage/storage';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string | null;
}

type SessionExpiredListener = () => void;

let cache: SessionTokens | null = null;
let hydrated = false;
const listeners = new Set<SessionExpiredListener>();

/** Carga los tokens persistidos. Idempotente: solo lee del disco una vez. */
export const hydrateTokens = async (): Promise<SessionTokens | null> => {
  if (hydrated) return cache;

  const stored = await getItems([StorageKeys.accessToken, StorageKeys.refreshToken]);
  const accessToken = stored[StorageKeys.accessToken];

  cache = accessToken
    ? { accessToken, refreshToken: stored[StorageKeys.refreshToken] ?? null }
    : null;
  hydrated = true;

  return cache;
};

/** Tokens actuales sin tocar el disco. `null` si no hay sesión. */
export const getTokens = (): SessionTokens | null => cache;

export const getAccessToken = (): string | null => cache?.accessToken ?? null;

export const getRefreshToken = (): string | null => cache?.refreshToken ?? null;

/** Guarda los tokens en memoria y en disco. */
export const setTokens = async (tokens: SessionTokens): Promise<void> => {
  cache = tokens;
  hydrated = true;
  await setItem(StorageKeys.accessToken, tokens.accessToken);
  if (tokens.refreshToken) {
    await setItem(StorageKeys.refreshToken, tokens.refreshToken);
  }
};

/** Borra los tokens de memoria y disco. No notifica a los listeners. */
export const clearTokens = async (): Promise<void> => {
  cache = null;
  hydrated = true;
  await removeItems([StorageKeys.accessToken, StorageKeys.refreshToken]);
};

/**
 * Se suscribe al evento "la sesión murió y no se pudo renovar".
 * Devuelve la función para desuscribirse.
 */
export const onSessionExpired = (listener: SessionExpiredListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Lo dispara el interceptor HTTP cuando el refresh falla. */
export const notifySessionExpired = (): void => {
  listeners.forEach((listener) => listener());
};
