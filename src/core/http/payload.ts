// El backend responde a veces `{ data, meta }` y a veces el recurso pelado (un array o
// un objeto suelto), según el endpoint. En vez de repetir
// `Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []`
// en cada context (como en v1), toda normalización pasa por estas tres funciones.

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

export const DEFAULT_PAGE_SIZE = 10;

export function toList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export function toPage<T>(payload: unknown, requestedPage: number, requestedLimit: number): Page<T> {
  const items = toList<T>(payload);
  const rawMeta =
    payload && typeof payload === 'object' ? (payload as { meta?: Partial<PaginationMeta> }).meta : undefined;

  const limit = rawMeta?.limit ?? requestedLimit;
  const page = rawMeta?.page ?? requestedPage;
  const total = rawMeta?.total ?? items.length;
  const totalPages = rawMeta?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)));

  return { items, meta: { total, page, limit, totalPages } };
}

export function toItem<T>(payload: unknown): T | null {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    const data = (payload as { data: unknown }).data;
    return (data ?? null) as T | null;
  }
  return payload as T;
}

export function hasNextPage(meta: PaginationMeta): boolean {
  return meta.page < meta.totalPages;
}

export function toAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
