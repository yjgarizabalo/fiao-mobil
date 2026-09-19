/**
 * Avatar con iniciales y color estable por nombre.
 *
 * Sin fotos de perfil todavía, así que la identidad visual del cliente son
 * sus iniciales sobre un color derivado de su nombre: el mismo cliente
 * siempre se ve igual, lo que ayuda a reconocerlo de un vistazo en la lista.
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { getAvatarColor, getInitials } from '@/core/utils/format';
import { Text } from './Text';
import { theme } from '@/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  /** Punto de estado en la esquina (verde al día, rojo con deuda). */
  status?: 'clear' | 'debt' | 'overdue';
  style?: ViewStyle;
}

const DIMENSIONS: Record<AvatarSize, { box: number; variant: 'caption' | 'bodyStrong' | 'title3' | 'title2' }> = {
  sm: { box: 32, variant: 'caption' },
  md: { box: 44, variant: 'bodyStrong' },
  lg: { box: 56, variant: 'title3' },
  xl: { box: 72, variant: 'title2' },
};

const STATUS_COLOR: Record<NonNullable<AvatarProps['status']>, string> = {
  clear: theme.color.success,
  debt: theme.color.warning,
  overdue: theme.color.danger,
};

export const Avatar = ({ name, size = 'md', status, style }: AvatarProps) => {
  const { box, variant } = DIMENSIONS[size];
  const background = getAvatarColor(name);
  const dotSize = Math.max(10, box * 0.26);

  return (
    <View style={[{ width: box, height: box }, style]}>
      <View
        style={[
          styles.circle,
          { width: box, height: box, borderRadius: box / 2, backgroundColor: background },
        ]}
      >
        <Text variant={variant} weight="heavy" color="textInverse">
          {getInitials(name)}
        </Text>
      </View>

      {status ? (
        <View
          style={[
            styles.status,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: STATUS_COLOR[status],
              borderWidth: dotSize > 12 ? 2.5 : 2,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderColor: theme.color.surface,
  },
});
