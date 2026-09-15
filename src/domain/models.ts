/**
 * Modelos del dominio.
 *
 * Un solo archivo con las entidades del negocio, en lugar de tenerlas
 * declaradas dentro de cada context como en el v1 (donde `Client` vivía en
 * `ClientContext` y había que importar el context solo para usar el tipo).
 *
 * Nota de nombres: el backend llama `debtor` al cliente que fía, y la interfaz
 * de usuario le dice "cliente". Aquí se respeta `Debtor` para que el código
 * hable el mismo idioma que el API, y la traducción a "cliente" ocurre solo en
 * los textos de pantalla.
 */
import type {
  DebtStatus,
  DocumentType,
  PaymentMethod,
  TransactionType,
} from './constants';

/* ── Usuario ──────────────────────────────────────────────────────────────── */

export interface User {
  id: string;
  email: string;
  /** Nombre completo que devuelve el backend en el login. */
  name?: string;
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  phone?: string;
  role?: string;
}

/** Nombre para mostrar, con degradación elegante si faltan campos. */
export const displayName = (user: User | null): string => {
  if (!user) return 'Usuario';
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.firstName ?? user.name ?? user.email ?? 'Usuario';
};

/* ── Negocio ──────────────────────────────────────────────────────────────── */

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

/* ── Cliente / deudor ─────────────────────────────────────────────────────── */

export interface Debtor {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  /** Saldo pendiente en este negocio. */
  balance: number;
  /** Saldo consolidado en todos los negocios del usuario. */
  totalBalance?: number;
  hasPendingDebt?: boolean;
  /**
   * Negocio al que pertenece. El endpoint `/debtors/me/all` lo devuelve; el
   * de un negocio concreto no, y en ese caso se rellena en el cliente.
   */
  businessId?: string;
}

export interface DebtorDraft {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
}

/** Saldo a mostrar: prioriza el del negocio y cae al consolidado. */
export const debtorBalance = (debtor: Debtor): number =>
  debtor.balance > 0 ? debtor.balance : (debtor.totalBalance ?? 0);

/* ── Deuda ────────────────────────────────────────────────────────────────── */

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  method: PaymentMethod;
  type: TransactionType;
  note: string;
  createdAt?: string;
  /** Presente en el resumen de un pago global: total repartido del grupo. */
  totalAmount?: number;
  /** Marca los resúmenes sintéticos creados en el cliente, no en el backend. */
  isGlobalSummary?: boolean;
}

export interface Debt {
  id: string;
  businessId: string;
  debtorId: string;
  amount: number;
  /** Lo que queda por pagar de esta deuda. */
  remainingAmount: number;
  description: string;
  dueDate: string;
  status: DebtStatus;
  createdAt?: string;
  /** El endpoint de deudas las devuelve con sus pagos embebidos. */
  payments: Payment[];
}

export interface DebtDraft {
  debtorId: string;
  amount: number;
  description: string;
  /** ISO date. Si no se envía, el backend usa su valor por defecto. */
  dueDate?: string;
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

/* ── Movimiento (vista unificada del extracto) ────────────────────────────── */

/**
 * Una fila del extracto de un cliente. Es un tipo de la capa de presentación:
 * une deudas y pagos en una sola lista ordenada por fecha, que es como el
 * tendero lee la cuenta ("le fié, me abonó, le fié…").
 */
export type Movement =
  | { kind: 'debt'; id: string; date: number; amount: number; debt: Debt }
  | { kind: 'payment'; id: string; date: number; amount: number; payment: Payment };

/** Construye el extracto ordenado del más reciente al más antiguo. */
export const buildMovements = (debts: Debt[]): Movement[] => {
  const movements: Movement[] = [];

  for (const debt of debts) {
    movements.push({
      kind: 'debt',
      id: `debt-${debt.id}`,
      date: new Date(debt.createdAt ?? debt.dueDate).getTime(),
      amount: debt.amount,
      debt,
    });

    for (const payment of debt.payments) {
      movements.push({
        kind: 'payment',
        id: `payment-${payment.id}`,
        date: new Date(payment.createdAt ?? 0).getTime(),
        amount: payment.amount,
        payment,
      });
    }
  }

  return movements.sort((a, b) => b.date - a.date);
};

/* ── Agregados ────────────────────────────────────────────────────────────── */

export interface DebtorSummary {
  /** Suma de lo fiado. */
  totalDebt: number;
  /** Suma de lo abonado. */
  totalPaid: number;
  /** Lo que falta por cobrar. */
  balance: number;
  openDebts: number;
  paidDebts: number;
  /** Deuda vencida más antigua, si hay alguna. */
  oldestOverdueDate: string | null;
}

export const summarizeDebts = (debts: Debt[], serverBalance?: number): DebtorSummary => {
  let totalDebt = 0;
  let totalPaid = 0;
  let openDebts = 0;
  let paidDebts = 0;
  let oldestOverdueDate: string | null = null;

  const today = Date.now();

  for (const debt of debts) {
    totalDebt += debt.amount;
    for (const payment of debt.payments) totalPaid += payment.amount;

    if (debt.status === 'PAID') {
      paidDebts += 1;
    } else {
      openDebts += 1;
      const due = new Date(debt.dueDate).getTime();
      if (Number.isFinite(due) && due < today) {
        if (!oldestOverdueDate || due < new Date(oldestOverdueDate).getTime()) {
          oldestOverdueDate = debt.dueDate;
        }
      }
    }
  }

  // Se confía en el saldo del servidor cuando viene: él conoce ajustes que la
  // app no ve. El cálculo local es el respaldo.
  const balance =
    serverBalance !== undefined && serverBalance !== null
      ? Math.max(0, serverBalance)
      : Math.max(0, totalDebt - totalPaid);

  return { totalDebt, totalPaid, balance, openDebts, paidDebts, oldestOverdueDate };
};
