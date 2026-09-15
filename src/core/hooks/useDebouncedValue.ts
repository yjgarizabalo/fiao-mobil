/**
 * Retrasa la propagación de un valor.
 *
 * Se usa en los buscadores: filtrar una lista en cada tecla provoca tirones,
 * y si el filtro fuera al servidor sería una petición por letra.
 */
import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, delayMs = 250): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};
