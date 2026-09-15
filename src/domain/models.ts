// Entidades de dominio y las funciones que operan sobre ellas. Antes estos tipos vivían
// declarados dentro de cada context (Client en ClientContext, Debt en DebtsContext...);
// aquí quedan en un solo sitio, sin depender de React.
import { DebtStatus, DocumentType, PaymentMethod } from './constants';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  role?: string;
}

export function displayName(user: User | null | undefined): string {
  if (!user) return '';
  if (user.firstName) return `${user.firstName} ${user.lastName ?? ''}`.trim();
  if (user.name) return user.name;
  return user.email;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  currency?: string;
}

export interface BusinessDraft {
  name: string;
  address: string;
}

// En el API el recurso se llama "debtor"; en la UI siempre es "cliente".
export interface Debtor {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  balance: number;
  totalBalance?: number;
  hasPendingDebt?: boolean;
  businessId?: string;
}

export interface DebtorDraft {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
}

// Saldo del negocio actual, con el consolidado entre negocios como respaldo — la lista
// "todos mis negocios" solo trae `totalBalance`.
export function debtorBalance(debtor: Debtor): number {
  return debtor.balance ?? debtor.totalBalance ?? 0;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  method: PaymentMethod;
  type: string;
  note: string;
  createdAt?: string;
  // Presentes solo en el pago sintético de resumen de un pago global (ver
  // addGlobalPaymentSummary en el v1): el backend reparte el pago global entre las
  // deudas abiertas y no hay un único registro con el total, así que la pantalla arma
  // uno local para que el extracto muestre el monto que el tendero realmente cobró.
  totalAmount?: number;
  isGlobalSummary?: boolean;
}

export interface PaymentDraft {
  debtId: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}

export interface GlobalPaymentDraft {
  debtorId: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}

export interface Debt {
  id: string;
  businessId: string;
  debtorId: string;
  amount: number;
  remainingAmount: number;
  description: string;
  dueDate: string;
  status: DebtStatus;
  createdAt?: string;
  payments: Payment[];
}

export interface DebtDraft {
  debtorId: string;
  amount: number;
  description: string;
  dueDate: string;
}

export type Movement =
  | { kind: 'debt'; id: string; date: string; amount: number; description: string }
  | { kind: 'payment'; id: string; date: string; amount: number; method: PaymentMethod; note: string };

// Extracto unificado de deudas + pagos, ordenado por fecha descendente. Reemplaza el
// `sortedMovements` que construía clientDetail.tsx a mano cada vez.
export function buildMovements(debts: Debt[]): Movement[] {
  const movements: Movement[] = [];

  for (const debt of debts) {
    movements.push({
      kind: 'debt',
      id: debt.id,
      date: debt.createdAt ?? debt.dueDate,
      amount: debt.amount,
      description: debt.description,
    });

    for (const payment of debt.payments) {
      movements.push({
        kind: 'payment',
        id: payment.id,
        date: payment.createdAt ?? debt.createdAt ?? debt.dueDate,
        amount: payment.totalAmount ?? payment.amount,
        method: payment.method,
        note: payment.note,
      });
    }
  }

  return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface DebtorSummary {
  totalDebt: number;
  totalPaid: number;
  balance: number;
  openDebts: number;
  paidDebts: number;
  oldestOverdueDate?: string;
}

// El saldo mostrado prioriza el del servidor y solo calcula totalDeudas - totalPagos
// como respaldo, igual que hacía clientDetail.tsx en el v1.
export function summarizeDebts(debts: Debt[], serverBalance?: number): DebtorSummary {
  let totalDebt = 0;
  let totalPaid = 0;
  let openDebts = 0;
  let paidDebts = 0;
  let oldestOverdueDate: string | undefined;

  const today = new Date();

  for (const debt of debts) {
    totalDebt += debt.amount;
    totalPaid += debt.amount - debt.remainingAmount;

    if (debt.status === 'PAID') {
      paidDebts += 1;
    } else {
      openDebts += 1;
      const dueDate = new Date(debt.dueDate);
      if (dueDate < today && (!oldestOverdueDate || dueDate < new Date(oldestOverdueDate))) {
        oldestOverdueDate = debt.dueDate;
      }
    }
  }

  return {
    totalDebt,
    totalPaid,
    balance: serverBalance ?? totalDebt - totalPaid,
    openDebts,
    paidDebts,
    oldestOverdueDate,
  };
}
