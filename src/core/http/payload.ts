/**
 * Normalización de respuestas del backend.
 *
 * El API responde a veces `{ data, meta }` y a veces el recurso pelado. El v1
 * repetía la misma cadena de comprobaciones en cada context; aquí se hace en
 * un solo sitio y con tipos.
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Envoltorio paginado tal como lo devuelve el backend. */
interface RawEnvelope<T> {
  data?: T[] | T;
  meta?: Partial<PaginationMeta>;
}

export const DEFAULT_PAGE_SIZE = 10;

const buildMeta = (
  raw: Partial<PaginationMeta> | undefined,
  itemCount: number,
  requestedPage: number,
  requestedLimit: number,
): PaginationMeta => {
  const limit = raw?.limit ?? requestedLimit;
  const page = raw?.page ?? requestedPage;
  const total = raw?.total ?? itemCount;
  const totalPages = raw?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));
  return { total, page, limit, totalPages };
};

/**
 * Extrae la lista de una respuesta, sea `{ data: [...] }` o `[...]`.
 * Nunca devuelve `undefined`: si la forma es inesperada, devuelve `[]`.
 */
export const toList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const envelope = payload as RawEnvelope<T> | null | undefined;
  if (envelope && Array.isArray(envelope.data)) return envelope.data;
  return [];
};

/** Extrae lista + metadatos de paginación, completando los que falten. */
export const toPage = <T>(
  payload: unknown,
  requestedPage = 1,
  requestedLimit = DEFAULT_PAGE_SIZE,
): Page<T> => {
  const items = toList<T>(payload);
  const envelope = (Array.isArray(payload) ? undefined : payload) as
    | RawEnvelope<T>
    | undefined;
  return {
    items,
    meta: buildMeta(envelope?.meta, items.length, requestedPage, requestedLimit),
  };
};

/** Extrae un recurso único, sea `{ data: {...} }` o `{...}`. */
export const toItem = <T>(payload: unknown): T | null => {
  if (payload === null || payload === undefined) return null;
  const envelope = payload as RawEnvelope<T>;
  if (
    typeof payload === 'object' &&
    'data' in (payload as object) &&
    envelope.data !== undefined &&
    !Array.isArray(envelope.data)
  ) {
    return envelope.data as T;
  }
  return payload as T;
};

/** `true` si quedan páginas por cargar. */
export const hasNextPage = (meta: PaginationMeta | null): boolean =>
  meta !== null && meta.page < meta.totalPages;

/**
 * Convierte a número los importes que el backend manda como string
 * (`balance: "15000.00"`). Devuelve 0 ante cualquier valor no numérico.
 */
export const toAmount = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};
