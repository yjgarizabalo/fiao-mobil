/**
 * API de autenticación y de usuario.
 *
 * Unifica lo que en el v1 estaban en tres archivos con tres clases de error
 * distintas (`authService.ts`, `registerUsers.ts`, `userService.ts`, más un
 * `registerBussiness.ts` vacío). Todo pasa por el mismo cliente HTTP, así que
 * hereda timeout, logging redactado y conversión de errores.
 */
import { env } from '../../../core/config/env';
import { http, skipAuthRefresh } from '../../../core/http/client';
import { toItem } from '../../../core/http/payload';
import type { DocumentType } from '../../../domain/constants';
import { mapUser } from '../../../domain/mappers';
import type { User } from '../../../domain/models';

export interface LoginCredentials {
  /** Correo o número de documento: el backend acepta ambos. */
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string | null;
  user: User;
}

export interface ProfilePayload {
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const AUTH = env.authPrefix;

export const authApi = {
  /** `POST /auth/login` */
  login: async (credentials: LoginCredentials): Promise<AuthSession> => {
    const { data } = await http.post(`${AUTH}/login`, credentials, {
      // Un 401 aquí son credenciales malas, no una sesión expirada: no tiene
      // sentido intentar renovar el token.
      ...skipAuthRefresh,
    });

    return {
      accessToken: String(data?.accessToken ?? ''),
      refreshToken: data?.refreshToken ? String(data.refreshToken) : null,
      user: mapUser(data?.user),
    };
  },

  /** `POST /users` — el registro crea el usuario, no inicia sesión. */
  register: async (payload: RegisterPayload): Promise<User> => {
    const { data } = await http.post('/users', payload, { ...skipAuthRefresh });
    return mapUser(toItem(data));
  },

  /**
   * `POST /auth/logout` — invalida el refresh token en el servidor.
   *
   * El body va como `{}`, no `null`: con `Content-Type: application/json`,
   * axios serializa `null` al literal `"null"`, y el `body-parser` de Express
   * (modo estricto) lo rechaza con un 400 porque no empieza por `{` ni `[` —
   * nunca llega a tocar el controlador. `{}` es un objeto válido y además es
   * justo lo que espera el DTO opcional del backend.
   */
  logout: async (refreshToken: string): Promise<void> => {
    await http.post(
      `${AUTH}/logout`,
      {},
      {
        headers: { 'x-refresh-token': refreshToken },
        ...skipAuthRefresh,
      }
    );
  },

  /** `PATCH /users/:id` — datos del perfil. */
  updateProfile: async (userId: string, payload: ProfilePayload): Promise<void> => {
    await http.patch(`/users/${userId}`, payload);
  },

  /** `PATCH /users/:id` — cambio de contraseña. */
  updatePassword: async (userId: string, password: string): Promise<void> => {
    await http.patch(`/users/${userId}`, { password });
  },
};
