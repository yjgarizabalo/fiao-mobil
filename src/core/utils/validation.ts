// Validadores de campo, sin librería (no hay zod en este proyecto). Se combinan con
// useForm: cada regla es un `Validator = (value) => string | undefined`, el primer error
// gana.
import { Validator } from '../hooks/useForm';

export function validate(value: string, ...validators: Validator[]): string | undefined {
  for (const validator of validators) {
    const message = validator(value);
    if (message) return message;
  }
  return undefined;
}

export function validateFields<T extends Record<string, string>>(
  values: T,
  rules: Partial<Record<keyof T, Validator[]>>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const field of Object.keys(values) as (keyof T)[]) {
    const message = validate(values[field] ?? '', ...(rules[field] ?? []));
    if (message) errors[field] = message;
  }
  return errors;
}

export function isValid(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((message) => !message);
}

export const required =
  (label = 'Este campo'): Validator =>
  (value) =>
    value.trim().length === 0 ? `${label} es obligatorio` : undefined;

export const email: Validator = (value) => {
  if (!value.trim()) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Correo inválido';
};

export const minLength =
  (length: number, label = 'Este campo'): Validator =>
  (value) =>
    value.trim().length > 0 && value.trim().length < length ? `${label} debe tener al menos ${length} caracteres` : undefined;

// Cédula/documento colombiano: 6 a 12 dígitos.
export const documentNumber: Validator = (value) => {
  if (!value.trim()) return undefined;
  return /^\d{6,12}$/.test(value.trim()) ? undefined : 'Documento inválido';
};

// Celular colombiano: 10 dígitos, empieza en 3.
export const phone: Validator = (value) => {
  if (!value.trim()) return undefined;
  return /^3\d{9}$/.test(value.trim()) ? undefined : 'Celular inválido';
};

export const password: Validator = (value) => {
  if (!value) return undefined;
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'Debe combinar letras y números';
  return undefined;
};

export const matches =
  (other: () => string, message = 'No coincide'): Validator =>
  (value) =>
    value !== other() ? message : undefined;

// Login: acepta correo o número de documento.
export const emailOrDocument: Validator = (value) => {
  if (!value.trim()) return undefined;
  const trimmed = value.trim();
  const isEmail = trimmed.includes('@');
  return isEmail ? email(trimmed) : documentNumber(trimmed);
};

export const positiveAmount =
  (max?: number): Validator =>
  (value) => {
    const amount = Number(value.replace(/[^0-9]/g, ''));
    if (!value.trim() || amount <= 0) return 'Ingresa un monto válido';
    if (max !== undefined && amount > max) return 'El monto supera el saldo disponible';
    return undefined;
  };
