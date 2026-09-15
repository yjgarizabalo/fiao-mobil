// Caché en memoria de los tokens de sesión. utils/api.ts (v1) leía AsyncStorage en cada
// request; aquí se hidrata una sola vez al arrancar y de ahí en adelante se lee de
// memoria — más rápido y evita una carrera si dos peticiones salen casi al tiempo justo
// cuando se está guardando un token nuevo.
import { getItems, removeItems, setItem, StorageKeys } from '../storage/storage';

export interface SessionTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

let tokens: SessionTokens = { accessToken: null, refreshToken: null };
let hydrated = false;
let hydrating: Promise<SessionTokens> | null = null;

type SessionExpiredListener = () => void;
const listeners = new Set<SessionExpiredListener>();

export async function hydrateTokens(): Promise<SessionTokens> {
  if (hydrated) return tokens;
  if (hydrating) return hydrating;

  hydrating = (async () => {
    const stored = await getItems([StorageKeys.accessToken, StorageKeys.refreshToken]);
    tokens = {
      accessToken: stored[StorageKeys.accessToken] ?? null,
      refreshToken: stored[StorageKeys.refreshToken] ?? null,
    };
    hydrated = true;
    hydrating = null;
    return tokens;
  })();

  return hydrating;
}

export function getTokens(): SessionTokens {
  return tokens;
}

export function getAccessToken(): string | null {
  return tokens.accessToken;
}

export function getRefreshToken(): string | null {
  return tokens.refreshToken;
}

export async function setTokens(next: SessionTokens): Promise<void> {
  tokens = next;
  hydrated = true;
  await Promise.all([
    next.accessToken ? setItem(StorageKeys.accessToken, next.accessToken) : Promise.resolve(),
    next.refreshToken ? setItem(StorageKeys.refreshToken, next.refreshToken) : Promise.resolve(),
  ]);
}

export async function clearTokens(): Promise<void> {
  tokens = { accessToken: null, refreshToken: null };
  hydrated = true;
  await removeItems([StorageKeys.accessToken, StorageKeys.refreshToken, StorageKeys.user]);
}

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySessionExpired(): void {
  listeners.forEach((listener) => listener());
}
