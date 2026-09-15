/**
 * Traducción de errores de axios al `AppError` de la aplicación.
 */
import axios from 'axios';

import { AppError, codeFromStatus, isAppError } from '../errors/AppError';

/** Formas conocidas en las que el backend devuelve el detalle de un error. */
interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  errors?: Record<string, string | string[]>;
  statusCode?: number;
}

const firstString = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value.find((item) => typeof item === 'string');
  return typeof value === 'string' ? value : undefined;
};

/** Aplana `{ errors: { email: ['ya existe'] } }` a `{ email: 'ya existe' }`. */
const parseFieldErrors = (
  errors: ApiErrorBody['errors'],
): Record<string, string> | undefined => {
  if (!errors) return undefined;
  const output: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors)) {
    const message = firstString(value);
    if (message) output[field] = message;
  }
  return Object.keys(output).length > 0 ? output : undefined;
};

/**
 * Convierte cualquier error de red/HTTP en un `AppError` con mensaje listo
 * para mostrar. Respeta el mensaje del backend cuando viene y es legible.
 */
export const toHttpAppError = (error: unknown): AppError => {
  if (isAppError(error)) return error;

  if (axios.isCancel(error)) {
    return new AppError('CANCELLED', { cause: error });
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new AppError('TIMEOUT', { cause: error });
    }

    // Sin `response` significa que la petición nunca llegó al servidor.
    if (!error.response) {
      return new AppError('NETWORK', { cause: error });
    }

    const status = error.response.status;
    const body = error.response.data as ApiErrorBody | undefined;
    const backendMessage = firstString(body?.message) ?? body?.error;
    const code = codeFromStatus(status);

    return new AppError(code, {
      status,
      cause: error,
      fieldErrors: parseFieldErrors(body?.errors),
      // Para 5xx nunca mostramos el texto del servidor: suele ser un stack trace.
      message: code === 'SERVER' ? undefined : backendMessage,
    });
  }

  return new AppError('UNKNOWN', { cause: error });
};
