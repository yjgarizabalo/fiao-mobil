// Estado de formulario sin librerías externas (no hay react-hook-form ni zod en este
// proyecto, y no se introducen aquí). Reemplaza el patrón repetido de
// `useState` por campo + `validateForm()` a mano que tenía cada pantalla de formulario.
import { useCallback, useMemo, useState } from 'react';

export type Validator = (value: string) => string | undefined;
export type FormRules<T extends Record<string, string>> = Partial<Record<keyof T, Validator[]>>;

interface UseFormOptions<T extends Record<string, string>> {
  initialValues: T;
  rules?: FormRules<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

function runValidators(value: string, validators: Validator[] = []): string | undefined {
  for (const validate of validators) {
    const message = validate(value);
    if (message) return message;
  }
  return undefined;
}

export function useForm<T extends Record<string, string>>({ initialValues, rules, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientErrors = useMemo(() => {
    const result: Partial<Record<keyof T, string>> = {};
    for (const field of Object.keys(values) as (keyof T)[]) {
      const message = runValidators(values[field] ?? '', rules?.[field]);
      if (message) result[field] = message;
    }
    return result;
  }, [values, rules]);

  const errors = useMemo(() => ({ ...clientErrors, ...serverErrors }), [clientErrors, serverErrors]);

  const visibleError = useCallback(
    (field: keyof T): string | undefined => {
      if (serverErrors[field]) return serverErrors[field];
      if (touched[field] || submitAttempted) return clientErrors[field];
      return undefined;
    },
    [serverErrors, clientErrors, touched, submitAttempted]
  );

  const setValue = useCallback((field: keyof T, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setServerErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const handleChange = useCallback((field: keyof T) => (value: string) => setValue(field, value), [setValue]);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  }, []);

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setServerErrors((previous) => ({ ...previous, [field]: message }));
  }, []);

  const setFieldErrors = useCallback((next: Partial<Record<keyof T, string>>) => {
    setServerErrors((previous) => ({ ...previous, ...next }));
  }, []);

  const reset = useCallback(
    (nextValues?: T) => {
      setValues(nextValues ?? initialValues);
      setTouched({});
      setServerErrors({});
      setSubmitAttempted(false);
    },
    [initialValues]
  );

  const isDirty = useMemo(
    () => (Object.keys(values) as (keyof T)[]).some((field) => values[field] !== initialValues[field]),
    [values, initialValues]
  );

  const isValid = Object.keys(clientErrors).length === 0;

  const submit = useCallback(async () => {
    setSubmitAttempted(true);
    if (Object.keys(clientErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [clientErrors, values, onSubmit]);

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
    isValid,
    isDirty,
    reset,
  };
}
