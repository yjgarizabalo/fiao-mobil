// Modelo único de error de la app. Reemplaza a AuthError/UserServiceError/RegisterError:
// antes cada pantalla hacía un switch sobre el `type` de la clase que le tocara: ahora
// toAppError() siempre entrega un AppError con el título y el mensaje ya listos para
// mostrar al usuario, así que ninguna pantalla vuelve a decidir el copy de un error.

export type ErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'SERVER'
  | 'CANCELLED'
  | 'UNKNOWN';

interface ErrorCopy {
  title: string;
  message: string;
}

const DEFAULT_COPY: Record<ErrorCode, ErrorCopy> = {
  NETWORK: { title: 'Sin conexión', message: 'Revisa tu internet e intenta de nuevo.' },
  TIMEOUT: { title: 'Se demoró demasiado', message: 'La petición tardó más de lo normal. Intenta de nuevo.' },
  UNAUTHORIZED: { title: 'Sesión expirada', message: 'Vuelve a iniciar sesión para continuar.' },
  FORBIDDEN: { title: 'Sin permiso', message: 'No tienes permiso para hacer esto.' },
  NOT_FOUND: { title: 'No encontrado', message: 'Lo que buscas ya no existe o fue movido.' },
  CONFLICT: { title: 'Ya existe', message: 'Ese registro ya existe.' },
  VALIDATION: { title: 'Revisa los datos', message: 'Algunos campos no son válidos.' },
  SERVER: { title: 'Error del servidor', message: 'Algo falló de nuestro lado. Intenta más tarde.' },
  CANCELLED: { title: 'Cancelado', message: 'La operación fue cancelada.' },
  UNKNOWN: { title: 'Algo salió mal', message: 'Intenta de nuevo en un momento.' },
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly title: string;
  readonly status?: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    code: ErrorCode,
    options?: { message?: string; title?: string; status?: number; fieldErrors?: Record<string, string>; cause?: unknown }
  ) {
    const copy = DEFAULT_COPY[code];
    super(options?.message ?? copy.message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.title = options?.title ?? copy.title;
    this.status = options?.status;
    this.fieldErrors = options?.fieldErrors;
  }

  get isRetryable(): boolean {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT' || this.code === 'SERVER';
  }

  get isSessionExpired(): boolean {
    return this.code === 'UNAUTHORIZED';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError('UNKNOWN', { message: error.message, cause: error });
  }
  return new AppError('UNKNOWN', { cause: error });
}

export function codeFromStatus(status: number | undefined): ErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 400:
    case 422:
      return 'VALIDATION';
    default:
      if (status !== undefined && status >= 500) return 'SERVER';
      return 'UNKNOWN';
  }
}
