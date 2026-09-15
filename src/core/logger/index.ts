// Logger con niveles y redacción de secretos. Reemplaza los console.log sueltos de
// utils/api.ts y authService.ts que imprimían el access token, el refresh token y
// cuerpos de respuesta completos en cada petición — cualquiera con acceso a los logs
// (Metro, Logcat, un crash reporter) podía leer credenciales de sesión ahí.
import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'x-refresh-token',
  'secret',
]);

function maskValue(value: string): string {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length})`;
}

export function redact(value: unknown, depth = 4): unknown {
  if (depth <= 0 || value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    const truncated = value.slice(0, 20).map((item) => redact(item, depth - 1));
    return value.length > 20 ? [...truncated, `…${value.length - 20} más`] : truncated;
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = typeof val === 'string' ? maskValue(val) : '***';
      } else {
        result[key] = redact(val, depth - 1);
      }
    }
    return result;
  }

  return value;
}

function shouldLog(level: LogLevel): boolean {
  if (env.isDebug) return true;
  return level === 'warn' || level === 'error';
}

export function createLogger(scope: string) {
  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!shouldLog(level)) return;
    const prefix = `[${scope}]`;
    const method = level === 'debug' ? 'log' : level;
    // eslint-disable-next-line no-console -- este es el único punto autorizado a usar console.*
    console[method](prefix, ...args);
  };

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
  };
}
