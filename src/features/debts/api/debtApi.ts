/**
 * API de deudas. `GET /debtors/:id/debts` · `POST /debts`
 *
 * El endpoint de listado devuelve cada deuda con sus pagos embebidos, así que
 * una sola petición basta para armar el extracto de un cliente. El v1 llamaba
 * además a `/debts/:id/payments` una vez por deuda; eso ya no hace falta.
 */
import { businessHeader, http } from '../../../core/http/client';
import { toItem, toList } from '../../../core/http/payload';
import { mapDebt } from '../../../domain/mappers';
import type { Debt, DebtDraft } from '../../../domain/models';

export const debtApi = {
  /** `GET /debtors/:debtorId/debts` — deudas con sus pagos. */
  listByDebtor: async (debtorId: string, businessId: string): Promise<Debt[]> => {
    const { data } = await http.get(
      `/debtors/${debtorId}/debts`,
      businessHeader(businessId),
    );
    return toList<unknown>(data).map((item) => mapDebt(item, businessId));
  },

  /** `POST /debts` */
  create: async (businessId: string, draft: DebtDraft): Promise<Debt> => {
    const { data } = await http.post('/debts', draft, businessHeader(businessId));
    return mapDebt(toItem(data), businessId);
  },
};
