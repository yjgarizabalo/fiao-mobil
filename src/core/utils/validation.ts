/**
 * Validación de formularios, sin dependencias externas.
 *
 * Cada validador devuelve `undefined` cuando el valor es válido y un mensaje
 * en español cuando no lo es. Eso permite componerlos y alimentar
 * directamente el `error` de los inputs.
 */
import { digitsOnly } from './format';

export type Validator = (value: string) => string | undefined;

/** Mensaje de error por campo. */
export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── Validadores individuales ─────────────────────────────────────────────── */

export const required =
  (label = 'Este campo'): Validator =>
  (value) =>
    value.trim().length === 0 ? `${label} es obligatorio` : undefined;

export const email: Validator = (value) =>
  EMAIL_PATTERN.test(value.trim()) ? undefined : 'El correo no tiene un formato válido';

export const minLength =
  (length: number, label = 'Este campo'): Validator =>
  (value) =>
    value.trim().length < length
      ? `${label} debe tener al menos ${length} caracteres`
      : undefined;

/** Documento de identidad colombiano: solo dígitos, entre 6 y 12. */
export const documentNumber: Validator = (value) => {
  const digits = digitsOnly(value);
  if (digits.length === 0) return 'El número de documento es obligatorio';
  if (digits !== value.trim()) return 'El documento debe tener solo números';
  if (digits.length < 6 || digits.length > 12) return 'El documento debe tener entre 6 y 12 dígitos';
  return undefined;
};

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export const phone: Validator = (value) => {
  const digits = digitsOnly(value);
  if (digits.length === 0) return 'El teléfono es obligatorio';
  if (digits.length !== 10) return 'El celular debe tener 10 dígitos';
  if (!digits.startsWith('3')) return 'El celular debe empezar por 3';
  return undefined;
};

/**
 * Contraseña. Se pide una longitud razonable y algo de variedad, sin llegar a
 * ser hostil: la meta es que el tendero pueda entrar, no aprobar una auditoría.
 */
export const password: Validator = (value) => {
  if (value.length === 0) return 'La contraseña es obligatoria';
  if (value.length < 8) return 'Debe tener al menos 8 caracteres';
  if (!/[a-zA-Z]/.test(value)) return 'Debe incluir al menos una letra';
  if (!/\d/.test(value)) return 'Debe incluir al menos un número';
  return undefined;
};

export const matches =
  (other: string, message = 'Los valores no coinciden'): Validator =>
  (value) =>
    value === other ? undefined : message;

/** Acepta correo **o** número de documento: es el login del v1. */
export const emailOrDocument: Validator = (value) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Ingresa tu correo o documento';
  const looksLikeEmail = trimmed.includes('@');
  if (looksLikeEmail) return email(trimmed);
  return /^\d{4,}$/.test(trimmed)
    ? undefined
    : 'Ingresa un correo válido o un número de documento';
};

export const positiveAmount =
  (max?: number): Validator =>
  (value) => {
    const amount = Number(digitsOnly(value));
    if (!Number.isFinite(amount) || amount <= 0) return 'Ingresa un monto mayor a cero';
    if (max !== undefined && amount > max) return 'El monto supera el saldo pendiente';
    return undefined;
  };

/* ── Composición ──────────────────────────────────────────────────────────── */

/** Aplica validadores en orden y devuelve el primer error encontrado. */
export const validate = (value: string, ...validators: Validator[]): string | undefined => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return undefined;
};

/**
 * Valida un objeto completo contra un mapa de validadores.
 *
 * @example
 * const errors = validateFields(form, {
 *   name: [required('El nombre')],
 *   phone: [phone],
 * });
 */
export const validateFields = <T extends Record<string, string>>(
  values: T,
  rules: Partial<Record<keyof T, Validator[]>>,
): FieldErrors<Extract<keyof T, string>> => {
  const errors: Record<string, string> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const validators = rules[key];
    if (!validators) continue;
    const error = validate(values[key] ?? '', ...validators);
    if (error) errors[key as string] = error;
  }
  return errors as FieldErrors<Extract<keyof T, string>>;
};

/** `true` si no hay ningún error. */
export const isValid = (errors: FieldErrors): boolean => Object.keys(errors).length === 0;
