// Cliente HTTP único de la app (reemplaza utils/api.ts y los fetch() sueltos de
// services/). Corrige el bug de la renovación de sesión: antes se mandaba
// `axios.post(url, { headers: {...} })`, así que ese objeto viajaba como *body*, no como
// headers reales, y `x-refresh-token` nunca llegaba al backend. Aquí va como tercer
// argumento de axios (config), que es donde axios realmente lee los headers.
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { createLogger, redact } from '../logger';
import { toHttpAppError } from './httpError';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hydrateTokens,
  notifySessionExpired,
  setTokens,
} from './tokenStore';

const logger = createLogger('http');

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

// Header multi-tenant: clientes, deudas y pagos pertenecen a un negocio. Se usa así en
// vez de escribir `headers: { 'x-business-id': businessId }` a mano en cada llamada.
export function businessHeader(businessId: string) {
  return { headers: { 'x-business-id': businessId } };
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
}

// Config a pasar en login/logout/registro: un 401 ahí significa "credenciales
// incorrectas", no "sesión vencida", así que no debe disparar el flujo de refresh.
export const skipAuthRefresh: { _skipAuthRefresh: boolean } = { _skipAuthRefresh: true };

http.interceptors.request.use(async (config) => {
  await hydrateTokens();
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  logger.debug(config.method?.toUpperCase(), config.url);
  return config;
});

let refreshInFlight: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new AppError('UNAUTHORIZED');
  }

  const response = await axios.post<{ accessToken?: string; refreshToken?: string }>(
    `${env.apiBaseUrl}${env.authPrefix}/refresh`,
    undefined,
    { headers: { 'x-refresh-token': refreshToken } }
  );

  const accessToken = response.data?.accessToken;
  if (!accessToken) {
    throw new AppError('UNAUTHORIZED');
  }

  await setTokens({ accessToken, refreshToken: response.data?.refreshToken ?? refreshToken });
  return accessToken;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const canRetry = originalRequest && !originalRequest._retry && !originalRequest._skipAuthRefresh;

    if (isUnauthorized && canRetry && originalRequest) {
      originalRequest._retry = true;
      try {
        refreshInFlight = refreshInFlight ?? performRefresh();
        const accessToken = await refreshInFlight;
        refreshInFlight = null;
        originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
        return http(originalRequest);
      } catch (refreshError) {
        refreshInFlight = null;
        await clearTokens();
        notifySessionExpired();
        return Promise.reject(toHttpAppError(refreshError));
      }
    }

    logger.warn(error.config?.url, error.response?.status, redact(error.response?.data));
    return Promise.reject(toHttpAppError(error));
  }
);
