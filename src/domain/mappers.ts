// Traducción de las respuestas del backend a los modelos de dominio. Es el único lugar
// que tolera las imprecisiones del API: montos que llegan como string, nombres de campo
// que cambian según el endpoint, campos que a veces no vienen.
import { toAmount } from '../core/http/payload';
import { isDocumentType } from './constants';
import { Business, Debt, Debtor, Payment, User } from './models';

export function mapUser(raw: Record<string, unknown>): User {
  const documentType = raw.documentType;
  return {
    id: String(raw.id),
    email: String(raw.email ?? ''),
    name: typeof raw.name === 'string' ? raw.name : undefined,
    firstName: typeof raw.firstName === 'string' ? raw.firstName : undefined,
    lastName: typeof raw.lastName === 'string' ? raw.lastName : undefined,
    documentType: typeof documentType === 'string' && isDocumentType(documentType) ? documentType : undefined,
    documentNumber: typeof raw.documentNumber === 'string' ? raw.documentNumber : undefined,
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    role: typeof raw.role === 'string' ? raw.role : undefined,
  };
}

export function mapBusiness(raw: Record<string, unknown>): Business {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    address: String(raw.address ?? ''),
    currency: typeof raw.currency === 'string' ? raw.currency : undefined,
  };
}

export function mapDebtor(raw: Record<string, unknown>, businessId?: string): Debtor {
  const documentType = raw.documentType;
  const balance = toAmount(raw.balance);
  const totalBalance = raw.totalBalance !== undefined ? toAmount(raw.totalBalance) : undefined;

  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    documentType: typeof documentType === 'string' && isDocumentType(documentType) ? documentType : 'CC',
    documentNumber: String(raw.documentNumber ?? ''),
    phone: String(raw.phone ?? ''),
    balance,
    totalBalance,
    hasPendingDebt: typeof raw.hasPendingDebt === 'boolean' ? raw.hasPendingDebt : (totalBalance ?? balance) > 0,
    businessId: typeof raw.businessId === 'string' ? raw.businessId : businessId,
  };
}

// Los pagos globales (`POST /payments/global`) reparten el monto entre varias deudas y
// el backend puede devolver el monto aplicado a cada una como `appliedAmount` en vez de
// `amount`.
export function mapPayment(raw: Record<string, unknown>, debtId?: string): Payment {
  return {
    id: String(raw.id),
    debtId: String(raw.debtId ?? debtId ?? ''),
    amount: toAmount(raw.amount ?? raw.appliedAmount),
    method: (raw.method as Payment['method']) ?? 'CASH',
    type: String(raw.type ?? 'PAYMENT'),
    note: typeof raw.note === 'string' ? raw.note : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : (raw.paymentDate as string | undefined),
    totalAmount: raw.totalAmount !== undefined ? toAmount(raw.totalAmount) : undefined,
    isGlobalSummary: raw.isGlobalSummary === true,
  };
}

export function mapDebt(raw: Record<string, unknown>, businessId?: string): Debt {
  const amount = toAmount(raw.amount);
  const payments = Array.isArray(raw.payments)
    ? (raw.payments as Record<string, unknown>[]).map((payment) => mapPayment(payment, String(raw.id)))
    : [];
  const paidSoFar = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount =
    raw.remainingAmount !== undefined
      ? toAmount(raw.remainingAmount)
      : raw.balance !== undefined
        ? toAmount(raw.balance)
        : Math.max(amount - paidSoFar, 0);

  const status = (raw.status as Debt['status']) ?? (remainingAmount <= 0 ? 'PAID' : paidSoFar > 0 ? 'PARTIAL' : 'OPEN');

  return {
    id: String(raw.id),
    businessId: String(raw.businessId ?? businessId ?? ''),
    debtorId: String(raw.debtorId ?? ''),
    amount,
    remainingAmount,
    description: typeof raw.description === 'string' ? raw.description : '',
    dueDate: String(raw.dueDate ?? ''),
    status,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    payments,
  };
}
