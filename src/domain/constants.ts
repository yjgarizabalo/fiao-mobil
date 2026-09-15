// Constantes de dominio con su etiqueta en español. El backend guarda estos valores como
// strings libres; aquí se cierra el tipo del lado de la app para que un typo no llegue a
// un formulario ni a una pantalla.

export const DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'PP', 'TI'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  NIT: 'NIT',
  PP: 'Pasaporte',
  TI: 'Tarjeta de identidad',
};

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

export const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES.map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABELS[value],
}));

export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CARD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
};

export const PAYMENT_METHOD_ICON: Record<PaymentMethod, string> = {
  CASH: 'cash-outline',
  TRANSFER: 'swap-horizontal-outline',
  CARD: 'card-outline',
};

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export const DEBT_STATUSES = ['OPEN', 'PARTIAL', 'PAID'] as const;
export type DebtStatus = (typeof DEBT_STATUSES)[number];

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  OPEN: 'Pendiente',
  PARTIAL: 'Abonada',
  PAID: 'Pagada',
};

export const TRANSACTION_TYPES = ['PAYMENT', 'ADJUSTMENT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
