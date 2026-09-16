/**
 * Cliente HTTP de la aplicación.
 *
 * Qué se arregló respecto al v1:
 *  1. El refresh token ahora viaja como **header** (`x-refresh-token`). En el
 *     v1 se pasaba dentro del body por un error de firma de `axios.post`, así
 *     que la renovación de sesión nunca funcionaba.
 *  2. Las peticiones concurrentes que reciben 401 esperan **una sola**
 *     renovación (patrón single-flight con una promesa compartida) en lugar de
 *     una cola manual de callbacks.
 *  3. El token se lee de memoria (`tokenStore`), no con tres lecturas
 *     asíncronas a AsyncStorage por cada request.
 *  4. Nunca se imprimen tokens ni cuerpos completos: el logger los redacta.
 *  5. Todo error sale ya convertido a `AppError`, así que las capas de arriba
 *     no dependen de axios.
 */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/core/config/env';
import { AppError } from '@/core/errors/AppError';
import { toHttpAppError } from './httpError';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifySessionExpired,
  setTokens,
} from './tokenStore';
import { createLogger } from '@/core/logger';

const log = createLogger('http');

/** Marca interna para no reintentar una petición más de una vez. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
  /** Si es `true`, el interceptor no intenta renovar la sesión en un 401. */
  _skipAuthRefresh?: boolean;
}

export const http: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.timeoutMs,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

/* ── Request: adjunta el token y traza la petición ────────────────────────── */

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  log.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
  });
  return config;
});

/* ── Renovación de sesión (single-flight) ─────────────────────────────────── */

let refreshInFlight: Promise<string> | null = null;

const requestNewAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new AppError('UNAUTHORIZED', { message: 'No hay refresh token guardado.' });
  }

  // Se usa `axios` directo (no `http`) para no volver a entrar en este mismo
  // interceptor y provocar una recursión infinita.
  const response = await axios.post<{ accessToken: string; refreshToken?: string }>(
    `${env.apiBaseUrl}${env.authPrefix}/refresh`,
    null,
    {
      timeout: env.timeoutMs,
      headers: {
        Accept: 'application/json',
        'x-refresh-token': refreshToken,
      },
    },
  );

  const accessToken = response.data?.accessToken;
  if (!accessToken) {
    throw new AppError('UNAUTHORIZED', {
      message: 'El servidor no devolvió un token nuevo.',
    });
  }

  await setTokens({
    accessToken,
    refreshToken: response.data.refreshToken ?? refreshToken,
  });

  log.info('Sesión renovada');
  return accessToken;
};

/** Renueva el token reutilizando la renovación en curso si ya hay una. */
const refreshAccessToken = (): Promise<string> => {
  refreshInFlight ??= requestNewAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

/* ── Response: renueva en 401 y normaliza errores ─────────────────────────── */

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    const canRetry =
      status === 401 &&
      config !== undefined &&
      !config._retried &&
      !config._skipAuthRefresh &&
      getRefreshToken() !== null;

    if (!canRetry) {
      return Promise.reject(toHttpAppError(error));
    }

    config._retried = true;

    try {
      const accessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return http(config);
    } catch (refreshError) {
      log.warn('No se pudo renovar la sesión; cerrando sesión');
      await clearTokens();
      notifySessionExpired();
      return Promise.reject(
        new AppError('UNAUTHORIZED', {
          message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
          cause: refreshError,
        }),
      );
    }
  },
);

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Header de negocio activo. Los recursos de clientes, deudas y pagos son
 * multi-tenant y el backend los filtra con `x-business-id`.
 */
export const businessHeader = (businessId: string) => ({
  headers: { 'x-business-id': businessId },
});

/** Config para peticiones que no deben disparar el refresh (login, logout). */
export const skipAuthRefresh = { _skipAuthRefresh: true } as Partial<RetriableConfig>;
