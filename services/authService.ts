import { getApiUrl } from '../config/environment';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthError extends Error {
  constructor(public type: string, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const url = getApiUrl('/login');
    console.log('Attempting login to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (response.status === 401) {
        throw new AuthError('INVALID_CREDENTIALS', 'Credenciales incorrectas');
      }

      if (response.status >= 500) {
        throw new AuthError('SERVER_ERROR', 'Error del servidor');
      }

      if (!response.ok) {
        throw new AuthError('UNKNOWN_ERROR', `Error ${response.status}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.log('Login error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new AuthError('NETWORK_ERROR', 'No se pudo conectar al servidor');
      }
      throw new AuthError('NETWORK_ERROR', 'Error de conexión');
    }
  }
}