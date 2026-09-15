/**
 * Vocabulario del negocio: tipos de documento, métodos de pago y estados.
 *
 * Estaban repartidos como strings sueltos por las pantallas del v1
 * (`'CC'` escrito a mano en dos formularios, `'CASH'` en el modal de pago).
 * Centralizarlos evita que un typo mande `"cash"` al backend y da las
 * etiquetas en español en un solo lugar.
 */

/* ── Tipos de documento ───────────────────────────────────────────────────── */

export const DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'PP', 'TI'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  CC: 'CC',
  CE: 'CE',
  NIT: 'NIT',
  PP: 'Pasaporte',
  TI: 'TI',
};

export const DOCUMENT_TYPE_DESCRIPTION: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  NIT: 'Número de identificación tributaria',
  PP: 'Pasaporte',
  TI: 'Tarjeta de identidad',
};

export const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES.map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABEL[value],
  description: DOCUMENT_TYPE_DESCRIPTION[value],
}));

export const isDocumentType = (value: string): value is DocumentType =>
  (DOCUMENT_TYPES as readonly string[]).includes(value);

/* ── Métodos de pago ──────────────────────────────────────────────────────── */

export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CARD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
};

export const PAYMENT_METHOD_ICON: Record<PaymentMethod, 'cash-outline' | 'phone-portrait-outline' | 'card-outline'> = {
  CASH: 'cash-outline',
  TRANSFER: 'phone-portrait-outline',
  CARD: 'card-outline',
};

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABEL[value],
}));

/* ── Estado de una deuda ──────────────────────────────────────────────────── */

export const DEBT_STATUSES = ['OPEN', 'PARTIAL', 'PAID'] as const;
export type DebtStatus = (typeof DEBT_STATUSES)[number];

export const DEBT_STATUS_LABEL: Record<DebtStatus, string> = {
  OPEN: 'Pendiente',
  PARTIAL: 'Abonada',
  PAID: 'Pagada',
};

/* ── Tipo de movimiento ───────────────────────────────────────────────────── */

/** El backend usa `type` para distinguir un pago de un ajuste. */
export const TRANSACTION_TYPES = ['PAYMENT', 'ADJUSTMENT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
