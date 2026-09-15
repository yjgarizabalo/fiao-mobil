/**
 * Cifra de dinero que "cuenta" hasta su nuevo valor.
 *
 * Cuando se registra un pago, ver el saldo bajar de $120.000 a $80.000 en
 * medio segundo comunica el resultado mejor que un número que simplemente
 * cambia. Es un detalle pequeño con mucho efecto en la percepción de calidad.
 *
 * Se usa un tween con `requestAnimationFrame` en vez de un worklet porque el
 * valor tiene que pasar por el formateador de moneda de JS en cada fotograma.
 * El bucle solo existe mientras la animación dura.
 */
import { useEffect, useRef, useState } from 'react';

import { formatMoney } from '../core/utils/format';
import { Text, type TextProps } from './Text';

export interface AnimatedMoneyProps extends Omit<TextProps, 'children'> {
  value: number;
  /** Duración del conteo. `0` lo desactiva. */
  durationMs?: number;
}

/** Suavizado: rápido al principio y frenando al final. */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const AnimatedMoney = ({
  value,
  durationMs = 520,
  variant = 'moneyHero',
  ...textProps
}: AnimatedMoneyProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;

    if (durationMs <= 0 || from === to) {
      setDisplayValue(to);
      return;
    }

    const startedAt = Date.now();

    const step = () => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      setDisplayValue(Math.round(from + (to - from) * easeOutCubic(progress)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return (
    <Text variant={variant} {...textProps}>
      {formatMoney(displayValue)}
    </Text>
  );
};
