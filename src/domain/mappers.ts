/**
 * Mapeo de las respuestas del backend a los modelos del dominio.
 *
 * Es la frontera del sistema: aquí —y solo aquí— se toleran las rarezas del
 * API (importes como string `"15000.00"`, campos que a veces no vienen,
 * nombres alternativos). A partir de este punto el resto de la app trabaja con
 * datos limpios y tipados, así que ninguna pantalla necesita `Number(x)` ni
 * `?? 0` defensivos.
 */
import { toAmount } from '../core/http/payload';
import {
  type DebtStatus,
  type DocumentType,
  type PaymentMethod,
  type TransactionType,
  isDocumentType,
} from './constants';
import type { Business, Debt, Debtor, Payment, User } from './models';

type Raw = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;

const asBoolean = (value: unknown): boolean => value === true || value === 'true';

const asDocumentType = (value: unknown): DocumentType => {
  const raw = asString(value).toUpperCase();
  return isDocumentType(raw) ? raw : 'CC';
};

const asPaymentMethod = (value: unknown): PaymentMethod => {
  const raw = asString(value).toUpperCase();
  return raw === 'TRANSFER' || raw === 'CARD' ? raw : 'CASH';
};

const asTransactionType = (value: unknown): TransactionType =>
  asString(value).toUpperCase() === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'PAYMENT';

const asDebtStatus = (value: unknown): DebtStatus => {
  const raw = asString(value).toUpperCase();
  if (raw === 'PAID' || raw === 'PARTIAL') return raw;
  return 'OPEN';
};

/* ── Usuario ──────────────────────────────────────────────────────────────── */

export const mapUser = (raw: unknown): User => {
  const data = (raw ?? {}) as Raw;
  return {
    id: asString(data.id),
    email: asString(data.email),
    name: data.name === undefined ? undefined : asString(data.name),
    firstName: data.firstName === undefined ? undefined : asString(data.firstName),
    lastName: data.lastName === undefined ? undefined : asString(data.lastName),
    documentType: data.documentType === undefined ? undefined : asDocumentType(data.documentType),
    documentNumber:
      data.documentNumber === undefined ? undefined : asString(data.documentNumber),
    phone: data.phone === undefined ? undefined : asString(data.phone),
    role: data.role === undefined ? undefined : asString(data.role),
  };
};

/* ── Negocio ──────────────────────────────────────────────────────────────── */

export const mapBusiness = (raw: unknown): Business => {
  const data = (raw ?? {}) as Raw;
  return {
    id: asString(data.id),
    name: asString(data.name, 'Sin nombre'),
    address: asString(data.address),
    currency: data.currency === undefined ? undefined : asString(data.currency),
  };
};

/* ── Cliente / deudor ─────────────────────────────────────────────────────── */

export const mapDebtor = (raw: unknown, businessId?: string): Debtor => {
  const data = (raw ?? {}) as Raw;
  const balance = toAmount(data.balance);
  const totalBalance = data.totalBalance === undefined ? undefined : toAmount(data.totalBalance);

  return {
    id: asString(data.id),
    name: asString(data.name, 'Sin nombre'),
    documentType: asDocumentType(data.documentType),
    documentNumber: asString(data.documentNumber),
    phone: asString(data.phone),
    balance,
    totalBalance,
    // Si el backend no manda la bandera, se deduce del saldo.
    hasPendingDebt:
      data.hasPendingDebt === undefined
        ? balance > 0 || (totalBalance ?? 0) > 0
        : asBoolean(data.hasPendingDebt),
    businessId: asString(data.businessId) || businessId,
  };
};

/* ── Pago ─────────────────────────────────────────────────────────────────── */

export const mapPayment = (raw: unknown, debtId = ''): Payment => {
  const data = (raw ?? {}) as Raw;
  return {
    id: asString(data.id),
    debtId: asString(data.debtId, debtId),
    // El backend usa `appliedAmount` en los pagos de un grupo global.
    amount: toAmount(data.amount ?? data.appliedAmount),
    method: asPaymentMethod(data.method),
    type: asTransactionType(data.type),
    note: asString(data.note),
    createdAt: data.createdAt === undefined ? undefined : asString(data.createdAt),
    totalAmount: data.totalAmount === undefined ? undefined : toAmount(data.totalAmount),
  };
};

/* ── Deuda ────────────────────────────────────────────────────────────────── */

export const mapDebt = (raw: unknown, businessId = ''): Debt => {
  const data = (raw ?? {}) as Raw;
  const id = asString(data.id);
  const amount = toAmount(data.amount);
  const payments = Array.isArray(data.payments)
    ? data.payments.map((payment) => mapPayment(payment, id))
    : [];

  // `remainingAmount` y `balance` son dos nombres para lo mismo según el
  // endpoint; si no viene ninguno, se calcula con los pagos.
  const paid = payments.reduce((total, payment) => total + payment.amount, 0);
  const remainingRaw = data.remainingAmount ?? data.balance;
  const remainingAmount =
    remainingRaw === undefined ? Math.max(0, amount - paid) : toAmount(remainingRaw);

  return {
    id,
    businessId: asString(data.businessId, businessId),
    debtorId: asString(data.debtorId),
    amount,
    remainingAmount,
    description: asString(data.description),
    dueDate: asString(data.dueDate),
    status: asDebtStatus(data.status),
    createdAt: data.createdAt === undefined ? undefined : asString(data.createdAt),
    payments,
  };
};
