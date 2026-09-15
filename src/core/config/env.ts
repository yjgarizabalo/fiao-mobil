/**
 * Configuración de entorno, validada una sola vez al arrancar.
 *
 * A diferencia del v1 —donde cada helper leía `process.env` y aplicaba su
 * propio valor por defecto— aquí las variables se leen, se validan y se
 * congelan en un único objeto tipado. Si falta algo crítico, la app avisa
 * de inmediato en desarrollo en vez de fallar más tarde con un 404 raro.
 */

export type Environment = 'local' | 'dev' | 'prd';

interface EnvConfig {
  /** Entorno activo. */
  readonly environment: Environment;
  /** Base del API, sin barra final. Ej: `http://192.168.1.17:3000/api` */
  readonly apiBaseUrl: string;
  /** Prefijo de las rutas de autenticación. Ej: `/auth` */
  readonly authPrefix: string;
  /** Timeout de las peticiones HTTP, en ms. */
  readonly timeoutMs: number;
  /** `true` solo en el entorno de producción. */
  readonly isProduction: boolean;
  /** `true` cuando conviene mostrar logs de red y avisos de desarrollo. */
  readonly isDebug: boolean;
}

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureLeadingSlash = (value: string) =>
  value.startsWith('/') ? value : `/${value}`;

const parseEnvironment = (value: string | undefined): Environment => {
  if (value === 'dev' || value === 'prd' || value === 'local') return value;
  return 'local';
};

const parseTimeout = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20_000;
};

const readApiBaseUrl = (): string => {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!raw || raw.trim().length === 0) {
    // No lanzamos una excepción para no dejar la app en pantalla blanca:
    // se avisa fuerte y se usa un valor que hace evidente el problema.
    console.error(
      '[env] Falta EXPO_PUBLIC_API_BASE_URL. Copia .env.example a .env.local y ' +
        'ejecuta `npm run env:local`. En un celular físico debe ser la IP LAN ' +
        'de tu máquina, no localhost.',
    );
    return 'http://localhost:3000/api';
  }

  if (__DEV__ && /localhost|127\.0\.0\.1/.test(raw)) {
    console.warn(
      '[env] EXPO_PUBLIC_API_BASE_URL apunta a localhost. Un celular físico o ' +
        'el simulador de iOS no alcanzan el localhost del PC: usa tu IP LAN.',
    );
  }

  return stripTrailingSlash(raw.trim());
};

const environment = parseEnvironment(process.env.EXPO_PUBLIC_ENVIRONMENT);

export const env: EnvConfig = Object.freeze({
  environment,
  apiBaseUrl: readApiBaseUrl(),
  authPrefix: ensureLeadingSlash(process.env.EXPO_PUBLIC_API_AUTH_PREFIX ?? '/auth'),
  timeoutMs: parseTimeout(process.env.EXPO_PUBLIC_API_TIMEOUT_MS),
  isProduction: environment === 'prd',
  isDebug: __DEV__ && environment !== 'prd',
});
