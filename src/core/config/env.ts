// Único punto de lectura de `process.env`. El resto de la app importa `env`
// de aquí — nunca leas EXPO_PUBLIC_* directo en otro archivo, porque entonces
// cada uno inventa su propio default y su propia validación (como pasaba antes
// entre config/environment.ts y los distintos servicios).

export type Environment = 'local' | 'dev' | 'prd';

export interface EnvConfig {
  environment: Environment;
  apiBaseUrl: string;
  authPrefix: string;
  timeoutMs: number;
  isProduction: boolean;
  isDebug: boolean;
}

function parseEnvironment(value: string | undefined): Environment {
  if (value === 'dev' || value === 'prd' || value === 'local') return value;
  return 'local';
}

function parseTimeout(value: string | undefined): number {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
}

function buildEnv(): EnvConfig {
  const environment = parseEnvironment(process.env.EXPO_PUBLIC_ENVIRONMENT);
  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '');
  const authPrefixRaw = process.env.EXPO_PUBLIC_API_AUTH_PREFIX ?? '/auth';
  const authPrefix = authPrefixRaw.startsWith('/') ? authPrefixRaw : `/${authPrefixRaw}`;
  const timeoutMs = parseTimeout(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
  const isProduction = environment === 'prd';

  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.warn('[env] EXPO_PUBLIC_API_BASE_URL no está definida, usando http://localhost:3000/api');
  } else if (environment !== 'prd' && /localhost|127\.0\.0\.1/.test(apiBaseUrl)) {
    console.warn(
      '[env] EXPO_PUBLIC_API_BASE_URL apunta a localhost: un celular físico o el simulador de iOS no lo alcanzan. Usa la IP LAN de tu máquina.'
    );
  }

  return {
    environment,
    apiBaseUrl,
    authPrefix,
    timeoutMs,
    isProduction,
    isDebug: __DEV__ && !isProduction,
  };
}

export const env: EnvConfig = buildEnv();
