/**
 * Vocabulario del negocio: tipos de documento, métodos de pago y estados.
 *
 * Estaban repartidos como strings sueltos por las pantallas del v1
 * (`'CC'` escrito a mano en dos formularios, `'CASH'` en el modal de pago).
 * Centralizarlos evita que un typo mande `"cash"` al backend y da las
 * etiquetas en español en un solo lugar.
 */

/* ── Tipos de documento ───────────────────────────────────────────────────── */

/**
 * Son los tres valores del enum `DocumentType` del backend. Ofrecer más
 * (pasaporte, tarjeta de identidad) hacía que el servidor rechazara el
 * registro con un 400, porque `@IsEnum` solo admite estos.
 */
export const DOCUMENT_TYPES = ['CC', 'FOREIGNER', 'NIT'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  CC: 'CC',
  FOREIGNER: 'CE',
  NIT: 'NIT',
};

export const DOCUMENT_TYPE_DESCRIPTION: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  FOREIGNER: 'Cédula de extranjería',
  NIT: 'Número de identificación tributaria',
};

export const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES.map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABEL[value],
  description: DOCUMENT_TYPE_DESCRIPTION[value],
}));

export const isDocumentType = (value: string): value is DocumentType =>
  (DOCUMENT_TYPES as readonly string[]).includes(value);

/* ── Métodos de pago ──────────────────────────────────────────────────────── */

/** Enum `PaymentMethod` del backend. `CARD` no existe allí: un pago con
 *  tarjeta se registra como `OTHER`. */
export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
};

export const PAYMENT_METHOD_ICON: Record<
  PaymentMethod,
  'cash-outline' | 'phone-portrait-outline' | 'ellipsis-horizontal-outline'
> = {
  CASH: 'cash-outline',
  TRANSFER: 'phone-portrait-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABEL[value],
}));

/* ── Estado de una deuda ──────────────────────────────────────────────────── */

export const DEBT_STATUSES = ['OPEN', 'PARTIAL', 'PAID', 'CANCELLED'] as const;
export type DebtStatus = (typeof DEBT_STATUSES)[number];

export const DEBT_STATUS_LABEL: Record<DebtStatus, string> = {
  OPEN: 'Pendiente',
  PARTIAL: 'Abonada',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
};

/* ── Tipo de movimiento ───────────────────────────────────────────────────── */

/**
 * El backend usa `type` para distinguir un abono de un ajuste. `REVERSAL` lo
 * genera él al reversar un pago global; la app nunca lo envía, pero sí lo
 * recibe y tiene que saber mostrarlo.
 */
export const TRANSACTION_TYPES = ['PAYMENT', 'ADJUSTMENT', 'REVERSAL'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  PAYMENT: 'Abono',
  ADJUSTMENT: 'Ajuste',
  REVERSAL: 'Reverso',
};
