/**
 * Logger con niveles y redacción de datos sensibles.
 *
 * El v1 imprimía el access token, el refresh token y el cuerpo completo de
 * cada respuesta en consola. Eso filtra credenciales a cualquier herramienta
 * que capture logs. Aquí:
 *  - en producción solo se emiten `warn` y `error`;
 *  - todo objeto pasa por `redact()`, que enmascara llaves sensibles.
 */
import { env } from '@/core/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Llaves cuyo valor nunca debe aparecer completo en un log. */
const SENSITIVE_KEYS = [
  'password',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'x-refresh-token',
  'secret',
];

const minWeight = env.isDebug ? LEVEL_WEIGHT.debug : LEVEL_WEIGHT.warn;

const maskValue = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) return '***';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}…${value.slice(-4)} (len ${value.length})`;
};

/** Copia el valor enmascarando cualquier llave sensible, a cualquier nivel. */
export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 4 || value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redact(item, depth + 1));
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
      output[key] = SENSITIVE_KEYS.includes(key.toLowerCase())
        ? maskValue(source[key])
        : redact(source[key], depth + 1);
    }
    return output;
  }

  return value;
};

const emit = (level: LogLevel, scope: string, message: string, meta?: unknown) => {
  if (LEVEL_WEIGHT[level] < minWeight) return;

  const prefix = `[${scope}]`;
  const payload = meta === undefined ? undefined : redact(meta);

  // eslint-disable-next-line no-console
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (payload === undefined) sink(prefix, message);
  else sink(prefix, message, payload);
};

/**
 * Crea un logger con ámbito fijo.
 *
 * @example
 * const log = createLogger('http');
 * log.debug('GET /debtors', { page: 1 });
 */
export const createLogger = (scope: string) => ({
  debug: (message: string, meta?: unknown) => emit('debug', scope, message, meta),
  info: (message: string, meta?: unknown) => emit('info', scope, message, meta),
  warn: (message: string, meta?: unknown) => emit('warn', scope, message, meta),
  error: (message: string, meta?: unknown) => emit('error', scope, message, meta),
});

export type Logger = ReturnType<typeof createLogger>;
