/**
 * Sesión del usuario.
 *
 * Diferencias clave con el `AuthContext` del v1:
 *  1. Expone un `status` explícito (`loading` / `authenticated` /
 *     `unauthenticated`) en lugar de un `isLoading` suelto. La pantalla de
 *     arranque decide con eso, y así se corrige el bug del v1, donde
 *     `app/index.tsx` tenía `isAuthenticated = false` fijo y **siempre**
 *     mandaba al login aunque hubiera sesión guardada.
 *  2. Escucha `onSessionExpired`: si el refresh token muere a mitad de uso, la
 *     app cierra sesión sola y vuelve al login, en vez de quedarse con un
 *     token muerto lanzando 401 en cada pantalla.
 *  3. `logout` siempre limpia el estado local, incluso si la llamada al
 *     backend falla (el usuario pidió salir: hay que sacarlo).
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AppError, toAppError } from '../../../core/errors/AppError';
import {
  clearTokens,
  getRefreshToken,
  hydrateTokens,
  onSessionExpired,
  setTokens,
} from '../../../core/http/tokenStore';
import { createLogger } from '../../../core/logger';
import { StorageKeys, getJson, removeItems, setJson } from '../../../core/storage/storage';
import type { User } from '../../../domain/models';
import {
  type LoginCredentials,
  type RegisterPayload,
  authApi,
} from '../../auth/api/authApi';

const log = createLogger('session');

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  /** Actualiza el usuario en memoria y en disco (tras editar el perfil). */
  patchUser: (changes: Partial<User>) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  /* ── Rehidratación al arrancar ─────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const [tokens, storedUser] = await Promise.all([
        hydrateTokens(),
        getJson<User>(StorageKeys.user),
      ]);

      if (cancelled) return;

      if (tokens?.accessToken && storedUser) {
        setUser(storedUser);
        setStatus('authenticated');
        log.info('Sesión restaurada');
      } else {
        // Estado inconsistente (token sin usuario o al revés): se limpia.
        if (tokens?.accessToken || storedUser) {
          await clearSession();
        }
        setStatus('unauthenticated');
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Cierre de sesión forzado por el interceptor HTTP ──────────────────── */

  useEffect(
    () =>
      onSessionExpired(() => {
        log.warn('Sesión expirada: se cierra la sesión local');
        setUser(null);
        setStatus('unauthenticated');
        void removeItems([StorageKeys.user, StorageKeys.activeBusinessId]);
      }),
    [],
  );

  /* ── Acciones ──────────────────────────────────────────────────────────── */

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await authApi.login(credentials);

    if (!session.accessToken) {
      throw new AppError('UNKNOWN', {
        message: 'El servidor no devolvió un token de acceso.',
      });
    }

    await setTokens({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    await setJson(StorageKeys.user, session.user);

    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    (payload: RegisterPayload) => authApi.register(payload),
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (caught) {
        // Que el backend no pueda invalidar el token no debe impedir salir.
        log.warn('El logout remoto falló; se cierra igualmente en local', {
          code: toAppError(caught).code,
        });
      }
    }

    await clearSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const patchUser = useCallback(
    async (changes: Partial<User>) => {
      const next = { ...(user ?? ({} as User)), ...changes } as User;
      setUser(next);
      await setJson(StorageKeys.user, next);
    },
    [user],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      patchUser,
    }),
    [status, user, login, register, logout, patchUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

/** Borra tokens y datos locales de la sesión. */
const clearSession = async () => {
  await clearTokens();
  await removeItems([StorageKeys.user, StorageKeys.activeBusinessId]);
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de un SessionProvider');
  }
  return context;
};
