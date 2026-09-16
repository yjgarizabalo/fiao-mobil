/**
 * API de negocios. `GET/POST /business`
 */
import { http } from '@/core/http/client';
import { DEFAULT_PAGE_SIZE, type Page, toItem, toPage } from '@/core/http/payload';
import { mapBusiness } from '@/domain/mappers';
import type { Business, BusinessDraft } from '@/domain/models';

export const businessApi = {
  list: async (page = 1, limit = DEFAULT_PAGE_SIZE): Promise<Page<Business>> => {
    const { data } = await http.get('/business', { params: { page, limit } });
    const raw = toPage<unknown>(data, page, limit);
    return { items: raw.items.map(mapBusiness), meta: raw.meta };
  },

  create: async (draft: BusinessDraft): Promise<Business> => {
    const { data } = await http.post('/business', draft);
    return mapBusiness(toItem(data));
  },
};
