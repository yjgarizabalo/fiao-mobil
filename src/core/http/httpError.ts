// Convierte cualquier error de axios/red en un AppError. Es el único sitio del código
// que le importa la forma exacta del error de axios; todo lo demás solo ve AppError.
import axios from 'axios';
import { AppError, codeFromStatus, isAppError } from '../errors/AppError';

function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function extractFieldErrors(errors: unknown): Record<string, string> | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    const message = firstMessage(value);
    if (message) result[field] = message;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function toHttpAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (axios.isCancel(error)) {
    return new AppError('CANCELLED', { cause: error });
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new AppError('TIMEOUT', { cause: error });
    }

    if (!error.response) {
      return new AppError('NETWORK', { cause: error });
    }

    const status = error.response.status;
    const code = codeFromStatus(status);
    const body = error.response.data as
      | { message?: string | string[]; error?: string; errors?: Record<string, string | string[]> }
      | undefined;

    const backendMessage = code === 'SERVER' ? undefined : firstMessage(body?.message) ?? body?.error;
    const fieldErrors = extractFieldErrors(body?.errors);

    return new AppError(code, {
      status,
      message: backendMessage,
      fieldErrors,
      cause: error,
    });
  }

  return new AppError('UNKNOWN', { cause: error });
}
