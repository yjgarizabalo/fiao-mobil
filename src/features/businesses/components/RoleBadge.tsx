/**
 * Etiqueta del rol de una persona dentro de un negocio.
 *
 * Reutiliza `Badge` mapeando cada rol a un tono **existente** del sistema (no
 * agrega colores nuevos, según la Fase 0.4): el dueño resalta en verde marca,
 * el administrador en info, y cajero / solo-lectura en neutro. Vive aquí para
 * que el rol se lea igual en el perfil y, más adelante, en la lista de equipo.
 */
import { BUSINESS_ROLE_LABEL, type BusinessRole } from '@/domain/constants';
import { Badge } from '@/ui';

const ROLE_TONE: Record<BusinessRole, 'brand' | 'info' | 'neutral'> = {
  OWNER: 'brand',
  ADMIN: 'info',
  CASHIER: 'neutral',
  VIEWER: 'neutral',
};

export interface RoleBadgeProps {
  role: BusinessRole;
  size?: 'sm' | 'md';
}

export const RoleBadge = ({ role, size }: RoleBadgeProps) => (
  <Badge label={BUSINESS_ROLE_LABEL[role]} tone={ROLE_TONE[role]} size={size} />
);
