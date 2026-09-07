import { getBaseApiUrl } from '../config/environment';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface UpdateSecurityData {
  password: string;
}

export class UserServiceError extends Error {
  constructor(public type: string, message: string) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class UserService {
  static async updateUser(
    id: string,
    data: UpdateProfileData | UpdateSecurityData,
    accessToken: string,
  ): Promise<void> {
    const url = getBaseApiUrl(`/users/${id}`);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      if (response.status === 400) throw new UserServiceError('VALIDATION_ERROR', 'Datos inválidos');
      if (response.status === 401) throw new UserServiceError('UNAUTHORIZED', 'No autorizado');
      if (response.status >= 500) throw new UserServiceError('SERVER_ERROR', 'Error del servidor');
      if (!response.ok) throw new UserServiceError('UNKNOWN_ERROR', `Error ${response.status}`);
    } catch (error) {
      if (error instanceof UserServiceError) throw error;
      throw new UserServiceError('NETWORK_ERROR', 'Error de conexión');
    }
  }
}
