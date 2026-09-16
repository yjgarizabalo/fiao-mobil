/**
 * API de pagos.
 *
 * Hay dos formas de pagar y las dos se conservan del v1:
 *  - `POST /payments` abona a **una** deuda concreta;
 *  - `POST /payments/global` abona al **saldo total** del cliente y el backend
 *    reparte el monto entre sus deudas abiertas, devolviendo el total del
 *    grupo en `group.totalAmount`.
 */
import { businessHeader, http } from '@/core/http/client';
import { DEFAULT_PAGE_SIZE, type Page, toAmount, toItem, toPage } from '@/core/http/payload';
import { mapPayment } from '@/domain/mappers';
import type { GlobalPaymentDraft, Payment, PaymentDraft } from '@/domain/models';

export interface GlobalPaymentResult {
  /** Monto efectivamente aplicado por el backend. */
  totalAmount: number;
  /** Cuántas deudas alcanzó a cubrir el reparto. */
  debtsAffected: number;
}

export const paymentApi = {
  /** `POST /payments` — abono a una deuda puntual. */
  create: async (businessId: string, draft: PaymentDraft): Promise<Payment> => {
    const { data } = await http.post(
      '/payments',
      {
        debtId: draft.debtId,
        amount: draft.amount,
        method: draft.method,
        // El DTO exige `type` y no tiene valor por defecto; la app solo crea
        // abonos (los ajustes y reversos los genera el backend).
        type: 'PAYMENT',
        ...(draft.note ? { note: draft.note } : {}),
      },
      businessHeader(businessId),
    );
    return mapPayment(toItem(data), draft.debtId);
  },

  /** `POST /payments/global` — abono al saldo total del cliente. */
  createGlobal: async (
    businessId: string,
    draft: GlobalPaymentDraft,
  ): Promise<GlobalPaymentResult> => {
    const { data } = await http.post(
      '/payments/global',
      {
        debtorId: draft.debtorId,
        amount: draft.amount,
        method: draft.method,
        ...(draft.note ? { note: draft.note } : {}),
      },
      businessHeader(businessId),
    );

    // El servicio responde `{ group: { totalAmount }, summary: { debtsAffected } }`.
    // Si cambiara la forma, se cae al monto solicitado en lugar de mostrar 0.
    const body = data as
      | { group?: { totalAmount?: unknown }; summary?: { debtsAffected?: unknown } }
      | undefined;
    const groupTotal = body?.group?.totalAmount;

    return {
      totalAmount: groupTotal === undefined ? draft.amount : toAmount(groupTotal),
      debtsAffected: toAmount(body?.summary?.debtsAffected),
    };
  },

  /**
   * `GET /debts/:debtId/payments` — pagos de una deuda.
   *
   * Hoy el detalle del cliente no lo necesita (las deudas ya llegan con sus
   * pagos), pero se mantiene porque el endpoint es el único que pagina los
   * pagos y sirve para un histórico largo.
   */
  listByDebt: async (
    debtId: string,
    businessId: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  ): Promise<Page<Payment>> => {
    const { data } = await http.get(`/debts/${debtId}/payments`, {
      params: { page, limit, type: 'PAYMENT' },
      ...businessHeader(businessId),
    });
    const raw = toPage<unknown>(data, page, limit);
    return { items: raw.items.map((item) => mapPayment(item, debtId)), meta: raw.meta };
  },
};
