/**
 * API de clientes (deudores).
 *
 * Todos los endpoints salvo `/debtors/me/all` exigen el header
 * `x-business-id`: el backend es multi-tenant por negocio.
 */
import { businessHeader, http } from '../../../core/http/client';
import { DEFAULT_PAGE_SIZE, type Page, toItem, toPage } from '../../../core/http/payload';
import { mapDebtor } from '../../../domain/mappers';
import type { Debtor, DebtorDraft } from '../../../domain/models';

export const debtorApi = {
  /** `GET /debtors` — clientes de un negocio concreto. */
  listByBusiness: async (
    businessId: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<Page<Debtor>> => {
    const { data } = await http.get('/debtors', {
      params: { page, limit },
      ...businessHeader(businessId),
    });
    const raw = toPage<unknown>(data, page, limit);
    // Este endpoint no devuelve `businessId`, así que se rellena aquí para que
    // la navegación al detalle pueda enviar el header correcto.
    return { items: raw.items.map((item) => mapDebtor(item, businessId)), meta: raw.meta };
  },

  /** `GET /debtors/me/all` — clientes de todos los negocios del usuario. */
  listAll: async (page = 1, limit = DEFAULT_PAGE_SIZE): Promise<Page<Debtor>> => {
    const { data } = await http.get('/debtors/me/all', { params: { page, limit } });
    const raw = toPage<unknown>(data, page, limit);
    return { items: raw.items.map((item) => mapDebtor(item)), meta: raw.meta };
  },

  /** `GET /debtors/:id` */
  getById: async (debtorId: string, businessId: string): Promise<Debtor> => {
    const { data } = await http.get(`/debtors/${debtorId}`, businessHeader(businessId));
    return mapDebtor(toItem(data), businessId);
  },

  /** `POST /debtors` */
  create: async (businessId: string, draft: DebtorDraft): Promise<Debtor> => {
    const { data } = await http.post('/debtors', draft, businessHeader(businessId));
    return mapDebtor(toItem(data), businessId);
  },
};
