/**
 * Fila de un miembro del equipo.
 *
 * Se construye sobre `ListRow` del design system —no a mano— para que la lista
 * de equipo comparta la misma fila base que Clientes: avatar de persona a la
 * izquierda, nombre y contacto, y el rol como `RoleBadge` a la derecha. El
 * chevron solo aparece cuando la fila es accionable (se puede gestionar).
 */
import type { Member } from '@/domain/models';
import { Avatar, ListRow } from '@/ui';

import { RoleBadge } from './RoleBadge';

export interface MemberRowProps {
  member: Member;
  /** Marca al propio usuario con un "(tú)" para que se reconozca. */
  isCurrentUser: boolean;
  /** Si viene, la fila abre la gestión del miembro (cambiar rol / quitar). */
  onPress?: () => void;
}

export const MemberRow = ({ member, isCurrentUser, onPress }: MemberRowProps) => (
  <ListRow
    leading={<Avatar name={member.name} />}
    title={isCurrentUser ? `${member.name} (tú)` : member.name}
    subtitle={member.email ?? member.phone ?? undefined}
    trailing={<RoleBadge role={member.role} />}
    onPress={onPress}
    chevron={Boolean(onPress)}
  />
);
