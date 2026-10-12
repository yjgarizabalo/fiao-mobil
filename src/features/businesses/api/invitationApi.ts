/**
 * API de invitaciones. `POST /invitations`, `GET /invitations/:code`,
 * `POST /invitations/accept`, `GET /invitations/business/:businessId`.
 *
 * Es el camino para sumar a alguien a un negocio: se crea una invitación con un
 * correo (o teléfono) y un rol, el backend genera un código corto —y manda un
 * correo si hay email— y la persona lo acepta tecleando ese código dentro de la
 * app. Crear y listar exigen rol ADMIN/OWNER + `x-business-id`; consultar y
 * aceptar solo requieren estar autenticado (el invitado no es miembro todavía).
 */
import { businessHeader, http } from '@/core/http/client';
import { toItem, toPage } from '@/core/http/payload';
import type { BusinessRole } from '@/domain/constants';
import { mapInvitation } from '@/domain/mappers';
import type { Invitation } from '@/domain/models';

export interface InviteDraft {
  email?: string;
  phone?: string;
  role: BusinessRole;
}

/** Las invitaciones vivas de un negocio son pocas; una página de 100 sobra. */
const MAX_INVITATIONS = 100;

export const invitationApi = {
  /** `POST /invitations` — crea una invitación de tipo BUSINESS_USER. */
  create: async (businessId: string, draft: InviteDraft): Promise<Invitation> => {
    const { data } = await http.post(
      '/invitations',
      { type: 'BUSINESS_USER', email: draft.email, phone: draft.phone, role: draft.role },
      businessHeader(businessId),
    );
    // El backend responde `{ message, invitation }`, no el recurso pelado.
    const invitation = (data as { invitation?: unknown })?.invitation;
    return mapInvitation(invitation ?? toItem(data));
  },

  /** `GET /invitations/:code` — valida el código y devuelve la invitación. */
  getByCode: async (code: string): Promise<Invitation> => {
    const { data } = await http.get(`/invitations/${code}`);
    return mapInvitation(toItem(data));
  },

  /** `POST /invitations/accept` — el usuario autenticado acepta el código. */
  accept: async (code: string): Promise<void> => {
    await http.post('/invitations/accept', { code });
  },

  /** `GET /invitations/business/:businessId` — invitaciones del negocio (ADMIN/OWNER). */
  listByBusiness: async (businessId: string): Promise<Invitation[]> => {
    const { data } = await http.get(`/invitations/business/${businessId}`, {
      params: { page: 1, limit: MAX_INVITATIONS },
      ...businessHeader(businessId),
    });
    return toPage<unknown>(data, 1, MAX_INVITATIONS).items.map(mapInvitation);
  },
};
