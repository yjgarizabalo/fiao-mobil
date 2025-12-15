import { getBaseApiUrl } from '../config/environment';

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class RegisterError extends Error {
  constructor(public type: string, message: string) {
    super(message);
    this.name = 'RegisterError';
  }
}

export class RegisterService {
  static async registerUser(userData: RegisterUserData): Promise<RegisterResponse> {
    const url = getBaseApiUrl('/users');
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseText = await response.text();

      if (response.status === 400) {
        throw new RegisterError('VALIDATION_ERROR', 'Datos inválidos');
      }

      if (response.status === 409) {
        throw new RegisterError('USER_EXISTS', 'El usuario ya existe');
      }

      if (response.status >= 500) {
        throw new RegisterError('SERVER_ERROR', 'Error del servidor');
      }

      if (!response.ok) {
        throw new RegisterError('UNKNOWN_ERROR', `Error ${response.status}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      if (error instanceof RegisterError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new RegisterError('NETWORK_ERROR', 'No se pudo conectar al servidor');
      }
      throw new RegisterError('NETWORK_ERROR', 'Error de conexión');
    }
  }
}