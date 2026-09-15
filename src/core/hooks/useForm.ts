/**
 * Manejo de formularios: valores, errores, campos tocados y envío.
 *
 * Reemplaza el patrón del v1, donde cada pantalla repetía un `useState` por
 * campo, un objeto `errors` y su propia función `validateForm()`. Sin añadir
 * dependencias (nada de react-hook-form): son ~90 líneas y cubren lo que la
 * app necesita.
 *
 * Detalle de UX importante: el error de un campo solo se muestra cuando el
 * usuario ya lo "tocó" (salió del campo) o cuando intentó enviar. Así no se
 * pinta todo de rojo mientras escribe.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import { type FieldErrors, type Validator, validate } from '../utils/validation';

type StringRecord = Record<string, string>;

export interface UseFormOptions<T extends StringRecord> {
  initialValues: T;
  /** Validadores por campo. Los campos sin reglas nunca dan error. */
  rules?: Partial<Record<keyof T, Validator[]>>;
  /** Se ejecuta solo si la validación pasa. */
  onSubmit: (values: T) => Promise<void> | void;
}

export interface UseFormResult<T extends StringRecord> {
  values: T;
  errors: FieldErrors<Extract<keyof T, string>>;
  /** Error visible: existe y el campo ya fue tocado o se intentó enviar. */
  visibleError: (field: keyof T) => string | undefined;
  setValue: (field: keyof T, value: string) => void;
  setValues: (partial: Partial<T>) => void;
  /** Handler listo para `onChangeText`. */
  handleChange: (field: keyof T) => (value: string) => void;
  /** Handler listo para `onBlur`. */
  handleBlur: (field: keyof T) => () => void;
  /** Fuerza un error de servidor en un campo (p. ej. "el correo ya existe"). */
  setFieldError: (field: keyof T, message: string) => void;
  setFieldErrors: (fieldErrors: Record<string, string>) => void;
  submit: () => Promise<void>;
  isSubmitting: boolean;
  /** `true` si todos los campos con reglas están válidos. */
  isValid: boolean;
  /** `true` si algún valor cambió respecto al inicial. */
  isDirty: boolean;
  reset: (nextValues?: T) => void;
}

export const useForm = <T extends StringRecord>({
  initialValues,
  rules,
  onSubmit,
}: UseFormOptions<T>): UseFormResult<T> => {
  const [values, setValuesState] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se guarda en una ref para que `submit` no cambie de identidad en cada render.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  const errors = useMemo(() => {
    const result: Record<string, string> = {};
    for (const field of Object.keys(values)) {
      const validators = rules?.[field as keyof T];
      const error = validators ? validate(values[field] ?? '', ...validators) : undefined;
      const serverError = serverErrors[field as keyof T];
      const message = error ?? serverError;
      if (message) result[field] = message;
    }
    return result as FieldErrors<Extract<keyof T, string>>;
  }, [values, serverErrors, rules]);

  const setValue = useCallback((field: keyof T, value: string) => {
    setValuesState((previous) => ({ ...previous, [field]: value }));
    // Al escribir se limpia el error que vino del servidor para ese campo.
    setServerErrors((previous) =>
      previous[field] === undefined ? previous : { ...previous, [field]: undefined },
    );
  }, []);

  const setValues = useCallback((partial: Partial<T>) => {
    setValuesState((previous) => ({ ...previous, ...partial }));
  }, []);

  const handleChange = useCallback(
    (field: keyof T) => (value: string) => setValue(field, value),
    [setValue],
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => setTouched((previous) => ({ ...previous, [field]: true })),
    [],
  );

  const visibleError = useCallback(
    (field: keyof T): string | undefined => {
      if (!submitAttempted && !touched[field]) return undefined;
      return errors[field as Extract<keyof T, string>];
    },
    [errors, touched, submitAttempted],
  );

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setServerErrors((previous) => ({ ...previous, [field]: message }));
    setTouched((previous) => ({ ...previous, [field]: true }));
  }, []);

  const setFieldErrors = useCallback((fieldErrors: Record<string, string>) => {
    setServerErrors((previous) => ({ ...previous, ...fieldErrors }));
    setSubmitAttempted(true);
  }, []);

  const submit = useCallback(async () => {
    setSubmitAttempted(true);

    // Se recalcula sobre los valores actuales para no depender del memo.
    const currentErrors: Record<string, string> = {};
    for (const field of Object.keys(values)) {
      const validators = rules?.[field as keyof T];
      const error = validators ? validate(values[field] ?? '', ...validators) : undefined;
      if (error) currentErrors[field] = error;
    }
    if (Object.keys(currentErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await submitRef.current(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, rules]);

  const reset = useCallback(
    (nextValues?: T) => {
      setValuesState(nextValues ?? initialValues);
      setTouched({});
      setServerErrors({});
      setSubmitAttempted(false);
    },
    [initialValues],
  );

  const isDirty = useMemo(
    () => Object.keys(initialValues).some((key) => values[key] !== initialValues[key]),
    [values, initialValues],
  );

  return {
    values,
    errors,
    visibleError,
    setValue,
    setValues,
    handleChange,
    handleBlur,
    setFieldError,
    setFieldErrors,
    submit,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    isDirty,
    reset,
  };
};
